import { TraceContextData } from '../../tracing/traceContext';
export declare function formatTraceSummary(trace: TraceContextData, options?: {
    maxSpans?: number;
}): string;
export declare function formatTraceForMetadata(trace: TraceContextData): Record<string, unknown>;
//# sourceMappingURL=traceFormatting.d.ts.map