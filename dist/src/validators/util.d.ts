import type { ApiProvider } from '../types/providers';
/**
 * Formats config body for troubleshooting display
 */
export declare function formatConfigBody({ body }: {
    body: any;
}): string;
/**
 * Formats config headers for troubleshooting display
 */
export declare function formatConfigHeaders({ headers, }: {
    headers: Record<string, any> | undefined;
}): string;
/**
 * Validates session configuration for both client and server sessions
 * Logs warnings if configuration looks invalid but does not prevent test execution
 */
export declare function validateSessionConfig({ provider, sessionSource, sessionConfig, }: {
    provider: ApiProvider;
    sessionSource: string;
    sessionConfig?: {
        sessionSource?: string;
        sessionParser?: string;
    };
}): void;
/**
 * Determines the effective session source based on config and defaults
 */
export declare function determineEffectiveSessionSource({ provider, sessionConfig, }: {
    provider: ApiProvider;
    sessionConfig?: {
        sessionSource?: string;
        sessionParser?: string;
    };
}): string;
//# sourceMappingURL=util.d.ts.map