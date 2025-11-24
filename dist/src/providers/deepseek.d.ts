import type { ApiProvider, ProviderOptions } from '../types/index';
import type { OpenAiCompletionOptions } from './openai/types';
type DeepSeekConfig = OpenAiCompletionOptions;
type DeepSeekProviderOptions = Omit<ProviderOptions, 'config'> & {
    config?: {
        config?: DeepSeekConfig;
    };
};
export declare const DEEPSEEK_CHAT_MODELS: {
    id: string;
    cost: {
        input: number;
        output: number;
        cache_read: number;
    };
}[];
/**
 * Calculate DeepSeek cost based on model name and token usage
 */
export declare function calculateDeepSeekCost(modelName: string, config: any, promptTokens?: number, completionTokens?: number, cachedTokens?: number): number | undefined;
export declare function createDeepSeekProvider(providerPath: string, options?: DeepSeekProviderOptions): ApiProvider;
export {};
//# sourceMappingURL=deepseek.d.ts.map