import { format, addMinutes, isBefore, isAfter } from "date-fns";

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
  private speechSynthesis: SpeechSynthesis;
  private activeReminders: Map<string, number>;
  private isInitialized: boolean = false;
  private isTestMode: boolean = false;
  private availableVoices: SpeechSynthesisVoice[] = [];
  private voiceLoaded: boolean = false;

  private constructor() {
    this.speechSynthesis = window.speechSynthesis;
    this.activeReminders = new Map();
    this.loadVoices();
  }

  public static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService();
    }
    return ReminderService.instance;
  }

  private loadVoices(): void {
    // Load voices if they're already available
    if (this.speechSynthesis.getVoices().length > 0) {
      this.availableVoices = this.speechSynthesis.getVoices();
      this.voiceLoaded = true;
    }

    // Listen for voices being loaded
    this.speechSynthesis.onvoiceschanged = () => {
      this.availableVoices = this.speechSynthesis.getVoices();
      this.voiceLoaded = true;
    };
  }

  private getIndianVoice(): SpeechSynthesisVoice | undefined {
    return this.availableVoices.find(
      (voice) =>
        voice.lang.includes("en-IN") ||
        voice.name.toLowerCase().includes("indian") ||
        voice.name.toLowerCase().includes("india")
    );
  }

  private speak(message: string): void {
    if (!this.isInitialized) {
      this.isInitialized = true;
      // Request notification permission on first use
      Notification.requestPermission();
    }

    // Create notification
    const notification = new Notification("Ramadan Reminder", {
      body: message,
      icon: "/assets/icon/favicon.png",
      badge: "/assets/icon/favicon.png",
    });

    // Speak the message
    const utterance = new SpeechSynthesisUtterance(message);

    // Try to use Indian voice if available
    if (this.voiceLoaded) {
      const indianVoice = this.getIndianVoice();
      if (indianVoice) {
        utterance.voice = indianVoice;
      } else {
        utterance.lang = "en-US";
      }
    } else {
      utterance.lang = "en-US";
    }

    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    this.speechSynthesis.speak(utterance);
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
    this.speechSynthesis.cancel();
  }
}

export const reminderService = ReminderService.getInstance();
