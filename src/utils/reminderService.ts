import { addMinutes, isBefore } from "date-fns";
import { TextToSpeech } from "@capacitor-community/text-to-speech";
import { LocalNotifications } from "@capacitor/local-notifications";
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

class ReminderService {
  private static instance: ReminderService;
  private activeReminders: Map<string, number>;
  private isInitialized: boolean = false;
  private isTestMode: boolean = false;
  private isSpeaking: boolean = false;
  private notificationId: number = 1;

  private constructor() {
    this.activeReminders = new Map();
    this.initializeNotifications();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  private async initializeNotifications() {
    if (!this.isInitialized) {
      try {
        // Request notification permissions
        const permResult = await LocalNotifications.requestPermissions();
        if (permResult.display !== "granted") {
          console.error("Notification permission not granted");
          return;
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

  private async speak(message: string): Promise<void> {
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

      // If TTS is enabled, speak the message
      if (ttsSettings.enabled) {
        this.isSpeaking = true;
        try {
          await TextToSpeech.speak({
            text: message,
            lang: ttsSettings.language,
            rate: ttsSettings.rate,
            pitch: ttsSettings.pitch,
            volume: ttsSettings.volume,
          });
        } catch (error) {
          console.error("Text-to-Speech error:", error);
          // Fallback to default English if Indian English is not available
          try {
            await TextToSpeech.speak({
              text: message,
              lang: "en-US",
              rate: ttsSettings.rate,
              pitch: ttsSettings.pitch,
              volume: ttsSettings.volume,
            });
          } catch (fallbackError) {
            console.error("Fallback Text-to-Speech error:", fallbackError);
          }
        } finally {
          this.isSpeaking = false;
        }
      }
    } catch (error) {
      console.error("Error in speak function:", error);
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

  public async testReminders(): Promise<void> {
    this.clearAllReminders();
    const testPrefix = "TEST: ";

    try {
      // Test Sehri reminders in sequence
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}It's 30 minutes until Sehri time. Please prepare for Sehri.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      await new Promise((resolve) => setTimeout(resolve, 6000));

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}10 minutes until Sehri ends. Please complete your meal.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      await new Promise((resolve) => setTimeout(resolve, 6000));

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}5 minutes until Sehri ends. Please finish your meal.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      await new Promise((resolve) => setTimeout(resolve, 6000));

      // Test Iftar reminders in sequence
      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}It's 30 minutes until Iftar time. Please prepare for Iftar.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      await new Promise((resolve) => setTimeout(resolve, 6000));

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}10 minutes until Iftar time. Please get ready to break your fast.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      await new Promise((resolve) => setTimeout(resolve, 6000));

      await LocalNotifications.schedule({
        notifications: [
          {
            title: "Ramadan Reminder",
            body: `${testPrefix}It's Iftar time! You can now break your fast.`,
            id: this.notificationId++,
            schedule: { at: new Date() },
            channelId: "ramadan-reminders",
            smallIcon: "ic_notification",
            iconColor: "#488AFF",
          }
        ]
      });

      // Reset ID if it gets too large
      if (this.notificationId > 100000) {
        this.notificationId = 1;
      }

      // If TTS is enabled, speak the messages
      const ttsSettings = getTTSSettings();
      if (ttsSettings.enabled) {
        const messages = [
          `${testPrefix}It's 30 minutes until Sehri time. Please prepare for Sehri.`,
          `${testPrefix}10 minutes until Sehri ends. Please complete your meal.`,
          `${testPrefix}5 minutes until Sehri ends. Please finish your meal.`,
          `${testPrefix}It's 30 minutes until Iftar time. Please prepare for Iftar.`,
          `${testPrefix}10 minutes until Iftar time. Please get ready to break your fast.`,
          `${testPrefix}It's Iftar time! You can now break your fast.`
        ];

        for (const message of messages) {
          this.isSpeaking = true;
          try {
            await TextToSpeech.speak({
              text: message,
              lang: ttsSettings.language,
              rate: ttsSettings.rate,
              pitch: ttsSettings.pitch,
              volume: ttsSettings.volume,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } catch (error) {
            console.error("Text-to-Speech error:", error);
            try {
              await TextToSpeech.speak({
                text: message,
                lang: "en-US",
                rate: ttsSettings.rate,
                pitch: ttsSettings.pitch,
                volume: ttsSettings.volume,
              });
            } catch (fallbackError) {
              console.error("Fallback Text-to-Speech error:", fallbackError);
            }
          } finally {
            this.isSpeaking = false;
          }
        }
      }
    } catch (error) {
      console.error("Error in test reminders:", error);
    }
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
