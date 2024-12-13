// src/lib/stores/comparisonStore.ts
import { writable } from "svelte/store";
import type { PackageComparison, PerformanceMetrics } from "$lib/types/cpi";

interface ComparisonStoreState {
  comparison: PackageComparison[] | null;
  lastComparisonTime: Date | null;
  isLoading: boolean;
  error: string | null;
  timestamp: number | null;
  performanceMetrics: PerformanceMetrics;
}

function createComparisonStore() {
  const CACHE_KEY = "cpi-comparison-cache";
  const CACHE_EXPIRY_HOURS = 4;

  const isCacheValid = (timestamp: number): boolean => {
    const currentTime = new Date().getTime();
    const timeDiff = currentTime - timestamp;
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff < CACHE_EXPIRY_HOURS;
  };

  const getCachedComparison = (): ComparisonStoreState | null => {
    // Check if localStorage is available
    if (typeof localStorage === "undefined") {
      return null;
    }

    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsedData: ComparisonStoreState = JSON.parse(cachedData);
        if (parsedData.timestamp && isCacheValid(parsedData.timestamp)) {
          return parsedData;
        }
      } catch (error) {
        console.error("Error parsing cached comparison", error);
      }
      localStorage.removeItem(CACHE_KEY);
    }
    return null;
  };

  const initialState: ComparisonStoreState = {
    comparison: null,
    lastComparisonTime: null,
    isLoading: false,
    error: null,
    timestamp: null,
    performanceMetrics: {
      fetchTime: 0,
      processingTime: 0,
      totalTime: 0,
    },
  };

  // Only attempt to get cached comparison on the client side
  const storeState =
    typeof window !== "undefined"
      ? getCachedComparison() || initialState
      : initialState;

  const { subscribe, set, update } = writable<ComparisonStoreState>(storeState);

  return {
    subscribe,
    setComparison: (
      comparison: PackageComparison[],
      performanceMetrics: PerformanceMetrics
    ) =>
      update((store) => {
        const newStore: ComparisonStoreState = {
          ...store,
          comparison,
          lastComparisonTime: new Date(),
          isLoading: false,
          error: null,
          timestamp: new Date().getTime(),
          performanceMetrics,
        };

        // Only attempt to set localStorage on the client side
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(newStore));
          } catch (error) {
            console.error("Error caching comparison", error);
          }
        }

        return newStore;
      }),
    setLoading: (isLoading: boolean) =>
      update((store) => ({
        ...store,
        isLoading,
      })),
    setError: (error: string | null) =>
      update((store) => ({
        ...store,
        error,
        isLoading: false,
      })),
    clearComparison: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(CACHE_KEY);
      }
      set(initialState);
    },
    resetCache: () => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(CACHE_KEY);
      }
    },
  };
}

export const comparisonStore = createComparisonStore();
