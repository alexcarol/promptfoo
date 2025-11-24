import type { ApiProvider, ProviderOptions } from '../types/index';
import type { EnvOverrides } from '../types/env';
/**
 * Creates an Nscale provider using OpenAI-compatible endpoints
 *
 * Nscale provides serverless AI inference with OpenAI-compatible API endpoints.
 * All parameters are automatically passed through to the Nscale API.
 *
 * Documentation: https://docs.nscale.com/
 */
export declare function createNscaleProvider(providerPath: string, options?: {
    config?: ProviderOptions;
    id?: string;
    env?: EnvOverrides;
}): ApiProvider;
//# sourceMappingURL=nscale.d.ts.map