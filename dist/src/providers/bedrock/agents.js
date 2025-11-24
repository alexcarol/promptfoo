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
exports.AwsBedrockAgentsProvider = void 0;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const index_1 = require("./index");
/**
 * AWS Bedrock Agents provider for invoking deployed AI agents.
 * Supports all Bedrock Agents features including memory, knowledge bases, action groups,
 * guardrails, and session management.
 *
 * @example Basic usage
 * ```yaml
 * providers:
 *   - bedrock-agent:AGENT_ID
 *     config:
 *       agentAliasId: PROD_ALIAS
 *       region: us-east-1
 * ```
 *
 * @example With memory and session
 * ```yaml
 * providers:
 *   - bedrock-agent:AGENT_ID
 *     config:
 *       agentAliasId: PROD_ALIAS
 *       sessionId: user-session-123
 *       memoryId: LONG_TERM_MEMORY
 *       enableTrace: true
 * ```
 *
 * @example With guardrails and inference config
 * ```yaml
 * providers:
 *   - bedrock-agent:AGENT_ID
 *     config:
 *       agentAliasId: PROD_ALIAS
 *       guardrailConfiguration:
 *         guardrailId: GUARDRAIL_ID
 *         guardrailVersion: "1"
 *       temperature: 0.7  # Can be specified at root level for convenience
 *         topP: 0.9
 *         maximumLength: 2048
 * ```
 */
