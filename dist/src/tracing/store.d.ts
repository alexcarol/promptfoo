import type { TraceData } from '../types/tracing';
interface StoreTraceData extends Omit<TraceData, 'spans'> {
    evaluationId: string;
    testCaseId: string;
    metadata?: Record<string, any>;
}
export interface SpanData {
    spanId: string;
    parentSpanId?: string;
    name: string;
    startTime: number;
    endTime?: number;
    attributes?: Record<string, any>;
    statusCode?: number;
    statusMessage?: string;
}
export interface ParsedTrace {
    traceId: string;
    span: SpanData;
}
export interface TraceSpanQueryOptions {
    earliestStartTime?: number;
    maxSpans?: number;
    maxDepth?: number;
    includeInternalSpans?: boolean;
    spanFilter?: string[];
    sanitizeAttributes?: boolean;
}
export declare class TraceStore {
    private db;
    private getDatabase;
    createTrace(trace: StoreTraceData): Promise<void>;
    addSpans(traceId: string, spans: SpanData[], options?: {
        skipTraceCheck?: boolean;
    }): Promise<void>;
    getTracesByEvaluation(evaluationId: string): Promise<any[]>;
    getTrace(traceId: string): Promise<any | null>;
    deleteOldTraces(retentionDays: number): Promise<void>;
    getSpans(traceId: string, options?: TraceSpanQueryOptions): Promise<SpanData[]>;
}
export declare function getTraceStore(): TraceStore;
export declare function getTraceSpans(traceId: string, options?: TraceSpanQueryOptions): Promise<SpanData[]>;
export {};
//# sourceMappingURL=store.d.ts.map