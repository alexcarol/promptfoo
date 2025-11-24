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
exports.DrizzleLogWriter = void 0;
exports.getDbPath = getDbPath;
exports.getDbSignalPath = getDbSignalPath;
exports.getDb = getDb;
exports.closeDb = closeDb;
exports.isDbOpen = isDbOpen;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const better_sqlite3_2 = require("drizzle-orm/better-sqlite3");
const logger_1 = require("drizzle-orm/logger");
const path = __importStar(require("path"));
const envars_1 = require("../envars");
const logger_2 = __importDefault(require("../logger"));
const manage_1 = require("../util/config/manage");
class DrizzleLogWriter {
    write(message) {
        if ((0, envars_1.getEnvBool)('PROMPTFOO_ENABLE_DATABASE_LOGS', false)) {
            logger_2.default.debug(`Drizzle: ${message}`);
        }
    }
}
exports.DrizzleLogWriter = DrizzleLogWriter;
let dbInstance = null;
let sqliteInstance = null;
function getDbPath() {
    return path.resolve((0, manage_1.getConfigDirectoryPath)(true /* createIfNotExists */), 'promptfoo.db');
}
function getDbSignalPath() {
    return path.resolve((0, manage_1.getConfigDirectoryPath)(true /* createIfNotExists */), 'evalLastWritten');
}
function getDb() {
    if (!dbInstance) {
        const isMemoryDb = (0, envars_1.getEnvBool)('IS_TESTING');
        const dbPath = isMemoryDb ? ':memory:' : getDbPath();
        sqliteInstance = new better_sqlite3_1.default(dbPath);
        // Enable foreign key constraints (required for referential integrity)
        sqliteInstance.pragma('foreign_keys = ON');
        // Configure WAL mode unless explicitly disabled or using in-memory database
        if (!isMemoryDb && !(0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_WAL_MODE', false)) {
            try {
                // Enable WAL mode for better concurrency
                sqliteInstance.pragma('journal_mode = WAL');
                // Verify WAL mode was actually enabled
                const result = sqliteInstance.prepare('PRAGMA journal_mode').get();
                if (result.journal_mode.toLowerCase() === 'wal') {
                    logger_2.default.debug('Successfully enabled SQLite WAL mode');
                }
                else {
                    logger_2.default.warn(`Failed to enable WAL mode (got '${result.journal_mode}'). ` +
                        'Database performance may be reduced. This can happen on network filesystems. ' +
                        'Set PROMPTFOO_DISABLE_WAL_MODE=true to suppress this warning.');
                }
                // Additional WAL configuration for optimal performance
                sqliteInstance.pragma('wal_autocheckpoint = 1000'); // Checkpoint every 1000 pages
                sqliteInstance.pragma('synchronous = NORMAL'); // Good balance of safety and speed with WAL
            }
            catch (err) {
                logger_2.default.warn(`Error configuring SQLite WAL mode: ${err}. ` +
                    'Database will use default journal mode. Performance may be reduced. ' +
                    'This can happen on network filesystems or certain containerized environments. ' +
                    'Set PROMPTFOO_DISABLE_WAL_MODE=true to suppress this warning.');
            }
        }
        const drizzleLogger = new logger_1.DefaultLogger({ writer: new DrizzleLogWriter() });
        dbInstance = (0, better_sqlite3_2.drizzle)(sqliteInstance, { logger: drizzleLogger });
    }
    return dbInstance;
}
function closeDb() {
    if (sqliteInstance) {
        try {
            // Attempt to checkpoint WAL file before closing
            if (!(0, envars_1.getEnvBool)('IS_TESTING') && !(0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_WAL_MODE', false)) {
                try {
                    sqliteInstance.pragma('wal_checkpoint(TRUNCATE)');
                    logger_2.default.debug('Successfully checkpointed WAL file before closing');
                }
                catch (err) {
                    logger_2.default.debug(`Could not checkpoint WAL file: ${err}`);
                }
            }
            sqliteInstance.close();
            logger_2.default.debug('Database connection closed successfully');
        }
        catch (err) {
            logger_2.default.error(`Error closing database connection: ${err}`);
            // Even if close fails, we should still clear the instances
            // to prevent reuse of a potentially corrupted connection
        }
        finally {
            sqliteInstance = null;
            dbInstance = null;
        }
    }
}
/**
 * Check if the database is currently open
 */
function isDbOpen() {
    return sqliteInstance !== null && dbInstance !== null;
}
//# sourceMappingURL=index.js.map