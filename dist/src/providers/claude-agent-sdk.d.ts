import { MCPConfig } from './mcp/types';
import type { SettingSource } from '@anthropic-ai/claude-agent-sdk';
import type { ApiProvider, CallApiContextParams, CallApiOptionsParams, ProviderResponse } from '../types/index';
import type { EnvOverrides } from '../types/env';
/**
 * Claude Agent SDK Provider
 *
 * This provider requires the @anthropic-ai/claude-agent-sdk package, which has a
 * proprietary license and is not installed by default. Users must install it separately:
 *   npm install @anthropic-ai/claude-agent-sdk
 *
 * Two default configurations:
 * - No working_dir: Runs in temp directory with no tools - behaves like plain chat API
 * - With working_dir: Runs in specified directory with read-only file tools (Read/Grep/Glob/LS)
 *
 * User can override tool permissions with 'custom_allowed_tools', 'append_allowed_tools', 'disallowed_tools', and 'permission_mode'.
 *
 * For side effects (file writes, system calls, etc.), user can override permissions and use a custom working directory. They're then responsible for setup/teardown and security considerations.
 *
 * MCP server connection details are passed through from config. strict_mcp_config is true by default to only allow explicitly configured MCP servers.
 */
export declare const FS_READONLY_ALLOWED_TOOLS: string[];
export declare const CLAUDE_CODE_MODEL_ALIASES: string[];
export interface ClaudeCodeOptions {
    apiKey?: string;
    /**
     * 'working_dir' allows user to point to a pre-prepared directory with desired files/directories in place
     * If not supplied, we'll use an empty temp dir for isolation
     */
    working_dir?: string;
    /**
     * 'model' and 'fallback_model' are optional
     * if not supplied, Claude Agent SDK uses default models
     */
    model?: string;
    fallback_model?: string;
    max_turns?: number;
    max_thinking_tokens?: number;
    mcp?: MCPConfig;
    strict_mcp_config?: boolean;
    /**
     * User can set more dangerous 'acceptEdits' or 'bypassPermissions' if they know what they're doing,
     */
    permission_mode?: 'default' | 'plan' | 'acceptEdits' | 'bypassPermissions';
    /**
     * User can set a custom system prompt, or append to the default Claude Agent SDK system prompt
     */
    custom_system_prompt?: string;
    append_system_prompt?: string;
    /**
     * Since we run CC by default with a readonly set of allowed_tools, user can either fully replace the list ('custom_allowed_tools'), append to it ('append_allowed_tools'), or allow all tools ('allow_all_tools')
     */
    custom_allowed_tools?: string[];
    append_allowed_tools?: string[];
    allow_all_tools?: boolean;
    /**
     * 'disallowed_tools' is passed through as is; it always takes precedence over 'allowed_tools'
     */
    disallowed_tools?: string[];
    /**
     * 'setting_sources' controls where the Claude Agent SDK looks for settings, CLAUDE.md, and slash commands—accepts 'user', 'project', and 'local'
     * if not supplied, it won't look for any settings, CLAUDE.md, or slash commands
     */
    setting_sources?: SettingSource[];
    /**
     * 'plugins' allows loading Claude Code plugins from local file system paths
     * Each plugin must be a directory containing .claude-plugin/plugin.json manifest
     */
    plugins?: Array<{
        type: 'local';
        path: string;
    }>;
}
export declare class ClaudeCodeSDKProvider implements ApiProvider {
    static ANTHROPIC_MODELS: {
        id: string;
        cost: {
            input: number;
            output: number;
        };
    }[];
    static ANTHROPIC_MODELS_NAMES: string[];
    config: ClaudeCodeOptions;
    env?: EnvOverrides;
    apiKey?: string;
    private providerId;
    private claudeCodeModule?;
    constructor(options?: {
        id?: string;
        config?: ClaudeCodeOptions;
        env?: EnvOverrides;
    });
    id(): string;
    callApi(prompt: string, context?: CallApiContextParams, callOptions?: CallApiOptionsParams): Promise<ProviderResponse>;
    toString(): string;
    /**
     * For normal Claude Agent SDK support, just use the Anthropic API key
     * Users can also use Bedrock (with CLAUDE_CODE_USE_BEDROCK env var) or Vertex (with CLAUDE_CODE_USE_VERTEX env var)
     */
    getApiKey(): string | undefined;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=claude-agent-sdk.d.ts.map