import type { ApiProvider, CallApiContextParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
import type { CompletionOptions } from './types';
interface GoogleImageOptions {
    config?: CompletionOptions;
    id?: string;
    env?: EnvOverrides;
}
export declare class GoogleImageProvider implements ApiProvider {
    modelName: string;
    config: CompletionOptions;
    env?: EnvOverrides;
    maxRetries: number;
    baseRetryDelay: number;
    constructor(modelName: string, options?: GoogleImageOptions);
    id(): string;
    toString(): string;
    /**
     * Helper method to get Google client with credentials support
     */
    private getClientWithCredentials;
    private getProjectId;
    callApi(prompt: string, _context?: CallApiContextParams): Promise<ProviderResponse>;
    private callVertexApi;
    private callGeminiApi;
    private processResponse;
    private mapSafetyLevelForGemini;
    private getApiKey;
    private getModelPath;
    private getCost;
    private withRetry;
}
export {};
//# sourceMappingURL=image.d.ts.map