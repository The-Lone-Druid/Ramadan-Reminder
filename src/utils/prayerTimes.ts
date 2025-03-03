import { PrayerTimes, Coordinates, CalculationMethod } from 'adhan';
import { addMinutes, setHours, setMinutes } from 'date-fns';

export interface TimingType {
  sehri: Date;
  iftar: Date;
}

export const calculatePrayerTimes = (date: Date, coordinates: Coordinates): TimingType => {
  const params = CalculationMethod.MoonsightingCommittee();
  const prayerTimes = new PrayerTimes(coordinates, date, params);

  // Sehri time is 10 minutes before Fajr
  const sehri = addMinutes(prayerTimes.fajr, -10);
  
  // Iftar time is at Maghrib
  const iftar = prayerTimes.maghrib;

  return {
    sehri,
    iftar,
  };
};

// Default coordinates (will be replaced with user's location)
export const defaultCoordinates: Coordinates = {
  latitude: 21.4225,   // Mecca latitude
  longitude: 39.8262,  // Mecca longitude
}; 