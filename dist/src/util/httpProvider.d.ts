import type { ApiProvider, ProviderOptions } from '../types/providers';
/**
 * Check if a provider is an HTTP provider
 */
export declare function isHttpProvider(provider: ApiProvider | ProviderOptions): boolean;
/**
 * Patch HTTP provider config for validation.
 * We need to set maxRetries to 1 and add a silent header to avoid excessive logging of the request and response.
 */
export declare function patchHttpConfigForValidation(providerOptions: any): any;
//# sourceMappingURL=httpProvider.d.ts.map