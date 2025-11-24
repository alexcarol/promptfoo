"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.tracesRouter = void 0;
const express_1 = require("express");
const logger_1 = __importDefault(require("../../logger"));
const store_1 = require("../../tracing/store");
exports.tracesRouter = (0, express_1.Router)();
// Get traces for a specific evaluation
exports.tracesRouter.get('/evaluation/:evaluationId', async (req, res) => {
    try {
        const { evaluationId } = req.params;
        logger_1.default.debug(`[TracesRoute] Fetching traces for evaluation ${evaluationId}`);
        const traceStore = (0, store_1.getTraceStore)();
        const traces = await traceStore.getTracesByEvaluation(evaluationId);
        logger_1.default.debug(`[TracesRoute] Found ${traces.length} traces for evaluation ${evaluationId}`);
        res.json({ traces });
    }
    catch (error) {
        logger_1.default.error(`[TracesRoute] Error fetching traces: ${error}`);
        res.status(500).json({ error: 'Failed to fetch traces' });
    }
});
// Get a specific trace by ID
exports.tracesRouter.get('/:traceId', async (req, res) => {
    try {
        const { traceId } = req.params;
        logger_1.default.debug(`[TracesRoute] Fetching trace ${traceId}`);
        const traceStore = (0, store_1.getTraceStore)();
        const trace = await traceStore.getTrace(traceId);
        if (!trace) {
            res.status(404).json({ error: 'Trace not found' });
            return;
        }
        logger_1.default.debug(`[TracesRoute] Found trace ${traceId} with ${trace.spans?.length || 0} spans`);
        res.json({ trace });
    }
    catch (error) {
        logger_1.default.error(`[TracesRoute] Error fetching trace: ${error}`);
        res.status(500).json({ error: 'Failed to fetch trace' });
    }
});
//# sourceMappingURL=traces.js.map