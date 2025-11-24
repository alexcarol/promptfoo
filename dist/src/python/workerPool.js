"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonWorkerPool = void 0;
const worker_1 = require("./worker");
const logger_1 = __importDefault(require("../logger"));
class PythonWorkerPool {
    constructor(scriptPath, functionName, workerCount = 1, pythonPath, timeout) {
        this.scriptPath = scriptPath;
        this.functionName = functionName;
        this.workerCount = workerCount;
        this.pythonPath = pythonPath;
        this.timeout = timeout;
        this.workers = [];
        this.queue = [];
        this.isInitialized = false;
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        // Validate worker count
        if (this.workerCount < 1) {
            throw new Error(`Invalid worker count: ${this.workerCount}. Must be at least 1.`);
        }
        // Warn on excessive workers
        if (this.workerCount > 8) {
            logger_1.default.warn(`Spawning ${this.workerCount} Python workers for ${this.scriptPath}. ` +
                `This may use significant memory if your script has heavy imports.`);
        }
        logger_1.default.debug(`Initializing Python worker pool with ${this.workerCount} workers for ${this.scriptPath}`);
        // Start all workers in parallel
        const initPromises = [];
        for (let i = 0; i < this.workerCount; i++) {
            const worker = new worker_1.PythonWorker(this.scriptPath, this.functionName, this.pythonPath, this.timeout, () => this.processQueue());
            initPromises.push(worker.initialize());
            this.workers.push(worker);
        }
        await Promise.all(initPromises);
        this.isInitialized = true;
        logger_1.default.debug(`Python worker pool initialized with ${this.workerCount} workers`);
    }
    async execute(functionName, args) {
        if (!this.isInitialized) {
            throw new Error('Worker pool not initialized');
        }
        // Try to get available worker
        const worker = this.getAvailableWorker();
        if (worker) {
            // Worker available, execute immediately and trigger queue processing when done
            return worker.call(functionName, args).finally(() => this.processQueue());
        }
        else {
            // All workers busy, queue the request
            return new Promise((resolve, reject) => {
                this.queue.push({ functionName, args, resolve, reject });
                logger_1.default.debug(`Request queued (queue size: ${this.queue.length})`);
            });
        }
    }
    getAvailableWorker() {
        for (const worker of this.workers) {
            if (worker.isReady() && !worker.isBusy()) {
                return worker;
            }
        }
        return null;
    }
    processQueue() {
        // Drain the entire queue - process all waiting requests with available workers
        while (this.queue.length > 0) {
            const worker = this.getAvailableWorker();
            if (!worker) {
                return; // No workers available right now
            }
            const request = this.queue.shift();
            if (!request) {
                return;
            }
            logger_1.default.debug(`Processing queued request (${this.queue.length} remaining)`);
            // Execute and attach queue processing to continue draining when done
            worker
                .call(request.functionName, request.args)
                .then(request.resolve)
                .catch(request.reject)
                .finally(() => this.processQueue());
        }
    }
    getWorkerCount() {
        return this.workers.length;
    }
    async shutdown() {
        logger_1.default.debug(`Shutting down Python worker pool (${this.workers.length} workers)`);
        // Reject any queued requests
        for (const req of this.queue) {
            try {
                req.reject(new Error('Worker pool shutting down'));
            }
            catch {
                // Ignore errors from rejecting
            }
        }
        // Shutdown all workers in parallel
        await Promise.all(this.workers.map((w) => w.shutdown()));
        this.workers = [];
        this.queue = [];
        this.isInitialized = false;
        logger_1.default.debug('Python worker pool shutdown complete');
    }
}
exports.PythonWorkerPool = PythonWorkerPool;
//# sourceMappingURL=workerPool.js.map