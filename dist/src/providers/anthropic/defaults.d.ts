import { AnthropicMessagesProvider } from './messages';
import type { DefaultProviders, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
export declare const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-4-5-20250929";
export declare class AnthropicLlmRubricProvider extends AnthropicMessagesProvider {
    constructor(modelName: string, options?: {
        env?: EnvOverrides;
        config?: Record<string, any>;
    });
    callApi(prompt: string): Promise<ProviderResponse>;
}
/**
 * Gets all default Anthropic providers with the given environment overrides
 * @param env - Optional environment overrides
 * @returns Anthropic provider implementations for various functions
 */
export declare function getAnthropicProviders(env?: EnvOverrides): Pick<DefaultProviders, 'gradingJsonProvider' | 'gradingProvider' | 'llmRubricProvider' | 'suggestionsProvider' | 'synthesizeProvider'>;
//# sourceMappingURL=defaults.d.ts.map