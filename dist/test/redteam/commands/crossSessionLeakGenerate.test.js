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
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../../src/redteam/index");
const generate_1 = require("../../../src/redteam/commands/generate");
const configModule = __importStar(require("../../../src/util/config/load"));
jest.mock('../../../src/redteam', () => ({
    synthesize: jest.fn(),
}));
jest.mock('../../../src/util/config/load', () => ({
    resolveConfigs: jest.fn(),
}));
jest.mock('../../../src/util/config/writer', () => ({
    writePromptfooConfig: jest.fn(),
}));
jest.mock('../../../src/providers', () => ({
    loadApiProviders: jest.fn().mockResolvedValue([
        {
            id: () => 'openai:gpt-4',
            callApi: jest.fn(),
            cleanup: jest.fn(),
        },
    ]),
    getProviderIds: jest.fn().mockReturnValue(['openai:gpt-4']),
}));
jest.mock('../../../src/logger', () => ({
    __esModule: true,
    default: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));
describe('cross-session-leak strategy exclusions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('should include cross-session-leak plugin and pass through strategies', async () => {
        jest.mocked(configModule.resolveConfigs).mockResolvedValue({
            basePath: '/mock/path',
            testSuite: {
                prompts: [{ raw: 'Test prompt' }],
                providers: [{ id: 'openai:gpt-4' }],
                tests: [],
            },
            config: {
                providers: ['openai:gpt-4'],
                redteam: {
                    plugins: ['cross-session-leak'],
                    strategies: ['crescendo', 'goat', 'rot13'],
                    numTests: 1,
                },
            },
        });
        jest.mocked(index_1.synthesize).mockResolvedValue({
            testCases: [],
            purpose: 'p',
            entities: [],
            injectVar: 'input',
        });
        const options = {
            output: 'out.yaml',
            cache: true,
            defaultConfig: {},
            write: true,
            config: 'config.yaml',
        };
        await (0, generate_1.doGenerateRedteam)(options);
        const synthOpts = jest.mocked(index_1.synthesize).mock.calls[0][0];
        const plugin = synthOpts.plugins.find((p) => p.id === 'cross-session-leak');
        expect(plugin).toBeDefined();
        expect(synthOpts.strategies.map((s) => s.id)).toEqual(['crescendo', 'goat', 'rot13']);
    });
});
//# sourceMappingURL=crossSessionLeakGenerate.test.js.map