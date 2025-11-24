import { OpenAiChatCompletionProvider } from './openai/chat';
import { OpenAiCompletionProvider } from './openai/completion';
import { OpenAiEmbeddingProvider } from './openai/embedding';
import type { ApiProvider, ProviderOptions } from '../types/index';
import type { OpenAiCompletionOptions } from './openai/types';
export interface CloudflareAiConfig extends OpenAiCompletionOptions {
    accountId?: string;
    accountIdEnvar?: string;
    apiKey?: string;
    apiKeyEnvar?: string;
    apiBaseUrl?: string;
}
export interface CloudflareAiProviderOptions extends ProviderOptions {
    config?: CloudflareAiConfig;
}
export declare class CloudflareAiChatCompletionProvider extends OpenAiChatCompletionProvider {
    private cloudflareConfig;
    private modelType;
    constructor(modelName: string, providerOptions: CloudflareAiProviderOptions);
    id(): string;
    toString(): string;
    getApiKey(): string | undefined;
    toJSON(): {
        provider: string;
        model: string;
        modelType: string;
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
export declare class CloudflareAiCompletionProvider extends OpenAiCompletionProvider {
    private cloudflareConfig;
    private modelType;
    constructor(modelName: string, providerOptions: CloudflareAiProviderOptions);
    id(): string;
    toString(): string;
    getApiKey(): string | undefined;
    toJSON(): {
        provider: string;
        model: string;
        modelType: string;
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
export declare class CloudflareAiEmbeddingProvider extends OpenAiEmbeddingProvider {
    private cloudflareConfig;
    private modelType;
    constructor(modelName: string, providerOptions: CloudflareAiProviderOptions);
    id(): string;
    toString(): string;
    getApiKey(): string | undefined;
    toJSON(): {
        provider: string;
        model: string;
        modelType: string;
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
export declare function createCloudflareAiProvider(providerPath: string, options?: CloudflareAiProviderOptions): ApiProvider;
//# sourceMappingURL=cloudflare-ai.d.ts.map