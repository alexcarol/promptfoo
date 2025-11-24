import type { ProviderOptions } from '../types/providers';
/**
 * Default provider list shown in the eval creator UI.
 * This list can be overridden by server administrators using ui-providers.yaml
 */
export declare const defaultProviders: ProviderOptions[];
/**
 * Provider groups for UI organization
 */
export declare const PROVIDER_GROUPS: Record<string, string>;
/**
 * Get the group name for a provider
 */
export declare function getProviderGroup(option: string | ProviderOptions): string;
//# sourceMappingURL=defaultProviders.d.ts.map