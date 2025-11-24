"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatTraceSummary = formatTraceSummary;
exports.formatTraceForMetadata = formatTraceForMetadata;
const DEFAULT_MAX_SPANS = 10;
function formatDuration(durationMs) {
    if (!durationMs || Number.isNaN(durationMs)) {
        return '0ms';
    }
    if (durationMs < 1000) {
        return `${Math.round(durationMs)}ms`;
    }
    if (durationMs < 60000) {
        return `${(durationMs / 1000).toFixed(1)}s`;
    }
    const minutes = durationMs / 60000;
    return `${minutes.toFixed(1)}m`;
}
function formatSpan(span) {
    const parts = [];
    const duration = formatDuration(span.durationMs);
    parts.push(`[${duration}] ${span.name}${span.kind && span.kind !== 'unspecified' ? ` (${span.kind})` : ''}`);
    const tool = span.attributes['tool.name'] || span.attributes['tool_name'];
    if (tool) {
        parts.push(`tool=${tool}`);
    }
    const model = span.attributes['model'] || span.attributes['llm.model'];
    if (model) {
        parts.push(`model=${model}`);
    }
    if (span.status.code === 'error') {
        parts.push(`ERROR: ${span.status.message ?? 'Unknown error'}`);
    }
    return parts.join(' | ');
}
function formatTraceSummary(trace, options = {}) {
    if (!trace || trace.spans.length === 0) {
        return 'No trace spans recorded during this iteration.';
    }
    const maxSpans = options.maxSpans ?? DEFAULT_MAX_SPANS;
    const spans = trace.spans.slice(0, maxSpans);
    const header = `Trace ${trace.traceId.slice(0, 8)} • ${trace.spans.length} span${trace.spans.length === 1 ? '' : 's'}`;
    const formattedSpans = spans.map((span, index) => `${index + 1}. ${formatSpan(span)}`).join('\n');
    const insights = trace.insights.length > 0 ? trace.insights.map((i) => `• ${i}`).join('\n') : 'None';
    return [header, '', 'Execution Flow:', formattedSpans, '', 'Key Observations:', insights].join('\n');
}
function formatTraceForMetadata(trace) {
    return {
        traceId: trace.traceId,
        fetchedAt: trace.fetchedAt,
        spanCount: trace.spans.length,
        insights: trace.insights,
    };
}
//# sourceMappingURL=traceFormatting.js.map