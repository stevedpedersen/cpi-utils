// src/lib/services/performanceService.ts
import type { PerformanceMetrics } from "$lib/types/cpi";
import { resolve } from "chart.js/helpers";

export interface PerformanceTrackerOptions {
    precision?: number;
}

export class PerformanceTracker {
    private startTime: number;
    private fetchStartTime: number | null = null;
    private processingStartTime: number | null = null;
    private precision: number;

    constructor(options: PerformanceTrackerOptions = {}) {
        this.startTime = performance.now();
        this.precision = options.precision ?? 2;
    }

    startFetch(): void {
        this.fetchStartTime = performance.now();
    }

    endFetch(): number {
        if (!this.fetchStartTime) {
            throw new Error('Fetch not started');
        }
        return this.roundNumber(performance.now() - this.fetchStartTime);
    }

    startProcessing(): void {
        this.processingStartTime = performance.now();
    }

    endProcessing(): number {
        if (!this.processingStartTime) {
            throw new Error('Processing not started');
        }
        return this.roundNumber(performance.now() - this.processingStartTime);
    }

    getMetrics(): PerformanceMetrics {
        const totalTime = this.roundNumber(performance.now() - this.startTime);
        const fetchTime = this.fetchStartTime
            ? this.endFetch()
            : 0;
        const processingTime = this.processingStartTime
            ? this.endProcessing()
            : 0;

        return {
            fetchTime,
            processingTime,
            totalTime
        };
    }

    reset(): void {
        this.startTime = performance.now();
        this.fetchStartTime = null;
        this.processingStartTime = null;
    }

    private roundNumber(value: number): number {
        return Number(value.toFixed(this.precision));
    }

    static measureAsync<T>(
        asyncFn: () => Promise<T>,
        label?: string
    ): Promise<{ result: T; metrics: PerformanceMetrics }> {
        const tracker = new PerformanceTracker();

        return asyncFn()
            .then(result => ({
                result,
                metrics: tracker.getMetrics()
            }))
            .catch(error => {
                console.error(`Performance measurement error ${label || ''}:`, error);
                throw error;
            });
    }
}




// // Example usage
// export async function exampleUsage() {
//     try {
//         const { result, metrics } = await PerformanceTracker.measureAsync(async () => {
//             // Your async operation
//             return await someAsyncFunction();
//         }, 'Example Operation');

//         console.log('Operation Result:', result);
//         console.log('Performance Metrics:', metrics);
//     } catch (error) {
//         console.error('Operation failed', error);
//     }
// }

// // Basic Usage
// const tracker = new PerformanceTracker();
// tracker.startFetch();
// // Perform fetch operation
// const fetchTime = tracker.endFetch();

// tracker.startProcessing();
// // Perform processing
// const processingTime = tracker.endProcessing();

// const metrics = tracker.getMetrics();

// // Async measurement
// const { result, metrics: asyncMetrics } = await PerformanceTracker.measureAsync(async () => {
//     return await someAsyncOperation();
// });

// const someAsyncFunction = async () => { }
// const someAsyncOperation = async () => { }