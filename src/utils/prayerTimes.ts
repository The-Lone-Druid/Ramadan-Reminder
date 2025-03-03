import { PrayerTimes, Coordinates, CalculationMethod } from "adhan";
import { addMinutes } from "date-fns";

export interface TimingType {
  sehri: Date;
  iftar: Date;
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  sunset: Date;
  maghrib: Date;
  isha: Date;
}

const isValidDate = (date: Date | undefined | null): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

const toValidDate = (date: Date | undefined, fallback: Date): Date => {
  if (!date || !isValidDate(date)) {
    console.warn("Invalid date detected, using fallback");
    return fallback;
  }
  return date;
};

export const calculatePrayerTimes = (
  date: Date,
  coordinates: Coordinates
): TimingType => {
  try {
    const params = CalculationMethod.MoonsightingCommittee();

    // Create a new date at midnight for the given date
    const calcDate = new Date(date);
    calcDate.setHours(0, 0, 0, 0);

    const prayerTimes = new PrayerTimes(coordinates, calcDate, params);

    // Convert prayer times to proper Date objects
    const prayerDate = (time: Date): Date => {
      const newDate = new Date(calcDate);
      newDate.setHours(time.getHours());
      newDate.setMinutes(time.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      return newDate;
    };

    // Get all prayer times and ensure they're on the correct date
    const fajr = prayerDate(prayerTimes.fajr);
    const sunrise = prayerDate(prayerTimes.sunrise);
    const dhuhr = prayerDate(prayerTimes.dhuhr);
    const asr = prayerDate(prayerTimes.asr);
    const sunset = prayerDate(prayerTimes.sunset);
    const maghrib = prayerDate(prayerTimes.maghrib);
    const isha = prayerDate(prayerTimes.isha);

    // Calculate sehri and iftar based on fajr and maghrib
    const sehri = addMinutes(fajr, -10);
    const iftar = new Date(maghrib);

    // Validate all times
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    return {
      sehri: toValidDate(sehri, addMinutes(baseDate, 290)), // 4:50 AM
      iftar: toValidDate(iftar, addMinutes(baseDate, 1080)), // 6:00 PM
      fajr: toValidDate(fajr, addMinutes(baseDate, 300)), // 5:00 AM
      sunrise: toValidDate(sunrise, addMinutes(baseDate, 360)), // 6:00 AM
      dhuhr: toValidDate(dhuhr, addMinutes(baseDate, 720)), // 12:00 PM
      asr: toValidDate(asr, addMinutes(baseDate, 900)), // 3:00 PM
      sunset: toValidDate(sunset, addMinutes(baseDate, 1080)), // 6:00 PM
      maghrib: toValidDate(maghrib, addMinutes(baseDate, 1080)), // 6:00 PM
      isha: toValidDate(isha, addMinutes(baseDate, 1170)), // 7:30 PM
    };
  } catch (error) {
    console.error("Error calculating prayer times:", error);
    // Return fallback times if calculation fails
    const baseDate = new Date(date);
    baseDate.setHours(0, 0, 0, 0);

    return {
      sehri: addMinutes(baseDate, 290), // 4:50 AM
      fajr: addMinutes(baseDate, 300), // 5:00 AM
      sunrise: addMinutes(baseDate, 360), // 6:00 AM
      dhuhr: addMinutes(baseDate, 720), // 12:00 PM
      asr: addMinutes(baseDate, 900), // 3:00 PM
      sunset: addMinutes(baseDate, 1080), // 6:00 PM
      maghrib: addMinutes(baseDate, 1080), // 6:00 PM
      iftar: addMinutes(baseDate, 1080), // 6:00 PM
      isha: addMinutes(baseDate, 1170), // 7:30 PM
    };
  }
};

// Default coordinates (will be replaced with user's location)
export const defaultCoordinates: Coordinates = {
  latitude: 21.4225, // Mecca latitude
  longitude: 39.8262, // Mecca longitude
};
