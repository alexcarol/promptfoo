import express from 'express';
export declare class OTLPReceiver {
    private app;
    private traceStore;
    private port?;
    private server?;
    constructor();
    private setupMiddleware;
    private setupRoutes;
    private parseOTLPJSONRequest;
    private parseAttributes;
    private parseAttributeValue;
    private convertId;
    listen(port?: number, host?: string): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
}
export declare function startOTLPReceiver(port?: number, host?: string): Promise<void>;
export declare function stopOTLPReceiver(): Promise<void>;
//# sourceMappingURL=otlpReceiver.d.ts.map