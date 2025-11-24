import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { ApiProvider } from '../../types/providers';
export type HyperbolicImageOptions = {
    apiKey?: string;
    apiKeyEnvar?: string;
    apiBaseUrl?: string;
    model_name?: string;
    prompt?: string;
    height?: number;
    width?: number;
    backend?: 'auto' | 'tvm' | 'torch';
    prompt_2?: string;
    negative_prompt?: string;
    negative_prompt_2?: string;
    image?: string;
    strength?: number;
    seed?: number;
    cfg_scale?: number;
    sampler?: string;
    steps?: number;
    style_preset?: string;
    enable_refiner?: boolean;
    controlnet_name?: string;
    controlnet_image?: string;
    loras?: Record<string, number>;
    response_format?: 'url' | 'b64_json';
};
export declare function formatHyperbolicImageOutput(imageData: string, _prompt: string, responseFormat?: string): string;
export declare class HyperbolicImageProvider implements ApiProvider {
    modelName: string;
    config: HyperbolicImageOptions;
    env?: EnvOverrides;
    constructor(modelName: string, options?: {
        config?: HyperbolicImageOptions;
        id?: string;
        env?: EnvOverrides;
    });
    getApiKey(): string | undefined;
    getApiUrl(): string;
    id(): string;
    toString(): string;
    private getApiModelName;
    private calculateImageCost;
    callApi(prompt: string, context?: CallApiContextParams, _callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
}
export declare function createHyperbolicImageProvider(providerPath: string, options?: {
    config?: HyperbolicImageOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=image.d.ts.map