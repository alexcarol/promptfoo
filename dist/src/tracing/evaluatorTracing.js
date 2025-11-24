"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTraceId = generateTraceId;
exports.generateSpanId = generateSpanId;
exports.generateTraceparent = generateTraceparent;
exports.isOtlpReceiverStarted = isOtlpReceiverStarted;
exports.startOtlpReceiverIfNeeded = startOtlpReceiverIfNeeded;
exports.stopOtlpReceiverIfNeeded = stopOtlpReceiverIfNeeded;
exports.isTracingEnabled = isTracingEnabled;
exports.generateTraceContextIfNeeded = generateTraceContextIfNeeded;
const crypto_1 = require("crypto");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const telemetry_1 = __importDefault(require("../telemetry"));
// Track whether OTLP receiver has been started
let otlpReceiverStarted = false;
/**
 * Generate a 16-byte trace ID
 */
function generateTraceId() {
    return (0, crypto_1.randomBytes)(16).toString('hex');
}
/**
 * Generate an 8-byte span ID
 */
function generateSpanId() {
    return (0, crypto_1.randomBytes)(8).toString('hex');
}
/**
 * Generate W3C Trace Context format traceparent header
 * Format: version-trace-id-parent-id-trace-flags
 */
function generateTraceparent(traceId, spanId, sampled = true) {
    const version = '00';
    const traceFlags = sampled ? '01' : '00';
    return `${version}-${traceId}-${spanId}-${traceFlags}`;
}
/**
 * Check if the OTLP receiver has been started
 */
function isOtlpReceiverStarted() {
    return otlpReceiverStarted;
}
/**
 * Start the OTLP receiver if tracing is enabled and it hasn't been started yet
 */
async function startOtlpReceiverIfNeeded(testSuite) {
    logger_1.default.debug(`[EvaluatorTracing] Checking tracing config: ${JSON.stringify(testSuite.tracing)}`);
    logger_1.default.debug(`[EvaluatorTracing] testSuite keys: ${Object.keys(testSuite)}`);
    logger_1.default.debug(`[EvaluatorTracing] Full testSuite.tracing: ${JSON.stringify(testSuite.tracing, null, 2)}`);
    if (testSuite.tracing?.enabled &&
        testSuite.tracing?.otlp?.http?.enabled &&
        !otlpReceiverStarted) {
        telemetry_1.default.record('feature_used', {
            feature: 'tracing',
        });
        try {
            logger_1.default.debug('[EvaluatorTracing] Tracing configuration detected, starting OTLP receiver');
            const { startOTLPReceiver } = await Promise.resolve().then(() => __importStar(require('./otlpReceiver')));
            const port = testSuite.tracing.otlp.http.port || 4318;
            const host = testSuite.tracing.otlp.http.host || '0.0.0.0';
            logger_1.default.debug(`[EvaluatorTracing] Starting OTLP receiver on ${host}:${port}`);
            await startOTLPReceiver(port, host);
            otlpReceiverStarted = true;
            logger_1.default.info(`[EvaluatorTracing] OTLP receiver successfully started on port ${port} for tracing`);
        }
        catch (error) {
            logger_1.default.error(`[EvaluatorTracing] Failed to start OTLP receiver: ${error}`);
        }
    }
    else {
        if (otlpReceiverStarted) {
            logger_1.default.debug('[EvaluatorTracing] OTLP receiver already started, skipping initialization');
        }
        else {
            logger_1.default.debug('[EvaluatorTracing] Tracing not enabled or OTLP HTTP receiver not configured');
            logger_1.default.debug(`[EvaluatorTracing] tracing.enabled: ${testSuite.tracing?.enabled}`);
            logger_1.default.debug(`[EvaluatorTracing] tracing.otlp.http.enabled: ${testSuite.tracing?.otlp?.http?.enabled}`);
        }
    }
}
/**
 * Stop the OTLP receiver if it was started
 */
async function stopOtlpReceiverIfNeeded() {
    if (otlpReceiverStarted) {
        try {
            logger_1.default.debug('[EvaluatorTracing] Stopping OTLP receiver');
            const { stopOTLPReceiver } = await Promise.resolve().then(() => __importStar(require('./otlpReceiver')));
            await stopOTLPReceiver();
            otlpReceiverStarted = false;
            logger_1.default.info('[EvaluatorTracing] OTLP receiver stopped successfully');
        }
        catch (error) {
            logger_1.default.error(`[EvaluatorTracing] Failed to stop OTLP receiver: ${error}`);
        }
    }
}
/**
 * Check if tracing is enabled for a test case
 */
function isTracingEnabled(test, _testSuite) {
    const result = test.metadata?.tracingEnabled === true || (0, envars_1.getEnvBool)('PROMPTFOO_TRACING_ENABLED', false);
    logger_1.default.debug(`[EvaluatorTracing] isTracingEnabled check: test.metadata?.tracingEnabled=${test.metadata?.tracingEnabled}, env=${(0, envars_1.getEnvBool)('PROMPTFOO_TRACING_ENABLED', false)}, result=${result}`);
    return result;
}
/**
 * Generate trace context and create trace record if tracing is enabled
 */
async function generateTraceContextIfNeeded(test, evaluateOptions, testIdx, promptIdx) {
    const tracingEnabled = isTracingEnabled(test);
    if (tracingEnabled) {
        logger_1.default.debug('[EvaluatorTracing] Tracing enabled for test case');
        logger_1.default.debug(`[EvaluatorTracing] Test metadata: ${JSON.stringify(test.metadata)}`);
    }
    if (!tracingEnabled) {
        return null;
    }
    // Import trace store dynamically to avoid circular dependencies
    logger_1.default.debug('[EvaluatorTracing] Importing trace store');
    const { getTraceStore } = await Promise.resolve().then(() => __importStar(require('./store')));
    const traceStore = getTraceStore();
    // Generate trace context
    const traceId = generateTraceId();
    const spanId = generateSpanId();
    const traceparent = generateTraceparent(traceId, spanId);
    logger_1.default.debug(`[EvaluatorTracing] Generated trace context: traceId=${traceId}, spanId=${spanId}`);
    // Get evaluation ID from test metadata (set by Evaluator class)
    let evaluationId = test.metadata?.evaluationId || evaluateOptions?.eventSource;
    if (!evaluationId) {
        logger_1.default.warn('[EvaluatorTracing] No evaluation ID found in test metadata or evaluateOptions, trace will not be linked to evaluation');
        evaluationId = `eval-${Date.now()}`;
    }
    const testCaseId = test.metadata?.testCaseId || test.id || `${testIdx}-${promptIdx}`;
    // Store trace association in trace store
    try {
        logger_1.default.debug(`[EvaluatorTracing] Creating trace record for traceId=${traceId}`);
        await traceStore.createTrace({
            traceId,
            evaluationId: evaluationId || '',
            testCaseId: testCaseId || '',
            metadata: {
                testIdx,
                promptIdx,
                vars: test.vars,
            },
        });
        logger_1.default.debug('[EvaluatorTracing] Trace record created successfully');
    }
    catch (error) {
        logger_1.default.error(`[EvaluatorTracing] Failed to create trace: ${error}`);
    }
    logger_1.default.debug(`[EvaluatorTracing] Trace context ready: ${traceparent} for test case ${testCaseId}`);
    return {
        traceparent,
        evaluationId,
        testCaseId,
    };
}
//# sourceMappingURL=evaluatorTracing.js.map