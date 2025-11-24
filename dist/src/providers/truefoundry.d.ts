import { OpenAiChatCompletionProvider } from './openai/chat';
import { OpenAiEmbeddingProvider } from './openai/embedding';
import type { ApiEmbeddingProvider, ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse } from '../types/providers';
import type { OpenAiCompletionOptions } from './openai/types';
type TrueFoundryMetadata = Record<string, any>;
type TrueFoundryLoggingConfig = {
    enabled?: boolean;
    [key: string]: any;
};
type TrueFoundryMCPServer = {
    integration_fqn: string;
    enable_all_tools?: boolean;
    tools?: Array<{
        name: string;
    }>;
};
type TrueFoundryCompletionOptions = OpenAiCompletionOptions & {
    metadata?: TrueFoundryMetadata;
    loggingConfig?: TrueFoundryLoggingConfig;
    mcp_servers?: TrueFoundryMCPServer[];
    iteration_limit?: number;
};
type TrueFoundryProviderOptions = ProviderOptions & {
    config?: TrueFoundryCompletionOptions;
};
/**
 * TrueFoundry LLM Gateway Provider
 *
 * Provides access to 1000+ LLMs through TrueFoundry's unified gateway with
 * enterprise-grade security, observability, and governance.
 */
export declare class TrueFoundryProvider extends OpenAiChatCompletionProvider {
    constructor(modelName: string, providerOptions?: TrueFoundryProviderOptions);
    /**
     * Override isReasoningModel to correctly detect GPT-5 and other reasoning models
     * despite TrueFoundry's provider-account/model-name format
     */
    protected isReasoningModel(): boolean;
    /**
     * Override getOpenAiBody to add TrueFoundry-specific headers and body parameters
     */
    getOpenAiBody(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): {
        body: Record<string, any>;
        config: any;
    };
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
}
/**
 * TrueFoundry Embedding Provider
 *
 * Provides embedding capabilities through TrueFoundry's gateway
 */
export declare class TrueFoundryEmbeddingProvider extends OpenAiEmbeddingProvider {
    constructor(modelName: string, providerOptions?: TrueFoundryProviderOptions);
    /**
     * Override callEmbeddingApi to add TrueFoundry-specific headers
     */
    callEmbeddingApi(text: string): Promise<ProviderResponse>;
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
        };
    };
}
/**
 * Creates a TrueFoundry provider
 *
 * @param providerPath - Provider path, e.g., "truefoundry:openai/gpt-4"
 * @param options - Provider options
 * @returns A TrueFoundry provider (chat or embedding based on model type)
 */
export declare function createTrueFoundryProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: Record<string, string | undefined>;
}): ApiProvider | ApiEmbeddingProvider;
export {};
//# sourceMappingURL=truefoundry.d.ts.map