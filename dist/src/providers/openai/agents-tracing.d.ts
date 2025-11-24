import type { TracingExporter, Trace, Span } from '@openai/agents';
/**
 * OTLP Tracing Exporter for OpenAI Agents
 *
 * Exports traces and spans from openai-agents-js to promptfoo's OTLP receiver
 * in OTLP JSON format over HTTP.
 */
export declare class OTLPTracingExporter implements TracingExporter {
    private otlpEndpoint;
    private evaluationId?;
    private testCaseId?;
    constructor(options?: {
        otlpEndpoint?: string;
        evaluationId?: string;
        testCaseId?: string;
    });
    /**
     * Export traces and spans to OTLP endpoint
     */
    export(items: (Trace | Span<any>)[], signal?: AbortSignal): Promise<void>;
    /**
     * Transform openai-agents-js traces/spans to OTLP JSON format
     */
    private transformToOTLP;
    /**
     * Convert a single span to OTLP format
     */
    private spanToOTLP;
    /**
     * Get span name from span data
     */
    private getSpanName;
    /**
     * Get span status from span data
     */
    private getSpanStatus;
    /**
     * Convert span data to OTLP attributes
     */
    private attributesToOTLP;
    /**
     * Convert a value to OTLP attribute value format
     */
    private valueToOTLP;
    /**
     * Convert hex string to base64 for OTLP format
     * Handles openai-agents-js ID format (trace_XXX, span_XXX)
     * @param hex - The hex string to convert
     * @param kind - Whether this is a 'trace' (16 bytes) or 'span' (8 bytes) ID
     */
    private hexToBase64;
    /**
     * Generate a random trace ID (32 hex chars)
     */
    private generateTraceId;
    /**
     * Generate a random span ID (16 hex chars)
     */
    private generateSpanId;
    /**
     * Generate random hex string of specified length
     */
    private generateRandomHex;
}
//# sourceMappingURL=agents-tracing.d.ts.map