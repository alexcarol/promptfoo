/**
 * Iterate through user choices and determine if the user has selected a provider that needs an API key
 * but has not set and API key in their environment.
 */
export declare function reportProviderAPIKeyWarnings(providerChoices: (string | object)[]): string[];
export declare function createDummyFiles(directory: string | null, interactive?: boolean): Promise<{
    numPrompts: number;
    providerPrefixes: never[];
    action: string;
    language: string;
    outDirectory?: undefined;
} | {
    numPrompts: number;
    providerPrefixes: string[];
    action: string;
    language: string;
    outDirectory: string;
}>;
export declare function initializeProject(directory: string | null, interactive?: boolean): Promise<{
    numPrompts: number;
    providerPrefixes: never[];
    action: string;
    language: string;
} | {
    numPrompts: number;
    providerPrefixes: string[];
    action: string;
    language: string;
}>;
//# sourceMappingURL=onboarding.d.ts.map