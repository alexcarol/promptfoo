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
const fs_1 = __importDefault(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const ORIGINAL_ENV = { ...process.env };
describe('database WAL mode', () => {
    let tempDir;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...ORIGINAL_ENV };
        tempDir = fs_1.default.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-dbtest-'));
        process.env.PROMPTFOO_CONFIG_DIR = tempDir;
        delete process.env.IS_TESTING;
        delete process.env.PROMPTFOO_DISABLE_WAL_MODE;
    });
    afterEach(async () => {
        process.env = ORIGINAL_ENV;
        // Close the database connection if it exists
        try {
            const database = await Promise.resolve().then(() => __importStar(require('../src/database')));
            database.closeDb();
        }
        catch (err) {
            console.error('Error closing database:', err);
        }
        // Add a small delay to ensure connections are fully closed on Windows
        if (process.platform === 'win32') {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        try {
            fs_1.default.rmSync(tempDir, { recursive: true, force: true });
        }
        catch (err) {
            console.warn(`Could not remove temp directory ${tempDir}:`, err);
            // On Windows, sometimes we need multiple attempts
            if (process.platform === 'win32') {
                try {
                    // Try a second time after a short delay
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    fs_1.default.rmSync(tempDir, { recursive: true, force: true });
                }
                catch {
                    console.error(`Failed to remove temp directory after retry: ${tempDir}`);
                }
            }
        }
    });
    it('enables WAL journal mode by default', async () => {
        // First import and initialize the database to trigger WAL mode configuration
        const database = await Promise.resolve().then(() => __importStar(require('../src/database')));
        database.getDb();
        // Close it to ensure we don't get resource conflicts
        database.closeDb();
        // Then independently verify the journal mode using a direct connection
        const dbPath = database.getDbPath();
        const directDb = new better_sqlite3_1.default(dbPath);
        try {
            const result = directDb.prepare('PRAGMA journal_mode;').get();
            expect(result.journal_mode.toLowerCase()).toBe('wal');
        }
        finally {
            // Make sure to close this connection too
            directDb.close();
        }
    });
    it('skips WAL mode when PROMPTFOO_DISABLE_WAL_MODE is set', async () => {
        process.env.PROMPTFOO_DISABLE_WAL_MODE = 'true';
        const database = await Promise.resolve().then(() => __importStar(require('../src/database')));
        database.getDb();
        database.closeDb();
        const dbPath = database.getDbPath();
        const directDb = new better_sqlite3_1.default(dbPath);
        try {
            const result = directDb.prepare('PRAGMA journal_mode;').get();
            // Should be in default mode (delete) when WAL is disabled
            expect(result.journal_mode.toLowerCase()).toBe('delete');
        }
        finally {
            directDb.close();
        }
    });
    it('does not enable WAL mode for in-memory databases', async () => {
        process.env.IS_TESTING = 'true';
        const database = await Promise.resolve().then(() => __importStar(require('../src/database')));
        const db = database.getDb();
        // For in-memory databases, we can't verify the journal mode
        // but we can ensure it doesn't throw
        expect(db).toBeDefined();
    });
    it('verifies WAL checkpoint settings', async () => {
        const database = await Promise.resolve().then(() => __importStar(require('../src/database')));
        database.getDb();
        database.closeDb();
        const dbPath = database.getDbPath();
        const directDb = new better_sqlite3_1.default(dbPath);
        try {
            const autocheckpoint = directDb.prepare('PRAGMA wal_autocheckpoint;').get();
            expect(autocheckpoint.wal_autocheckpoint).toBe(1000);
            const synchronous = directDb.prepare('PRAGMA synchronous;').get();
            // NORMAL = 1 in SQLite
            expect(synchronous.synchronous).toBe(1);
        }
        finally {
            directDb.close();
        }
    });
});
//# sourceMappingURL=database.test.js.map