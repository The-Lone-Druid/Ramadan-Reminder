import { addDays, startOfDay } from 'date-fns';
import { toHijri } from 'hijri-converter';
import { getDateAdjustment } from './storage';

interface RamadanDates {
  START: Date;
  END: Date;
  YEAR: number;
  dateAdjustment?: {
    enabled: boolean;
    daysToAdd: number;
    reason: string;
  };
}

export const calculateRamadanDates = (gregorianYear: number): RamadanDates => {
  // Find 1st of Ramadan for the given gregorian year
  let gregorianDate = new Date(gregorianYear, 0, 1); // Start of the year
  let hijriDate = toHijri(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  
  // Find when Ramadan starts in this gregorian year
  while (!(hijriDate.hm === 9 && hijriDate.hd === 1)) {
    gregorianDate = addDays(gregorianDate, 1);
    hijriDate = toHijri(gregorianDate.getFullYear(), gregorianDate.getMonth() + 1, gregorianDate.getDate());
  }
  
  // Get date adjustment configuration
  const dateAdjustment = getDateAdjustment();
  
  // Apply date adjustment if enabled
  const startDate = dateAdjustment.enabled 
    ? addDays(new Date(gregorianDate), dateAdjustment.daysToAdd)
    : new Date(gregorianDate);
    
  const endDate = addDays(startDate, 29); // Ramadan is either 29 or 30 days
  
  return {
    START: startDate,
    END: endDate,
    YEAR: gregorianYear,
    dateAdjustment: dateAdjustment.enabled ? dateAdjustment : undefined
  };
};

export const getCurrentRamadanDates = (): RamadanDates => {
  const today = new Date();
  const currentYear = today.getFullYear();
  const nextYear = currentYear + 1;
  
  // Calculate Ramadan dates for current and next year
  const currentYearDates = calculateRamadanDates(currentYear);
  const nextYearDates = calculateRamadanDates(nextYear);
  
  // If today is after current year's Ramadan, return next year's dates
  if (today > currentYearDates.END) {
    return nextYearDates;
  }
  
  // Otherwise return current year's dates
  return currentYearDates;
};

export const getCurrentRamadanDay = (): number | null => {
  const ramadanDates = getCurrentRamadanDates();
  const today = startOfDay(new Date());
  
  if (!isRamadan()) return null;
  
  const diffTime = Math.abs(today.getTime() - ramadanDates.START.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const isRamadan = (): boolean => {
  const today = startOfDay(new Date());
  const ramadanDates = getCurrentRamadanDates();
  return today >= ramadanDates.START && today <= ramadanDates.END;
};

export const getRamadanDates = () => {
  const ramadanDates = getCurrentRamadanDates();
  const dates = [];
  
  let currentDate = new Date(ramadanDates.START);
  let dayNumber = 1;
  
  while (currentDate <= ramadanDates.END) {
    dates.push({
      date: new Date(currentDate),
      dayNumber,
      isToday: startOfDay(new Date()).getTime() === startOfDay(currentDate).getTime()
    });
    
    currentDate = addDays(currentDate, 1);
    dayNumber++;
  }
  
  return dates;
}; 