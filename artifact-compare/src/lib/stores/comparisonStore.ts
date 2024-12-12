import { writable } from 'svelte/store';
import type { PackageComparison } from '$lib/types/cpi';

function createComparisonStore() {
    const CACHE_KEY = 'cpi-comparison-cache';
    const CACHE_EXPIRY_HOURS = 4; // Cache valid for 4 hours

    function isCacheValid(timestamp: number): boolean {
        const currentTime = new Date().getTime();
        const timeDiff = currentTime - timestamp;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff < CACHE_EXPIRY_HOURS;
    }

    function getCachedComparison() {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const parsedData = JSON.parse(cachedData);
            if (isCacheValid(parsedData.timestamp)) {
                return parsedData;
            }
            // Remove expired cache
            localStorage.removeItem(CACHE_KEY);
        }
        return null;
    }

    const initialState = getCachedComparison() || {
        comparison: null,
        lastComparisonTime: null,
        isLoading: false,
        error: null,
        timestamp: null,
        performanceMetrics: {
            fetchTime: 0,
            processingTime: 0,
            totalTime: 0
        }
    };

    const { subscribe, set, update } = writable(initialState);

    return {
        subscribe,
        setComparison: (
            comparison: PackageComparison[],
            performanceMetrics: PerformanceMetrics
        ) =>
            update(store => {
                const newStore = {
                    ...store,
                    comparison,
                    lastComparisonTime: new Date(),
                    isLoading: false,
                    error: null,
                    timestamp: new Date().getTime(),
                    performanceMetrics
                };

                localStorage.setItem(CACHE_KEY, JSON.stringify(newStore));
                return newStore;
            }),
        // ... other methods
    };
}


// function createComparisonStore() {
//     const CACHE_KEY = 'cpi-comparison-cache';

//     // Try to load from localStorage
//     const cachedComparison = localStorage.getItem(CACHE_KEY);
//     const initialState = cachedComparison
//         ? JSON.parse(cachedComparison)
//         : {
//             comparison: null as PackageComparison[] | null,
//             lastComparisonTime: null as Date | null,
//             isLoading: false,
//             error: null as string | null
//         };

//     const { subscribe, set, update } = writable(initialState);

//     return {
//         subscribe,
//         setComparison: (comparison: PackageComparison[]) =>
//             update(store => {
//                 const newStore = {
//                     ...store,
//                     comparison,
//                     lastComparisonTime: new Date(),
//                     isLoading: false,
//                     error: null
//                 };

//                 // Cache in localStorage
//                 localStorage.setItem(CACHE_KEY, JSON.stringify(newStore));

//                 return newStore;
//             }),
//         clearCache: () => {
//             localStorage.removeItem(CACHE_KEY);
//             set({
//                 comparison: null,
//                 lastComparisonTime: null,
//                 isLoading: false,
//                 error: null
//             });
//         },
//         // Other methods remain the same
//     };
// }

export const comparisonStore = createComparisonStore();
