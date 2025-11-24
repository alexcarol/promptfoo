"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const goat_1 = __importDefault(require("../../../src/redteam/providers/goat"));
const remoteGeneration_1 = require("../../../src/redteam/remoteGeneration");
// Mock the graders module at the top level
const mockGrader = {
    getResult: globals_1.jest.fn(),
};
const mockGetGraderById = globals_1.jest.fn().mockReturnValue(mockGrader);
globals_1.jest.mock('../../../src/redteam/graders', () => ({
    getGraderById: mockGetGraderById,
}));
globals_1.jest.mock('../../../src/util/server', () => ({
    checkServerFeatureSupport: globals_1.jest.fn(() => Promise.resolve(false)),
}));
(0, globals_1.describe)('RedteamGoatProvider', () => {
    let mockFetch;
    // Helper function to create a mock target provider
    const createMockTargetProvider = (outputValue = 'target response', tokenUsage = {}, responseOverrides = {}) => {
        const targetProvider = {
            id: () => 'test-provider',
            callApi: globals_1.jest.fn(),
        };
        targetProvider.callApi.mockResolvedValue({
            output: outputValue,
            tokenUsage,
            ...responseOverrides,
        });
        return targetProvider;
    };
    // Helper function to create a mock context
    const createMockContext = (targetProvider, vars = { goal: 'test goal' }, testConfig) => ({
        originalProvider: targetProvider,
        vars,
        prompt: { raw: 'test prompt', label: 'test' },
        test: testConfig,
    });
    (0, globals_1.beforeEach)(() => {
        mockFetch = globals_1.jest.fn().mockImplementation(async () => ({
            json: async () => ({
                message: { role: 'assistant', content: 'test response' },
            }),
            ok: true,
        }));
        global.fetch = mockFetch;
        // Reset mocks
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.clearAllMocks();
    });
    (0, globals_1.it)('should initialize with required config', () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 3,
        });
        (0, globals_1.expect)(provider.id()).toBe('promptfoo:redteam:goat');
    });
    (0, globals_1.it)('should throw error if injectVar is missing', () => {
        (0, globals_1.expect)(() => {
            new goat_1.default({});
        }).toThrow('Expected injectVar to be set');
    });
    (0, globals_1.it)('should initialize with all config options', () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 3,
            stateful: true,
            excludeTargetOutputFromAgenticAttackGeneration: true,
        });
        (0, globals_1.expect)(provider.config).toEqual({
            injectVar: 'goal',
            maxTurns: 3,
            stateful: true,
            excludeTargetOutputFromAgenticAttackGeneration: true,
            continueAfterSuccess: false,
        });
    });
    (0, globals_1.it)('should default stateful to false when not specified', () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
        });
        (0, globals_1.expect)(provider.config.stateful).toBe(false);
    });
    (0, globals_1.it)('should handle stateful behavior when set to true', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 2,
            stateful: true,
        });
        const targetProvider = createMockTargetProvider();
        const context = createMockContext(targetProvider);
        await provider.callApi('test prompt', context);
        const lastCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        (0, globals_1.expect)(lastCallBody.messages).toBeDefined();
    });
    (0, globals_1.it)('should pass excludeTargetOutputFromAgenticAttackGeneration through config', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 2,
            excludeTargetOutputFromAgenticAttackGeneration: true,
        });
        const targetProvider = createMockTargetProvider();
        const context = createMockContext(targetProvider);
        await provider.callApi('test prompt', context);
        const lastCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        (0, globals_1.expect)(lastCallBody.excludeTargetOutputFromAgenticAttackGeneration).toBe(true);
    });
    (0, globals_1.it)('should make correct API calls with message history', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 2,
        });
        const targetProvider = {
            id: () => 'test-provider',
            callApi: globals_1.jest.fn(),
        };
        targetProvider.callApi.mockResolvedValue({
            output: 'target response',
            tokenUsage: {},
        });
        const prompt = {
            raw: 'test prompt',
            label: 'test',
        };
        const context = {
            originalProvider: targetProvider,
            vars: { goal: 'test goal' },
            prompt,
        };
        const result = await provider.callApi('test prompt', context);
        (0, globals_1.expect)(result.metadata?.stopReason).toBe('Max turns reached');
        (0, globals_1.expect)(mockFetch).toHaveBeenCalledWith((0, remoteGeneration_1.getRemoteGenerationUrl)(), globals_1.expect.objectContaining({
            method: 'POST',
            headers: globals_1.expect.objectContaining({
                'Content-Type': 'application/json',
            }),
            body: globals_1.expect.any(String),
        }));
        const bodyObj = JSON.parse(mockFetch.mock.calls[0][1].body);
        (0, globals_1.expect)(bodyObj.purpose).toBeUndefined();
    });
    (0, globals_1.it)('should handle grader integration and stop early on failure', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 3,
        });
        const targetProvider = createMockTargetProvider('target response', {
            total: 10,
            prompt: 5,
            completion: 5,
        });
        // Mock grader to fail (indicating success)
        mockGrader.getResult.mockResolvedValue({
            grade: {
                pass: false,
                tokensUsed: { total: 5, prompt: 2, completion: 3 },
            },
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'contains',
                    value: 'expected content',
                },
            ],
            metadata: { pluginId: 'contains' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        (0, globals_1.expect)(result.metadata?.stopReason).toBe('Grader failed');
        (0, globals_1.expect)(result.tokenUsage?.total).toBeGreaterThan(0);
    });
    (0, globals_1.it)('should stringify non-string target provider responses', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const objectResponse = { foo: 'bar', baz: 123 };
        const targetProvider = {
            id: () => 'test-provider',
            callApi: globals_1.jest.fn(),
        };
        targetProvider.callApi.mockResolvedValue({
            output: objectResponse,
            tokenUsage: {},
        });
        const prompt = {
            raw: 'test prompt',
            label: 'test',
        };
        const context = {
            originalProvider: targetProvider,
            vars: { goal: 'test goal' },
            prompt,
        };
        const result = await provider.callApi('test prompt', context);
        const messages = result.metadata?.messages;
        (0, globals_1.expect)(messages[messages.length - 1].content).toBe(JSON.stringify(objectResponse));
    });
    (0, globals_1.it)('should include purpose in API call when provided in test metadata', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = {
            id: () => 'test-provider',
            callApi: globals_1.jest.fn(),
        };
        targetProvider.callApi.mockResolvedValue({
            output: 'target response',
            tokenUsage: {},
        });
        const context = {
            originalProvider: targetProvider,
            vars: { goal: 'test goal' },
            prompt: { raw: 'test prompt', label: 'test' },
            test: {
                vars: {},
                metadata: {
                    purpose: 'test purpose',
                },
            },
        };
        await provider.callApi('test prompt', context);
        const lastCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        (0, globals_1.expect)(lastCallBody.purpose).toBe('test purpose');
    });
    (0, globals_1.it)('should handle undefined purpose in test metadata', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = {
            id: () => 'test-provider',
            callApi: globals_1.jest.fn(),
        };
        targetProvider.callApi.mockResolvedValue({
            output: 'target response',
            tokenUsage: {},
        });
        const context = {
            originalProvider: targetProvider,
            vars: { goal: 'test goal' },
            prompt: { raw: 'test prompt', label: 'test' },
            test: {
                vars: {},
            },
        };
        await provider.callApi('test prompt', context);
        const lastCallBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        (0, globals_1.expect)(lastCallBody.purpose).toBeUndefined();
    });
    (0, globals_1.describe)('continueAfterSuccess functionality', () => {
        (0, globals_1.beforeEach)(() => {
            // Reset mocks before each test
            globals_1.jest.clearAllMocks();
        });
        (0, globals_1.it)('should stop on first successful attack when continueAfterSuccess is false (default)', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 5,
                continueAfterSuccess: false,
            });
            const targetProvider = createMockTargetProvider('harmful response', {
                total: 10,
                prompt: 5,
                completion: 5,
            });
            // Mock grader to fail on first attempt (indicating success)
            mockGrader.getResult.mockResolvedValue({
                grade: {
                    pass: false,
                    tokensUsed: { total: 5, prompt: 2, completion: 3 },
                },
            });
            const testConfig = {
                vars: {},
                assert: [{ type: 'contains', value: 'harmful' }],
                metadata: { pluginId: 'contains' },
            };
            const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.stopReason).toBe('Grader failed');
            (0, globals_1.expect)(result.metadata?.successfulAttacks).toHaveLength(1);
            (0, globals_1.expect)(result.metadata?.totalSuccessfulAttacks).toBe(1);
            (0, globals_1.expect)(result.metadata?.successfulAttacks?.[0]).toEqual({
                turn: 0,
                prompt: 'test response',
                response: 'harmful response',
            });
            (0, globals_1.expect)(mockFetch).toHaveBeenCalledTimes(1); // Only one turn
        });
        (0, globals_1.it)('should continue and collect multiple successful attacks when continueAfterSuccess is true', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 3,
                continueAfterSuccess: true,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'first harmful response',
                tokenUsage: { total: 10, prompt: 5, completion: 5 },
            })
                .mockResolvedValueOnce({
                output: 'second harmful response',
                tokenUsage: { total: 12, prompt: 6, completion: 6 },
            })
                .mockResolvedValueOnce({
                output: 'third response',
                tokenUsage: { total: 8, prompt: 4, completion: 4 },
            });
            // Mock grader to fail on first two attempts (indicating success)
            mockGrader.getResult
                .mockResolvedValueOnce({
                grade: {
                    pass: false,
                    tokensUsed: { total: 5, prompt: 2, completion: 3 },
                },
            })
                .mockResolvedValueOnce({
                grade: {
                    pass: false,
                    tokensUsed: { total: 6, prompt: 3, completion: 3 },
                },
            })
                .mockResolvedValueOnce({
                grade: {
                    pass: true,
                    tokensUsed: { total: 4, prompt: 2, completion: 2 },
                },
            });
            const context = {
                originalProvider: targetProvider,
                vars: { goal: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    vars: {},
                    assert: [{ type: 'contains', value: 'harmful' }],
                    metadata: { pluginId: 'contains' },
                },
            };
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.stopReason).toBe('Max turns reached');
            (0, globals_1.expect)(result.metadata?.successfulAttacks).toHaveLength(2);
            (0, globals_1.expect)(result.metadata?.totalSuccessfulAttacks).toBe(2);
            (0, globals_1.expect)(result.metadata?.successfulAttacks?.[0]).toEqual({
                turn: 0,
                prompt: 'test response',
                response: 'first harmful response',
            });
            (0, globals_1.expect)(result.metadata?.successfulAttacks?.[1]).toEqual({
                turn: 1,
                prompt: 'test response',
                response: 'second harmful response',
            });
            (0, globals_1.expect)(mockFetch).toHaveBeenCalledTimes(3); // All three turns
        });
        (0, globals_1.it)('should have empty successfulAttacks array when no attacks succeed', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 2,
                continueAfterSuccess: true,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi.mockResolvedValue({
                output: 'safe response',
                tokenUsage: { total: 10, prompt: 5, completion: 5 },
            });
            // Mock grader to always pass (indicating no successful attacks)
            mockGrader.getResult.mockResolvedValue({
                grade: {
                    pass: true,
                    tokensUsed: { total: 5, prompt: 2, completion: 3 },
                },
            });
            const context = {
                originalProvider: targetProvider,
                vars: { goal: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    vars: {},
                    assert: [{ type: 'contains', value: 'harmful' }],
                    metadata: { pluginId: 'contains' },
                },
            };
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.stopReason).toBe('Max turns reached');
            (0, globals_1.expect)(result.metadata?.successfulAttacks).toHaveLength(0);
            (0, globals_1.expect)(result.metadata?.totalSuccessfulAttacks).toBe(0);
        });
        (0, globals_1.it)('should initialize continueAfterSuccess to false by default', () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 3,
            });
            (0, globals_1.expect)(provider.config.continueAfterSuccess).toBe(false);
        });
        (0, globals_1.it)('should respect continueAfterSuccess configuration option', () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 3,
                continueAfterSuccess: true,
            });
            (0, globals_1.expect)(provider.config.continueAfterSuccess).toBe(true);
        });
        (0, globals_1.it)('should handle mixed success and failure cases with continueAfterSuccess', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 4,
                continueAfterSuccess: true,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi
                .mockResolvedValueOnce({ output: 'safe response 1', tokenUsage: {} })
                .mockResolvedValueOnce({ output: 'harmful response 1', tokenUsage: {} })
                .mockResolvedValueOnce({ output: 'safe response 2', tokenUsage: {} })
                .mockResolvedValueOnce({ output: 'harmful response 2', tokenUsage: {} });
            // Mock grader: pass, fail, pass, fail
            mockGrader.getResult
                .mockResolvedValueOnce({ grade: { pass: true } })
                .mockResolvedValueOnce({ grade: { pass: false } })
                .mockResolvedValueOnce({ grade: { pass: true } })
                .mockResolvedValueOnce({ grade: { pass: false } });
            const context = {
                originalProvider: targetProvider,
                vars: { goal: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    vars: {},
                    assert: [{ type: 'contains', value: 'harmful' }],
                    metadata: { pluginId: 'contains' },
                },
            };
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.stopReason).toBe('Max turns reached');
            (0, globals_1.expect)(result.metadata?.successfulAttacks).toHaveLength(2);
            (0, globals_1.expect)(result.metadata?.totalSuccessfulAttacks).toBe(2);
            (0, globals_1.expect)(result.metadata?.successfulAttacks?.[0].response).toBe('harmful response 1');
            (0, globals_1.expect)(result.metadata?.successfulAttacks?.[1].response).toBe('harmful response 2');
        });
    });
    (0, globals_1.it)('should pass additionalRubric to grader when goal is provided', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        // Mock grader to capture the additionalRubric parameter
        let capturedAdditionalRubric;
        mockGrader.getResult.mockImplementation(async (_prompt, _output, _test, _provider, _value, additionalRubric) => {
            capturedAdditionalRubric = additionalRubric;
            return {
                grade: {
                    pass: false,
                    score: 0,
                    reason: 'Test jailbreak detected',
                },
            };
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'contains',
                    value: 'expected content',
                },
            ],
            metadata: {
                pluginId: 'contains',
                goal: 'Extract sensitive information',
            },
        };
        const context = createMockContext(targetProvider, { goal: 'Extract sensitive information' }, testConfig);
        await provider.callApi('test prompt', context);
        // Verify that additionalRubric was generated and passed to grader
        (0, globals_1.expect)(capturedAdditionalRubric).toBeDefined();
        (0, globals_1.expect)(capturedAdditionalRubric).toContain('Extract sensitive information');
        (0, globals_1.expect)(capturedAdditionalRubric).toContain('ADDITIONAL EVALUATION CRITERIA');
    });
    (0, globals_1.it)('should store grader result in metadata when grader fails', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        const mockGraderResult = {
            pass: false,
            score: 0,
            reason: 'Jailbreak successful - sensitive info extracted',
            tokensUsed: { total: 10, prompt: 5, completion: 5 },
        };
        // Mock grader to fail (indicating jailbreak success)
        mockGrader.getResult.mockResolvedValue({
            grade: mockGraderResult,
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'contains',
                    value: 'expected content',
                },
            ],
            metadata: { pluginId: 'contains' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Verify storedGraderResult is included in metadata
        (0, globals_1.expect)(result.metadata?.storedGraderResult).toMatchObject(mockGraderResult);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion).toBeDefined();
        (0, globals_1.expect)(result.metadata?.stopReason).toBe('Grader failed');
    });
    (0, globals_1.it)('should store rendered rubric in assertion.value when grader returns rubric', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        const mockRenderedRubric = `
      <system_purpose>Medical chatbot</system_purpose>
      <policy>Only return NAICS codes if 100% certain</policy>
      
      Evaluate if the output violates the given policy...
    `;
        const mockGraderResult = {
            pass: false,
            score: 0,
            reason: 'Policy violation detected',
        };
        // Mock grader to return both grade and rubric
        mockGrader.getResult.mockResolvedValue({
            grade: mockGraderResult,
            rubric: mockRenderedRubric,
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'promptfoo:redteam:policy',
                    metric: 'PolicyViolation:401a805692b3',
                },
            ],
            metadata: { pluginId: 'policy' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Verify storedGraderResult includes the rendered rubric in assertion.value
        (0, globals_1.expect)(result.metadata?.storedGraderResult).toBeDefined();
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion).toBeDefined();
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.value).toBe(mockRenderedRubric);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.type).toBe('promptfoo:redteam:policy');
        (0, globals_1.expect)(result.metadata?.stopReason).toBe('Grader failed');
    });
    (0, globals_1.it)('should store rubric with grade.assertion when grader returns assertion with existing value', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        const mockRenderedRubric = '<rendered_rubric>Evaluation criteria</rendered_rubric>';
        const mockGraderResult = {
            pass: false,
            score: 0,
            reason: 'Test failed',
            assertion: {
                type: 'promptfoo:redteam:policy',
                metric: 'PolicyViolation:test',
                value: 'old value',
            },
        };
        // Mock grader returning grade with assertion
        mockGrader.getResult.mockResolvedValue({
            grade: mockGraderResult,
            rubric: mockRenderedRubric,
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'promptfoo:redteam:policy',
                    metric: 'PolicyViolation:test',
                },
            ],
            metadata: { pluginId: 'policy' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Verify that the rubric overrides the old value
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.value).toBe(mockRenderedRubric);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.type).toBe('promptfoo:redteam:policy');
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.metric).toBe('PolicyViolation:test');
    });
    (0, globals_1.it)('should use assertion from test config when grade.assertion is undefined', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        const mockRenderedRubric = '<rubric>Test rubric</rubric>';
        const mockGraderResult = {
            pass: false,
            score: 0,
            reason: 'Test failed',
            // No assertion field
        };
        mockGrader.getResult.mockResolvedValue({
            grade: mockGraderResult,
            rubric: mockRenderedRubric,
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'promptfoo:redteam:harmful',
                    metric: 'Harmful',
                },
            ],
            metadata: { pluginId: 'harmful' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Should use assertion from test config with rubric as value
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.value).toBe(mockRenderedRubric);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.type).toBe('promptfoo:redteam:harmful');
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion?.metric).toBe('Harmful');
    });
    (0, globals_1.it)('should not store assertion when assertToUse is AssertionSet', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 1,
        });
        const targetProvider = createMockTargetProvider();
        const mockRenderedRubric = '<rubric>Test rubric</rubric>';
        const mockGraderResult = {
            pass: false,
            score: 0,
            reason: 'Test failed',
        };
        mockGrader.getResult.mockResolvedValue({
            grade: mockGraderResult,
            rubric: mockRenderedRubric,
        });
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'assert-set',
                    assert: [
                        { type: 'contains', value: 'test' },
                        { type: 'contains', value: 'another' },
                    ],
                },
            ],
            metadata: { pluginId: 'policy' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Should not create assertion from AssertionSet
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion).toBeUndefined();
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.pass).toBe(false);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.score).toBe(0);
    });
    (0, globals_1.it)('should store grader result even when continueAfterSuccess is true', async () => {
        const provider = new goat_1.default({
            injectVar: 'goal',
            maxTurns: 2,
            continueAfterSuccess: true,
        });
        const targetProvider = createMockTargetProvider();
        const firstGraderResult = {
            pass: false,
            score: 0,
            reason: 'Jailbreak detected',
        };
        const secondGraderResult = {
            pass: true,
            score: 1,
            reason: 'No jailbreak detected',
        };
        // Mock grader to fail on first turn, pass on second turn
        mockGrader.getResult
            .mockResolvedValueOnce({
            grade: firstGraderResult,
        })
            .mockResolvedValueOnce({
            grade: secondGraderResult,
        });
        // Mock remote generation API for second turn
        mockFetch.mockImplementationOnce(async () => ({
            json: async () => ({
                message: { role: 'assistant', content: 'attack prompt' },
            }),
            ok: true,
        }));
        const testConfig = {
            vars: {},
            assert: [
                {
                    type: 'contains',
                    value: 'expected content',
                },
            ],
            metadata: { pluginId: 'contains' },
        };
        const context = createMockContext(targetProvider, { goal: 'test goal' }, testConfig);
        const result = await provider.callApi('test prompt', context);
        // Should continue to max turns and store the LAST grader result
        (0, globals_1.expect)(result.metadata?.storedGraderResult).toMatchObject(secondGraderResult);
        (0, globals_1.expect)(result.metadata?.storedGraderResult?.assertion).toBeDefined();
        (0, globals_1.expect)(result.metadata?.stopReason).toBe('Max turns reached');
        (0, globals_1.expect)(result.metadata?.successfulAttacks).toHaveLength(1);
        // The successful attack should be from the first turn
        (0, globals_1.expect)(result.metadata?.successfulAttacks?.[0]).toMatchObject({
            turn: 0,
            prompt: globals_1.expect.any(String),
            response: globals_1.expect.any(String),
        });
    });
    (0, globals_1.describe)('Token Counting', () => {
        (0, globals_1.beforeEach)(() => {
            // Reset TokenUsageTracker between tests to ensure clean state
            const { TokenUsageTracker } = require('../../../src/util/tokenUsage');
            TokenUsageTracker.getInstance().resetAllUsage();
        });
        (0, globals_1.it)('should correctly track token usage from target provider', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider('target response', {
                total: 100,
                prompt: 60,
                completion: 40,
                numRequests: 1,
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            // Verify that target token usage is accumulated
            (0, globals_1.expect)(result.tokenUsage?.total).toBe(100);
            (0, globals_1.expect)(result.tokenUsage?.prompt).toBe(60);
            (0, globals_1.expect)(result.tokenUsage?.completion).toBe(40);
            (0, globals_1.expect)(result.tokenUsage?.numRequests).toBe(1);
        });
        (0, globals_1.it)('should accumulate token usage across multiple turns', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 3,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            // Mock target provider for multiple calls with different token usage
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'response 1',
                tokenUsage: { total: 100, prompt: 60, completion: 40, numRequests: 1 },
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'response 2',
                tokenUsage: { total: 150, prompt: 90, completion: 60, numRequests: 1 },
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'response 3',
                tokenUsage: { total: 200, prompt: 120, completion: 80, numRequests: 1 },
                cached: false,
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            // Verify accumulated token usage from all target calls
            (0, globals_1.expect)(result.tokenUsage?.total).toBe(450); // 100 + 150 + 200
            (0, globals_1.expect)(result.tokenUsage?.prompt).toBe(270); // 60 + 90 + 120
            (0, globals_1.expect)(result.tokenUsage?.completion).toBe(180); // 40 + 60 + 80
            (0, globals_1.expect)(result.tokenUsage?.numRequests).toBe(3);
        });
        (0, globals_1.it)('should handle missing token usage from target responses', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 3,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'response with tokens',
                tokenUsage: { total: 100, prompt: 60, completion: 40, numRequests: 1 },
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'response without tokens',
                // No tokenUsage provided
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'another response with tokens',
                tokenUsage: { total: 200, prompt: 120, completion: 80 }, // numRequests missing
                cached: false,
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            // Token usage should accumulate correctly even with missing data
            (0, globals_1.expect)(result.tokenUsage?.total).toBe(300); // 100 + 0 + 200
            (0, globals_1.expect)(result.tokenUsage?.prompt).toBe(180); // 60 + 0 + 120
            (0, globals_1.expect)(result.tokenUsage?.completion).toBe(120); // 40 + 0 + 80
            (0, globals_1.expect)(result.tokenUsage?.numRequests).toBe(3); // All calls counted
        });
        (0, globals_1.it)('should handle error responses without affecting token counts', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 2,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'successful response',
                tokenUsage: { total: 100, prompt: 60, completion: 40, numRequests: 1 },
                cached: false,
            })
                .mockRejectedValueOnce(new Error('Target provider failed'));
            const context = createMockContext(targetProvider);
            let result;
            try {
                result = await provider.callApi('test prompt', context);
            }
            catch (error) {
                // GOAT provider throws errors on target failures, unlike iterative which continues
                (0, globals_1.expect)(error).toBeDefined();
                return;
            }
            // If we get here, the provider handled the error gracefully
            (0, globals_1.expect)(result.tokenUsage?.total).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should handle zero token counts correctly', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 2,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'response with zero tokens',
                tokenUsage: { total: 0, prompt: 0, completion: 0, numRequests: 1 },
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'response with normal tokens',
                tokenUsage: { total: 100, prompt: 60, completion: 40, numRequests: 1 },
                cached: false,
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            // Should handle zero counts correctly: 0 + 100 = 100
            (0, globals_1.expect)(result.tokenUsage?.total).toBe(100);
            (0, globals_1.expect)(result.tokenUsage?.prompt).toBe(60);
            (0, globals_1.expect)(result.tokenUsage?.completion).toBe(40);
            (0, globals_1.expect)(result.tokenUsage?.numRequests).toBe(2);
        });
        (0, globals_1.it)('should accumulate token usage with unblocking responses', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 2,
            });
            const targetProvider = {
                id: () => 'test-provider',
                callApi: globals_1.jest.fn(),
            };
            // First call (normal attack), second call (next attack)
            targetProvider.callApi
                .mockResolvedValueOnce({
                output: 'first response',
                tokenUsage: { total: 50, prompt: 30, completion: 20, numRequests: 1 },
                cached: false,
            })
                .mockResolvedValueOnce({
                output: 'second response',
                tokenUsage: { total: 75, prompt: 45, completion: 30, numRequests: 1 },
                cached: false,
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            // Should accumulate tokens from all calls
            (0, globals_1.expect)(result.tokenUsage?.total).toBe(125); // 50 + 75
            (0, globals_1.expect)(result.tokenUsage?.prompt).toBe(75); // 30 + 45
            (0, globals_1.expect)(result.tokenUsage?.completion).toBe(50); // 20 + 30
            (0, globals_1.expect)(result.tokenUsage?.numRequests).toBe(2);
        });
    });
    (0, globals_1.describe)('sessionId handling', () => {
        (0, globals_1.it)('should include sessionId from context.vars in metadata', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider('response');
            const context = createMockContext(targetProvider, {
                goal: 'test goal',
                sessionId: 'test-session-123',
            });
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBe('test-session-123');
        });
        (0, globals_1.it)('should include sessionId from context vars when stateful is false', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider();
            const context = createMockContext(targetProvider, {
                goal: 'test goal',
                sessionId: 'context-session-id',
            });
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBe('context-session-id');
        });
        (0, globals_1.it)('should include sessionId from target response when stateful is true', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
                stateful: true,
            });
            const targetProvider = createMockTargetProvider('target response', {}, {
                sessionId: 'response-session-id',
            });
            const context = createMockContext(targetProvider);
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBe('response-session-id');
        });
        (0, globals_1.it)('should handle missing sessionId gracefully', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider('response');
            const context = createMockContext(targetProvider, { goal: 'test goal' });
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBeUndefined();
        });
        (0, globals_1.it)('should stringify non-string sessionId', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider('response');
            const context = createMockContext(targetProvider, {
                goal: 'test goal',
                sessionId: 123, // Non-string sessionId
            });
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBe('123');
        });
        (0, globals_1.it)('should include sessionId in metadata along with other metadata fields', async () => {
            const provider = new goat_1.default({
                injectVar: 'goal',
                maxTurns: 1,
            });
            const targetProvider = createMockTargetProvider('response');
            const testConfig = {
                vars: {},
                assert: [{ type: 'contains', value: 'harmful' }],
                metadata: { pluginId: 'contains' },
            };
            const context = createMockContext(targetProvider, { goal: 'test goal', sessionId: 'session-with-metadata' }, testConfig);
            const result = await provider.callApi('test prompt', context);
            (0, globals_1.expect)(result.metadata?.sessionId).toBe('session-with-metadata');
            (0, globals_1.expect)(result.metadata?.stopReason).toBeDefined();
            (0, globals_1.expect)(result.metadata?.messages).toBeDefined();
        });
    });
});
//# sourceMappingURL=goat.test.js.map