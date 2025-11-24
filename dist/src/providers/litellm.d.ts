import type { EnvOverrides } from '../types/env';
import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderOptions, ProviderResponse } from '../types/providers';
interface LiteLLMProviderOptions {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}
/**
 * Base class for LiteLLM providers that maintains LiteLLM identity
 */
declare abstract class LiteLLMProviderWrapper implements ApiProvider {
    protected provider: ApiProvider;
    protected providerType: string;
    constructor(provider: ApiProvider, providerType: string);
    get modelName(): string;
    get config(): any;
    id(): string;
    toString(): string;
    toJSON(): {
        provider: string;
        model: string;
        type: string;
        config: any;
    };
    callApi(prompt: string, context?: CallApiContextParams, options?: CallApiOptionsParams): Promise<ProviderResponse>;
    getApiKey?: () => string | undefined;
}
/**
 * LiteLLM Chat Provider
 */
declare class LiteLLMChatProvider extends LiteLLMProviderWrapper {
    constructor(modelName: string, options: ProviderOptions);
}
export declare class LiteLLMProvider extends LiteLLMChatProvider {
}
/**
 * Creates a LiteLLM provider using OpenAI-compatible endpoints
 *
 * LiteLLM supports chat, completion, and embedding models through its proxy server.
 * All parameters are automatically passed through to the LiteLLM API.
 *
 * @example
 * // Chat model (default)
 * createLiteLLMProvider('litellm:gpt-4')
 * createLiteLLMProvider('litellm:chat:gpt-4')
 *
 * // Completion model
 * createLiteLLMProvider('litellm:completion:gpt-3.5-turbo-instruct')
 *
 * // Embedding model
 * createLiteLLMProvider('litellm:embedding:text-embedding-3-large')
 */
export declare function createLiteLLMProvider(providerPath: string, options?: LiteLLMProviderOptions): ApiProvider;
export {};
//# sourceMappingURL=litellm.d.ts.map