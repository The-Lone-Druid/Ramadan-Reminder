import { Geolocation } from "@capacitor/geolocation";
import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();

const GEOLOCATION_OPTIONS = {
  timeout: 10000, // 10 seconds
  maximumAge: 0, // Don't use cached position
  enableHighAccuracy: true,
};

export const requestLocationPermission = async (): Promise<boolean> => {
  if (isNative) {
    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === "granted";
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return false;
    }
  } else {
    // For web browsers, we'll use the browser's geolocation API
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by your browser");
        resolve(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        (error) => {
          console.error("Geolocation permission error:", error.message);
          resolve(false);
        },
        GEOLOCATION_OPTIONS
      );
    });
  }
};

export const getCurrentLocation = async (): Promise<{
  latitude: number;
  longitude: number;
} | null> => {
  if (isNative) {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      return {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      };
    } catch (error) {
      console.error("Error getting current location:", error);
      return null;
    }
  } else {
    // For web browsers, use the browser's geolocation API
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error("Geolocation is not supported by your browser");
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          let errorMessage = "Error getting current location";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage =
                "Location permission denied. Please enable location access in your browser settings.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = `Location error: ${error.message}`;
          }
          console.error(errorMessage);
          resolve(null);
        },
        GEOLOCATION_OPTIONS
      );
    });
  }
};
