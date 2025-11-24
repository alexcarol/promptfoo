import { OpenAiChatCompletionProvider } from '../openai/chat';
import type { ApiProvider, ProviderOptions } from '../../types/index';
import type { OpenAiCompletionOptions } from '../openai/types';
type HyperbolicConfig = OpenAiCompletionOptions;
type HyperbolicProviderOptions = Omit<ProviderOptions, 'config'> & {
    config?: {
        config?: HyperbolicConfig;
    };
};
export declare const HYPERBOLIC_CHAT_MODELS: {
    id: string;
    cost: {
        input: number;
        output: number;
    };
    aliases: string[];
}[];
export declare const HYPERBOLIC_REASONING_MODELS: string[];
/**
 * Calculate Hyperbolic cost based on model name and token usage
 */
export declare function calculateHyperbolicCost(modelName: string, config: any, promptTokens?: number, completionTokens?: number, reasoningTokens?: number): number | undefined;
export declare class HyperbolicProvider extends OpenAiChatCompletionProvider {
    private originalConfig?;
    protected get apiKey(): string | undefined;
    protected isReasoningModel(): boolean;
    protected supportsTemperature(): boolean;
    constructor(modelName: string, providerOptions: HyperbolicProviderOptions);
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
            functions?: import("../openai/util").OpenAiFunction[];
            function_call?: "none" | "auto" | {
                name: string;
            };
            tools?: (import("../openai/util").OpenAiTool | import("../openai/types").OpenAiMCPTool | import("../openai/types").OpenAiWebSearchTool | import("../openai/types").OpenAiCodeInterpreterTool)[];
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
            reasoning_effort?: import("../openai/types").ReasoningEffort;
            reasoning?: import("../openai/types").Reasoning | import("../openai/types").GPT5Reasoning;
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
            functionToolCallbacks?: Record<import("openai").default.FunctionDefinition["name"], import("../openai/types").AssistantFunctionCallback | string>;
            mcp?: import("../mcp/types").MCPConfig;
            verbosity?: import("../openai/types").GPT5Verbosity;
        };
    };
    callApi(prompt: string, context?: any, callApiOptions?: any): Promise<any>;
}
export declare function createHyperbolicProvider(providerPath: string, options?: HyperbolicProviderOptions): ApiProvider;
export {};
//# sourceMappingURL=chat.d.ts.map