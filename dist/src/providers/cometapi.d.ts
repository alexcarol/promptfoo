import { OpenAiImageProvider } from './openai/image';
import type { ApiProvider, ProviderOptions } from '../types/index';
import type { EnvOverrides } from '../types/env';
import type { OpenAiSharedOptions } from './openai/types';
export interface CometApiModel {
    id: string;
}
export declare function clearCometApiModelsCache(): void;
export declare function fetchCometApiModels(env?: EnvOverrides): Promise<CometApiModel[]>;
/**
 * CometAPI Image Provider - extends OpenAI Image Provider for CometAPI's image generation models
 */
export declare class CometApiImageProvider extends OpenAiImageProvider {
    constructor(modelName: string, options?: {
        config?: OpenAiSharedOptions;
        id?: string;
        env?: EnvOverrides;
    });
    getApiKey(): string | undefined;
    getApiUrlDefault(): string;
}
/**
 * Factory for creating CometAPI providers using OpenAI-compatible endpoints.
 */
export declare function createCometApiProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=cometapi.d.ts.map