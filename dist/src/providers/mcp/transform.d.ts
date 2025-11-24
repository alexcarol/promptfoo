import type { McpServerConfig as ClaudeCodeMcpServerConfig } from '@anthropic-ai/claude-agent-sdk';
import type Anthropic from '@anthropic-ai/sdk';
import type { Tool as GoogleTool } from '../google/types';
import type { OpenAiTool } from '../openai/util';
import type { MCPConfig, MCPTool } from './types';
export declare function transformMCPToolsToOpenAi(tools: MCPTool[]): OpenAiTool[];
export declare function transformMCPToolsToAnthropic(tools: MCPTool[]): Anthropic.Tool[];
export declare function transformMCPToolsToGoogle(tools: MCPTool[]): GoogleTool[];
export declare function transformMCPConfigToClaudeCode(config: MCPConfig): Record<string, ClaudeCodeMcpServerConfig>;
//# sourceMappingURL=transform.d.ts.map