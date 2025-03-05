import { Geolocation } from "@capacitor/geolocation";
import { Preferences } from "@capacitor/preferences";

export interface LocationResult {
  latitude: number;
  longitude: number;
  error?: string;
}

const GEOLOCATION_OPTIONS = {
  timeout: 10000, // 10 seconds
  maximumAge: 3600000, // Use cached position up to 1 hour old
  enableHighAccuracy: false, // Set to false for better performance
};

const LOCATION_CACHE_KEY = "cached-location";
const LOCATION_CACHE_TIMESTAMP_KEY = "cached-location-timestamp";
const LOCATION_CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const requestLocationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Geolocation.requestPermissions();
    return permission.location === "granted";
  } catch (error) {
    console.error("Error requesting location permission:", error);
    return false;
  }
};

export const getCachedLocation = async (): Promise<LocationResult | null> => {
  try {
    const cachedLocation = await Preferences.get({ key: LOCATION_CACHE_KEY });
    const cachedTimestamp = await Preferences.get({ key: LOCATION_CACHE_TIMESTAMP_KEY });
    
    if (!cachedLocation.value || !cachedTimestamp.value) {
      return null;
    }
    
    const timestamp = parseInt(cachedTimestamp.value);
    const now = Date.now();
    
    // Check if cache is expired
    if (now - timestamp > LOCATION_CACHE_EXPIRY) {
      return null;
    }
    
    const location = JSON.parse(cachedLocation.value);
    return {
      latitude: location.latitude,
      longitude: location.longitude,
    };
  } catch (error) {
    console.error("Error getting cached location:", error);
    return null;
  }
};

export const cacheLocation = async (location: LocationResult): Promise<void> => {
  try {
    await Preferences.set({
      key: LOCATION_CACHE_KEY,
      value: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
      }),
    });
    
    await Preferences.set({
      key: LOCATION_CACHE_TIMESTAMP_KEY,
      value: Date.now().toString(),
    });
  } catch (error) {
    console.error("Error caching location:", error);
  }
};

export const getCurrentLocation = async (): Promise<LocationResult> => {
  try {
    // First try to get cached location
    const cachedLocation = await getCachedLocation();
    if (cachedLocation) {
      console.log("Using cached location");
      return cachedLocation;
    }
    
    // Check permission before trying to get location
    const permission = await Geolocation.checkPermissions();
    if (permission.location !== "granted") {
      throw new Error("Location permission not granted");
    }
    
    // Get current location
    const coordinates = await Geolocation.getCurrentPosition(GEOLOCATION_OPTIONS);
    
    const location = {
      latitude: coordinates.coords.latitude,
      longitude: coordinates.coords.longitude,
    };
    
    // Cache the location for future use
    await cacheLocation(location);
    
    return location;
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
