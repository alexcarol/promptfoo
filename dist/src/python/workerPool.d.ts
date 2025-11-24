export declare class PythonWorkerPool {
    private scriptPath;
    private functionName;
    private workerCount;
    private pythonPath?;
    private timeout?;
    private workers;
    private queue;
    private isInitialized;
    constructor(scriptPath: string, functionName: string, workerCount?: number, pythonPath?: string | undefined, timeout?: number | undefined);
    initialize(): Promise<void>;
    execute(functionName: string, args: any[]): Promise<any>;
    private getAvailableWorker;
    private processQueue;
    getWorkerCount(): number;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=workerPool.d.ts.map