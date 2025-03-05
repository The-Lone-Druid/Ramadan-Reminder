import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { addMinutes, isBefore } from "date-fns";
import { getTTSSettings } from "./storage";

interface Reminder {
  time: Date;
  message: string;
  type:
    | "sehri-prep"
    | "sehri-warning"
    | "sehri-final"
    | "iftar-prep"
    | "iftar-warning"
    | "iftar-time";
}

// Define a type for voice data
interface VoiceData {
  language?: string;
  identifier?: string;
  name?: string;
}

class ReminderService {
  private static instance: ReminderService;
  private activeReminders: Map<string, number>;
  private isInitialized: boolean = false;
  private isTestMode: boolean = false;
  private isSpeaking: boolean = false;
  private notificationId: number = 1;
  private speakQueue: string[] = [];
  private isProcessingQueue: boolean = false;
  private maxConcurrentNotifications: number = 5;
  private lastCleanupTime: number = 0;
  private lastScheduleTime: number = 0;
  private schedulingDebounceMs: number = 500; // Debounce scheduling operations
  private isDestroyed: boolean = false;
  private supportedLanguages: string[] = [];
  private isTTSSupported: boolean = true;

  private constructor() {
    this.activeReminders = new Map();
    this.initializeNotifications();
    this.initializeTTS();
    
    // Set up periodic cleanup to prevent memory leaks
    const cleanupInterval = setInterval(() => {
      if (this.isDestroyed) {
        clearInterval(cleanupInterval);
        return;
      }
      this.cleanupExpiredReminders();
    }, 60000); // Run every minute
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  public destroy(): void {
    this.isDestroyed = true;
    this.clearAllReminders();
    this.speakQueue = [];
    TextToSpeech.stop();
  }

  private async initializeTTS(): Promise<void> {
    try {
      // Check if TTS is supported on this device
      const voices = await TextToSpeech.getSupportedVoices();
      
      if (voices && voices.voices) {
        // Extract language from each voice, filtering out undefined values
        this.supportedLanguages = voices.voices
          .map((voice: VoiceData) => voice.language || '')
          .filter(lang => lang !== '');
          
        console.log("Supported TTS languages:", this.supportedLanguages);
        this.isTTSSupported = this.supportedLanguages.length > 0;
      } else {
        console.warn("No TTS voices found, TTS might not be supported");
        this.isTTSSupported = false;
      }
    } catch (error) {
      console.error("Error initializing TTS:", error);
      this.isTTSSupported = false;
    }
  }

  private async initializeNotifications() {
    if (!this.isInitialized && !this.isDestroyed) {
      try {
        // Request notification permissions
        const permResult = await LocalNotifications.checkPermissions();
        if (permResult.display !== "granted") {
          const requestResult = await LocalNotifications.requestPermissions();
          if (requestResult.display !== "granted") {
            console.error("Notification permission not granted");
            return;
          }
        }

        // Create notification channel for Android
        await LocalNotifications.createChannel({
          id: "ramadan-reminders",
          name: "Ramadan Reminders",
          description: "Notifications for Sehri and Iftar times",
          importance: 5,
          visibility: 1,
          vibration: true,
          lights: true,
        });

        this.isInitialized = true;
      } catch (error) {
        console.error("Error initializing notifications:", error);
      }
    }
  }

  // Clean up expired reminders to prevent memory leaks
  private cleanupExpiredReminders() {
    if (this.isDestroyed) return;
    
    const now = Date.now();
    
    // Only run cleanup every 5 minutes to avoid excessive processing
    if (now - this.lastCleanupTime < 300000) {
      return;
    }
    
    this.lastCleanupTime = now;
    
    let expiredCount = 0;
    for (const [key, timeoutId] of this.activeReminders.entries()) {
      // Extract timestamp from key
      const parts = key.split('-');
      const timestamp = parseInt(parts[parts.length - 1]);
      
      // If the reminder time has passed, clear the timeout
      if (timestamp < now) {
        clearTimeout(timeoutId);
        this.activeReminders.delete(key);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      console.log(`Cleaned up ${expiredCount} expired reminders`);
    }
  }

  private async processQueue() {
    if (this.isDestroyed || this.isProcessingQueue || this.speakQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    try {
      while (this.speakQueue.length > 0 && !this.isDestroyed) {
        const message = this.speakQueue.shift();
        if (message) {
          await this.speakMessage(message);
        }
      }
    } catch (error) {
      console.error("Error processing speak queue:", error);
    } finally {
      this.isProcessingQueue = false;
    }
  }

  private async speakMessage(message: string): Promise<void> {
    if (this.isDestroyed) return;
    
    try {
      const ttsSettings = getTTSSettings();

      // Show notification with incremental ID
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: message,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          },
        ],
      });

      // Reset ID if it gets too large
      if (this.notificationId > 100000) {
        this.notificationId = 1;
      }

      // If TTS is enabled and supported, speak the message
      if (ttsSettings.enabled && this.isTTSSupported && !this.isDestroyed) {
        this.isSpeaking = true;
        
        try {
          // Check platform
          const isAndroid = Capacitor.getPlatform() === 'android';
          
          // Determine the best language to use
          let languageToUse = ttsSettings.language;
          
          // If the selected language isn't in the supported languages list, try fallbacks
          if (this.supportedLanguages.length > 0 && !this.supportedLanguages.includes(languageToUse)) {
            // Try to find a close match (same language, different region)
            const baseLanguage = languageToUse.split('-')[0];
            const matchingLanguage = this.supportedLanguages.find(lang => lang.startsWith(baseLanguage + '-'));
            
            if (matchingLanguage) {
              languageToUse = matchingLanguage;
            } else if (this.supportedLanguages.includes('en-US')) {
              // Fallback to US English if available
              languageToUse = 'en-US';
            } else if (this.supportedLanguages.length > 0) {
              // Last resort: use the first available language
              languageToUse = this.supportedLanguages[0];
            }
          }
          
          // Adjust volume for Android (which sometimes has lower volume)
          const adjustedVolume = isAndroid ? Math.min(ttsSettings.volume * 1.5, 1.0) : ttsSettings.volume;
          
          await TextToSpeech.speak({
            text: message,
            lang: languageToUse,
            rate: ttsSettings.rate,
            pitch: ttsSettings.pitch,
            volume: adjustedVolume,
          });
        } catch (error) {
          console.error("Text-to-Speech error:", error);
          
          // Try with a simpler configuration as fallback
          if (!this.isDestroyed) {
            try {
              await TextToSpeech.speak({
                text: message,
                lang: "en-US",
                rate: 1.0,
                pitch: 1.0,
                volume: 1.0,
              });
            } catch (fallbackError) {
              console.error("Fallback Text-to-Speech error:", fallbackError);
              
              // Last resort - try with minimal options
              try {
                await TextToSpeech.speak({
                  text: message,
                });
              } catch (lastResortError) {
                console.error("Last resort Text-to-Speech error:", lastResortError);
                this.isTTSSupported = false; // Mark TTS as unsupported if all attempts fail
              }
            }
          }
        } finally {
          this.isSpeaking = false;
        }
      }
    } catch (error) {
      console.error("Error in speak function:", error);
    }
  }

  private speak(message: string): void {
    if (this.isDestroyed) return;
    
    // Add message to queue
    this.speakQueue.push(message);
    
    // Start processing queue if not already processing
    if (!this.isProcessingQueue) {
      this.processQueue();
    }
  }

  private scheduleReminder(reminder: Reminder): void {
    if (this.isDestroyed) return;
    
    const now = new Date();
    const reminderTime = reminder.time;
    const key = `${reminder.type}-${reminderTime.getTime()}`;

    // Don't schedule if the time has already passed
    if (isBefore(reminderTime, now)) {
      return;
    }

    // Clear existing reminder if any
    if (this.activeReminders.has(key)) {
      clearTimeout(this.activeReminders.get(key));
      this.activeReminders.delete(key);
    }

    // Calculate delay in milliseconds
    const delay = reminderTime.getTime() - now.getTime();

    // Schedule new reminder
    const timeoutId = setTimeout(() => {
      if (!this.isDestroyed) {
        this.speak(reminder.message);
      }
      // Remove from active reminders after it fires
      this.activeReminders.delete(key);
    }, delay);

    this.activeReminders.set(key, timeoutId);
  }

  public scheduleSehriReminders(sehriTime: Date, dayNumber: number): void {
    if (this.isTestMode || this.isDestroyed) return;
    
    // Debounce scheduling operations to prevent rapid calls
    const now = Date.now();
    if (now - this.lastScheduleTime < this.schedulingDebounceMs) {
      console.log("Scheduling operation debounced");
      return;
    }
    this.lastScheduleTime = now;

    const currentTime = new Date();
    
    // Don't schedule if sehri time has already passed
    if (isBefore(sehriTime, currentTime)) {
      return;
    }

    // 30 minutes before Sehri
    const prepTime = addMinutes(sehriTime, -30);
    if (!isBefore(prepTime, currentTime)) {
      this.scheduleReminder({
        time: prepTime,
        message: `Day ${dayNumber}: 30 minutes until Sehri time.`,
        type: "sehri-prep",
      });
    }

    // 10 minutes before Sehri
    const warningTime = addMinutes(sehriTime, -10);
    if (!isBefore(warningTime, currentTime)) {
      this.scheduleReminder({
        time: warningTime,
        message: `Day ${dayNumber}: 10 minutes until Sehri time.`,
        type: "sehri-warning",
      });
    }

    // At Sehri time
    this.scheduleReminder({
      time: sehriTime,
      message: `Day ${dayNumber}: It's Sehri time now.`,
      type: "sehri-final",
    });
  }

  public scheduleIftarReminders(iftarTime: Date, dayNumber: number): void {
    if (this.isTestMode || this.isDestroyed) return;
    
    // Debounce scheduling operations to prevent rapid calls
    const now = Date.now();
    if (now - this.lastScheduleTime < this.schedulingDebounceMs) {
      console.log("Scheduling operation debounced");
      return;
    }
    this.lastScheduleTime = now;

    const currentTime = new Date();
    
    // Don't schedule if iftar time has already passed
    if (isBefore(iftarTime, currentTime)) {
      return;
    }

    // 30 minutes before Iftar
    const prepTime = addMinutes(iftarTime, -30);
    if (!isBefore(prepTime, currentTime)) {
      this.scheduleReminder({
        time: prepTime,
        message: `Day ${dayNumber}: 30 minutes until Iftar time.`,
        type: "iftar-prep",
      });
    }

    // 5 minutes before Iftar
    const warningTime = addMinutes(iftarTime, -5);
    if (!isBefore(warningTime, currentTime)) {
      this.scheduleReminder({
        time: warningTime,
        message: `Day ${dayNumber}: 5 minutes until Iftar time.`,
        type: "iftar-warning",
      });
    }

    // At Iftar time
    this.scheduleReminder({
      time: iftarTime,
      message: `Day ${dayNumber}: It's Iftar time now.`,
      type: "iftar-time",
    });
  }

  public scheduleRamadanReminders(
    sehriTime: Date,
    iftarTime: Date,
    dayNumber: number
  ): void {
    if (this.isDestroyed) return;
    
    // Debounce scheduling operations to prevent rapid calls
    const now = Date.now();
    if (now - this.lastScheduleTime < this.schedulingDebounceMs) {
      console.log("Scheduling operation debounced");
      return;
    }
    this.lastScheduleTime = now;
    
    this.scheduleSehriReminders(sehriTime, dayNumber);
    this.scheduleIftarReminders(iftarTime, dayNumber);
  }

  public clearAllReminders(): void {
    // Clear all active timeouts
    for (const timeoutId of this.activeReminders.values()) {
      clearTimeout(timeoutId);
    }
    this.activeReminders.clear();
    this.speakQueue = [];
    
    if (this.isSpeaking) {
      TextToSpeech.stop();
      this.isSpeaking = false;
    }
  }

  public setTestMode(enabled: boolean): void {
    this.isTestMode = enabled;
    if (enabled) {
      this.clearAllReminders();
    }
  }

  public async testVoiceReminder(message: string): Promise<boolean> {
    if (this.isDestroyed) return false;
    
    try {
      this.setTestMode(true);
      
      // Check if TTS is supported
      if (!this.isTTSSupported) {
        console.warn("Text-to-Speech is not supported on this device");
        return false;
      }
      
      // Try to get supported voices again if we don't have any
      if (this.supportedLanguages.length === 0) {
        try {
          const voices = await TextToSpeech.getSupportedVoices();
          if (voices && voices.voices) {
            this.supportedLanguages = voices.voices
              .map((voice: VoiceData) => voice.language || '')
              .filter(lang => lang !== '');
          }
        } catch (error) {
          console.error("Error getting supported voices:", error);
        }
      }
      
      await this.speakMessage(message);
      return true;
    } catch (error) {
      console.error("Test voice reminder error:", error);
      return false;
    } finally {
      this.setTestMode(false);
    }
  }

  public getActiveRemindersCount(): number {
    return this.activeReminders.size;
  }
  
  public isTTSAvailable(): boolean {
    return this.isTTSSupported;
  }
  
  public getSupportedLanguages(): string[] {
    return [...this.supportedLanguages];
  }
}

export const reminderService = ReminderService.getInstance();
