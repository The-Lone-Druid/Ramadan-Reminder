import { ActionPerformed, LocalNotifications, LocalNotificationSchema } from '@capacitor/local-notifications';
import { Preferences } from '@capacitor/preferences';
import { format } from 'date-fns';

export interface NotificationSchedule {
  sehriTime: Date;
  iftarTime: Date;
  dayNumber: number;
}

const NOTIFICATION_CHANNEL_ID = 'ramadan-reminders';
const NOTIFICATIONS_SETUP_KEY = 'notifications-setup-completed';
const NOTIFICATIONS_LAST_SCHEDULED_KEY = 'notifications-last-scheduled';

// Limit the number of notifications to schedule at once to prevent performance issues
const MAX_NOTIFICATIONS_PER_BATCH = 10;
const BATCH_DELAY_MS = 500;

export const setupNotifications = async () => {
  try {
    // Check if notifications are already set up
    const setupCompleted = await Preferences.get({ key: NOTIFICATIONS_SETUP_KEY });
    if (setupCompleted.value === 'true') {
      console.log('Notifications already set up');
      return true;
    }

    // Create notification channel (Android only)
    await LocalNotifications.createChannel({
      id: NOTIFICATION_CHANNEL_ID,
      name: 'Ramadan Reminders',
      description: 'Notifications for Sehri and Iftar times',
      importance: 5, // High importance
      visibility: 1, // Public
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#488AFF'
    });

    // Register notification actions
    await LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'SEHRI_ACTION',
          actions: [
            {
              id: 'view',
              title: 'View Times'
            }
          ]
        },
        {
          id: 'IFTAR_ACTION',
          actions: [
            {
              id: 'view',
              title: 'View Times'
            }
          ]
        }
      ]
    });

    // Mark setup as completed
    await Preferences.set({ key: NOTIFICATIONS_SETUP_KEY, value: 'true' });
    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

// Helper function to schedule notifications in batches
const scheduleNotificationBatch = async (notifications: LocalNotificationSchema[]) => {
  if (notifications.length === 0) return;
  
  // Process in batches to prevent performance issues
  for (let i = 0; i < notifications.length; i += MAX_NOTIFICATIONS_PER_BATCH) {
    const batch = notifications.slice(i, i + MAX_NOTIFICATIONS_PER_BATCH);
    
    try {
      await LocalNotifications.schedule({ notifications: batch });
      
      // Add a small delay between batches to prevent UI lag
      if (i + MAX_NOTIFICATIONS_PER_BATCH < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
      }
    } catch (error) {
      console.error(`Error scheduling notification batch ${i}:`, error);
      // Continue with next batch even if this one fails
    }
  }
};

