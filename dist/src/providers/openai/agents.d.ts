import { OpenAiGenericProvider } from './index';
import type { OpenAiAgentsOptions } from './agents-types';
import type { CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../../types/index';
import type { EnvOverrides } from '../../types/env';
/**
 * OpenAI Agents Provider
 *
 * Integrates openai-agents-js SDK as a promptfoo provider.
 * Supports multi-turn agent workflows with tools, handoffs, and tracing.
 */
export declare class OpenAiAgentsProvider extends OpenAiGenericProvider {
    private agentConfig;
    private agent?;
    private tracingExporter?;
    constructor(modelName: string, options?: {
        config?: OpenAiAgentsOptions;
        id?: string;
        env?: EnvOverrides;
    });
    id(): string;
    toString(): string;
    /**
     * Call the agent with the given prompt
     */
    callApi(prompt: string, context?: CallApiContextParams, callApiOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
    /**
     * Initialize the agent from configuration
     */
    private initializeAgent;
    /**
     * Setup tracing if enabled
     */
    private setupTracingIfNeeded;
    /**
     * Register tracing exporter with openai-agents-js tracing system
     */
    private registerTracingExporter;
    /**
     * Run the agent with the given prompt
     */
    private runAgent;
    /**
     * Extract token usage from agent result
     */
    private extractTokenUsage;
    /**
     * Calculate cost from agent result
     */
    private calculateCost;
}
//# sourceMappingURL=agents.d.ts.map