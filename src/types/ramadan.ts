export interface PrayerTime {
  sehri: Date;
  iftar: Date;
  date: Date;
}

export interface TTSSettings {
  enabled: boolean;
  language: string;
  volume: number;
  rate: number;
  pitch: number;
}

export type RamadanDay = {
  date: Date;
  dayNumber: number;
  isToday: boolean;
  sehri: Date;
  iftar: Date;
  // Prayer times
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  sunset: Date;
  maghrib: Date;
  isha: Date;
};

export interface RamadanData {
  prayerTimes: RamadanDay[];
  currentDay: number;
  totalDays: number;
} 