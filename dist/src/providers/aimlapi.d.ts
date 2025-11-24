import type { ApiProvider, ProviderOptions } from '../types/index';
import type { EnvOverrides } from '../types/env';
export interface AimlApiModel {
    id: string;
}
export declare function clearAimlApiModelsCache(): void;
export declare function fetchAimlApiModels(env?: EnvOverrides): Promise<AimlApiModel[]>;
/**
 * Factory for creating AI/ML API providers using OpenAI-compatible endpoints.
 */
export declare function createAimlApiProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=aimlapi.d.ts.map