"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const workerPool_1 = require("../../src/python/workerPool");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Windows CI has severe filesystem delays (antivirus, etc.) - allow up to 90s
const TEST_TIMEOUT = process.platform === 'win32' ? 90000 : 5000;
// Skip on Windows CI due to aggressive file security policies blocking temp file IPC
// Works fine on local Windows and all other platforms
const describeOrSkip = process.platform === 'win32' && process.env.CI ? describe.skip : describe;
describeOrSkip('PythonWorkerPool', () => {
    let pool;
    const testScriptPath = path_1.default.join(__dirname, 'fixtures', 'counter_provider.py');
    const fixturesDir = path_1.default.join(__dirname, 'fixtures');
    beforeAll(() => {
        // Create fixtures directory if it doesn't exist
        if (!fs_1.default.existsSync(fixturesDir)) {
            fs_1.default.mkdirSync(fixturesDir, { recursive: true });
        }
        // Create test fixture with global state
        fs_1.default.writeFileSync(testScriptPath, `
# Global counter - persists across calls within same worker
call_count = 0

def call_api(prompt, options, context):
    global call_count
    call_count += 1
    return {"output": f"Call #{call_count}: {prompt}", "count": call_count}
`);
    });
    afterAll(() => {
        if (fs_1.default.existsSync(testScriptPath)) {
            fs_1.default.unlinkSync(testScriptPath);
        }
    });
    afterEach(async () => {
        if (pool) {
            await pool.shutdown();
        }
    });
    it('should initialize pool with specified worker count', async () => {
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', 2);
        await pool.initialize();
        expect(pool.getWorkerCount()).toBe(2);
    }, TEST_TIMEOUT);
    it('should reject invalid worker counts', async () => {
        // Test zero workers
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', 0);
        await expect(pool.initialize()).rejects.toThrow('Invalid worker count: 0. Must be at least 1.');
        // Test negative workers
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', -1);
        await expect(pool.initialize()).rejects.toThrow('Invalid worker count: -1. Must be at least 1.');
    });
    it('should execute calls sequentially with 1 worker', async () => {
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', 1);
        await pool.initialize();
        const result1 = await pool.execute('call_api', ['First', {}, {}]);
        const result2 = await pool.execute('call_api', ['Second', {}, {}]);
        const result3 = await pool.execute('call_api', ['Third', {}, {}]);
        // Same worker, counter increments
        expect(result1.count).toBe(1);
        expect(result2.count).toBe(2);
        expect(result3.count).toBe(3);
    }, TEST_TIMEOUT);
    it('should handle concurrent calls with multiple workers', async () => {
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', 2);
        await pool.initialize();
        // Execute 4 calls concurrently
        const promises = [
            pool.execute('call_api', ['Call 1', {}, {}]),
            pool.execute('call_api', ['Call 2', {}, {}]),
            pool.execute('call_api', ['Call 3', {}, {}]),
            pool.execute('call_api', ['Call 4', {}, {}]),
        ];
        const results = await Promise.all(promises);
        // Each worker maintains its own counter
        // With 2 workers, work should be distributed across both (not all to one worker)
        const counts = results.map((r) => r.count);
        const uniqueCounts = new Set(counts);
        // Verify multiple workers were used (at least 2 different counts)
        expect(uniqueCounts.size).toBeGreaterThan(1);
        // Verify all calls completed successfully
        expect(results.length).toBe(4);
    }, TEST_TIMEOUT);
    it('should queue requests when all workers busy', async () => {
        pool = new workerPool_1.PythonWorkerPool(testScriptPath, 'call_api', 1);
        await pool.initialize();
        // Start 3 concurrent calls with 1 worker - should queue
        const promises = [
            pool.execute('call_api', ['Q1', {}, {}]),
            pool.execute('call_api', ['Q2', {}, {}]),
            pool.execute('call_api', ['Q3', {}, {}]),
        ];
        const results = await Promise.all(promises);
        // All should complete (queued and executed)
        expect(results.length).toBe(3);
        expect(results[0].count).toBe(1);
        expect(results[1].count).toBe(2);
        expect(results[2].count).toBe(3);
    }, TEST_TIMEOUT);
    it('should handle different function names across pool', async () => {
        const multiApiPath = path_1.default.join(__dirname, 'fixtures', 'pool_multi_api.py');
        fs_1.default.writeFileSync(multiApiPath, `
def call_api(prompt, options, context):
    return {"output": f"text: {prompt}", "type": "text"}

def call_embedding_api(prompt, options, context):
    return {"output": [0.1, 0.2], "type": "embedding"}
`);
        try {
            pool = new workerPool_1.PythonWorkerPool(multiApiPath, 'call_api', 2);
            await pool.initialize();
            // Call different functions concurrently
            const results = await Promise.all([
                pool.execute('call_api', ['hello', {}, {}]),
                pool.execute('call_embedding_api', ['world', {}, {}]),
                pool.execute('call_api', ['again', {}, {}]),
            ]);
            expect(results[0].type).toBe('text');
            expect(results[1].type).toBe('embedding');
            expect(results[2].type).toBe('text');
        }
        finally {
            if (fs_1.default.existsSync(multiApiPath)) {
                fs_1.default.unlinkSync(multiApiPath);
            }
        }
    }, TEST_TIMEOUT);
    it('should process queued requests after worker becomes available', async () => {
        const queuePath = path_1.default.join(__dirname, 'fixtures', 'pool_queue.py');
        fs_1.default.writeFileSync(queuePath, `
call_count = 0

def call_api(prompt, options, context):
    global call_count
    call_count += 1
    return {"count": call_count, "output": prompt}
`);
        try {
            pool = new workerPool_1.PythonWorkerPool(queuePath, 'call_api', 1);
            await pool.initialize();
            // Fire off 5 requests - should queue and process sequentially
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(pool.execute('call_api', [`request-${i}`, {}, {}]));
            }
            const results = await Promise.all(promises);
            // All requests should complete
            expect(results.length).toBe(5);
            // Counter should increment sequentially (all in same worker)
            const counts = results.map((r) => r.count);
            expect(counts).toEqual([1, 2, 3, 4, 5]);
        }
        finally {
            if (fs_1.default.existsSync(queuePath)) {
                fs_1.default.unlinkSync(queuePath);
            }
        }
    }, TEST_TIMEOUT);
});
//# sourceMappingURL=workerPool.test.js.map