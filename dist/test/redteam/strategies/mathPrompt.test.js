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
const cli_progress_1 = require("cli-progress");
const cache_1 = require("../../../src/cache");
const shared_1 = require("../../../src/redteam/providers/shared");
const remoteGeneration = __importStar(require("../../../src/redteam/remoteGeneration"));
const mathPrompt_1 = require("../../../src/redteam/strategies/mathPrompt");
jest.mock('cli-progress');
jest.mock('../../../src/redteam/providers/shared');
jest.mock('../../../src/cache');
jest.mock('../../../src/redteam/remoteGeneration');
describe('mathPrompt', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.restoreAllMocks();
    });
    describe('generateMathPrompt', () => {
        it('should generate math prompts remotely', async () => {
            const mockProgressBar = {
                start: jest.fn(),
                increment: jest.fn(),
                stop: jest.fn(),
                render: jest.fn(),
                update: jest.fn(),
                isActive: jest.fn(),
                getProgress: jest.fn(),
            };
            cli_progress_1.SingleBar.mockImplementation(() => mockProgressBar);
            const mockTestCases = [{ vars: { prompt: 'test1' } }, { vars: { prompt: 'test2' } }];
            const mockResult = [{ vars: { prompt: 'encoded1' } }, { vars: { prompt: 'encoded2' } }];
            const mockResponse = {
                data: {
                    result: mockResult,
                },
                cached: false,
                status: 200,
                statusText: 'OK',
                headers: {},
                deleteFromCache: async () => { },
            };
            jest.mocked(cache_1.fetchWithCache).mockResolvedValue(mockResponse);
            const result = await (0, mathPrompt_1.generateMathPrompt)(mockTestCases, 'prompt', {});
            expect(result).toEqual(mockResult);
            expect(mockProgressBar.start).toHaveBeenCalledWith(1, 0);
            expect(mockProgressBar.increment).toHaveBeenCalledWith(1);
            expect(mockProgressBar.stop).toHaveBeenCalledWith();
        });
        it('should handle errors gracefully', async () => {
            jest.mocked(cache_1.fetchWithCache).mockRejectedValue(new Error('Network error'));
            cli_progress_1.SingleBar.mockImplementation(() => ({
                start: jest.fn(),
                increment: jest.fn(),
                stop: jest.fn(),
            }));
            const result = await (0, mathPrompt_1.generateMathPrompt)([{ vars: { prompt: 'test' } }], 'prompt', {});
            expect(result).toEqual([]);
        });
    });
    describe('encodeMathPrompt', () => {
        it('should encode text using math concepts', async () => {
            const mockProvider = {
                id: () => 'mock',
                callApi: jest.fn().mockResolvedValue({
                    output: JSON.stringify({ encodedPrompt: 'encoded math text' }),
                }),
            };
            jest.mocked(shared_1.redteamProviderManager.getProvider).mockResolvedValue(mockProvider);
            const result = await (0, mathPrompt_1.encodeMathPrompt)('test text', 'set theory');
            expect(result).toContain('encoded math text');
            expect(result).toContain('Also provide a complete translation');
        });
        it('should handle JSON parsing errors', async () => {
            const mockProvider = {
                id: () => 'mock',
                callApi: jest.fn().mockResolvedValue({
                    output: 'invalid json',
                }),
            };
            jest.mocked(shared_1.redteamProviderManager.getProvider).mockResolvedValue(mockProvider);
            await expect((0, mathPrompt_1.encodeMathPrompt)('test text', 'set theory')).rejects.toThrow('Expected a JSON object');
        });
    });
    describe('addMathPrompt', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should use custom math concepts when provided', async () => {
            jest.mocked(remoteGeneration.shouldGenerateRemote).mockReturnValue(false);
            const customConcepts = ['topology', 'calculus'];
            const mockProvider = {
                id: () => 'mock',
                callApi: jest.fn().mockResolvedValue({
                    output: JSON.stringify({ encodedPrompt: 'encoded' }),
                }),
            };
            jest.mocked(shared_1.redteamProviderManager.getProvider).mockResolvedValue(mockProvider);
            cli_progress_1.SingleBar.mockImplementation(() => ({
                start: jest.fn(),
                increment: jest.fn(),
                stop: jest.fn(),
            }));
            const result = await (0, mathPrompt_1.addMathPrompt)([{ vars: { prompt: 'test' } }], 'prompt', {
                mathConcepts: customConcepts,
            });
            expect(result).toHaveLength(customConcepts.length);
        });
        it('should validate mathConcepts config', async () => {
            await expect((0, mathPrompt_1.addMathPrompt)([], 'prompt', { mathConcepts: 'invalid' })).rejects.toThrow('MathPrompt strategy: `mathConcepts` must be an array of strings');
        });
    });
    describe('constants', () => {
        it('should expose DEFAULT_MATH_CONCEPTS', () => {
            expect(mathPrompt_1.DEFAULT_MATH_CONCEPTS).toEqual(['set theory', 'group theory', 'abstract algebra']);
        });
        it('should expose EXAMPLES', () => {
            expect(mathPrompt_1.EXAMPLES).toHaveLength(3);
            expect(mathPrompt_1.EXAMPLES[0]).toContain('Let A represent a set');
        });
    });
});
//# sourceMappingURL=mathPrompt.test.js.map