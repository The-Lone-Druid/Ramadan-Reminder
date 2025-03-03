import { RamadanData } from "../types/ramadan";
import { getCurrentRamadanDay, isRamadan, RAMADAN_2025 } from "./dates";
import { calculatePrayerTimes } from "./prayerTimes";
import { getCoordinates } from "./storage";

export const getRamadanData = async (): Promise<RamadanData> => {
  const coordinates = getCoordinates();
  if (!coordinates) {
    throw new Error("Location not set. Please enable location services.");
  }

  const prayerTimes = [];

  // Generate prayer times for Ramadan 2025 (March 2 to March 31)
  for (let i = 0; i < 30; i++) {
    // Create date directly for March 2 + i days
    const currentDate = new Date(2025, 2, 2 + i);
    
    const times = calculatePrayerTimes(currentDate, coordinates);
    prayerTimes.push({
      ...times,
      date: currentDate,
    });
  }

  return {
    prayerTimes,
    startDate: RAMADAN_2025.START,
    endDate: RAMADAN_2025.END,
    currentDay: getCurrentRamadanDay() || 0,
    totalDays: 30,
  };
};
