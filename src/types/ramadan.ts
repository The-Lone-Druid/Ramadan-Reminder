export interface PrayerTime {
  sehri: Date;
  iftar: Date;
  date: Date;
}

export interface RamadanData {
  prayerTimes: PrayerTime[];
  startDate: Date;
  endDate: Date;
  currentDay: number;
  totalDays: number;
} 