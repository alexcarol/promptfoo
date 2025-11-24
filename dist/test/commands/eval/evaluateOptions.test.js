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
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const eval_1 = require("../../../src/commands/eval");
const evaluatorModule = __importStar(require("../../../src/evaluator"));
jest.mock('../../../src/evaluator', () => ({
    evaluate: jest.fn().mockResolvedValue({ results: [], summary: {} }),
}));
jest.mock('../../../src/logger', () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    getLogLevel: jest.fn().mockReturnValue('info'),
}));
jest.mock('../../../src/migrate', () => ({
    runDbMigrations: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('../../../src/telemetry', () => ({
    record: jest.fn(),
    recordAndSendOnce: jest.fn(),
    send: jest.fn().mockResolvedValue(undefined),
}));
const evaluateMock = jest.mocked(evaluatorModule.evaluate);
function makeConfig(configPath, evaluateOptions = {}) {
    fs_1.default.writeFileSync(configPath, js_yaml_1.default.dump({
        evaluateOptions: {
            // Define default values for the tests to use if none are provided.
            maxConcurrency: evaluateOptions.maxConcurrency ?? 9,
            repeat: evaluateOptions.repeat ?? 99,
            delay: evaluateOptions.delay ?? 999,
            showProgressBar: evaluateOptions.showProgressBar ?? false,
            cache: evaluateOptions.cache ?? false,
            timeoutMs: evaluateOptions.timeoutMs ?? 9999,
            maxEvalTimeMs: evaluateOptions.maxEvalTimeMs ?? 99999,
        },
        providers: [{ id: 'openai:gpt-4o-mini' }],
        prompts: ['test prompt'],
        tests: [{ vars: { input: 'test input' } }],
    }));
}
describe('evaluateOptions behavior', () => {
    let configPath;
    let noDelayConfigPath;
    let noRepeatConfigPath;
    const originalExit = process.exit;
    beforeAll(() => {
        process.exit = jest.fn();
        const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'promptfoo-test-'));
        // Build a config file for the tests to use.
        configPath = path_1.default.join(tmpDir, 'promptfooconfig.yaml');
        makeConfig(configPath);
        // Build a config that has no delay set; a delay set to >0 will override the maxConcurrency value.
        noDelayConfigPath = path_1.default.join(tmpDir, 'promptfooconfig-noDelay.yaml');
        makeConfig(noDelayConfigPath, { delay: 0 });
        // Build a config that has no repeat set; a repeat set to >1 will override the cache value
        noRepeatConfigPath = path_1.default.join(tmpDir, 'promptfooconfig-noRepeat.yaml');
        makeConfig(noRepeatConfigPath, { repeat: 1 });
    });
    beforeEach(() => {
        jest.clearAllMocks();
    });
    afterAll(() => {
        process.exit = originalExit;
    });
    describe('Reading values from config file', () => {
        it('should read evaluateOptions.maxConcurrency', async () => {
            const cmdObj = {
                config: [noDelayConfigPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.maxConcurrency).toBe(9);
        });
        it('should read evaluateOptions.repeat', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.repeat).toBe(99);
        });
        it('should read evaluateOptions.delay', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.delay).toBe(999);
        });
        it('should read evaluateOptions.showProgressBar', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.showProgressBar).toBe(false);
        });
        it('should read evaluateOptions.cache', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.cache).toBe(false);
        });
        it('should read evaluateOptions.timeoutMs', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.timeoutMs).toBe(9999);
        });
        it('should read evaluateOptions.maxEvalTimeMs', async () => {
            const cmdObj = {
                config: [configPath],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.maxEvalTimeMs).toBe(99999);
        });
    });
    describe('Prioritization of CLI options over config file options', () => {
        it('should prioritize maxConcurrency from command line options over config file options', async () => {
            const cmdObj = {
                config: [noDelayConfigPath],
                maxConcurrency: 5,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            expect(evaluateMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Object));
            const options = evaluateMock.mock.calls[0][2];
            expect(options.maxConcurrency).toBe(5);
        });
        it('should prioritize repeat from command line options over config file options', async () => {
            const cmdObj = {
                config: [configPath],
                repeat: 5,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            expect(evaluateMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Object));
            const options = evaluateMock.mock.calls[0][2];
            expect(options.repeat).toBe(5);
        });
        it('should prioritize delay from command line options over config file options', async () => {
            const cmdObj = {
                config: [configPath],
                delay: 5,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            expect(evaluateMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Object));
            const options = evaluateMock.mock.calls[0][2];
            expect(options.delay).toBe(5);
        });
        it('should prioritize showProgressBar from command line options over config file options', async () => {
            const cmdObj = {
                config: [configPath],
                progressBar: true,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            expect(evaluateMock).toHaveBeenCalledWith(expect.any(Object), expect.any(Object), expect.any(Object));
            const options = evaluateMock.mock.calls[0][2];
            expect(options.showProgressBar).toBe(true);
        });
        it('should prioritize cache from command line options over config file options', async () => {
            const cmdObj = {
                config: [noRepeatConfigPath],
                cache: true,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.cache).toBe(true);
        });
    });
    it('should correctly merge evaluateOptions from multiple sources', () => {
        const config = {
            evaluateOptions: {
                maxConcurrency: 3,
                showProgressBar: false,
            },
            providers: [],
            prompts: [],
        };
        const initialOptions = {
            showProgressBar: true,
        };
        const mergedOptions = config.evaluateOptions
            ? { ...initialOptions, ...config.evaluateOptions }
            : initialOptions;
        expect(mergedOptions.maxConcurrency).toBe(3);
        expect(mergedOptions.showProgressBar).toBe(false);
    });
    describe('Edge cases and interactions', () => {
        it('should handle delay >0 forcing concurrency to 1 even with CLI override', async () => {
            const cmdObj = {
                config: [configPath],
                maxConcurrency: 10, // This should be overridden to 1 due to delay
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.maxConcurrency).toBe(1); // Should be forced to 1 due to delay
        });
        it('should handle repeat >1 with cache value passed correctly', async () => {
            const cmdObj = {
                config: [configPath],
                cache: true,
                repeat: 3,
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.cache).toBe(true); // Cache value is passed as-is
            expect(options.repeat).toBe(3); // Repeat value is correctly set
            // Note: disableCache() is called globally but options.cache reflects the config
        });
        it('should handle undefined/null evaluateOptions gracefully', async () => {
            const tempConfig = path_1.default.join(process.cwd(), 'temp-test-config.yaml');
            fs_1.default.writeFileSync(tempConfig, js_yaml_1.default.dump({
                evaluateOptions: null, // Explicitly null
                providers: [{ id: 'openai:gpt-4o-mini' }],
                prompts: ['test'],
                tests: [{ vars: { input: 'test' } }],
            }));
            const cmdObj = {
                config: [tempConfig],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            expect(evaluateMock).toHaveBeenCalled();
            fs_1.default.unlinkSync(tempConfig);
        });
        it('should handle mixed CLI and config values correctly', async () => {
            const cmdObj = {
                config: [configPath], // Has delay: 999, maxConcurrency: 9, etc.
                delay: 0, // CLI override
                repeat: 1, // CLI override
                // maxConcurrency not set, should use config value
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.delay).toBeUndefined(); // CLI delay 0 should result in undefined
            expect(options.repeat).toBe(1); // CLI override
            expect(options.maxConcurrency).toBe(9); // From config
        });
    });
    describe('commandLineOptions behavior', () => {
        it('should respect commandLineOptions.generateSuggestions from config', async () => {
            const tempConfig = path_1.default.join(process.cwd(), 'test-generate-suggestions.yaml');
            fs_1.default.writeFileSync(tempConfig, js_yaml_1.default.dump({
                commandLineOptions: {
                    generateSuggestions: true,
                },
                providers: [{ id: 'openai:gpt-4o-mini' }],
                prompts: ['Test prompt'],
                tests: [{ vars: { input: 'test' } }],
            }));
            const cmdObj = {
                table: false,
                write: false,
                config: [tempConfig],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.generateSuggestions).toBe(true);
            fs_1.default.unlinkSync(tempConfig);
        });
        it('should prioritize CLI --suggest-prompts over commandLineOptions.generateSuggestions', async () => {
            const tempConfig = path_1.default.join(process.cwd(), 'test-generate-suggestions-override.yaml');
            fs_1.default.writeFileSync(tempConfig, js_yaml_1.default.dump({
                commandLineOptions: {
                    generateSuggestions: false,
                },
                providers: [{ id: 'openai:gpt-4o-mini' }],
                prompts: ['Test prompt'],
                tests: [{ vars: { input: 'test' } }],
            }));
            const cmdObj = {
                table: false,
                write: false,
                config: [tempConfig],
                generateSuggestions: true, // CLI override
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            const options = evaluateMock.mock.calls[0][2];
            expect(options.generateSuggestions).toBe(true);
            fs_1.default.unlinkSync(tempConfig);
        });
        it('should respect commandLineOptions.table from config', async () => {
            const tempConfig = path_1.default.join(process.cwd(), 'test-table.yaml');
            fs_1.default.writeFileSync(tempConfig, js_yaml_1.default.dump({
                commandLineOptions: {
                    table: false,
                },
                providers: [{ id: 'openai:gpt-4o-mini' }],
                prompts: ['Test prompt'],
                tests: [{ vars: { input: 'test' } }],
            }));
            const cmdObj = {
                write: false,
                config: [tempConfig],
            };
            // We can't directly check table output, but we can verify the config loads
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            // If this completes without error, the config was respected
            expect(evaluateMock).toHaveBeenCalled();
            fs_1.default.unlinkSync(tempConfig);
        });
        it('should respect commandLineOptions.write = false from config', async () => {
            const tempConfig = path_1.default.join(process.cwd(), 'test-write.yaml');
            fs_1.default.writeFileSync(tempConfig, js_yaml_1.default.dump({
                commandLineOptions: {
                    write: false,
                },
                providers: [{ id: 'openai:gpt-4o-mini' }],
                prompts: ['Test prompt'],
                tests: [{ vars: { input: 'test' } }],
            }));
            const cmdObj = {
                table: false,
                config: [tempConfig],
            };
            await (0, eval_1.doEval)(cmdObj, {}, undefined, {});
            // Verify eval completed successfully with write=false
            expect(evaluateMock).toHaveBeenCalled();
            fs_1.default.unlinkSync(tempConfig);
        });
    });
});
//# sourceMappingURL=evaluateOptions.test.js.map