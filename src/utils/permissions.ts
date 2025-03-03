import { Geolocation } from '@capacitor/geolocation';
import { LocalNotifications } from '@capacitor/local-notifications';
import { requestLocationPermission } from './location';

export interface PermissionStatus {
  location: boolean;
  notifications: boolean;
}

export const requestPermissions = async (): Promise<PermissionStatus> => {
  try {
    // Request location permission
    const locationGranted = await requestLocationPermission();

    // Request notification permission
    const notificationPermission = await LocalNotifications.requestPermissions();
    const notificationsGranted = notificationPermission.display === 'granted';

    return {
      location: locationGranted,
      notifications: notificationsGranted
    };
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return {
      location: false,
      notifications: false
    };
  }
};

export const checkPermissions = async (): Promise<PermissionStatus> => {
  try {
    // Check location permission
    const locationPermission = await Geolocation.checkPermissions();
    const locationGranted = locationPermission.location === 'granted';

    // Check notification permission
    const notificationPermission = await LocalNotifications.checkPermissions();
    const notificationsGranted = notificationPermission.display === 'granted';

    return {
      location: locationGranted,
      notifications: notificationsGranted
    };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      location: false,
      notifications: false
    };
  }
}; 