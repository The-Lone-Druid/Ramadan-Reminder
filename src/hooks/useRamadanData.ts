import { useEffect, useCallback } from "react";
import { getRamadanData } from "../utils/api";
import { RamadanData } from "../types/ramadan";
import { getCurrentRamadanDates } from "../utils/dates";
import { locationEvents } from "../utils/events";
import {
  getCoordinates,
  getCurrentLocation,
  saveCoordinates,
} from "../utils/storage";
import { App } from "@capacitor/app";
import { LocalNotifications } from "@capacitor/local-notifications";
import {
  setupNotifications,
  scheduleRamadanNotifications,
} from "../utils/notifications";
import { Store } from "@tanstack/store";
import { useStore } from "@tanstack/react-store";

const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in ms
const getCacheKey = (year: number) => `ramadan_data_cache_${year}`;

interface CacheData {
  data: RamadanData;
  timestamp: number;
  year: number;
}

interface IRamadanDataStore {
  data: RamadanData | null;
  loading: boolean;
  error: string | null;
  locationLoading: boolean;
  lastUpdate: number;
  isNotificationSetup: boolean;
}

const initialState: IRamadanDataStore = {
  data: null,
  loading: true,
  error: null,
  locationLoading: false,
  lastUpdate: 0,
  isNotificationSetup: false,
};

const RamadanDataStore = new Store<IRamadanDataStore>(initialState);

const parseCachedData = (cachedData: RamadanData): RamadanData => ({
  ...cachedData,
  prayerTimes: cachedData.prayerTimes.map((day) => ({
    ...day,
    date: new Date(day.date),
    sehri: new Date(day.sehri),
    iftar: new Date(day.iftar),
    fajr: new Date(day.fajr),
    sunrise: new Date(day.sunrise),
    dhuhr: new Date(day.dhuhr),
    asr: new Date(day.asr),
    sunset: new Date(day.sunset),
    maghrib: new Date(day.maghrib),
    isha: new Date(day.isha),
  })),
});

export const useRamadanData = () => {
  const {
    data,
    loading,
    error,
    locationLoading,
    lastUpdate,
    isNotificationSetup,
  } = useStore(RamadanDataStore);

  const setupNotificationsForData = async (ramadanData: RamadanData) => {
    if (isNotificationSetup) return;

    try {
      const permResult = await LocalNotifications.checkPermissions();
      if (permResult.display !== "granted") {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== "granted") return;
      }

      if (!(await setupNotifications())) {
        throw new Error("Failed to setup notifications");
      }

      const schedules = ramadanData.prayerTimes.map(
        ({ sehri, iftar, dayNumber }) => ({
          sehriTime: sehri,
          iftarTime: iftar,
          dayNumber,
        })
      );

      await scheduleRamadanNotifications(schedules);
      RamadanDataStore.setState((prev) => ({
        ...prev,
        isNotificationSetup: true,
      }));
    } catch (error) {
      console.error("Notification setup error:", error);
    }
  };

  const getCachedData = async (year: number): Promise<RamadanData | null> => {
    try {
      const cached = localStorage.getItem(getCacheKey(year));
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached) as CacheData;
      if (Date.now() - timestamp > CACHE_EXPIRY) return null;

      return parseCachedData(data);
    } catch (error) {
      console.error("Cache read error:", error);
      return null;
    }
  };

  const getFreshData = async (): Promise<RamadanData> => {
    RamadanDataStore.setState((prev) => ({ ...prev, locationLoading: true }));

    try {
      const coordinates = await getCurrentLocation();
      if (!coordinates) {
        throw new Error("Location services required");
      }

      await saveCoordinates(coordinates);
      return await getRamadanData(coordinates);
    } catch (error) {
      console.log("Error getting fresh data:", error);
      const cachedCoordinates = getCoordinates();
      if (!cachedCoordinates) {
        throw new Error("Location permission required");
      }
      return await getRamadanData(cachedCoordinates);
    } finally {
      RamadanDataStore.setState((prev) => ({
        ...prev,
        locationLoading: false,
      }));
    }
  };

  const updateCache = async (data: RamadanData, year: number) => {
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
      year,
    };
    localStorage.setItem(getCacheKey(year), JSON.stringify(cacheData));
  };

  const loadData = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();

      // Check if we can use existing data
      if (!forceRefresh && data && now - lastUpdate < CACHE_EXPIRY) {
        return;
      }

      try {
        RamadanDataStore.setState((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Try cache first
        const ramadanDates = getCurrentRamadanDates();
        const cachedData = await getCachedData(ramadanDates.YEAR);

        if (cachedData && !forceRefresh) {
          RamadanDataStore.setState((prev) => ({
            ...prev,
            data: cachedData,
            lastUpdate: now,
            loading: false,
          }));
          await setupNotificationsForData(cachedData);
          return;
        }

        // Get fresh data
        const freshData = await getFreshData();
        RamadanDataStore.setState((prev) => ({
          ...prev,
          data: freshData,
          lastUpdate: now,
        }));

        await updateCache(freshData, ramadanDates.YEAR);
        await setupNotificationsForData(freshData);
      } catch (error) {
        RamadanDataStore.setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error.message : "Failed to load data",
        }));
      } finally {
        RamadanDataStore.setState((prev) => ({ ...prev, loading: false }));
      }
    },
    [data, lastUpdate, setupNotificationsForData]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, []); // Dependency removed to prevent unnecessary reloads

  // App resume handler
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupAppStateListener = async () => {
      const listener = await App.addListener(
        "appStateChange",
        ({ isActive }) => isActive && loadData()
      );
      cleanup = () => listener.remove();
    };

    setupAppStateListener();
    return () => cleanup?.();
  }, [loadData]);

  // Location change handler
  useEffect(() => {
    const unsubscribe = locationEvents.subscribe(() => loadData(true));
    return () => unsubscribe();
  }, [loadData]);

  return {
    data,
    loading: loading || locationLoading,
    error,
    refresh: () => loadData(true),
  };
};
