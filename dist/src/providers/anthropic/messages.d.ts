import { AnthropicGenericProvider } from './generic';
import type { EnvOverrides } from '../../types/env';
import type { CallApiContextParams, ProviderResponse } from '../../types/index';
import type { AnthropicMessageOptions } from './types';
export declare class AnthropicMessagesProvider extends AnthropicGenericProvider {
    config: AnthropicMessageOptions;
    private mcpClient;
    private initializationPromise;
    static ANTHROPIC_MODELS: {
        id: string;
        cost: {
            input: number;
            output: number;
        };
    }[];
    static ANTHROPIC_MODELS_NAMES: string[];
    constructor(modelName: string, options?: {
        id?: string;
        config?: AnthropicMessageOptions;
        env?: EnvOverrides;
    });
    private initializeMCP;
    cleanup(): Promise<void>;
    toString(): string;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
}
//# sourceMappingURL=messages.d.ts.map