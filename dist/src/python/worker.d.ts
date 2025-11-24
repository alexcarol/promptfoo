export declare class PythonWorker {
    private scriptPath;
    private functionName;
    private pythonPath?;
    private timeout;
    private onReady?;
    private process;
    private ready;
    private busy;
    private shuttingDown;
    private crashCount;
    private readonly maxCrashes;
    private pendingRequest;
    private requestTimeout;
    constructor(scriptPath: string, functionName: string, pythonPath?: string | undefined, timeout?: number, onReady?: (() => void) | undefined);
    initialize(): Promise<void>;
    private startWorker;
    call(functionName: string, args: any[]): Promise<any>;
    private executeCall;
    private createTimeout;
    private handleDone;
    private handleCrash;
    isReady(): boolean;
    isBusy(): boolean;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=worker.d.ts.map