export const scheduleRamadanNotifications = async (schedules: NotificationSchedule[]) => {
  try {
    // Check if we've already scheduled notifications recently
    const lastScheduled = await Preferences.get({ key: NOTIFICATIONS_LAST_SCHEDULED_KEY });
    const now = Date.now();
    
    if (lastScheduled.value) {
      const lastTime = parseInt(lastScheduled.value);
      // If we scheduled notifications in the last hour, skip to prevent duplicates
      if (now - lastTime < 60 * 60 * 1000) {
        console.log('Notifications already scheduled recently');
        return true;
      }
    }
    
    // Cancel any existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    // Create notifications array
    const notifications: LocalNotificationSchema[] = [];
    
    // Only schedule notifications for future dates
    const now_date = new Date();
    
    schedules.forEach(schedule => {
      // Skip past dates
      if (schedule.sehriTime < now_date && schedule.iftarTime < now_date) {
        return;
      }
      
      // Sehri notification (if in future)
      if (schedule.sehriTime > now_date) {
        notifications.push({
          id: schedule.dayNumber * 2 - 1,
          title: 'Sehri Time',
          body: `Day ${schedule.dayNumber}: Sehri time is at ${format(schedule.sehriTime, 'hh:mm a')}`,
          schedule: { at: new Date(schedule.sehriTime.getTime() - 30 * 60000) }, // 30 minutes before
          channelId: NOTIFICATION_CHANNEL_ID,
          actionTypeId: 'SEHRI_ACTION',
          extra: {
            dayNumber: schedule.dayNumber,
            type: 'sehri'
          }
        });
      }
      
      // Iftar notification (if in future)
      if (schedule.iftarTime > now_date) {
        notifications.push({
          id: schedule.dayNumber * 2,
          title: 'Iftar Time',
          body: `Day ${schedule.dayNumber}: Iftar time is at ${format(schedule.iftarTime, 'hh:mm a')}`,
          schedule: { at: new Date(schedule.iftarTime.getTime() - 15 * 60000) }, // 15 minutes before
          channelId: NOTIFICATION_CHANNEL_ID,
          actionTypeId: 'IFTAR_ACTION',
          extra: {
            dayNumber: schedule.dayNumber,
            type: 'iftar'
          }
        });
      }
    });

    // Schedule notifications in batches
    await scheduleNotificationBatch(notifications);
    
    // Record that we scheduled notifications
    await Preferences.set({ key: NOTIFICATIONS_LAST_SCHEDULED_KEY, value: now.toString() });

    return true;
  } catch (error) {
    console.error('Error scheduling notifications:', error);
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
};

// Add notification listeners
export const addNotificationListeners = (
  onReceived?: (notification: LocalNotificationSchema) => void,
  onAction?: (notification: ActionPerformed) => void
) => {
  try {
    LocalNotifications.addListener('localNotificationReceived', (notification) => {
      console.log('Notification received:', notification);
      onReceived?.(notification);
    });

    LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
      console.log('Notification action performed:', notification);
      onAction?.(notification);
    });
  } catch (error) {
    console.error('Error adding notification listeners:', error);
  }
};

export const removeNotificationListeners = () => {
  try {
    LocalNotifications.removeAllListeners();
  } catch (error) {
    console.error('Error removing notification listeners:', error);
  }
};

export const showFullTestNotifications = async () => {
  try {
    // First check permissions
    const permResult = await LocalNotifications.checkPermissions();
    if (permResult.display !== "granted") {
      const requestResult = await LocalNotifications.requestPermissions();
      if (requestResult.display !== "granted") {
        throw new Error("Notification permissions not granted");
      }
    }

    // Use small integer IDs instead of Date.now()
    const TEST_SEHRI_ID = 9001; // Use a fixed integer ID for test notifications
    const TEST_IFTAR_ID = 9002; // Use a different fixed integer ID

    // Cancel any existing test notifications first
    await LocalNotifications.cancel({
      notifications: [
        { id: TEST_SEHRI_ID },
        { id: TEST_IFTAR_ID }
      ]
    });

    // Schedule test notifications with small delays
    await LocalNotifications.schedule({
      notifications: [
        {
          title: "Sehri Time",
          body: "Time to wake up for Sehri! This is a test notification.",
          id: TEST_SEHRI_ID,
          schedule: { at: new Date(Date.now() + 3000) }, // 3 seconds delay
          sound: "beep.wav",
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: "ic_notification",
          iconColor: "#488AFF",
          extra: {
            type: "TEST_SEHRI",
          },
        },
        {
          title: "Iftar Time",
          body: "Time for Iftar! This is a test notification.",
          id: TEST_IFTAR_ID,
          schedule: { at: new Date(Date.now() + 6000) }, // 6 seconds delay
          sound: "beep.wav",
          channelId: NOTIFICATION_CHANNEL_ID,
          smallIcon: "ic_notification",
          iconColor: "#488AFF",
          extra: {
            type: "TEST_IFTAR",
          },
        },
      ],
    });

    return true;
  } catch (error) {
    console.error("Error showing test notifications:", error);
    throw error;
  }
}; 