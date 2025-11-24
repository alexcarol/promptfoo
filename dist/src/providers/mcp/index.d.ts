import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { MCPConfig } from './types';
interface MCPProviderOptions {
    config?: MCPConfig;
    id?: string;
    defaultArgs?: Record<string, unknown>;
}
export declare class MCPProvider implements ApiProvider {
    private mcpClient;
    config: MCPConfig;
    private defaultArgs?;
    private initializationPromise;
    constructor(options?: MCPProviderOptions);
    id(): string;
    toString(): string;
    private initialize;
    callApi(_prompt: string, context?: CallApiContextParams, _options?: CallApiOptionsParams): Promise<ProviderResponse>;
    cleanup(): Promise<void>;
    callTool(toolName: string, args: Record<string, unknown>): Promise<ProviderResponse>;
    getAvailableTools(): Promise<import("./types").MCPTool[]>;
    getConnectedServers(): string[];
}
export {};
//# sourceMappingURL=index.d.ts.map