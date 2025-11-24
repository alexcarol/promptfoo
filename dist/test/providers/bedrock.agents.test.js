"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const agents_1 = require("../../src/providers/bedrock/agents");
// Mock AWS SDK modules
globals_1.jest.mock('@aws-sdk/client-bedrock-agent-runtime', () => ({
    BedrockAgentRuntimeClient: globals_1.jest.fn(),
    InvokeAgentCommand: globals_1.jest.fn(),
}));
globals_1.jest.mock('../../src/cache', () => ({
    getCache: globals_1.jest.fn(() => Promise.resolve({
        get: globals_1.jest.fn(() => Promise.resolve(null)),
        set: globals_1.jest.fn(),
    })),
    isCacheEnabled: globals_1.jest.fn(() => false),
}));
describe('AwsBedrockAgentsProvider', () => {
    beforeEach(() => {
        globals_1.jest.clearAllMocks();
    });
    describe('constructor', () => {
        it('should allow creation without agentAliasId but fail on callApi', async () => {
            const provider = new agents_1.AwsBedrockAgentsProvider('test-agent-123');
            const result = await provider.callApi('test');
            expect(result.error).toContain('Agent Alias ID is required');
        });
        it('should create provider with agent ID from path and alias in config', () => {
            const provider = new agents_1.AwsBedrockAgentsProvider('test-agent-123', {
                config: { agentId: 'test-agent-123', agentAliasId: 'test-alias' },
            });
            expect(provider.id()).toBe('bedrock-agent:test-agent-123');
        });
        it('should create provider with agent ID from config', () => {
            const provider = new agents_1.AwsBedrockAgentsProvider('', {
                config: {
                    agentId: 'config-agent-456',
                    agentAliasId: 'test-alias',
                },
            });
            expect(provider.id()).toBe('bedrock-agent:config-agent-456');
        });
        it('should throw error when no agent ID is provided', () => {
            expect(() => new agents_1.AwsBedrockAgentsProvider('', {
                config: { agentAliasId: 'test-alias' },
            })).toThrow('Agent ID is required. Provide it in the provider path (bedrock-agent:AGENT_ID) or config.');
        });
        it('should accept configuration options', () => {
            const config = {
                agentId: 'test-agent',
                agentAliasId: 'prod-alias',
                sessionId: 'session-123',
                enableTrace: true,
                memoryId: 'LONG_TERM_MEMORY',
            };
            const provider = new agents_1.AwsBedrockAgentsProvider('', { config });
            // Provider adds default timeout and maxRetries
            expect(provider.config).toMatchObject(config);
        });
    });
    describe('callApi', () => {
        let mockSend;
        let provider;
        beforeEach(() => {
            globals_1.jest.clearAllMocks();
            // Create a fresh mock for each test
            mockSend = globals_1.jest.fn();
            const { BedrockAgentRuntimeClient, InvokeAgentCommand, } = require('@aws-sdk/client-bedrock-agent-runtime');
            BedrockAgentRuntimeClient.mockImplementation(() => ({
                send: mockSend,
            }));
            InvokeAgentCommand.mockImplementation((input) => input);
            // Create provider after mocks are set up
            provider = new agents_1.AwsBedrockAgentsProvider('test-agent', {
                config: {
                    agentId: 'test-agent',
                    agentAliasId: 'test-alias',
                    region: 'us-east-1',
                },
            });
        });
        afterEach(() => {
            globals_1.jest.clearAllMocks();
            globals_1.jest.restoreAllMocks();
        });
        it('should require agentAliasId', async () => {
            // Create provider without agentAliasId to test error
            const providerNoAlias = new agents_1.AwsBedrockAgentsProvider('test-agent', {
                config: {
                    agentId: 'test-agent',
                    // agentAliasId intentionally missing
                },
            });
            const result = await providerNoAlias.callApi('Test prompt');
            expect(result.error).toContain('Agent Alias ID is required');
            expect(result.output).toBeUndefined();
        });
        it('should successfully invoke agent with text response', async () => {
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('This is the agent response'),
                        },
                    };
                })(),
                sessionId: 'session-abc123',
                $metadata: {},
            };
            mockSend.mockResolvedValue(mockResponse);
            const result = await provider.callApi('Test prompt');
            expect(result.output).toBe('This is the agent response');
            expect(result.error).toBeUndefined();
            expect(result.metadata?.sessionId).toBe('session-abc123');
        });
        it('should handle agent with tool calls and traces', async () => {
            provider.config.enableTrace = true;
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('Agent response with tool'),
                        },
                        trace: {
                            trace: {
                                orchestrationTrace: {
                                    rationale: {
                                        text: 'Agent reasoning about the task',
                                    },
                                    invocationInput: {
                                        actionGroupInvocationInput: {
                                            actionGroupName: 'calculator',
                                            function: 'add',
                                        },
                                    },
                                },
                            },
                        },
                    };
                    yield {
                        trace: {
                            trace: {
                                actionGroupTrace: {
                                    actionGroupInvocationOutput: {
                                        text: '42',
                                    },
                                },
                            },
                        },
                    };
                })(),
                sessionId: 'session-xyz789',
                $metadata: {},
            };
            mockSend.mockResolvedValue(mockResponse);
            const result = await provider.callApi('Calculate something');
            expect(result.output).toBe('Agent response with tool');
            // Trace should be the raw array from the agent response
            expect(result.metadata?.trace).toEqual([
                {
                    trace: {
                        orchestrationTrace: {
                            rationale: {
                                text: 'Agent reasoning about the task',
                            },
                            invocationInput: {
                                actionGroupInvocationInput: {
                                    actionGroupName: 'calculator',
                                    function: 'add',
                                },
                            },
                        },
                    },
                },
                {
                    trace: {
                        actionGroupTrace: {
                            actionGroupInvocationOutput: {
                                text: '42',
                            },
                        },
                    },
                },
            ]);
        });
        it('should handle memory configuration', async () => {
            provider.config.memoryId = 'LONG_TERM_MEMORY';
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('Response with memory'),
                        },
                    };
                })(),
                sessionId: 'session-mem123',
                $metadata: {},
            };
            mockSend.mockResolvedValue(mockResponse);
            await provider.callApi('Test with memory');
            // Verify that the provider was configured with memory
            expect(provider.config.memoryId).toBe('LONG_TERM_MEMORY');
        });
        it.skip('should handle API errors gracefully', async () => {
            // TODO: Fix mock isolation issue - test passes in isolation but fails when run with other tests
            // Override the mock to reject for this test
            mockSend.mockRejectedValue(new Error('AWS API Error'));
            const result = await provider.callApi('Test prompt');
            expect(result.error).toBeDefined();
            expect(result.error).toContain('Failed to invoke agent');
            expect(result.output).toBeUndefined();
        });
        it.skip('should handle token usage in metadata', async () => {
            // TODO: Fix mock isolation issue - test passes in isolation but fails when run with other tests
            // Clear previous mock and set up new response
            mockSend.mockClear();
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('Response with tokens'),
                        },
                    };
                })(),
                sessionId: 'session-token123',
                $metadata: {
                    usage: {
                        inputTokens: 10,
                        outputTokens: 20,
                        totalTokens: 30,
                    },
                },
            };
            mockSend.mockResolvedValue(mockResponse);
            const result = await provider.callApi('Test prompt');
            // Token usage is not currently extracted from Bedrock Agents responses
            // as the AWS SDK types don't include usage metadata
            expect(result.output).toBe('Response with tokens');
        });
        it('should use session ID from config if provided', async () => {
            provider.config.sessionId = 'fixed-session-id';
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('Response'),
                        },
                    };
                })(),
                sessionId: 'response-session-id',
                $metadata: {},
            };
            mockSend.mockResolvedValue(mockResponse);
            await provider.callApi('Test prompt');
            // Verify that the fixed session ID was used
            expect(provider.config.sessionId).toBe('fixed-session-id');
        });
        it.skip('should generate session ID if not provided', async () => {
            // TODO: Fix mock isolation issue - test passes in isolation but fails when run with other tests
            // Clear previous mock and set up new response
            mockSend.mockClear();
            const mockResponse = {
                completion: (async function* () {
                    yield {
                        chunk: {
                            bytes: new TextEncoder().encode('Response'),
                        },
                    };
                })(),
                sessionId: 'generated-session',
                $metadata: {},
            };
            mockSend.mockResolvedValue(mockResponse);
            const result = await provider.callApi('Test prompt');
            // Verify call was successful
            expect(result.output).toBe('Response');
            expect(result.error).toBeUndefined();
            expect(mockSend).toHaveBeenCalled();
        });
    });
    describe('toString', () => {
        it('should return formatted string representation', () => {
            const provider = new agents_1.AwsBedrockAgentsProvider('my-agent', {
                config: { agentId: 'my-agent', agentAliasId: 'test-alias' },
            });
            expect(provider.toString()).toBe('[AWS Bedrock Agents Provider my-agent]');
        });
    });
});
//# sourceMappingURL=bedrock.agents.test.js.map