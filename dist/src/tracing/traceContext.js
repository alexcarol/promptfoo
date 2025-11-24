"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.extractTraceIdFromTraceparent = extractTraceIdFromTraceparent;
exports.fetchTraceContext = fetchTraceContext;
const logger_1 = __importDefault(require("../logger"));
const time_1 = require("../util/time");
const store_1 = require("./store");
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 500;
const SPAN_KIND_MAP = {
    0: 'unspecified',
    1: 'internal',
    2: 'server',
    3: 'client',
    4: 'producer',
    5: 'consumer',
};
function resolveSpanKind(span) {
    const attributes = span.attributes || {};
    const attributeKind = (attributes['span.kind'] ||
        attributes['otel.span.kind'] ||
        attributes['spanKind'] ||
        attributes['kind']);
    if (attributeKind) {
        return `${attributeKind}`.toLowerCase();
    }
    const numericKind = attributes['otel.span.kind_code'];
    if (typeof numericKind === 'number' && numericKind in SPAN_KIND_MAP) {
        return SPAN_KIND_MAP[numericKind];
    }
    return 'unspecified';
}
function mapStatusCode(span) {
    switch (span.statusCode) {
        case 1:
            return 'ok';
        case 2:
            return 'error';
        default:
            return 'unset';
    }
}
function buildSpanTree(spans) {
    const depthMap = new Map();
    const spansById = new Map(spans.map((span) => [span.spanId, span]));
    const computeDepth = (span) => {
        if (depthMap.has(span.spanId)) {
            return depthMap.get(span.spanId);
        }
        if (!span.parentSpanId || !spansById.has(span.parentSpanId)) {
            depthMap.set(span.spanId, 0);
            return 0;
        }
        const parentDepth = computeDepth(spansById.get(span.parentSpanId));
        const depth = parentDepth + 1;
        depthMap.set(span.spanId, depth);
        return depth;
    };
    spans.forEach((span) => computeDepth(span));
    return depthMap;
}
function createTraceSpans(spans) {
    const depthMap = buildSpanTree(spans);
    return spans.map((span) => {
        const endTime = span.endTime ?? span.startTime;
        const durationMs = Math.max(0, endTime - span.startTime);
        return {
            spanId: span.spanId,
            parentSpanId: span.parentSpanId,
            name: span.name,
            kind: resolveSpanKind(span),
            startTime: span.startTime,
            endTime: span.endTime,
            durationMs,
            attributes: span.attributes || {},
            status: {
                code: mapStatusCode(span),
                message: span.statusMessage,
            },
            depth: depthMap.get(span.spanId) ?? 0,
            events: [],
        };
    });
}
function deriveInsights(traceSpans) {
    if (traceSpans.length === 0) {
        return [];
    }
    const insights = [];
    const errorSpans = traceSpans.filter((span) => span.status.code === 'error');
    errorSpans.forEach((span) => {
        const statusMessage = span.status.message ? `: ${span.status.message}` : '';
        insights.push(`Error span "${span.name}" (${span.spanId.slice(0, 8)})${statusMessage}`);
    });
    const toolCalls = traceSpans.filter((span) => span.attributes['tool.name']);
    toolCalls.forEach((span) => {
        insights.push(`Tool call ${span.attributes['tool.name']} via "${span.name}" (duration ${span.durationMs ?? 0}ms)`);
    });
    const guardrailHits = traceSpans.filter((span) => span.attributes['guardrail.name'] || span.attributes['guardrails.decision']);
    guardrailHits.forEach((span) => {
        const decision = span.attributes['guardrails.decision'] ?? span.attributes['guardrail.decision'];
        insights.push(`Guardrail ${span.attributes['guardrail.name'] ?? span.name} decision: ${decision ?? 'unknown'}`);
    });
    return insights.slice(0, 20);
}
function extractTraceIdFromTraceparent(traceparent) {
    if (!traceparent) {
        return null;
    }
    const parts = traceparent.split('-');
    if (parts.length < 2) {
        return null;
    }
    return parts[1];
}
async function fetchTraceContext(traceId, options = {}) {
    const { includeInternalSpans = true, sanitizeAttributes = true, maxRetries = DEFAULT_MAX_RETRIES, retryDelayMs = DEFAULT_RETRY_DELAY_MS, ...spanOptions } = options;
    const traceStore = (0, store_1.getTraceStore)();
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const spans = await traceStore.getSpans(traceId, {
                includeInternalSpans,
                sanitizeAttributes,
                ...spanOptions,
            });
            if (spans.length === 0) {
                if (attempt === maxRetries) {
                    logger_1.default.debug(`[TraceContext] No spans found for trace ${traceId} after ${attempt + 1} attempts`);
                    return null;
                }
                logger_1.default.debug(`[TraceContext] No spans yet for trace ${traceId}, retrying in ${retryDelayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
                await (0, time_1.sleep)(retryDelayMs);
                continue;
            }
            const traceSpans = createTraceSpans(spans);
            const insights = deriveInsights(traceSpans);
            const context = {
                traceId,
                spans: traceSpans,
                insights,
                fetchedAt: Date.now(),
            };
            logger_1.default.debug(`[TraceContext] Resolved ${traceSpans.length} spans for trace ${traceId} with ${insights.length} insights`);
            return context;
        }
        catch (error) {
            logger_1.default.error(`[TraceContext] Failed to fetch spans for trace ${traceId}: ${error}`);
            if (attempt === maxRetries) {
                return null;
            }
            await (0, time_1.sleep)(retryDelayMs);
        }
    }
    return null;
}
//# sourceMappingURL=traceContext.js.map