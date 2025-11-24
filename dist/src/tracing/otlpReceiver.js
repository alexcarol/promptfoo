"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OTLPReceiver = void 0;
exports.startOTLPReceiver = startOTLPReceiver;
exports.stopOTLPReceiver = stopOTLPReceiver;
const express_1 = __importDefault(require("express"));
const logger_1 = __importDefault(require("../logger"));
const store_1 = require("./store");
const SPAN_KIND_MAP = {
    0: 'unspecified',
    1: 'internal',
    2: 'server',
    3: 'client',
    4: 'producer',
    5: 'consumer',
};
class OTLPReceiver {
    constructor() {
        this.app = (0, express_1.default)();
        this.traceStore = (0, store_1.getTraceStore)();
        logger_1.default.debug('[OtlpReceiver] Initializing OTLP receiver');
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        // Support both JSON and protobuf (for now, we'll focus on JSON)
        this.app.use(express_1.default.json({ limit: '10mb', type: 'application/json' }));
        this.app.use(express_1.default.raw({ type: 'application/x-protobuf', limit: '10mb' }));
        logger_1.default.debug('[OtlpReceiver] Middleware configured for JSON and protobuf');
    }
    setupRoutes() {
        // OTLP HTTP endpoint for traces
        this.app.post('/v1/traces', async (req, res) => {
            const contentType = req.headers['content-type'] || 'unknown';
            const bodySize = req.body ? JSON.stringify(req.body).length : 0;
            logger_1.default.debug(`[OtlpReceiver] Received trace request: ${req.headers['content-type']} with ${bodySize} bytes`);
            logger_1.default.debug('[OtlpReceiver] Starting to process traces');
            // Check content type first before processing
            if (contentType === 'application/json') {
                // Continue with JSON processing
            }
            else if (contentType === 'application/x-protobuf') {
                logger_1.default.warn('Protobuf format not yet supported, please use JSON');
                res.status(415).json({ error: 'Protobuf format not yet supported' });
                return;
            }
            else {
                res.status(415).json({ error: 'Unsupported content type' });
                return;
            }
            try {
                let traces = [];
                // We already validated content type above, so this must be JSON
                logger_1.default.debug('[OtlpReceiver] Parsing OTLP JSON request');
                logger_1.default.debug(`[OtlpReceiver] Request body: ${JSON.stringify(req.body).substring(0, 500)}...`);
                traces = this.parseOTLPJSONRequest(req.body);
                logger_1.default.debug(`[OtlpReceiver] Parsed ${traces.length} traces from request`);
                // Group spans by trace ID and extract metadata
                const spansByTrace = new Map();
                const traceInfoById = new Map();
                for (const trace of traces) {
                    if (!spansByTrace.has(trace.traceId)) {
                        spansByTrace.set(trace.traceId, []);
                        // Extract optional evaluation and test case IDs from span attributes
                        const evaluationId = trace.span.attributes?.['evaluation.id'];
                        const testCaseId = trace.span.attributes?.['test.case.id'];
                        // Store info for this trace (even if IDs are missing)
                        const info = traceInfoById.get(trace.traceId) ?? {};
                        if (evaluationId) {
                            info.evaluationId = evaluationId;
                        }
                        if (testCaseId) {
                            info.testCaseId = testCaseId;
                        }
                        traceInfoById.set(trace.traceId, info);
                    }
                    spansByTrace.get(trace.traceId).push(trace.span);
                }
                logger_1.default.debug(`[OtlpReceiver] Grouped spans into ${spansByTrace.size} traces`);
                // Create trace records for all traces (required for foreign key constraints)
                // Include optional metadata when available
                for (const [traceId, info] of traceInfoById) {
                    try {
                        logger_1.default.debug(`[OtlpReceiver] Creating trace record for ${traceId}`);
                        await this.traceStore.createTrace({
                            traceId,
                            evaluationId: info.evaluationId || '',
                            testCaseId: info.testCaseId || '',
                        });
                    }
                    catch (error) {
                        // Trace might already exist, which is fine
                        logger_1.default.debug(`[OtlpReceiver] Trace ${traceId} may already exist: ${error}`);
                    }
                }
                // Store spans for each trace
                for (const [traceId, spans] of spansByTrace) {
                    logger_1.default.debug(`[OtlpReceiver] Storing ${spans.length} spans for trace ${traceId}`);
                    await this.traceStore.addSpans(traceId, spans, { skipTraceCheck: true });
                }
                // OTLP success response
                res.status(200).json({ partialSuccess: {} });
                logger_1.default.debug('[OtlpReceiver] Successfully processed traces');
            }
            catch (error) {
                logger_1.default.error(`[OtlpReceiver] Failed to process OTLP traces: ${error}`);
                logger_1.default.error(`[OtlpReceiver] Error stack: ${error instanceof Error ? error.stack : 'No stack'}`);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Health check endpoint
        this.app.get('/health', (_req, res) => {
            logger_1.default.debug('[OtlpReceiver] Health check requested');
            res.status(200).json({ status: 'ok' });
        });
        // OTLP service info endpoint
        this.app.get('/v1/traces', (_req, res) => {
            res.status(200).json({
                service: 'promptfoo-otlp-receiver',
                version: '1.0.0',
                supported_formats: ['json'], // 'protobuf' will be added in phase 2
            });
        });
        // Debug endpoint to check receiver status
        this.app.get('/debug/status', async (_req, res) => {
            res.status(200).json({
                status: 'running',
                uptime: process.uptime(),
                timestamp: new Date().toISOString(),
                port: this.port || 4318,
            });
        });
        // Global error handler
        this.app.use((error, _req, res, _next) => {
            logger_1.default.error(`[OtlpReceiver] Global error handler: ${error}`);
            logger_1.default.error(`[OtlpReceiver] Error stack: ${error.stack}`);
            // Handle JSON parsing errors
            if (error instanceof SyntaxError && 'body' in error) {
                res.status(400).json({ error: 'Invalid JSON' });
                return;
            }
            res.status(500).json({ error: 'Internal server error' });
        });
    }
    parseOTLPJSONRequest(body) {
        const traces = [];
        logger_1.default.debug(`[OtlpReceiver] Parsing request with ${body.resourceSpans?.length || 0} resource spans`);
        for (const resourceSpan of body.resourceSpans) {
            // Extract resource attributes if needed
            const resourceAttributes = this.parseAttributes(resourceSpan.resource?.attributes);
            logger_1.default.debug(`[OtlpReceiver] Parsed ${Object.keys(resourceAttributes).length} resource attributes`);
            for (const scopeSpan of resourceSpan.scopeSpans) {
                for (const span of scopeSpan.spans) {
                    // Convert IDs - handle both hex strings and base64 encoded binary
                    const traceId = this.convertId(span.traceId, 32); // 32 hex chars = 16 bytes
                    const spanId = this.convertId(span.spanId, 16); // 16 hex chars = 8 bytes
                    const parentSpanId = span.parentSpanId
                        ? this.convertId(span.parentSpanId, 16)
                        : undefined;
                    logger_1.default.debug(`[OtlpReceiver] Processing span: ${span.name} (${spanId}) in trace ${traceId}`);
                    // Parse attributes
                    const spanKindName = SPAN_KIND_MAP[span.kind] ?? 'unspecified';
                    const attributes = {
                        ...resourceAttributes,
                        ...this.parseAttributes(span.attributes),
                        'otel.scope.name': scopeSpan.scope?.name,
                        'otel.scope.version': scopeSpan.scope?.version,
                        'otel.span.kind': spanKindName,
                        'otel.span.kind_code': span.kind,
                    };
                    traces.push({
                        traceId,
                        span: {
                            spanId,
                            parentSpanId,
                            name: span.name,
                            startTime: Number(span.startTimeUnixNano) / 1000000, // Convert to ms
                            endTime: span.endTimeUnixNano ? Number(span.endTimeUnixNano) / 1000000 : undefined,
                            attributes,
                            statusCode: span.status?.code,
                            statusMessage: span.status?.message,
                        },
                    });
                }
            }
        }
        return traces;
    }
    parseAttributes(attributes) {
        if (!attributes) {
            return {};
        }
        const result = {};
        for (const attr of attributes) {
            const value = this.parseAttributeValue(attr.value);
            if (value !== undefined) {
                result[attr.key] = value;
            }
        }
        return result;
    }
    parseAttributeValue(value) {
        if (value.stringValue !== undefined) {
            return value.stringValue;
        }
        if (value.intValue !== undefined) {
            return Number(value.intValue);
        }
        if (value.doubleValue !== undefined) {
            return value.doubleValue;
        }
        if (value.boolValue !== undefined) {
            return value.boolValue;
        }
        if (value.arrayValue?.values) {
            return value.arrayValue.values.map((v) => this.parseAttributeValue(v));
        }
        if (value.kvlistValue?.values) {
            const kvMap = {};
            for (const kv of value.kvlistValue.values) {
                kvMap[kv.key] = this.parseAttributeValue(kv.value);
            }
            return kvMap;
        }
        return undefined;
    }
    convertId(id, expectedHexLength) {
        logger_1.default.debug(`[OtlpReceiver] Converting ID: ${id} (length: ${id.length}, expected hex length: ${expectedHexLength})`);
        // Check if it's already a hex string of the expected length
        if (id.length === expectedHexLength && /^[0-9a-f]+$/i.test(id)) {
            logger_1.default.debug(`[OtlpReceiver] ID is already hex format`);
            return id.toLowerCase();
        }
        // Try base64 decoding
        try {
            const buffer = Buffer.from(id, 'base64');
            const hex = buffer.toString('hex');
            logger_1.default.debug(`[OtlpReceiver] Base64 decoded: ${id} -> ${hex} (${buffer.length} bytes)`);
            // Check if the decoded value looks like it was originally a hex string encoded as UTF-8
            const utf8String = buffer.toString('utf8');
            if (utf8String.length === expectedHexLength && /^[0-9a-f]+$/i.test(utf8String)) {
                logger_1.default.debug(`[OtlpReceiver] Detected hex string encoded as UTF-8: ${utf8String}`);
                return utf8String.toLowerCase();
            }
            // If the resulting hex is the expected length, return it
            if (hex.length === expectedHexLength) {
                return hex;
            }
            // Otherwise, something's wrong
            logger_1.default.warn(`[OtlpReceiver] Unexpected ID format: ${id} -> ${hex} (expected ${expectedHexLength} hex chars)`);
            return id.toLowerCase();
        }
        catch (error) {
            logger_1.default.error(`[OtlpReceiver] Failed to convert ID: ${error}`);
            return id.toLowerCase();
        }
    }
    listen(port = 4318, host = '0.0.0.0') {
        this.port = port;
        logger_1.default.debug(`[OtlpReceiver] Starting receiver on ${host}:${port}`);
        return new Promise((resolve, reject) => {
            this.server = this.app.listen(port, host, () => {
                logger_1.default.info(`[OtlpReceiver] Listening on http://${host}:${port}`);
                logger_1.default.debug('[OtlpReceiver] Receiver fully initialized and ready to accept traces');
                resolve();
            });
            this.server.on('error', (error) => {
                logger_1.default.error(`[OtlpReceiver] Failed to start: ${error}`);
                reject(error);
            });
        });
    }
    stop() {
        logger_1.default.debug('[OtlpReceiver] Stopping receiver');
        return new Promise((resolve) => {
            if (this.server) {
                this.server.close(() => {
                    logger_1.default.info('[OtlpReceiver] Server stopped');
                    this.server = undefined;
                    resolve();
                });
            }
            else {
                logger_1.default.debug('[OtlpReceiver] No server to stop');
                resolve();
            }
        });
    }
    getApp() {
        return this.app;
    }
}
exports.OTLPReceiver = OTLPReceiver;
// Singleton instance
let otlpReceiver = null;
function getOTLPReceiver() {
    if (!otlpReceiver) {
        otlpReceiver = new OTLPReceiver();
    }
    return otlpReceiver;
}
async function startOTLPReceiver(port, host) {
    logger_1.default.debug('[OtlpReceiver] Starting receiver through startOTLPReceiver function');
    const receiver = getOTLPReceiver();
    await receiver.listen(port, host);
}
async function stopOTLPReceiver() {
    logger_1.default.debug('[OtlpReceiver] Stopping receiver through stopOTLPReceiver function');
    if (otlpReceiver) {
        await otlpReceiver.stop();
        otlpReceiver = null;
    }
}
//# sourceMappingURL=otlpReceiver.js.map