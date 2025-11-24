import type { ApiProvider, ProviderOptions } from '../../types/index';
import type { OpenAiCompletionOptions } from '../openai/types';
type XAIConfig = {
    region?: string;
    reasoning_effort?: 'low' | 'high';
    search_parameters?: Record<string, any>;
} & OpenAiCompletionOptions;
type XAIProviderOptions = Omit<ProviderOptions, 'config'> & {
    config?: {
        config?: XAIConfig;
    };
};
export declare const XAI_CHAT_MODELS: ({
    id: string;
    cost: {
        input: number;
        output: number;
        cache_read: number;
    };
    aliases: string[];
} | {
    id: string;
    cost: {
        input: number;
        output: number;
        cache_read: number;
    };
    aliases?: undefined;
} | {
    id: string;
    cost: {
        input: number;
        output: number;
        cache_read?: undefined;
    };
    aliases: string[];
} | {
    id: string;
    cost: {
        input: number;
        output: number;
        cache_read?: undefined;
    };
    aliases?: undefined;
})[];
export declare const GROK_3_MINI_MODELS: string[];
export declare const GROK_REASONING_EFFORT_MODELS: string[];
export declare const GROK_REASONING_MODELS: string[];
export declare const GROK_4_MODELS: string[];
/**
 * Calculate xAI Grok cost based on model name and token usage
 */
export declare function calculateXAICost(modelName: string, config: any, promptTokens?: number, completionTokens?: number, reasoningTokens?: number): number | undefined;
export declare function createXAIProvider(providerPath: string, options?: XAIProviderOptions): ApiProvider;
export {};
//# sourceMappingURL=chat.d.ts.map