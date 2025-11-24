import type { Plugin, Severity } from '../redteam/constants';
import type { PoliciesById } from '../redteam/types';
import type { UnifiedConfig } from '../types/index';
import type { ProviderOptions } from '../types/providers';
/**
 * Makes an authenticated HTTP request to the PromptFoo Cloud API.
 * @param path - The API endpoint path (with or without leading slash)
 * @param method - HTTP method (GET, POST, PUT, DELETE, etc.)
 * @param body - Optional request body that will be JSON stringified
 * @returns Promise resolving to the fetch Response object
 * @throws Error if the request fails due to network or other issues
 */
export declare function makeRequest(path: string, method: string, body?: any): Promise<Response>;
/**
 * Fetches a provider configuration from PromptFoo Cloud by its ID.
 * @param id - The unique identifier of the cloud provider
 * @returns Promise resolving to provider options with guaranteed id field
 * @throws Error if cloud is not enabled, provider not found, or request fails
 */
export declare function getProviderFromCloud(id: string): Promise<ProviderOptions & {
    id: string;
}>;
/**
 * Fetches a unified configuration from PromptFoo Cloud for red team operations.
 * @param id - The unique identifier of the cloud configuration
 * @param providerId - Optional provider ID to filter the configuration
 * @returns Promise resolving to a unified configuration object
 * @throws Error if cloud is not enabled, config not found, or request fails
 */
export declare function getConfigFromCloud(id: string, providerId?: string): Promise<UnifiedConfig>;
/**
 * Checks if a provider path represents a cloud-based provider.
 * @param providerPath - The provider path to check
 * @returns True if the path starts with the cloud provider prefix, false otherwise
 */
export declare function isCloudProvider(providerPath: string): boolean;
/**
 * Extracts the database ID from a cloud provider path.
 * @param providerPath - The cloud provider path
 * @returns The database ID portion of the path
 * @throws Error if the path is not a valid cloud provider path
 */
export declare function getCloudDatabaseId(providerPath: string): string;
/**
 * Get the plugin severity overrides for a cloud provider.
 * @param cloudProviderId - The cloud provider ID.
 * @returns The plugin severity overrides.
 */
export declare function getPluginSeverityOverridesFromCloud(cloudProviderId: string): Promise<{
    id: string;
    severities: Record<Plugin, Severity>;
} | null>;
/**
 * Retrieves all teams for the current user from Promptfoo Cloud.
 * @returns Promise resolving to an array of team objects
 * @throws Error if the request fails
 */
export declare function getUserTeams(): Promise<Array<{
    id: string;
    name: string;
    slug: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}>>;
/**
 * Retrieves the default team for the current user from Promptfoo Cloud.
 * The default team is determined as the oldest team by creation date.
 * @returns Promise resolving to an object with team id, name, organizationId, and createdAt
 * @throws Error if the request fails or no teams are found
 */
export declare function getDefaultTeam(): Promise<{
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
}>;
/**
 * Retrieves a team by its ID.
 * @param teamId - The team ID to look up
 * @returns Promise resolving to an object with team id, name, organizationId, and createdAt
 * @throws Error if the team is not found or not accessible
 */
export declare function getTeamById(teamId: string): Promise<{
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
}>;
/**
 * Resolves a team identifier (name, slug, or ID) to a team object.
 * @param identifier - The team name, slug, or ID
 * @returns Promise resolving to an object with team id, name, organizationId, and createdAt
 * @throws Error if the team is not found
 */
export declare function resolveTeamFromIdentifier(identifier: string): Promise<{
    id: string;
    name: string;
    organizationId: string;
    createdAt: string;
}>;
/**
 * Resolves the current team context, checking stored preferences first.
 * @param teamIdentifier - Optional explicit team identifier to use
 * @param fallbackToDefault - Whether to fall back to server default team
 * @returns Promise resolving to an object with team id and name
 * @throws Error if no team can be resolved
 */
export declare function resolveTeamId(teamIdentifier?: string, fallbackToDefault?: boolean): Promise<{
    id: string;
    name: string;
}>;
/**
 * Custom error class for configuration permission-related failures.
 * Thrown when users lack necessary permissions to use certain cloud features.
 */
export declare class ConfigPermissionError extends Error {
    constructor(message: string);
}
/**
 * Validates that the current user has necessary permissions for the given configuration.
 * Checks with PromptFoo Cloud to ensure providers and other resources can be accessed.
 * Gracefully degrades if cloud is disabled or server doesn't support permission checking.
 * @param config - The configuration to validate permissions for
 * @throws ConfigPermissionError if permissions are insufficient (403 responses)
 * @throws Error for other critical permission check failures
 */
export declare function checkCloudPermissions(config: Partial<UnifiedConfig>): Promise<void>;
/**
 * Checks if the current user can create new targets (providers) for a given team.
 * @param teamId - The team ID to check permissions for. If undefined, uses the default team
 * @returns Promise resolving to true if user can create targets, false otherwise
 * @throws Error if the permission check request fails
 */
export declare function canCreateTargets(teamId: string | undefined): Promise<boolean>;
/**
 * Given a list of policy IDs, fetches custom policies from Promptfoo Cloud.
 * @param ids - The IDs of the policies to fetch.
 * @param teamId - The ID of the team to fetch policies from. Note that all policies must belong to this team.
 * @returns A map of policy IDs to their texts and severities.
 */
export declare function getPoliciesFromCloud(ids: string[], teamId: string): Promise<PoliciesById>;
/**
 * Validates linkedTargetId format and existence.
 * linkedTargetId is a Promptfoo Cloud feature that links custom provider results
 * to an existing target instead of creating duplicates.
 *
 * Validates the prefix and checks existence in cloud. Format validation
 * (e.g., UUID format) is deferred to the cloud API for simplicity.
 *
 * @param linkedTargetId - The linkedTargetId to validate
 * @throws Error if validation fails
 */
export declare function validateLinkedTargetId(linkedTargetId: string): Promise<void>;
/**
 * Fetches the current organization and optional team context for display.
 * Returns null if cloud is not enabled or if fetching fails.
 * @returns Promise resolving to organization name and optional team name, or null
 */
export declare function getOrgContext(): Promise<{
    organizationName: string;
    teamName?: string;
} | null>;
//# sourceMappingURL=cloud.d.ts.map