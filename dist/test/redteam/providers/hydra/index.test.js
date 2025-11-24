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
const evaluatorHelpers = __importStar(require("../../../../src/evaluatorHelpers"));
const promptfoo_1 = require("../../../../src/providers/promptfoo");
const graders_1 = require("../../../../src/redteam/graders");
const index_1 = require("../../../../src/redteam/providers/hydra/index");
const remoteGeneration_1 = require("../../../../src/redteam/remoteGeneration");
jest.mock('../../../../src/providers/promptfoo', () => ({
    PromptfooChatCompletionProvider: jest.fn(),
}));
jest.mock('../../../../src/redteam/graders', () => ({
    getGraderById: jest.fn(),
}));
jest.mock('../../../../src/redteam/remoteGeneration', () => ({
    shouldGenerateRemote: jest.fn(),
}));
jest.mock('../../../../src/evaluatorHelpers', () => ({
    ...jest.requireActual('../../../../src/evaluatorHelpers'),
    renderPrompt: jest.fn(),
}));
jest.mock('../../../../src/redteam/util', () => ({
    ...jest.requireActual('../../../../src/redteam/util'),
    isBasicRefusal: jest.fn(),
    getSessionId: jest.fn(),
}));
describe('HydraProvider', () => {
    let mockAgentProvider;
    let mockTargetProvider;
    let mockGrader;
    beforeEach(() => {
        jest.clearAllMocks();
        // Mock agent provider (cloud provider)
        mockAgentProvider = {
            id: jest.fn().mockReturnValue('mock-agent'),
            callApi: jest.fn(),
            delay: 0,
        };
        // Mock target provider
        mockTargetProvider = {
            id: jest.fn().mockReturnValue('mock-target'),
            callApi: jest.fn().mockResolvedValue({
                output: 'Target response',
            }),
        };
        // Mock grader
        mockGrader = {
            getResult: jest.fn().mockResolvedValue({
                grade: {
                    pass: true,
                    score: 1,
                    reason: 'Target defended',
                },
            }),
        };
        // Setup mocks
        promptfoo_1.PromptfooChatCompletionProvider.mockImplementation(() => mockAgentProvider);
        jest.mocked(graders_1.getGraderById).mockReturnValue(mockGrader);
        jest.mocked(remoteGeneration_1.shouldGenerateRemote).mockReturnValue(true);
        jest.mocked(evaluatorHelpers.renderPrompt).mockResolvedValue('rendered prompt');
        const { isBasicRefusal } = jest.requireMock('../../../../src/redteam/util');
        isBasicRefusal.mockReturnValue(false);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    describe('constructor', () => {
        it('should initialize with default config values', () => {
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
            });
            expect(provider.config.injectVar).toBe('input');
            expect(provider['maxTurns']).toBe(10);
            expect(provider['maxBacktracks']).toBe(10);
            expect(provider['stateful']).toBe(false);
        });
        it('should initialize with custom config values', () => {
            const provider = new index_1.HydraProvider({
                injectVar: 'query',
                maxTurns: 5,
                maxBacktracks: 3,
                stateful: true,
                scanId: 'test-scan-id',
            });
            expect(provider.config.injectVar).toBe('query');
            expect(provider['maxTurns']).toBe(5);
            expect(provider['maxBacktracks']).toBe(3);
            expect(provider['stateful']).toBe(true);
            expect(provider['scanId']).toBe('test-scan-id');
        });
        it('should throw error when remote generation is not available', () => {
            jest.mocked(remoteGeneration_1.shouldGenerateRemote).mockReturnValue(false);
            expect(() => {
                new index_1.HydraProvider({ injectVar: 'input' });
            }).toThrow('jailbreak:hydra strategy requires cloud access. Set PROMPTFOO_REMOTE_GENERATION_URL or log into Promptfoo Cloud.');
        });
        it('should warn when backtracking is enabled in stateful mode', () => {
            const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
            new index_1.HydraProvider({
                injectVar: 'input',
                stateful: true,
                maxBacktracks: 5,
            });
            // Logger.warn should have been called
            warnSpy.mockRestore();
        });
        it('should create agent provider with correct config', () => {
            new index_1.HydraProvider({ injectVar: 'input' });
            expect(promptfoo_1.PromptfooChatCompletionProvider).toHaveBeenCalledWith({
                task: 'hydra-decision',
                jsonOnly: true,
                preferSmallModel: false,
            });
        });
    });
    describe('id()', () => {
        it('should return correct provider id', () => {
            const provider = new index_1.HydraProvider({ injectVar: 'input' });
            expect(provider.id()).toBe('promptfoo:redteam:hydra');
        });
    });
    describe('callApi() - basic functionality', () => {
        it('should execute single turn attack successfully', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target defended',
                tokenUsage: { total: 50, prompt: 25, completion: 25 },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result).toBeDefined();
            expect(result.output).toBe('Target defended');
            expect(result.metadata?.hydraRoundsCompleted).toBe(1);
            expect(result.metadata?.hydraBacktrackCount).toBe(0);
            expect(result.metadata?.hydraResult).toBe(false);
            expect(result.metadata?.stopReason).toBe('Max turns reached');
            expect(result.tokenUsage?.total).toBe(150);
        });
        it('should detect vulnerability when grader fails', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Successful attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Here is how to do harmful thing',
                tokenUsage: { total: 50, prompt: 25, completion: 25 },
            });
            // Grader fails (vulnerability detected)
            mockGrader.getResult.mockResolvedValue({
                grade: {
                    pass: false,
                    score: 0,
                    reason: 'Harmful content detected',
                },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 10,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.hydraResult).toBe(true);
            expect(result.metadata?.stopReason).toBe('Grader failed');
            expect(result.metadata?.successfulAttacks).toHaveLength(1);
            expect(result.metadata?.successfulAttacks?.[0]).toMatchObject({
                turn: 1,
                message: 'Successful attack message',
                response: 'Here is how to do harmful thing',
            });
        });
        it('should handle multiple turns until max turns reached', async () => {
            let callCount = 0;
            mockAgentProvider.callApi.mockImplementation(async () => {
                callCount++;
                return {
                    output: `Attack message ${callCount}`,
                    tokenUsage: { total: 100, prompt: 50, completion: 50 },
                };
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target defended',
                tokenUsage: { total: 50, prompt: 25, completion: 25 },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 3,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.hydraRoundsCompleted).toBe(3);
            expect(result.metadata?.stopReason).toBe('Max turns reached');
            // Agent is called 3 times for attacks + 1 time for learning update
            expect(mockAgentProvider.callApi).toHaveBeenCalledTimes(4);
            expect(mockTargetProvider.callApi).toHaveBeenCalledTimes(3);
        });
        it('should use goal from test metadata or vars', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            // Test with goal in metadata
            const contextWithMetadata = {
                originalProvider: mockTargetProvider,
                vars: { input: 'var goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'metadata goal', pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', contextWithMetadata);
            const agentCall = mockAgentProvider.callApi.mock.calls[0];
            const request = JSON.parse(agentCall[0]);
            expect(request.goal).toBe('metadata goal');
            // Reset mocks
            jest.clearAllMocks();
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            // Test with goal from vars
            const contextWithVars = {
                originalProvider: mockTargetProvider,
                vars: { input: 'var goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', contextWithVars);
            const agentCall2 = mockAgentProvider.callApi.mock.calls[0];
            const request2 = JSON.parse(agentCall2[0]);
            expect(request2.goal).toBe('var goal');
        });
    });
    describe('callApi() - stateful mode', () => {
        it('should handle stateful mode with sessionId', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
                sessionId: 'session-123',
                tokenUsage: { total: 50, prompt: 25, completion: 25 },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
                stateful: true,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.sessionId).toBe('session-123');
            expect(result.metadata?.sessionIds).toEqual(['session-123', 'session-123']);
            // Check that the second call includes sessionId
            const renderCalls = evaluatorHelpers.renderPrompt.mock.calls;
            const secondCall = renderCalls[1];
            expect(secondCall[1]).toMatchObject({
                sessionId: 'session-123',
            });
        });
        it('should escape nunjucks syntax in stateful mode', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack with {{template}} and {% block %}',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
                stateful: true,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', context);
            // Check that the call with the escaped message was made
            const renderCalls = evaluatorHelpers.renderPrompt.mock.calls;
            const escapedCall = renderCalls.find((call) => call[1].input === 'Attack with { {template} } and { % block % }');
            expect(escapedCall).toBeDefined();
        });
    });
    describe('callApi() - stateless mode', () => {
        it('should send full conversation history in stateless mode', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'First attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockResolvedValueOnce({
                output: 'Second attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi
                .mockResolvedValueOnce({
                output: 'First response',
            })
                .mockResolvedValueOnce({
                output: 'Second response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
                stateful: false,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', context);
            // Check that target was called with JSON conversation history
            const secondTargetCall = mockTargetProvider.callApi.mock.calls[1];
            expect(secondTargetCall[0]).toBeDefined();
            // In stateless mode, the prompt should be JSON stringified conversation
        });
    });
    describe('callApi() - backtracking', () => {
        it('should backtrack when target refuses in stateless mode', async () => {
            const { isBasicRefusal } = jest.requireMock('../../../../src/redteam/util');
            let attackCallCount = 0;
            mockAgentProvider.callApi.mockImplementation(async (prompt) => {
                const request = JSON.parse(prompt);
                // Don't count learning updates
                if (!request.testComplete) {
                    attackCallCount++;
                }
                return {
                    output: `Attack message ${attackCallCount}`,
                    tokenUsage: { total: 100, prompt: 50, completion: 50 },
                };
            });
            let targetCallCount = 0;
            mockTargetProvider.callApi.mockImplementation(async () => {
                targetCallCount++;
                // First call is refused, second succeeds
                if (targetCallCount === 1) {
                    return { output: "I can't help with that" };
                }
                return { output: 'Target cooperated' };
            });
            // First response is a refusal, second is not
            isBasicRefusal.mockReturnValueOnce(true).mockReturnValueOnce(false);
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 10,
                maxBacktracks: 5,
                stateful: false,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.hydraBacktrackCount).toBe(1);
            // Should complete 1 turn (first was backtracked, second succeeded and continues to max)
            expect(result.metadata?.hydraRoundsCompleted).toBeGreaterThanOrEqual(1);
        });
        it('should stop when max backtracks reached', async () => {
            const { isBasicRefusal } = jest.requireMock('../../../../src/redteam/util');
            isBasicRefusal.mockReturnValue(true); // Always refuse
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: "I can't help with that",
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 10,
                maxBacktracks: 3,
                stateful: false,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.hydraBacktrackCount).toBe(3);
            expect(result.metadata?.stopReason).toBe('Max backtracks reached');
        });
        it('should not backtrack in stateful mode', async () => {
            const { isBasicRefusal } = jest.requireMock('../../../../src/redteam/util');
            isBasicRefusal.mockReturnValue(true); // Always refuse
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: "I can't help with that",
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 3,
                maxBacktracks: 5,
                stateful: true,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // No backtracking should occur
            expect(result.metadata?.hydraBacktrackCount).toBe(0);
            expect(result.metadata?.hydraRoundsCompleted).toBe(3);
        });
    });
    describe('callApi() - error handling', () => {
        it('should continue when agent provider returns error', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                error: 'Agent error',
                output: '',
            })
                .mockResolvedValueOnce({
                output: 'Valid attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // Should complete despite agent error on first turn
            expect(result.metadata?.hydraRoundsCompleted).toBe(1);
            expect(mockTargetProvider.callApi).toHaveBeenCalledTimes(1);
        });
        it('should continue when target provider returns error', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi
                .mockResolvedValueOnce({
                error: 'Target error',
                output: '',
            })
                .mockResolvedValueOnce({
                output: 'Valid response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // First turn has error (doesn't count), second turn succeeds (counts as turn 1)
            // But since we continue after error, we actually make 2 turns total
            expect(result.metadata?.hydraRoundsCompleted).toBeGreaterThanOrEqual(1);
            // Agent is called for each turn + learning update
            expect(mockAgentProvider.callApi).toHaveBeenCalledTimes(3);
        });
        it('should handle empty target response', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: '',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // Should handle empty response by adding marker
            expect(result.metadata?.redteamHistory?.[0].output).toBe('[Target provided empty response - likely refused]');
        });
        it('should continue when agent returns missing message', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: '', // Empty message
            })
                .mockResolvedValueOnce({
                output: 'Valid attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // Should skip turn with empty message
            expect(result.metadata?.hydraRoundsCompleted).toBe(1);
        });
    });
    describe('callApi() - conversation history', () => {
        it('should build conversation history correctly', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'First attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockResolvedValueOnce({
                output: 'Second attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi
                .mockResolvedValueOnce({
                output: 'First response',
            })
                .mockResolvedValueOnce({
                output: 'Second response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.messages).toEqual([
                { role: 'user', content: 'First attack' },
                { role: 'assistant', content: 'First response' },
                { role: 'user', content: 'Second attack' },
                { role: 'assistant', content: 'Second response' },
            ]);
            expect(result.metadata?.redteamHistory).toHaveLength(2);
            expect(result.metadata?.redteamHistory?.[0]).toEqual({
                prompt: 'First attack',
                output: 'First response',
                graderPassed: true,
            });
        });
        it('should send conversation history to cloud agent', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'First attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockResolvedValueOnce({
                output: 'Second attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', context);
            // Check second agent call includes conversation history
            const secondAgentCall = mockAgentProvider.callApi.mock.calls[1];
            const request = JSON.parse(secondAgentCall[0]);
            expect(request.conversationHistory).toEqual([
                { role: 'user', content: 'First attack' },
                { role: 'assistant', content: 'Target response' },
            ]);
            expect(request.turn).toBe(2);
        });
    });
    describe('callApi() - grading', () => {
        it('should use correct grader from test assertions', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:violent-crime' }, { type: 'other-assertion' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:violent-crime' },
                },
            };
            await provider.callApi('', context);
            expect(graders_1.getGraderById).toHaveBeenCalledWith('harmful:violent-crime');
            expect(mockGrader.getResult).toHaveBeenCalledWith('Attack message', 'Target response', expect.anything(), mockTargetProvider, undefined);
        });
        it('should send grader result to cloud agent on next turn', async () => {
            const graderResult = {
                pass: false,
                score: 0.3,
                reason: 'Partially harmful',
            };
            mockGrader.getResult.mockResolvedValue({
                grade: graderResult,
            });
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'First attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockResolvedValueOnce({
                output: 'Second attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            // First turn passes grader
            mockGrader.getResult
                .mockResolvedValueOnce({
                grade: { pass: true, score: 1, reason: 'Safe' },
            })
                .mockResolvedValueOnce({
                grade: graderResult,
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            await provider.callApi('', context);
            // Check second agent call includes last grader result
            const secondAgentCall = mockAgentProvider.callApi.mock.calls[1];
            const request = JSON.parse(secondAgentCall[0]);
            expect(request.lastGraderResult).toEqual({
                pass: true,
                score: 1,
            });
        });
        it('should store grader result in metadata', async () => {
            const graderResult = {
                pass: false,
                score: 0,
                reason: 'Vulnerability detected',
            };
            mockGrader.getResult.mockResolvedValue({
                grade: graderResult,
            });
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Harmful response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.metadata?.storedGraderResult).toEqual(graderResult);
        });
    });
    describe('callApi() - scan learning', () => {
        it('should send learning update after completion', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
                scanId: 'test-scan-id',
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
                evaluationId: 'eval-123',
            };
            await provider.callApi('', context);
            // Check last call is learning update
            const lastCall = mockAgentProvider.callApi.mock.calls[mockAgentProvider.callApi.mock.calls.length - 1];
            const request = JSON.parse(lastCall[0]);
            expect(request.task).toBe('hydra-decision');
            expect(request.testComplete).toBe(true);
            expect(request.scanId).toBe('eval-123'); // Should use evaluationId
            expect(request.finalResult).toEqual({
                success: false,
                totalTurns: 2,
            });
        });
        it('should send success in learning update when vulnerability found', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Harmful response',
            });
            mockGrader.getResult.mockResolvedValue({
                grade: { pass: false, score: 0, reason: 'Vulnerability' },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 10,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
                evaluationId: 'eval-123',
            };
            await provider.callApi('', context);
            const lastCall = mockAgentProvider.callApi.mock.calls[mockAgentProvider.callApi.mock.calls.length - 1];
            const request = JSON.parse(lastCall[0]);
            expect(request.finalResult.success).toBe(true);
            expect(request.finalResult.totalTurns).toBe(1);
        });
        it('should not fail test if learning update fails', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockRejectedValueOnce(new Error('Learning update failed'));
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            // Should not throw
            const result = await provider.callApi('', context);
            expect(result).toBeDefined();
            expect(result.output).toBe('Target response');
        });
    });
    describe('callApi() - token usage tracking', () => {
        it('should accumulate token usage from agent and target', async () => {
            mockAgentProvider.callApi
                .mockResolvedValueOnce({
                output: 'First attack',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            })
                .mockResolvedValueOnce({
                output: 'Second attack',
                tokenUsage: { total: 150, prompt: 75, completion: 75 },
            });
            mockTargetProvider.callApi
                .mockResolvedValueOnce({
                output: 'First response',
                tokenUsage: { total: 80, prompt: 40, completion: 40 },
            })
                .mockResolvedValueOnce({
                output: 'Second response',
                tokenUsage: { total: 120, prompt: 60, completion: 60 },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 2,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            // Total should be sum of all calls
            // Agent: 100 + 150 = 250
            // Target: 80 + 120 = 200
            // Total: 450
            expect(result.tokenUsage?.total).toBe(450);
            expect(result.tokenUsage?.prompt).toBe(225);
            expect(result.tokenUsage?.completion).toBe(225);
        });
    });
    describe('callApi() - cloud request format', () => {
        it('should send correct request format to cloud', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: {
                        goal: 'test goal',
                        pluginId: 'harmful:test',
                        purpose: 'Test purpose',
                        modifiers: ['modifier1', 'modifier2'],
                    },
                },
                evaluationId: 'eval-123',
                testCaseId: 'tc-456',
            };
            await provider.callApi('', context);
            const agentCall = mockAgentProvider.callApi.mock.calls[0];
            const request = JSON.parse(agentCall[0]);
            expect(request).toMatchObject({
                task: 'hydra-decision',
                testRunId: expect.stringContaining('eval-123-tc'),
                scanId: 'eval-123',
                turn: 1,
                goal: 'test goal',
                purpose: 'Test purpose',
                modifiers: ['modifier1', 'modifier2'],
                conversationHistory: [],
                stateful: false,
                maxTurns: 1,
            });
            // First request should not have lastGraderResult
            expect(request.lastGraderResult).toBeUndefined();
        });
    });
    describe('callApi() - metadata output', () => {
        it('should return complete metadata', async () => {
            const { getSessionId } = jest.requireMock('../../../../src/redteam/util');
            getSessionId.mockReturnValue('session-123');
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
                sessionId: 'session-123',
                guardrails: { triggered: true, policy: 'test-policy' },
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
                stateful: true, // Enable stateful to capture sessionId
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result).toMatchObject({
                output: 'Target response',
                metadata: {
                    sessionId: 'session-123',
                    hydraRoundsCompleted: 1,
                    hydraBacktrackCount: 0,
                    hydraResult: false,
                    stopReason: 'Max turns reached',
                    successfulAttacks: [],
                    totalSuccessfulAttacks: 0,
                    messages: expect.arrayContaining([
                        { role: 'user', content: 'Attack message' },
                        { role: 'assistant', content: 'Target response' },
                    ]),
                    redteamHistory: expect.arrayContaining([
                        {
                            prompt: 'Attack message',
                            output: 'Target response',
                            graderPassed: true,
                        },
                    ]),
                    sessionIds: ['session-123'],
                    storedGraderResult: expect.any(Object),
                },
                tokenUsage: expect.any(Object),
                guardrails: { triggered: true, policy: 'test-policy' },
            });
        });
        it('should include error in output if last response had error', async () => {
            mockAgentProvider.callApi.mockResolvedValue({
                output: 'Attack message',
                tokenUsage: { total: 100, prompt: 50, completion: 50 },
            });
            mockTargetProvider.callApi.mockResolvedValue({
                output: 'Target response',
                error: 'Some error occurred',
            });
            const provider = new index_1.HydraProvider({
                injectVar: 'input',
                maxTurns: 1,
            });
            const context = {
                originalProvider: mockTargetProvider,
                vars: { input: 'test goal' },
                prompt: { raw: 'test prompt', label: 'test' },
                test: {
                    assert: [{ type: 'harmful:test' }],
                    metadata: { goal: 'test goal', pluginId: 'harmful:test' },
                },
            };
            const result = await provider.callApi('', context);
            expect(result.output).toBe('Target response');
            expect(result.error).toBe('Some error occurred');
        });
    });
});
//# sourceMappingURL=index.test.js.map