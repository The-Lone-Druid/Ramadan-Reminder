import { format, addMinutes, isBefore, isAfter } from "date-fns";
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { getTTSSettings } from './storage';

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

class ReminderService {
  private static instance: ReminderService;
  private activeReminders: Map<string, number>;
  private isInitialized: boolean = false;
  private isTestMode: boolean = false;
  private isSpeaking: boolean = false;

  private constructor() {
    this.activeReminders = new Map();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  private async speak(message: string): Promise<void> {
    if (!this.isInitialized) {
      this.isInitialized = true;
      // Request notification permission on first use
      Notification.requestPermission();
    }

    const ttsSettings = getTTSSettings();
    if (!ttsSettings.enabled) {
      // If TTS is disabled, only show notification
      const notification = new Notification("Ramadan Reminder", {
        body: message,
        icon: "/assets/icon/favicon.png",
        badge: "/assets/icon/favicon.png",
      });
      return;
    }

    // Create notification
    const notification = new Notification("Ramadan Reminder", {
      body: message,
      icon: "/assets/icon/favicon.png",
      badge: "/assets/icon/favicon.png",
    });

    this.isSpeaking = true;
    try {
      // Use Capacitor's Text-to-Speech with settings
      await TextToSpeech.speak({
        text: message,
        lang: ttsSettings.language,
        rate: ttsSettings.rate,
        pitch: ttsSettings.pitch,
        volume: ttsSettings.volume,
      });
    } catch (error) {
      console.error('Text-to-Speech error:', error);
      // Fallback to default English if Indian English is not available
      try {
        await TextToSpeech.speak({
          text: message,
          lang: 'en-US',
          rate: ttsSettings.rate,
          pitch: ttsSettings.pitch,
          volume: ttsSettings.volume,
        });
      } catch (fallbackError) {
        console.error('Fallback Text-to-Speech error:', fallbackError);
      }
    } finally {
      this.isSpeaking = false;
    }
  }

  private scheduleReminder(reminder: Reminder): void {
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
      this.speak(reminder.message);
    }, delay);

    this.activeReminders.set(key, timeoutId);
  }

  public scheduleDayReminders(
    sehriTime: Date,
    iftarTime: Date,
    isTest: boolean = false
  ): void {
    this.isTestMode = isTest;
    // Clear existing reminders
    this.clearAllReminders();

    const testPrefix = isTest ? "TEST: " : "";

    // Sehri reminders
    this.scheduleReminder({
      time: addMinutes(sehriTime, -30),
      message: `${testPrefix}It's 30 minutes until Sehri time. Please prepare for Sehri.`,
      type: "sehri-prep",
    });

    this.scheduleReminder({
      time: addMinutes(sehriTime, -10),
      message: `${testPrefix}10 minutes until Sehri ends. Please complete your meal.`,
      type: "sehri-warning",
    });

    this.scheduleReminder({
      time: addMinutes(sehriTime, -5),
      message: `${testPrefix}5 minutes until Sehri ends. Please finish your meal.`,
      type: "sehri-final",
    });

    // Iftar reminders
    this.scheduleReminder({
      time: addMinutes(iftarTime, -30),
      message: `${testPrefix}It's 30 minutes until Iftar time. Please prepare for Iftar.`,
      type: "iftar-prep",
    });

    this.scheduleReminder({
      time: addMinutes(iftarTime, -10),
      message: `${testPrefix}10 minutes until Iftar time. Please get ready to break your fast.`,
      type: "iftar-warning",
    });

    this.scheduleReminder({
      time: iftarTime,
      message: `${testPrefix}It's Iftar time! You can now break your fast.`,
      type: "iftar-time",
    });
  }

  public testReminders(): void {
    this.clearAllReminders();
    const now = new Date();
    const testPrefix = "TEST: ";

    // Test Sehri reminders in sequence
    setTimeout(() => {
      this.speak(
        `${testPrefix}It's 30 minutes until Sehri time. Please prepare for Sehri.`
      );
    }, 0);

    setTimeout(() => {
      this.speak(
        `${testPrefix}10 minutes until Sehri ends. Please complete your meal.`
      );
    }, 2000);

    setTimeout(() => {
      this.speak(
        `${testPrefix}5 minutes until Sehri ends. Please finish your meal.`
      );
    }, 4000);

    // Test Iftar reminders in sequence
    setTimeout(() => {
      this.speak(
        `${testPrefix}It's 30 minutes until Iftar time. Please prepare for Iftar.`
      );
    }, 6000);

    setTimeout(() => {
      this.speak(
        `${testPrefix}10 minutes until Iftar time. Please get ready to break your fast.`
      );
    }, 8000);

    setTimeout(() => {
      this.speak(`${testPrefix}It's Iftar time! You can now break your fast.`);
    }, 10000);
  }

  public clearAllReminders(): void {
    this.activeReminders.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.activeReminders.clear();
  }

  public stopSpeaking(): void {
    if (this.isSpeaking) {
      TextToSpeech.stop();
      this.isSpeaking = false;
    }
  }

  public isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }
}

export const reminderService = ReminderService.getInstance();
