import { LocalNotifications, LocalNotificationSchema, ActionPerformed } from '@capacitor/local-notifications';
import { format } from 'date-fns';

export interface NotificationSchedule {
  sehriTime: Date;
  iftarTime: Date;
  dayNumber: number;
}

const NOTIFICATION_CHANNEL_ID = 'ramadan-reminders';

export const setupNotifications = async () => {
  try {
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

    return true;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
};

export const scheduleRamadanNotifications = async (schedules: NotificationSchedule[]) => {
  try {
    // Cancel any existing notifications
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel(pending);
    }

    // Schedule new notifications for each day
    const notifications = schedules.flatMap((schedule) => [
      {
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
      },
      {
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
      }
    ]);

    await LocalNotifications.schedule({
      notifications
    });

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
  LocalNotifications.addListener('localNotificationReceived', (notification) => {
    console.log('Notification received:', notification);
    onReceived?.(notification);
  });

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    console.log('Notification action performed:', notification);
    onAction?.(notification);
  });
};

export const removeNotificationListeners = () => {
  LocalNotifications.removeAllListeners();
}; 