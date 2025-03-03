import { RamadanData, RamadanDay } from "../types/ramadan";
import { getCurrentRamadanDay, getRamadanDates } from "./dates";
import { calculatePrayerTimes } from "./prayerTimes";
import { Coordinates } from "adhan";

export const getRamadanData = async (coordinates: Coordinates): Promise<RamadanData> => {
  const currentDay = getCurrentRamadanDay() || 0;
  const dates = getRamadanDates();
  
  // Calculate prayer times for each day
  const prayerTimes: RamadanDay[] = dates.map(({ date, dayNumber, isToday }) => {
    const times = calculatePrayerTimes(date, coordinates);
    return {
      date,
      dayNumber,
      isToday,
      sehri: times.sehri,
      iftar: times.iftar,
      fajr: times.fajr,
      sunrise: times.sunrise,
      dhuhr: times.dhuhr,
      asr: times.asr,
      sunset: times.sunset,
      maghrib: times.maghrib,
      isha: times.isha,
    };
  });

  return {
    prayerTimes,
    currentDay,
    totalDays: dates.length,
  };
};
