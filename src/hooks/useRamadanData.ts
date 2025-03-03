import { useState, useEffect, useCallback } from "react";
import { getRamadanData } from "../utils/api";
import { RamadanData } from "../types/ramadan";
import { RAMADAN_2025 } from "../utils/dates";

const CACHE_KEY = "ramadan_data_cache_2025";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

interface CacheData {
  data: RamadanData;
  timestamp: number;
}

export const useRamadanData = () => {
  const [data, setData] = useState<RamadanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData && !forceRefresh) {
        const { data, timestamp } = JSON.parse(cachedData) as CacheData;
        const isExpired = Date.now() - timestamp > CACHE_DURATION;
        
        if (!isExpired) {
          // Verify the cached data is for Ramadan 2025
          const startDate = new Date(data.startDate);
          if (startDate.getTime() === RAMADAN_2025.START.getTime()) {
            setData(data);
            setLoading(false);
            return;
          }
        }
      }

      // Fetch new data
      const newData = await getRamadanData();
      
      // Verify the data is for Ramadan 2025
      const startDate = new Date(newData.startDate);
      if (startDate.getTime() !== RAMADAN_2025.START.getTime()) {
        throw new Error("Invalid Ramadan data received");
      }

      setData(newData);

      // Update cache
      const cacheData: CacheData = {
        data: newData,
        timestamp: Date.now(),
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return { data, loading, error, refresh: () => loadData(true) };
}; 