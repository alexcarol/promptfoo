export declare const CLOUD_API_HOST = "https://api.promptfoo.app";
export declare const API_HOST: string;
interface CloudUser {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
}
interface CloudOrganization {
    id: string;
    name: string;
    createdAt: Date;
    updatedAt: Date;
}
interface CloudTeam {
    id: string;
    name: string;
    slug: string;
    organizationId: string;
    createdAt: string;
    updatedAt: string;
}
interface CloudApp {
    url: string;
}
export declare class CloudConfig {
    private config;
    constructor();
    isEnabled(): boolean;
    setApiHost(apiHost: string): void;
    setApiKey(apiKey: string): void;
    getApiKey(): string | undefined;
    getApiHost(): string;
    setAppUrl(appUrl: string): void;
    getAppUrl(): string;
    delete(): void;
    private saveConfig;
    private reload;
    validateAndSetApiToken(token: string, apiHost: string): Promise<{
        user: CloudUser;
        organization: CloudOrganization;
        app: CloudApp;
    }>;
    getCurrentOrganizationId(): string | undefined;
    setCurrentOrganization(organizationId: string): void;
    getCurrentTeamId(organizationId?: string): string | undefined;
    setCurrentTeamId(teamId: string, organizationId?: string): void;
    clearCurrentTeamId(organizationId?: string): void;
    cacheTeams(teams: CloudTeam[], organizationId?: string): void;
    getCachedTeams(organizationId?: string): Array<{
        id: string;
        name: string;
        slug: string;
    }> | undefined;
}
export declare const cloudConfig: CloudConfig;
export {};
//# sourceMappingURL=cloud.d.ts.map