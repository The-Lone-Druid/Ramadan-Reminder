import { Coordinates } from "adhan";

const STORAGE_KEYS = {
  COORDINATES: "ramadan-coordinates",
  NOTIFICATIONS: "ramadan-notifications",
  MANUAL_TIMES: "ramadan-manual-times",
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

const defaultCoordinates: Coordinates = {
  latitude: 23.8103, // Default to Dhaka, Bangladesh
  longitude: 90.4125,
};

export const saveCoordinates = (coordinates: Coordinates): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.COORDINATES, JSON.stringify(coordinates));
  } catch (error) {
    console.error("Error saving coordinates:", error);
  }
};

export const getCoordinates = (): Coordinates => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.COORDINATES);
    if (stored) {
      return JSON.parse(stored);
    }
    return defaultCoordinates;
  } catch (error) {
    console.error("Error getting coordinates:", error);
    return defaultCoordinates;
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
