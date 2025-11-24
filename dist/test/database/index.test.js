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
const path = __importStar(require("path"));
const index_1 = require("../../src/database/index");
const envars_1 = require("../../src/envars");
const logger_1 = __importDefault(require("../../src/logger"));
const manage_1 = require("../../src/util/config/manage");
jest.mock('../../src/envars');
jest.mock('../../src/logger');
jest.mock('../../src/util/config/manage');
describe('database', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (0, index_1.closeDb)();
        jest.mocked(manage_1.getConfigDirectoryPath).mockReturnValue('/test/config/path');
        jest.mocked(envars_1.getEnvBool).mockImplementation((key) => {
            if (key === 'IS_TESTING') {
                return true;
            }
            return false;
        });
    });
    afterEach(() => {
        (0, index_1.closeDb)();
    });
    describe('getDbPath', () => {
        it('should return path in config directory', () => {
            const configPath = '/test/config/path';
            jest.mocked(manage_1.getConfigDirectoryPath).mockReturnValue(configPath);
            expect((0, index_1.getDbPath)()).toBe(path.resolve(configPath, 'promptfoo.db'));
        });
    });
    describe('getDbSignalPath', () => {
        it('should return evalLastWritten path in config directory', () => {
            const configPath = '/test/config/path';
            jest.mocked(manage_1.getConfigDirectoryPath).mockReturnValue(configPath);
            expect((0, index_1.getDbSignalPath)()).toBe(path.resolve(configPath, 'evalLastWritten'));
        });
    });
    describe('getDb', () => {
        beforeEach(() => {
            jest.mocked(envars_1.getEnvBool).mockImplementation((key) => {
                if (key === 'IS_TESTING') {
                    return true;
                }
                return false;
            });
        });
        it('should return in-memory database when testing', () => {
            const db = (0, index_1.getDb)();
            expect(db).toBeDefined();
        });
        it('should initialize database with WAL mode', () => {
            const db = (0, index_1.getDb)();
            expect(db).toBeDefined();
        });
        it('should return same instance on subsequent calls', () => {
            const db1 = (0, index_1.getDb)();
            const db2 = (0, index_1.getDb)();
            expect(db1).toBe(db2);
        });
    });
    describe('DrizzleLogWriter', () => {
        it('should log debug message when database logs enabled', () => {
            jest.mocked(envars_1.getEnvBool).mockImplementation((key) => {
                if (key === 'PROMPTFOO_ENABLE_DATABASE_LOGS') {
                    return true;
                }
                return false;
            });
            const writer = new index_1.DrizzleLogWriter();
            writer.write('test message');
            expect(logger_1.default.debug).toHaveBeenCalledWith('Drizzle: test message');
        });
        it('should not log debug message when database logs disabled', () => {
            jest.mocked(envars_1.getEnvBool).mockReturnValue(false);
            const writer = new index_1.DrizzleLogWriter();
            writer.write('test message');
            expect(logger_1.default.debug).not.toHaveBeenCalled();
        });
    });
    describe('closeDb', () => {
        it('should close database connection and reset instances', () => {
            const _db = (0, index_1.getDb)();
            expect((0, index_1.isDbOpen)()).toBe(true);
            (0, index_1.closeDb)();
            expect((0, index_1.isDbOpen)()).toBe(false);
            const newDb = (0, index_1.getDb)();
            expect(newDb).toBeDefined();
            expect((0, index_1.isDbOpen)()).toBe(true);
        });
        it('should handle errors when closing database', () => {
            const _db = (0, index_1.getDb)();
            (0, index_1.closeDb)();
            (0, index_1.closeDb)(); // Second close should be handled gracefully
            expect(logger_1.default.error).not.toHaveBeenCalled();
        });
        it('should handle close errors gracefully', () => {
            const _db = (0, index_1.getDb)();
            // Force an error by closing twice
            (0, index_1.closeDb)();
            (0, index_1.closeDb)();
            expect(logger_1.default.error).not.toHaveBeenCalled();
        });
    });
    describe('isDbOpen', () => {
        it('should return false when database is not initialized', () => {
            (0, index_1.closeDb)(); // Ensure clean state
            expect((0, index_1.isDbOpen)()).toBe(false);
        });
        it('should return true when database is open', () => {
            const _db = (0, index_1.getDb)();
            expect((0, index_1.isDbOpen)()).toBe(true);
        });
        it('should return false after closing database', () => {
            const _db = (0, index_1.getDb)();
            expect((0, index_1.isDbOpen)()).toBe(true);
            (0, index_1.closeDb)();
            expect((0, index_1.isDbOpen)()).toBe(false);
        });
    });
});
//# sourceMappingURL=index.test.js.map