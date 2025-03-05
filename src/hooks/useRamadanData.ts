import { useEffect, useCallback, useMemo, useRef } from "react";
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

// Create store outside component to prevent recreation
const RamadanDataStore = new Store<IRamadanDataStore>(initialState);

// Memoize this function to prevent unnecessary recreations
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
  
  // Use refs to track component mount state and pending operations
  const isMountedRef = useRef(true);
  const pendingOperationsRef = useRef<AbortController[]>([]);
  
  // Helper to create and track abort controllers
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    pendingOperationsRef.current.push(controller);
    return controller;
  }, []);
  
  // Helper to safely update store only if component is mounted
  const safeUpdateStore = useCallback((updater: (prev: IRamadanDataStore) => IRamadanDataStore) => {
    if (isMountedRef.current) {
      RamadanDataStore.setState(updater);
    }
  }, []);

  // Memoize this function to prevent recreation on each render
  const setupNotificationsForData = useCallback(async (ramadanData: RamadanData) => {
    if (isNotificationSetup || !isMountedRef.current) return;
    
    const controller = createAbortController();
    
    try {
      const permResult = await LocalNotifications.checkPermissions();
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      if (permResult.display !== "granted") {
        const requestResult = await LocalNotifications.requestPermissions();
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;
        
        if (requestResult.display !== "granted") return;
      }

      if (!(await setupNotifications())) {
        throw new Error("Failed to setup notifications");
      }
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;

      const schedules = ramadanData.prayerTimes.map(
        ({ sehri, iftar, dayNumber }) => ({
          sehriTime: sehri,
          iftarTime: iftar,
          dayNumber,
        })
      );

      await scheduleRamadanNotifications(schedules);
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return;
      
      safeUpdateStore((prev) => ({
        ...prev,
        isNotificationSetup: true,
      }));
    } catch (error) {
      console.error("Notification setup error:", error);
    } finally {
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    }
  }, [isNotificationSetup, createAbortController, safeUpdateStore]);

  const getCachedData = useCallback(async (year: number): Promise<RamadanData | null> => {
    if (!isMountedRef.current) return null;
    
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
  }, []);

  const getFreshData = useCallback(async (): Promise<RamadanData | null> => {
    if (!isMountedRef.current) return null;
    
    const controller = createAbortController();
    
    safeUpdateStore((prev) => ({ ...prev, locationLoading: true }));

    try {
      const coordinates = await getCurrentLocation();
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return null;
      
      if (!coordinates) {
        throw new Error("Location services required");
      }

      await saveCoordinates(coordinates);
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return null;
      
      const data = await getRamadanData(coordinates);
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return null;
      
      return data;
    } catch (error) {
      console.log("Error getting fresh data:", error);
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return null;
      
      const cachedCoordinates = getCoordinates();
      if (!cachedCoordinates) {
        throw new Error("Location permission required");
      }
      
      const data = await getRamadanData(cachedCoordinates);
      
      // Check if operation was aborted
      if (controller.signal.aborted || !isMountedRef.current) return null;
      
      return data;
    } finally {
      safeUpdateStore((prev) => ({
        ...prev,
        locationLoading: false,
      }));
      
      // Remove this controller from pending operations
      pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
    }
  }, [createAbortController, safeUpdateStore]);

  const updateCache = useCallback(async (data: RamadanData, year: number) => {
    if (!isMountedRef.current) return;
    
    const cacheData: CacheData = {
      data,
      timestamp: Date.now(),
      year,
    };
    localStorage.setItem(getCacheKey(year), JSON.stringify(cacheData));
  }, []);

  const loadData = useCallback(
    async (forceRefresh = false) => {
      if (!isMountedRef.current) return;
      
      const controller = createAbortController();
      const now = Date.now();

      // Check if we can use existing data
      if (!forceRefresh && data && now - lastUpdate < CACHE_EXPIRY) {
        return;
      }

      try {
        safeUpdateStore((prev) => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Try cache first
        const ramadanDates = getCurrentRamadanDates();
        const cachedData = await getCachedData(ramadanDates.YEAR);
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;

        if (cachedData && !forceRefresh) {
          safeUpdateStore((prev) => ({
            ...prev,
            data: cachedData,
            lastUpdate: now,
            loading: false,
          }));
          await setupNotificationsForData(cachedData);
          return;
        }
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;

        // Get fresh data
        const freshData = await getFreshData();
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;
        
        if (!freshData) return;

        safeUpdateStore((prev) => ({
          ...prev,
          data: freshData,
          lastUpdate: now,
        }));

        await updateCache(freshData, ramadanDates.YEAR);
        
        // Check if operation was aborted
        if (controller.signal.aborted || !isMountedRef.current) return;
        
        await setupNotificationsForData(freshData);
      } catch (error) {
        // Only update error state if component is still mounted
        if (isMountedRef.current) {
          safeUpdateStore((prev) => ({
            ...prev,
            error: error instanceof Error ? error.message : "Failed to load data",
          }));
        }
      } finally {
        safeUpdateStore((prev) => ({ ...prev, loading: false }));
        
        // Remove this controller from pending operations
        pendingOperationsRef.current = pendingOperationsRef.current.filter(c => c !== controller);
      }
    },
    [data, lastUpdate, getCachedData, getFreshData, updateCache, setupNotificationsForData, createAbortController, safeUpdateStore]
  );

  // Initial load - use an empty dependency array since loadData has its own dependencies
  useEffect(() => {
    isMountedRef.current = true;
    
    const initialLoad = async () => {
      if (isMountedRef.current) {
        await loadData();
      }
    };
    
    initialLoad();
    
    return () => {
      isMountedRef.current = false;
      
      // Abort all pending operations when component unmounts
      pendingOperationsRef.current.forEach(controller => {
        controller.abort();
      });
      pendingOperationsRef.current = [];
    };
  }, []);

  // App resume handler with proper cleanup
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    const setupAppStateListener = async () => {
      try {
        const listener = await App.addListener(
          "appStateChange",
          ({ isActive }) => {
            if (isActive && isMountedRef.current) {
              loadData();
            }
          }
        );
        cleanup = () => listener.remove();
      } catch (error) {
        console.error("Error setting up app state listener:", error);
      }
    };

    setupAppStateListener();
    
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [loadData]);

  // Location change handler with proper cleanup
  useEffect(() => {
    const unsubscribe = locationEvents.subscribe(() => {
      if (isMountedRef.current) {
        loadData(true);
      }
    });
    
    return () => unsubscribe();
  }, [loadData]);

  // Memoize the return value to prevent unnecessary re-renders
  return useMemo(() => ({
    data,
    loading: loading || locationLoading,
    error,
    refresh: () => isMountedRef.current && loadData(true),
  }), [data, loading, locationLoading, error, loadData]);
};
