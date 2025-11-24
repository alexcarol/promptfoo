import { type TraceSpanQueryOptions } from './store';
export interface TraceEvent {
    name: string;
    timestamp: number;
    attributes: Record<string, any>;
}
export interface TraceSpan {
    spanId: string;
    parentSpanId?: string;
    name: string;
    kind: string;
    startTime: number;
    endTime?: number;
    durationMs?: number;
    attributes: Record<string, any>;
    status: {
        code: 'unset' | 'ok' | 'error';
        message?: string;
    };
    depth: number;
    events: TraceEvent[];
}
export interface TraceContextData {
    traceId: string;
    spans: TraceSpan[];
    insights: string[];
    fetchedAt: number;
}
export interface FetchTraceContextOptions extends Omit<TraceSpanQueryOptions, 'includeInternalSpans' | 'sanitizeAttributes'> {
    includeInternalSpans?: boolean;
    sanitizeAttributes?: boolean;
    maxRetries?: number;
    retryDelayMs?: number;
}
export declare function extractTraceIdFromTraceparent(traceparent: string): string | null;
export declare function fetchTraceContext(traceId: string, options?: FetchTraceContextOptions): Promise<TraceContextData | null>;
//# sourceMappingURL=traceContext.d.ts.map