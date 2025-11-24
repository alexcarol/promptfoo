import type { Agent } from '@openai/agents';
import type { AgentDefinition, ToolDefinition, HandoffDefinition } from './agents-types';
/**
 * Load agent definition from file path or return inline definition
 */
export declare function loadAgentDefinition(agentConfig: Agent<any, any> | string | AgentDefinition): Promise<Agent<any, any>>;
/**
 * Load tools from file path or return inline definitions
 */
export declare function loadTools(toolsConfig?: string | ToolDefinition[]): Promise<ToolDefinition[] | undefined>;
/**
 * Load handoffs from file path or return inline definitions
 */
export declare function loadHandoffs(handoffsConfig?: string | HandoffDefinition[]): Promise<HandoffDefinition[] | undefined>;
//# sourceMappingURL=agents-loader.d.ts.map