import { AwsBedrockGenericProvider } from './index';
import type { BedrockAgentRuntimeClient } from '@aws-sdk/client-bedrock-agent-runtime';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider, ProviderResponse } from '../../types/providers';
/**
 * Configuration options for AWS Bedrock Agents provider
 * @see https://docs.aws.amazon.com/bedrock/latest/userguide/agents.html
 */
interface BedrockAgentsOptions {
    accessKeyId?: string;
    secretAccessKey?: string;
    sessionToken?: string;
    profile?: string;
    region?: string;
    agentId: string;
    agentAliasId: string;
    sessionId?: string;
    sessionState?: {
        sessionAttributes?: Record<string, string>;
        promptSessionAttributes?: Record<string, string>;
        returnControlInvocationResults?: Array<{
            functionResult?: {
                actionGroup: string;
                function?: string;
                responseBody?: Record<string, any>;
            };
            apiResult?: {
                actionGroup: string;
                apiPath?: string;
                httpMethod?: string;
                httpStatusCode?: number;
                responseBody?: Record<string, any>;
            };
        }>;
        invocationId?: string;
    };
    memoryId?: string;
    enableTrace?: boolean;
    endSession?: boolean;
    temperature?: number;
    topP?: number;
    topK?: number;
    maximumLength?: number;
    stopSequences?: string[];
    inferenceConfig?: {
        temperature?: number;
        topP?: number;
        topK?: number;
        maximumLength?: number;
        stopSequences?: string[];
    };
    guardrailConfiguration?: {
        guardrailId: string;
        guardrailVersion: string;
    };
    promptOverrideConfiguration?: {
        promptConfigurations: Array<{
            promptType: 'PRE_PROCESSING' | 'ORCHESTRATION' | 'POST_PROCESSING' | 'KNOWLEDGE_BASE_RESPONSE_GENERATION';
            promptCreationMode: 'DEFAULT' | 'OVERRIDDEN';
            promptState?: 'ENABLED' | 'DISABLED';
            basePromptTemplate?: string;
            inferenceConfiguration?: {
                temperature?: number;
                topP?: number;
                topK?: number;
                maximumLength?: number;
                stopSequences?: string[];
            };
            parserMode?: 'DEFAULT' | 'OVERRIDDEN';
        }>;
    };
    knowledgeBaseConfigurations?: Array<{
        knowledgeBaseId: string;
        retrievalConfiguration?: {
            vectorSearchConfiguration: {
                numberOfResults?: number;
                overrideSearchType?: 'HYBRID' | 'SEMANTIC';
                filter?: Record<string, any>;
            };
        };
    }>;
    actionGroups?: Array<{
        actionGroupName: string;
        actionGroupExecutor?: {
            lambda?: string;
            customControl?: 'RETURN_CONTROL';
        };
        apiSchema?: {
            s3?: {
                s3BucketName: string;
                s3ObjectKey: string;
            };
            payload?: string;
        };
        description?: string;
    }>;
    inputDataConfig?: {
        bypassLambdaParsing?: boolean;
        filters?: Array<{
            name: string;
            type: 'PREPROCESSING' | 'POSTPROCESSING';
            inputType: 'TEXT' | 'IMAGE';
            outputType: 'TEXT' | 'IMAGE';
        }>;
    };
}
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
export declare class AwsBedrockAgentsProvider extends AwsBedrockGenericProvider implements ApiProvider {
    private agentRuntimeClient?;
    config: BedrockAgentsOptions;
    constructor(agentId: string, options?: {
        config?: BedrockAgentsOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    /**
     * Get or create the Bedrock Agent Runtime client
     */
    getAgentRuntimeClient(): Promise<BedrockAgentRuntimeClient>;
    /**
     * Build the session state from configuration
     */
    private buildSessionState;
    /**
     * Build inference configuration from both root-level and nested parameters
     * Root-level parameters take precedence over nested ones for convenience
     */
    private buildInferenceConfig;
    /**
     * Process the streaming response from the agent
     */
    private processResponse;
    /**
     * Invoke the agent with the given prompt
     */
    callApi(prompt: string): Promise<ProviderResponse>;
}
export {};
//# sourceMappingURL=agents.d.ts.map