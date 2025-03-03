import { LocalNotifications } from '@capacitor/local-notifications';
import { TimingType } from './prayerTimes';
import { format, parse } from 'date-fns';
import { getManualTimeForDate } from './storage';

export const scheduleNotifications = async (times: TimingType) => {
  // Request permission
  const permResult = await LocalNotifications.requestPermissions();
  if (!permResult.display) {
    console.error('Notification permission denied');
    return;
  }

  // Check for manual time entry
  const manualEntry = getManualTimeForDate(times.sehri);
  let sehriTime = times.sehri;
  let iftarTime = times.iftar;

  if (manualEntry) {
    // Parse manual times
    sehriTime = parse(manualEntry.sehri, 'HH:mm', times.sehri);
    iftarTime = parse(manualEntry.iftar, 'HH:mm', times.iftar);
  }

  // Cancel any existing notifications
  await LocalNotifications.cancel({ notifications: [] });

  // Schedule notifications
  await LocalNotifications.schedule({
    notifications: [
      {
        id: 1,
        title: 'Sehri Time Approaching',
        body: `Sehri ends at ${format(sehriTime, 'h:mm a')}. Please finish your meal.`,
        schedule: { at: new Date(sehriTime.getTime() - 30 * 60 * 1000) },
        sound: 'beep.wav',
        actionTypeId: '',
        extra: null
      },
      {
        id: 2,
        title: 'Sehri Time Ending',
        body: 'Sehri time is ending now. Please stop eating and drinking.',
        schedule: { at: sehriTime },
        sound: 'beep.wav',
        actionTypeId: '',
        extra: null
      },
      {
        id: 3,
        title: 'Iftar Time',
        body: 'It\'s time for Iftar! May Allah accept your fast.',
        schedule: { at: iftarTime },
        sound: 'beep.wav',
        actionTypeId: '',
        extra: null
      }
    ]
  });
};

export const checkNotificationPermissions = async () => {
  const permResult = await LocalNotifications.requestPermissions();
  return permResult.display;
}; 