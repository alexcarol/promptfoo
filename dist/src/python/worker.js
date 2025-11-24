"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PythonWorker = void 0;
const python_shell_1 = require("python-shell");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const logger_1 = __importDefault(require("../logger"));
const shared_1 = require("../providers/shared");
const json_1 = require("../util/json");
const pythonUtils_1 = require("./pythonUtils");
class PythonWorker {
    constructor(scriptPath, functionName, pythonPath, timeout = shared_1.REQUEST_TIMEOUT_MS, onReady) {
        this.scriptPath = scriptPath;
        this.functionName = functionName;
        this.pythonPath = pythonPath;
        this.timeout = timeout;
        this.onReady = onReady;
        this.process = null;
        this.ready = false;
        this.busy = false;
        this.shuttingDown = false;
        this.crashCount = 0;
        this.maxCrashes = 3;
        this.pendingRequest = null;
        this.requestTimeout = null;
    }
    async initialize() {
        return this.startWorker();
    }
    async startWorker() {
        const wrapperPath = path_1.default.join(__dirname, 'persistent_wrapper.py');
        // Validate and resolve Python path using smart detection (tries python3, then python)
        const resolvedPythonPath = await (0, pythonUtils_1.validatePythonPath)(this.pythonPath || 'python', typeof this.pythonPath === 'string');
        this.process = new python_shell_1.PythonShell(wrapperPath, {
            mode: 'text',
            pythonPath: resolvedPythonPath,
            args: [this.scriptPath, this.functionName],
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        // Listen for READY signal
        return new Promise((resolve, reject) => {
            const readyTimeout = setTimeout(() => {
                reject(new Error('Worker failed to become ready within timeout'));
            }, 30000);
            this.process.on('message', (message) => {
                if (message.trim() === 'READY') {
                    clearTimeout(readyTimeout);
                    this.ready = true;
                    logger_1.default.debug(`Python worker ready for ${this.scriptPath}`);
                    // Notify pool that worker is ready (triggers queue processing)
                    if (this.onReady) {
                        this.onReady();
                    }
                    resolve();
                }
                else if (message.startsWith('DONE')) {
                    this.handleDone();
                }
            });
            this.process.on('error', (err) => {
                clearTimeout(readyTimeout);
                reject(err);
            });
            this.process.on('close', () => {
                if (!this.shuttingDown) {
                    this.handleCrash();
                }
            });
            this.process.stderr?.on('data', (data) => {
                logger_1.default.error(`Python worker stderr: ${data.toString()}`);
            });
        });
    }
    async call(functionName, args) {
        if (!this.ready) {
            throw new Error('Worker not ready');
        }
        if (this.busy) {
            throw new Error('Worker is busy');
        }
        this.busy = true;
        try {
            return await Promise.race([this.executeCall(functionName, args), this.createTimeout()]);
        }
        finally {
            this.busy = false;
            if (this.requestTimeout) {
                clearTimeout(this.requestTimeout);
                this.requestTimeout = null;
            }
        }
    }
    async executeCall(functionName, args) {
        const requestFile = path_1.default.join(os_1.default.tmpdir(), `promptfoo-worker-req-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
        const responseFile = path_1.default.join(os_1.default.tmpdir(), `promptfoo-worker-resp-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
        try {
            // Write request
            fs_1.default.writeFileSync(requestFile, (0, json_1.safeJsonStringify)(args), 'utf-8');
            // Send CALL command with function name
            // Note: PythonShell.send() adds newline automatically in 'text' mode
            // Using pipe (|) delimiter to avoid conflicts with Windows drive letters (C:)
            const command = `CALL|${functionName}|${requestFile}|${responseFile}`;
            this.process.send(command);
            // Wait for DONE
            await new Promise((resolve, reject) => {
                this.pendingRequest = { resolve, reject };
            });
            // Read response with exponential backoff retry
            // Python verifies file readability before sending DONE, but OS-level delays may still occur
            let responseData;
            let lastError;
            // Exponential backoff: 1ms, 2ms, 4ms, 8ms, 16ms, 32ms, 64ms, 128ms, 256ms, 512ms, 1024ms, 2048ms, 4096ms, 5000ms (capped)...
            // Total max wait: ~18 seconds (handles severe filesystem delays)
            for (let attempt = 0, delay = 1; attempt < 16; attempt++, delay = Math.min(delay * 2, 5000)) {
                try {
                    responseData = fs_1.default.readFileSync(responseFile, 'utf-8');
                    if (attempt > 0) {
                        logger_1.default.debug(`Response file read succeeded on attempt ${attempt + 1} after ${delay}ms`);
                    }
                    break;
                }
                catch (error) {
                    lastError = error;
                    if (error.code === 'ENOENT') {
                        // File doesn't exist yet, wait and retry with exponential backoff
                        await new Promise((resolve) => setTimeout(resolve, delay));
                        continue;
                    }
                    // Non-ENOENT error, don't retry
                    throw error;
                }
            }
            // If we exhausted all retries, throw with debugging info
            if (!responseData) {
                const tempDir = path_1.default.dirname(responseFile);
                try {
                    const files = fs_1.default.readdirSync(tempDir).filter((f) => f.startsWith('promptfoo-worker-'));
                    logger_1.default.error(`Failed to read response file after 16 attempts (~18s). Expected: ${path_1.default.basename(responseFile)}, Found in ${tempDir}: ${files.join(', ')}`);
                }
                catch {
                    logger_1.default.error(`Failed to read response file: ${responseFile}`);
                }
                throw lastError;
            }
            const response = JSON.parse(responseData);
            if (response.type === 'error') {
                throw new Error(`Python error: ${response.error}\n${response.traceback || ''}`);
            }
            return response.data;
        }
        finally {
            // Cleanup temp files
            [requestFile, responseFile].forEach((file) => {
                try {
                    if (fs_1.default.existsSync(file)) {
                        fs_1.default.unlinkSync(file);
                    }
                }
                catch (error) {
                    logger_1.default.error(`Error removing ${file}: ${error}`);
                }
            });
        }
    }
    createTimeout() {
        return new Promise((_, reject) => {
            this.requestTimeout = setTimeout(() => {
                reject(new Error(`Python worker timed out after ${this.timeout}ms`));
            }, this.timeout);
            // Prevent timeout from keeping Node.js event loop alive
            this.requestTimeout.unref();
        });
    }
    handleDone() {
        if (this.pendingRequest) {
            this.pendingRequest.resolve(undefined);
            this.pendingRequest = null;
        }
    }
    handleCrash() {
        this.ready = false;
        this.crashCount++;
        if (this.pendingRequest) {
            this.pendingRequest.reject(new Error('Worker crashed'));
            this.pendingRequest = null;
        }
        if (this.crashCount < this.maxCrashes) {
            logger_1.default.warn(`Python worker crashed (${this.crashCount}/${this.maxCrashes}), restarting...`);
            this.startWorker().catch((err) => {
                logger_1.default.error(`Failed to restart worker: ${err}`);
            });
        }
        else {
            logger_1.default.error(`Python worker crashed ${this.maxCrashes} times, marking as dead`);
        }
    }
    isReady() {
        return this.ready;
    }
    isBusy() {
        return this.busy;
    }
    async shutdown() {
        if (!this.process) {
            return;
        }
        try {
            this.shuttingDown = true;
            // Reject any in-flight request promptly
            if (this.pendingRequest) {
                this.pendingRequest.reject(new Error('Worker shutting down'));
                this.pendingRequest = null;
            }
            // Note: PythonShell.send() adds newline automatically in 'text' mode
            this.process.send('SHUTDOWN');
            // Wait for exit (5s timeout)
            await Promise.race([
                new Promise((resolve) => {
                    this.process.on('close', () => resolve());
                }),
                new Promise((resolve) => setTimeout(resolve, 5000).unref()),
            ]);
        }
        catch (error) {
            logger_1.default.error(`Error during worker shutdown: ${error}`);
        }
        finally {
            if (this.process) {
                this.process.kill('SIGTERM');
                this.process = null;
            }
            this.ready = false;
            this.busy = false;
            this.shuttingDown = false;
        }
    }
}
exports.PythonWorker = PythonWorker;
//# sourceMappingURL=worker.js.map