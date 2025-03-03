import { useState, useEffect, useCallback, useRef } from "react";
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

const getCacheKey = (year: number) => `ramadan_data_cache_${year}`;

interface CacheData {
  data: RamadanData;
  timestamp: number;
  year: number;
}

export const useRamadanData = () => {
  const [data, setData] = useState<RamadanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const notificationsSetupRef = useRef(false);

  const setupNotificationsForData = async (ramadanData: RamadanData) => {
    try {
      // If notifications have already been set up, skip
      if (notificationsSetupRef.current) {
        return;
      }

      // Check notification permissions
      const permResult = await LocalNotifications.checkPermissions();
      if (permResult.display !== "granted") {
        const requestResult = await LocalNotifications.requestPermissions();
        if (requestResult.display !== "granted") {
          console.log("Notification permissions not granted");
          return;
        }
      }

      // Setup notifications
      const setupSuccess = await setupNotifications();
      if (!setupSuccess) {
        console.error("Failed to setup notifications");
        return;
      }

      // Schedule notifications for each day
      const schedules = ramadanData.prayerTimes.map((day) => ({
        sehriTime: day.sehri,
        iftarTime: day.iftar,
        dayNumber: day.dayNumber,
      }));

      await scheduleRamadanNotifications(schedules);
      notificationsSetupRef.current = true;
    } catch (error) {
      console.error("Error setting up notifications:", error);
    }
  };

  const loadData = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        // Check if we have recent cached data and not forcing refresh
        if (!forceRefresh && data) {
          const now = Date.now();
          // Only refresh if last update was more than 1 hour ago
          if (now - lastUpdate < 60 * 60 * 1000) {
            return;
          }
        }

        setLoading(true);
        setError(null);

        // Try to get data from cache first
        const ramadanDates = getCurrentRamadanDates();
        const cacheKey = getCacheKey(ramadanDates.YEAR);
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData && !forceRefresh) {
          try {
            const { data: cachedRamadanData, timestamp } = JSON.parse(
              cachedData
            ) as CacheData;
            const isExpired = Date.now() - timestamp > 60 * 60 * 1000; // 1 hour expiry

            if (!isExpired) {
              const parsedData: RamadanData = {
                ...cachedRamadanData,
                prayerTimes: cachedRamadanData.prayerTimes.map((day) => ({
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
              };
              setData(parsedData);
              setLastUpdate(timestamp);
              setLoading(false);

              // Setup notifications with cached data if not already set up
              if (!notificationsSetupRef.current) {
                await setupNotificationsForData(parsedData);
              }
              return;
            }
          } catch (error) {
            console.error("Error parsing cached data:", error);
          }
        }

        // If no valid cache, get fresh data
        setLocationLoading(true);
        try {
          const coordinates = await getCurrentLocation();
          if (!coordinates) {
            throw new Error(
              "Unable to get location. Please enable location services and try again."
            );
          }

          // Save coordinates when successfully obtained
          saveCoordinates(coordinates);

          // Fetch new data with coordinates
          const newData = await getRamadanData(coordinates);
          setData(newData);
          setLastUpdate(Date.now());

          // Set up notifications with the new data if not already set up
          if (!notificationsSetupRef.current) {
            await setupNotificationsForData(newData);
          }

          // Update cache
          const cacheData: CacheData = {
            data: newData,
            timestamp: Date.now(),
            year: ramadanDates.YEAR,
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        } catch (error) {
          console.error("Location error:", error);
          // If getting current location fails, try to use cached coordinates
          const cachedCoordinates = getCoordinates();
          if (!cachedCoordinates) {
            setError(
              "Location permission required. Please enable location services in Settings."
            );
            return;
          }

          // Use cached coordinates to fetch data
          const newData = await getRamadanData(cachedCoordinates);
          setData(newData);
          setLastUpdate(Date.now());

          // Set up notifications with cached coordinates data if not already set up
          if (!notificationsSetupRef.current) {
            await setupNotificationsForData(newData);
          }
        } finally {
          setLocationLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    },
    [data, lastUpdate]
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, []); // Remove loadData from dependencies to prevent unnecessary reloads

  // Handle app resume - only refresh if it's been more than an hour
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupListener = async () => {
      const listener = await App.addListener(
        "appStateChange",
        ({ isActive }) => {
          if (isActive) {
            loadData();
          }
        }
      );
      cleanup = () => listener.remove();
    };

    setupListener();

    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [loadData]);

  // Subscribe to location changes
  useEffect(() => {
    const unsubscribe = locationEvents.subscribe(() => {
      loadData(true); // Force refresh when location changes
    });

    return () => {
      unsubscribe();
    };
  }, [loadData]);

  return {
    data,
    loading: loading || locationLoading,
    error,
    refresh: () => loadData(true),
  };
};