class AwsBedrockAgentsProvider extends index_1.AwsBedrockGenericProvider {
    constructor(agentId, options = {}) {
        super(agentId, options);
        // Validate required fields
        if (!agentId && !options.config?.agentId) {
            throw new Error('Agent ID is required. Provide it in the provider path (bedrock-agent:AGENT_ID) or config.');
        }
        // Note: agentAliasId is validated in callApi to allow partial construction for testing
        this.config = {
            ...options.config,
            agentId: options.config?.agentId || agentId,
        };
        // Record telemetry
        telemetry_1.default.record('feature_used', {
            feature: 'bedrock-agents',
            provider: 'bedrock',
        });
    }
    id() {
        return `bedrock-agent:${this.config.agentId}`;
    }
    toString() {
        return `[AWS Bedrock Agents Provider ${this.config.agentId}]`;
    }
    /**
     * Get or create the Bedrock Agent Runtime client
     */
    async getAgentRuntimeClient() {
        if (!this.agentRuntimeClient) {
            let handler;
            // Configure proxy if needed
            if ((0, envars_1.getEnvString)('HTTP_PROXY') || (0, envars_1.getEnvString)('HTTPS_PROXY')) {
                try {
                    const { NodeHttpHandler } = await Promise.resolve().then(() => __importStar(require('@smithy/node-http-handler')));
                    const { ProxyAgent } = await Promise.resolve().then(() => __importStar(require('proxy-agent')));
                    handler = new NodeHttpHandler({
                        httpsAgent: new ProxyAgent(),
                    });
                }
                catch {
                    throw new Error('The @smithy/node-http-handler package is required for proxy support. Please install it.');
                }
            }
            try {
                const { BedrockAgentRuntimeClient } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-bedrock-agent-runtime')));
                const credentials = await this.getCredentials();
                this.agentRuntimeClient = new BedrockAgentRuntimeClient({
                    region: this.getRegion(),
                    maxAttempts: (0, envars_1.getEnvInt)('AWS_BEDROCK_MAX_RETRIES', 10),
                    retryMode: 'adaptive',
                    ...(credentials ? { credentials } : {}),
                    ...(handler ? { requestHandler: handler } : {}),
                });
            }
            catch (err) {
                logger_1.default.error(`Error creating BedrockAgentRuntimeClient: ${err}`);
                throw new Error('The @aws-sdk/client-bedrock-agent-runtime package is required. Please install it: npm install @aws-sdk/client-bedrock-agent-runtime');
            }
        }
        return this.agentRuntimeClient;
    }
    /**
     * Build the session state from configuration
     */
    buildSessionState() {
        if (!this.config.sessionState) {
            return undefined;
        }
        // Build session state according to AWS SDK types
        // Note: Using partial typing due to AWS SDK type constraints
        const sessionState = {
            sessionAttributes: this.config.sessionState.sessionAttributes,
            promptSessionAttributes: this.config.sessionState.promptSessionAttributes,
            invocationId: this.config.sessionState.invocationId,
        };
        // Handle returnControlInvocationResults if present
        if (this.config.sessionState.returnControlInvocationResults) {
            sessionState.returnControlInvocationResults =
                this.config.sessionState.returnControlInvocationResults;
        }
        return sessionState;
    }
    /**
     * Build inference configuration from both root-level and nested parameters
     * Root-level parameters take precedence over nested ones for convenience
     */
    buildInferenceConfig() {
        // Check if we have any inference config at root level or nested
        const hasRootConfig = this.config.temperature !== undefined ||
            this.config.topP !== undefined ||
            this.config.topK !== undefined ||
            this.config.maximumLength !== undefined ||
            this.config.stopSequences !== undefined;
        const hasNestedConfig = this.config.inferenceConfig !== undefined;
        if (!hasRootConfig && !hasNestedConfig) {
            return undefined;
        }
        // Build inference config according to AWS SDK types
        // Note: Using partial typing due to AWS SDK type constraints
        const inferenceConfig = {};
        // Start with nested config as base
        if (this.config.inferenceConfig) {
            if (this.config.inferenceConfig.maximumLength !== undefined) {
                inferenceConfig.maximumLength = this.config.inferenceConfig.maximumLength;
            }
            if (this.config.inferenceConfig.stopSequences !== undefined) {
                inferenceConfig.stopSequences = this.config.inferenceConfig.stopSequences;
            }
            if (this.config.inferenceConfig.temperature !== undefined) {
                inferenceConfig.temperature = this.config.inferenceConfig.temperature;
            }
            if (this.config.inferenceConfig.topP !== undefined) {
                inferenceConfig.topP = this.config.inferenceConfig.topP;
            }
            if (this.config.inferenceConfig.topK !== undefined) {
                inferenceConfig.topK = this.config.inferenceConfig.topK;
            }
        }
        // Override with root-level parameters (these take precedence for convenience)
        if (this.config.temperature !== undefined) {
            inferenceConfig.temperature = this.config.temperature;
        }
        if (this.config.topP !== undefined) {
            inferenceConfig.topP = this.config.topP;
        }
        if (this.config.topK !== undefined) {
            inferenceConfig.topK = this.config.topK;
        }
        if (this.config.maximumLength !== undefined) {
            inferenceConfig.maximumLength = this.config.maximumLength;
        }
        if (this.config.stopSequences !== undefined) {
            inferenceConfig.stopSequences = this.config.stopSequences;
        }
        return inferenceConfig;
    }
    /**
     * Process the streaming response from the agent
     */
    async processResponse(response) {
        let output = '';
        const traces = [];
        if (response.completion) {
            const decoder = new TextDecoder();
            try {
                for await (const event of response.completion) {
                    // Process text chunks
                    if (event.chunk?.bytes) {
                        output += decoder.decode(event.chunk.bytes, { stream: true });
                    }
                    // Collect trace information if enabled
                    if (this.config.enableTrace && event.trace) {
                        traces.push(event.trace);
                    }
                }
                // Final decode to flush any remaining bytes
                output += decoder.decode();
            }
            catch (error) {
                logger_1.default.error(`Error processing agent response stream: ${error}`);
                throw error;
            }
        }
        return {
            output,
            trace: traces.length > 0 ? traces : undefined,
            sessionId: response.sessionId,
        };
    }
    /**
     * Invoke the agent with the given prompt
     */
    async callApi(prompt) {
        // Validate agentAliasId is present
        if (!this.config.agentAliasId) {
            return {
                error: 'Agent Alias ID is required. Set agentAliasId in the provider config.',
            };
        }
        const client = await this.getAgentRuntimeClient();
        // Generate session ID if not provided
        const sessionId = this.config.sessionId ||
            (typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? `session-${crypto.randomUUID()}`
                : `session-${Date.now()}-${process.hrtime.bigint().toString(36)}`);
        // Build the complete input with all supported features
        const input = {
            // Required fields
            agentId: this.config.agentId,
            agentAliasId: this.config.agentAliasId,
            sessionId,
            inputText: prompt,
            // Optional features
            enableTrace: this.config.enableTrace,
            endSession: this.config.endSession,
            sessionState: this.buildSessionState(),
            memoryId: this.config.memoryId,
            // Advanced configurations - using type assertions for preview features
            // The AWS SDK types may not be fully up to date with all Bedrock Agents features
            // These configurations are validated by AWS at runtime
            ...(this.buildInferenceConfig() && {
                inferenceConfig: this.buildInferenceConfig(),
            }),
            ...(this.config.guardrailConfiguration && {
                guardrailConfiguration: this.config.guardrailConfiguration,
            }),
            ...(this.config.promptOverrideConfiguration && {
                promptOverrideConfiguration: this.config.promptOverrideConfiguration,
            }),
            ...(this.config.knowledgeBaseConfigurations && {
                knowledgeBaseConfigurations: this.config.knowledgeBaseConfigurations,
            }),
            ...(this.config.actionGroups && {
                actionGroups: this.config.actionGroups,
            }),
            ...(this.config.inputDataConfig && {
                inputDataConfig: this.config.inputDataConfig,
            }),
        };
        logger_1.default.debug(`Invoking Bedrock agent ${this.config.agentId} with session ${sessionId}`);
        // Cache key based on agent ID and prompt (excluding volatile fields)
        const cache = await (0, cache_1.getCache)();
        const cacheKey = `bedrock-agent:${this.config.agentId}:${JSON.stringify({
            prompt,
            inferenceConfig: this.buildInferenceConfig(),
            knowledgeBaseConfigurations: this.config.knowledgeBaseConfigurations,
        })}`;
        // Check cache
        if ((0, cache_1.isCacheEnabled)()) {
            const cached = await cache.get(cacheKey);
            if (cached) {
                logger_1.default.debug('Returning cached Bedrock Agents response');
                try {
                    const parsed = JSON.parse(cached);
                    // Validate the parsed cache data has expected structure
                    if (parsed && typeof parsed === 'object') {
                        return {
                            ...parsed,
                            cached: true,
                        };
                    }
                }
                catch {
                    logger_1.default.warn('Failed to parse cached Bedrock Agents response, ignoring cache');
                }
            }
        }
        try {
            // Invoke the agent
            const { InvokeAgentCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-bedrock-agent-runtime')));
            const response = await client.send(new InvokeAgentCommand(input));
            // Process the streaming response
            const { output, trace, sessionId: responseSessionId } = await this.processResponse(response);
            // Build the result
            const result = {
                output,
                metadata: {
                    ...(responseSessionId && { sessionId: responseSessionId }),
                    ...(trace && { trace }),
                    ...(this.config.memoryId && { memoryId: this.config.memoryId }),
                    ...(this.config.guardrailConfiguration && {
                        guardrails: {
                            applied: true,
                            guardrailId: this.config.guardrailConfiguration.guardrailId,
                            guardrailVersion: this.config.guardrailConfiguration.guardrailVersion,
                        },
                    }),
                },
            };
            // Cache the successful response
            if ((0, cache_1.isCacheEnabled)()) {
                try {
                    await cache.set(cacheKey, JSON.stringify(result));
                }
                catch (err) {
                    logger_1.default.error(`Failed to cache response: ${err}`);
                }
            }
            return result;
        }
        catch (error) {
            logger_1.default.error(`Bedrock Agents invocation failed: ${error}`);
            // Provide helpful error messages
            if (error.name === 'ResourceNotFoundException') {
                return {
                    error: `Agent or alias not found. Verify agentId: ${this.config.agentId} and agentAliasId: ${this.config.agentAliasId}`,
                };
            }
            else if (error.name === 'AccessDeniedException') {
                return {
                    error: 'Access denied. Check IAM permissions for bedrock:InvokeAgent',
                };
            }
            else if (error.name === 'ValidationException') {
                return {
                    error: `Invalid configuration: ${error.message}`,
                };
            }
            else if (error.name === 'ThrottlingException') {
                return {
                    error: 'Rate limit exceeded. Please retry later.',
                };
            }
            return {
                error: `Failed to invoke agent: ${error.message || String(error)}`,
            };
        }
    }
}
exports.AwsBedrockAgentsProvider = AwsBedrockAgentsProvider;
//# sourceMappingURL=agents.js.map