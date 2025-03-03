export interface PrayerTime {
  sehri: Date;
  iftar: Date;
  date: Date;
}

export interface TTSSettings {
  enabled: boolean;
  volume: number;
  language: 'en-IN' | 'en-US';
  rate: number;
  pitch: number;
}

export interface RamadanData {
  prayerTimes: PrayerTime[];
  startDate: Date;
  endDate: Date;
  currentDay: number;
  totalDays: number;
} 