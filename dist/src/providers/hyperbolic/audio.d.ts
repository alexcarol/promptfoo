import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider } from '../../types/providers';
export type HyperbolicAudioOptions = {
    apiKey?: string;
    apiKeyEnvar?: string;
    apiBaseUrl?: string;
    model?: string;
    voice?: string;
    speed?: number;
    language?: string;
};
export declare class HyperbolicAudioProvider implements ApiProvider {
    modelName: string;
    config: HyperbolicAudioOptions;
    env?: EnvOverrides;
    constructor(modelName: string, options?: {
        config?: HyperbolicAudioOptions;
        id?: string;
        env?: EnvOverrides;
    });
    getApiKey(): string | undefined;
    getApiUrl(): string;
    id(): string;
    toString(): string;
    private getApiModelName;
    private calculateAudioCost;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare function createHyperbolicAudioProvider(providerPath: string, options?: {
    config?: HyperbolicAudioOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=audio.d.ts.map