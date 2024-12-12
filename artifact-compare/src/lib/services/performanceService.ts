export interface PerformanceMetrics {
    fetchTime: number;
    processingTime: number;
    totalTime: number;
}

export class PerformanceTracker {
    private startTime: number;
    private fetchStartTime: number;
    private processingStartTime: number;

    constructor() {
        this.startTime = performance.now();
    }

    startFetch() {
        this.fetchStartTime = performance.now();
    }

    endFetch() {
        return performance.now() - this.fetchStartTime;
    }

    startProcessing() {
        this.processingStartTime = performance.now();
    }

    endProcessing() {
        return performance.now() - this.processingStartTime;
    }

    getMetrics(): PerformanceMetrics {
        const totalTime = performance.now() - this.startTime;
        return {
            fetchTime: this.endFetch(),
            processingTime: this.endProcessing(),
            totalTime
        };
    }
}