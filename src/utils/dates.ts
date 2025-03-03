import { addDays, isAfter, isBefore, startOfDay } from 'date-fns';

// Ramadan 2025 dates (approximate, subject to moon sighting)
export const RAMADAN_2025 = {
  START: new Date(2025, 2, 2), // March 2, 2025 (month is 0-based)
  END: new Date(2025, 2, 31), // March 31, 2025
};

export const getCurrentRamadanDay = (): number | null => {
  if (!isRamadan()) return null;
  
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - RAMADAN_2025.START.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

export const isRamadan = (): boolean => {
  const today = new Date();
  return today >= RAMADAN_2025.START && today <= RAMADAN_2025.END;
};

export const getRamadanDates = () => {
  const dates = [];
  const startDate = new Date(2025, 2, 2); // March 2, 2025
  
  for (let i = 0; i < 30; i++) {
    const currentDate = new Date(2025, 2, 2 + i); // Start from March 2 and increment
    dates.push({
      date: currentDate,
      dayNumber: i + 1,
      isToday: startOfDay(new Date()).getTime() === startOfDay(currentDate).getTime()
    });
  }
  
  return dates;
}; 