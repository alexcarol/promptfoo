export declare class CIProgressReporter {
    private startTime;
    private lastUpdateTime;
    private totalTests;
    private completedTests;
    private updateIntervalMs;
    private intervalId;
    private milestonesSeen;
    private highestPercentageSeen;
    private lastErrorTime;
    private readonly ERROR_THROTTLE_MS;
    constructor(totalTests: number, updateIntervalMs?: number);
    start(): void;
    update(completed: number): void;
    updateTotalTests(newTotal: number): void;
    finish(): void;
    error(message: string): void;
    private logPeriodicUpdate;
    private logMilestone;
    private formatElapsedTime;
}
//# sourceMappingURL=ciProgressReporter.d.ts.map