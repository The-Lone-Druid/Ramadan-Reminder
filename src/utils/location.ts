import { Geolocation } from "@capacitor/geolocation";

export interface LocationResult {
  latitude: number;
  longitude: number;
  error?: string;
}

const GEOLOCATION_OPTIONS = {
  timeout: 10000, // 10 seconds
  maximumAge: 0, // Don't use cached position
  enableHighAccuracy: true,
};

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    const coordinates = await Geolocation.getCurrentPosition(GEOLOCATION_OPTIONS);
    return {
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
    };
  } catch (error) {
    console.error("Error getting current location:", error);
    let errorMessage = "Error getting current location";

    if (error instanceof Error) {
      switch (error.message) {
        case "User denied Geolocation":
          errorMessage = "Location permission denied. Please enable location access in your device settings.";
          break;
        case "Location services are not enabled":
          errorMessage = "Please enable location services in your device settings.";
          break;
        case "Location request timed out":
          errorMessage = "Location request timed out. Please try again.";
          break;
        default:
          errorMessage = `Location error: ${error.message}`;
      }
    }

    return {
      latitude: 0,
      longitude: 0,
      error: errorMessage
    };
  }
};
