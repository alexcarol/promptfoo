"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTLPTracingExporter = void 0;
const index_1 = require("../../util/fetch/index");
const logger_1 = __importDefault(require("../../logger"));
/**
 * OTLP Tracing Exporter for OpenAI Agents
 *
 * Exports traces and spans from openai-agents-js to promptfoo's OTLP receiver
 * in OTLP JSON format over HTTP.
 */
class OTLPTracingExporter {
    constructor(options = {}) {
        this.otlpEndpoint = options.otlpEndpoint || 'http://localhost:4318';
        this.evaluationId = options.evaluationId;
        this.testCaseId = options.testCaseId;
    }
    /**
     * Export traces and spans to OTLP endpoint
     */
    async export(items, signal) {
        if (items.length === 0) {
            logger_1.default.debug('[AgentsTracing] No items to export');
            return;
        }
        logger_1.default.debug(`[AgentsTracing] Exporting ${items.length} items to OTLP`);
        try {
            const otlpPayload = this.transformToOTLP(items);
            const url = `${this.otlpEndpoint}/v1/traces`;
            logger_1.default.debug('[AgentsTracing] Sending OTLP payload', {
                url,
                spanCount: otlpPayload.resourceSpans[0]?.scopeSpans[0]?.spans?.length || 0,
            });
            const response = await (0, index_1.fetchWithProxy)(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(otlpPayload),
                signal,
            });
            if (response.ok) {
                logger_1.default.debug('[AgentsTracing] Successfully exported traces to OTLP');
            }
            else {
                logger_1.default.error(`[AgentsTracing] OTLP export failed: ${response.status} ${response.statusText}`);
            }
        }
        catch (error) {
            logger_1.default.error('[AgentsTracing] Failed to export traces to OTLP', { error });
        }
    }
    /**
     * Transform openai-agents-js traces/spans to OTLP JSON format
     */
    transformToOTLP(items) {
        const spans = items
            .filter((item) => item.type === 'trace.span')
            .map((item) => this.spanToOTLP(item));
        return {
            resourceSpans: [
                {
                    resource: {
                        attributes: [
                            { key: 'service.name', value: { stringValue: 'promptfoo-agents' } },
                            ...(this.evaluationId
                                ? [
                                    {
                                        key: 'evaluation.id',
                                        value: { stringValue: this.evaluationId },
                                    },
                                ]
                                : []),
                            ...(this.testCaseId
                                ? [{ key: 'test.case.id', value: { stringValue: this.testCaseId } }]
                                : []),
                        ],
                    },
                    scopeSpans: [
                        {
                            scope: {
                                name: 'openai-agents-js',
                                version: '0.1.0',
                            },
                            spans,
                        },
                    ],
                },
            ],
        };
    }
    /**
     * Convert a single span to OTLP format
     */
    spanToOTLP(span) {
        // Parse timestamps - they are ISO strings
        const startTime = span.startedAt ? new Date(span.startedAt).getTime() : Date.now();
        const endTime = span.endedAt ? new Date(span.endedAt).getTime() : undefined;
        // Generate IDs if missing (openai-agents-js sometimes doesn't set them)
        const traceId = span.traceId || this.generateTraceId();
        const spanId = span.spanId || this.generateSpanId();
        return {
            traceId: this.hexToBase64(traceId, 'trace'),
            spanId: this.hexToBase64(spanId, 'span'),
            parentSpanId: span.parentId ? this.hexToBase64(span.parentId, 'span') : undefined,
            name: this.getSpanName(span),
            kind: 1, // SPAN_KIND_INTERNAL
            startTimeUnixNano: String(startTime * 1000000), // Convert ms to ns
            endTimeUnixNano: endTime ? String(endTime * 1000000) : undefined,
            attributes: this.attributesToOTLP(span.spanData),
            status: this.getSpanStatus(span),
        };
    }
    /**
     * Get span name from span data
     */
    getSpanName(span) {
        const data = span.spanData;
        // Try to get a meaningful name from span data
        if ('name' in data && data.name) {
            return data.name;
        }
        if (data.type) {
            return `agent.${data.type}`;
        }
        return 'agent.span';
    }
    /**
     * Get span status from span data
     */
    getSpanStatus(span) {
        const error = span.error;
        if (error) {
            return {
                code: 2, // STATUS_CODE_ERROR
                message: error.message || String(error),
            };
        }
        return {
            code: 0, // STATUS_CODE_OK
        };
    }
    /**
     * Convert span data to OTLP attributes
     */
    attributesToOTLP(data) {
        const attributes = [];
        if (!data) {
            return attributes;
        }
        // Convert all data fields to attributes
        for (const [key, value] of Object.entries(data)) {
            // Skip certain fields that are handled separately
            if (key === 'name' || key === 'type') {
                continue;
            }
            attributes.push({
                key: `agent.${key}`,
                value: this.valueToOTLP(value),
            });
        }
        return attributes;
    }
    /**
     * Convert a value to OTLP attribute value format
     */
    valueToOTLP(value) {
        if (value === null || value === undefined) {
            return { stringValue: '' };
        }
        if (typeof value === 'string') {
            return { stringValue: value };
        }
        if (typeof value === 'number') {
            return Number.isInteger(value) ? { intValue: String(value) } : { doubleValue: value };
        }
        if (typeof value === 'boolean') {
            return { boolValue: value };
        }
        if (Array.isArray(value)) {
            return {
                arrayValue: {
                    values: value.map((v) => this.valueToOTLP(v)),
                },
            };
        }
        if (typeof value === 'object') {
            // For objects, convert to JSON string
            return { stringValue: JSON.stringify(value) };
        }
        return { stringValue: String(value) };
    }
    /**
     * Convert hex string to base64 for OTLP format
     * Handles openai-agents-js ID format (trace_XXX, span_XXX)
     * @param hex - The hex string to convert
     * @param kind - Whether this is a 'trace' (16 bytes) or 'span' (8 bytes) ID
     */
    hexToBase64(hex, kind) {
        if (!hex) {
            return '';
        }
        try {
            // Strip prefixes if present (trace_, span_, group_)
            let cleanHex = hex.replace(/^(trace_|span_|group_)/, '');
            // Ensure hex is valid length (32 hex chars = 16 bytes for trace, 16 hex chars = 8 bytes for span)
            // If it's longer, truncate. If shorter, pad with zeros.
            const targetLength = kind === 'span' ? 16 : 32;
            if (cleanHex.length > targetLength) {
                cleanHex = cleanHex.substring(0, targetLength);
            }
            else if (cleanHex.length < targetLength) {
                cleanHex = cleanHex.padEnd(targetLength, '0');
            }
            return Buffer.from(cleanHex, 'hex').toString('base64');
        }
        catch (error) {
            logger_1.default.error(`[AgentsTracing] Failed to convert hex to base64: ${hex}`, { error });
            // Generate a fallback ID with correct length
            const fallbackLen = kind === 'span' ? 16 : 32;
            return Buffer.from(this.generateRandomHex(fallbackLen), 'hex').toString('base64');
        }
    }
    /**
     * Generate a random trace ID (32 hex chars)
     */
    generateTraceId() {
        return this.generateRandomHex(32);
    }
    /**
     * Generate a random span ID (16 hex chars)
     */
    generateSpanId() {
        return this.generateRandomHex(16);
    }
    /**
     * Generate random hex string of specified length
     */
    generateRandomHex(length) {
        const bytes = Math.ceil(length / 2);
        const buffer = Buffer.alloc(bytes);
        for (let i = 0; i < bytes; i++) {
            buffer[i] = Math.floor(Math.random() * 256);
        }
        return buffer.toString('hex').substring(0, length);
    }
}
exports.OTLPTracingExporter = OTLPTracingExporter;
//# sourceMappingURL=agents-tracing.js.map