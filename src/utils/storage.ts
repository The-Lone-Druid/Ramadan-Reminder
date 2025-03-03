import { Coordinates } from "adhan";
import { TTSSettings } from '../types/ramadan';
import { locationEvents } from './events';
import { Geolocation } from '@capacitor/geolocation';

export interface DateAdjustmentConfig {
  enabled: boolean;
  daysToAdd: number;
  reason: string;
}

const STORAGE_KEYS = {
  COORDINATES: "ramadan-coordinates",
  NOTIFICATIONS: "ramadan-notifications",
  MANUAL_TIMES: "ramadan-manual-times",
  TTS_SETTINGS: 'tts_settings',
  DATE_ADJUSTMENT: 'date-adjustment',
};

interface NotificationSettings {
  sehri: boolean;
  iftar: boolean;
}

export interface ManualTimeEntry {
  date: string; // ISO string
  sehri: string; // HH:mm format
  iftar: string; // HH:mm format
}

const DEFAULT_TTS_SETTINGS: TTSSettings = {
  enabled: true,
  volume: 1.0,
  language: 'en-IN',
  rate: 1.0,
  pitch: 1.0,
};

// Function to determine if location is in India (approximate bounding box)
export const isLocationInIndia = (coordinates: Coordinates | null): boolean => {
  if (!coordinates) return false;
  const { latitude, longitude } = coordinates;
  return latitude >= 8.4 && latitude <= 37.6 && longitude >= 68.7 && longitude <= 97.25;
};

export const getDateAdjustment = (): DateAdjustmentConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.DATE_ADJUSTMENT);
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Auto-configure based on location
    const coordinates = getCoordinates();
    if (isLocationInIndia(coordinates)) {
      return {
        enabled: true,
        daysToAdd: 1,
        reason: 'Adjusted for Indian moon sighting practice',
      };
    }
    
    return {
      enabled: false,
      daysToAdd: 0,
      reason: '',
    };
  } catch (error) {
    console.error("Error getting date adjustment:", error);
    return {
      enabled: false,
      daysToAdd: 0,
      reason: '',
    };
  }
};

export const saveDateAdjustment = (config: DateAdjustmentConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.DATE_ADJUSTMENT, JSON.stringify(config));
  } catch (error) {
    console.error("Error saving date adjustment:", error);
  }
};

export const saveCoordinates = (coordinates: Coordinates): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
    // Emit location change event
    locationEvents.emit(coordinates);
  } catch (error) {
    console.error("Error saving coordinates:", error);
  }
};

export const getCoordinates = (): Coordinates | null => {
  const stored = localStorage.getItem(STORAGE_KEYS.COORDINATES);
  if (!stored) return null;
  
  try {
    return JSON.parse(stored) as Coordinates;
  } catch {
    return null;
  }
};

export const saveNotificationSettings = (
  settings: NotificationSettings
): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
  } catch (error) {
    console.error("Error saving notification settings:", error);
  }
};

export const getNotificationSettings = (): NotificationSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!stored) return { sehri: true, iftar: true };
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error getting notification settings:", error);
    return { sehri: true, iftar: true };
  }
};

export const saveManualTimeEntry = (entry: ManualTimeEntry): void => {
  try {
    const entries = getManualTimeEntries();
    const existingIndex = entries.findIndex((e) => e.date === entry.date);

    if (existingIndex >= 0) {
      entries[existingIndex] = entry;
    } else {
      entries.push(entry);
    }

    localStorage.setItem(STORAGE_KEYS.MANUAL_TIMES, JSON.stringify(entries));
  } catch (error) {
    console.error("Error saving manual time entry:", error);
  }
};

export const getManualTimeEntries = (): ManualTimeEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.MANUAL_TIMES);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error getting manual time entries:", error);
    return [];
  }
};

export const getManualTimeForDate = (date: Date): ManualTimeEntry | null => {
  try {
    const entries = getManualTimeEntries();
    const dateStr = date.toISOString().split("T")[0];
    return entries.find((entry) => entry.date === dateStr) || null;
  } catch (error) {
    console.error("Error getting manual time for date:", error);
    return null;
  }
};

export const getTTSSettings = (): TTSSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.TTS_SETTINGS);
    if (!stored) return DEFAULT_TTS_SETTINGS;
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error getting TTS settings:', error);
    return DEFAULT_TTS_SETTINGS;
  }
};

export const saveTTSSettings = (settings: TTSSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.TTS_SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving TTS settings:', error);
  }
};

export const setCoordinates = (coordinates: Coordinates) => {
  localStorage.setItem(STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
};

export const getCurrentLocation = async (): Promise<Coordinates> => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    });

    const coordinates: Coordinates = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    
    setCoordinates(coordinates);
    return coordinates;
  } catch (error: unknown) {
    console.error('Geolocation error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to get location: ${errorMessage}`);
  }
};
