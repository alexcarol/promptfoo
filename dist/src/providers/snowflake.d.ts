import { OpenAiChatCompletionProvider } from './openai/chat';
import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse } from '../types/providers';
/**
 * Snowflake Cortex provider extends OpenAI chat completion provider
 * with Snowflake-specific endpoint handling.
 *
 * Documentation: https://docs.snowflake.com/en/user-guide/snowflake-cortex/cortex-rest-api
 *
 * The Snowflake Cortex REST API provides OpenAI-compatible endpoints but with
 * a different URL structure:
 * - Endpoint: https://<account_identifier>.snowflakecomputing.com/api/v2/cortex/inference:complete
 * - Authentication: Bearer token (JWT, OAuth, or programmatic access token)
 * - Supports similar parameters to OpenAI (temperature, max_tokens, etc.)
 * - Supports tool calling, structured output, and streaming
 *
 * Available models include:
 * - Claude models (claude-3-5-sonnet, claude-4-sonnet)
 * - OpenAI GPT models
 * - Mistral models
 * - Llama models
 * - Custom fine-tuned models
 *
 * Example configuration:
 * ```yaml
 * providers:
 *   - id: snowflake:mistral-large2
 *     config:
 *       accountIdentifier: "myorg-myaccount"  # or set SNOWFLAKE_ACCOUNT_IDENTIFIER
 *       apiKey: "your-bearer-token"           # or set SNOWFLAKE_API_KEY
 *       # Optional: override the base URL completely
 *       # apiBaseUrl: "https://myorg-myaccount.snowflakecomputing.com"
 * ```
 */
export declare class SnowflakeCortexProvider extends OpenAiChatCompletionProvider {
    constructor(modelName: string, providerOptions: ProviderOptions);
    id(): string;
    toString(): string;
    toJSON(): {
        provider: string;
        model: string;
        config: {
            apiKey?: string;
            apiKeyEnvar?: string;
            apiKeyRequired?: boolean;
            apiHost?: string;
            apiBaseUrl?: string;
            organization?: string;
            cost?: number;
            headers?: {
                [key: string]: string;
            };
            maxRetries?: number;
            temperature?: number;
            max_completion_tokens?: number;
            max_tokens?: number;
            top_p?: number;
            frequency_penalty?: number;
            presence_penalty?: number;
            best_of?: number;
            functions?: import("./openai/util").OpenAiFunction[];
            function_call?: "none" | "auto" | {
                name: string;
            };
            tools?: (import("./openai/util").OpenAiTool | import("./openai/types").OpenAiMCPTool | import("./openai/types").OpenAiWebSearchTool | import("./openai/types").OpenAiCodeInterpreterTool)[];
            tool_choice?: "none" | "auto" | "required" | {
                type: "function";
                function?: {
                    name: string;
                };
            };
            tool_resources?: Record<string, any>;
            showThinking?: boolean;
            response_format?: {
                type: "json_object";
            } | {
                type: "json_schema";
                json_schema: {
                    name: string;
                    strict: boolean;
                    schema: {
                        type: "object";
                        properties: Record<string, any>;
                        required?: string[];
                        additionalProperties: false;
                    };
                };
            };
            stop?: string[];
            seed?: number;
            passthrough?: object;
            reasoning_effort?: import("./openai/types").ReasoningEffort;
            reasoning?: import("./openai/types").Reasoning | import("./openai/types").GPT5Reasoning;
            service_tier?: ("auto" | "default" | "premium") | null;
            modalities?: string[];
            audio?: {
                bitrate?: string;
                format?: string | "wav" | "mp3" | "flac" | "opus" | "pcm16" | "aac";
                speed?: number;
                voice?: string;
            };
            instructions?: string;
            max_output_tokens?: number;
            max_tool_calls?: number;
            metadata?: Record<string, string>;
            parallel_tool_calls?: boolean;
            previous_response_id?: string;
            store?: boolean;
            stream?: boolean;
            truncation?: "auto" | "disabled";
            user?: string;
            background?: boolean;
            webhook_url?: string;
            functionToolCallbacks?: Record<import("openai").default.FunctionDefinition["name"], import("./openai/types").AssistantFunctionCallback | string>;
            mcp?: import("./mcp/types").MCPConfig;
            verbosity?: import("./openai/types").GPT5Verbosity;
        };
    };
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare function createSnowflakeProvider(providerPath: string, options?: ProviderOptions): ApiProvider;
//# sourceMappingURL=snowflake.d.ts.map