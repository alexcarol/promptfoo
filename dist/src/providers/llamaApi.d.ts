import { OpenAiChatCompletionProvider } from './openai/chat';
import type { ApiProvider, ProviderOptions } from '../types/index';
import type { EnvOverrides } from '../types/env';
export declare const LLAMA_API_MODELS: ({
    id: string;
    inputModalities: string[];
    outputModalities: string[];
    contextWindow: number;
    aliases: string[];
    provider?: undefined;
} | {
    id: string;
    inputModalities: string[];
    outputModalities: string[];
    contextWindow: number;
    provider: string;
    aliases: string[];
})[];
export declare const LLAMA_API_MULTIMODAL_MODELS: string[];
export declare class LlamaApiProvider extends OpenAiChatCompletionProvider {
    constructor(modelName: string, options?: ProviderOptions);
    id(): string;
    toString(): string;
    toJSON(): {
        provider: string;
        model: string;
        config: {
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
    static getModelInfo(modelName: string): {
        id: string;
        inputModalities: string[];
        outputModalities: string[];
        contextWindow: number;
        aliases: string[];
        provider?: undefined;
    } | {
        id: string;
        inputModalities: string[];
        outputModalities: string[];
        contextWindow: number;
        provider: string;
        aliases: string[];
    } | undefined;
    static isMultimodalModel(modelName: string): boolean;
    static validateModelName(modelName: string): boolean;
}
/**
 * Creates a Llama API provider using OpenAI-compatible endpoints
 */
export declare function createLlamaApiProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=llamaApi.d.ts.map