"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeSDKProvider = exports.CLAUDE_CODE_MODEL_ALIASES = exports.FS_READONLY_ALLOWED_TOOLS = void 0;
const node_module_1 = require("node:module");
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const dedent_1 = __importDefault(require("dedent"));
const cache_1 = require("../cache");
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
const util_1 = require("./anthropic/util");
const transform_1 = require("./mcp/transform");
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
// When a working directory is provided, we allow read-only tools by default (when no working directory is provided, default to no tools)
exports.FS_READONLY_ALLOWED_TOOLS = ['Read', 'Grep', 'Glob', 'LS'].sort(); // sort and export for tests
// Claude Agent SDK supports these model aliases in addition to full model names
// See: https://docs.anthropic.com/en/docs/claude-agent-sdk/model-config
exports.CLAUDE_CODE_MODEL_ALIASES = [
    'default',
    'sonnet',
    'opus',
    'haiku',
    'sonnet[1m]',
    'opusplan',
];
/**
 * Helper to load the Claude Agent SDK ESM module
 * Uses the same pattern as other providers for resolving npm packages
 */
async function loadClaudeCodeSDK() {
    try {
        // Use a file path for createRequire to ensure proper module resolution
        // createRequire needs an absolute path, not a relative one
        const basePath = cliState_1.default.basePath && path_1.default.isAbsolute(cliState_1.default.basePath) ? cliState_1.default.basePath : process.cwd();
        const resolveFrom = path_1.default.join(basePath, 'package.json');
        const require = (0, node_module_1.createRequire)(resolveFrom);
        const claudeCodePath = require.resolve('@anthropic-ai/claude-agent-sdk');
        return (0, esm_1.importModule)(claudeCodePath);
    }
    catch (err) {
        logger_1.default.error(`Failed to load Claude Agent SDK: ${err}`);
        if (err.stack) {
            logger_1.default.error(err.stack);
        }
        throw new Error((0, dedent_1.default) `The @anthropic-ai/claude-agent-sdk package is required but not installed.

      This package has a proprietary license and is not installed by default.

      To use the Claude Agent SDK provider, install it with:
        npm install @anthropic-ai/claude-agent-sdk

      For more information, see: https://www.promptfoo.dev/docs/providers/claude-agent-sdk/`);
    }
}
class ClaudeCodeSDKProvider {
    constructor(options = {}) {
        // Only SDK and Anthropic are supported for now
        // Could later potentially support Claude Agent SDK via external CLI calls, as well as Bedrock/Vertex providers
        this.providerId = 'anthropic:claude-agent-sdk';
        const { config, env, id } = options;
        this.config = config ?? {};
        this.env = env;
        this.apiKey = this.getApiKey();
        this.providerId = id ?? this.providerId;
        if (this.config.model &&
            !ClaudeCodeSDKProvider.ANTHROPIC_MODELS_NAMES.includes(this.config.model) &&
            !exports.CLAUDE_CODE_MODEL_ALIASES.includes(this.config.model)) {
            logger_1.default.warn(`Using unknown model for Claude Agent SDK: ${this.config.model}`);
        }
        if (this.config.fallback_model &&
            !ClaudeCodeSDKProvider.ANTHROPIC_MODELS_NAMES.includes(this.config.fallback_model) &&
            !exports.CLAUDE_CODE_MODEL_ALIASES.includes(this.config.fallback_model)) {
            logger_1.default.warn(`Using unknown model for Claude Agent SDK fallback: ${this.config.fallback_model}`);
        }
    }
    id() {
        return this.providerId;
    }
    async callApi(prompt, context, callOptions) {
        // Merge configs from the provider and the prompt
        const config = {
            ...this.config,
            ...context?.prompt?.config,
        };
        // Debug logging for plugins configuration
        logger_1.default.debug('[Claude Agent SDK] Plugins config check:', {
            providerPlugins: this.config.plugins,
            contextPlugins: context?.prompt?.config?.plugins,
            mergedPlugins: config.plugins,
        });
        // Set up env for the Claude Agent SDK call
        // Pass through entire environment like claude-agent-sdk CLI does, with EnvOverrides taking precedence
        // Sort keys for stable cache key generation
        const env = {};
        for (const key of Object.keys(process.env).sort()) {
            if (process.env[key] !== undefined) {
                env[key] = process.env[key];
            }
        }
        // EnvOverrides take precedence over process.env
        if (this.env) {
            for (const key of Object.keys(this.env).sort()) {
                const value = this.env[key];
                if (value !== undefined) {
                    env[key] = value;
                }
            }
        }
        // Ensure API key is available to Claude Agent SDK
        if (this.apiKey) {
            env.ANTHROPIC_API_KEY = this.apiKey;
        }
        // Could potentially do more to validate credentials for Bedrock/Vertex here, but Anthropic key is the main use case
        if (!this.apiKey && !(env.CLAUDE_CODE_USE_BEDROCK || env.CLAUDE_CODE_USE_VERTEX)) {
            throw new Error((0, dedent_1.default) `Anthropic API key is not set. Set the ANTHROPIC_API_KEY environment variable or add "apiKey" to the provider config.

        Use CLAUDE_CODE_USE_BEDROCK or CLAUDE_CODE_USE_VERTEX environment variables to use Bedrock or Vertex instead.`);
        }
        // Set up allowed tools for the Claude Agent SDK call
        // Check for conflicting config options (may want a zod schema in the future)
        if (config.allow_all_tools &&
            ('custom_allowed_tools' in config || 'append_allowed_tools' in config)) {
            throw new Error('Cannot specify both allow_all_tools and custom_allowed_tools or append_allowed_tools');
        }
        if ('custom_allowed_tools' in config && 'append_allowed_tools' in config) {
            throw new Error('Cannot specify both custom_allowed_tools and append_allowed_tools');
        }
        // De-dupe and sort allowed/disallowed tools for cache key consistency
        const defaultAllowedTools = config.working_dir ? exports.FS_READONLY_ALLOWED_TOOLS : [];
        let allowedTools = config.allow_all_tools ? undefined : defaultAllowedTools;
        if ('custom_allowed_tools' in config) {
            allowedTools = Array.from(new Set(config.custom_allowed_tools ?? [])).sort();
        }
        else if (config.append_allowed_tools) {
            allowedTools = Array.from(new Set([...defaultAllowedTools, ...config.append_allowed_tools])).sort();
        }
        const disallowedTools = config.disallowed_tools
            ? Array.from(new Set(config.disallowed_tools)).sort()
            : undefined;
        let isTempDir = false;
        let workingDir;
        if (config.working_dir) {
            workingDir = config.working_dir;
        }
        else {
            isTempDir = true;
        }
        // Just the keys we'll use to compute the cache key first
        // Lets us avoid unnecessary work and cleanup if there's a cache hit
        const cacheKeyQueryOptions = {
            maxTurns: config.max_turns,
            model: config.model,
            fallbackModel: config.fallback_model,
            strictMcpConfig: config.strict_mcp_config ?? true, // only allow MCP servers that are explicitly configured - true by default
            permissionMode: config.permission_mode,
            systemPrompt: config.custom_system_prompt
                ? config.custom_system_prompt
                : {
                    type: 'preset',
                    preset: 'claude_code',
                    append: config.append_system_prompt,
                },
            maxThinkingTokens: config.max_thinking_tokens,
            allowedTools,
            disallowedTools,
            plugins: config.plugins,
            env,
        };
        let shouldCache = (0, cache_1.isCacheEnabled)();
        // If we're caching, only read from cache if we're not busting it (we can still write to it when busting)
        let cache;
        let cacheKey;
        if (shouldCache) {
            let workingDirFingerprint = null;
            if (config.working_dir) {
                try {
                    workingDirFingerprint = await getWorkingDirFingerprint(config.working_dir);
                }
                catch (error) {
                    logger_1.default.error((0, dedent_1.default) `Error getting working directory fingerprint for cache key - ${config.working_dir}: ${String(error)}
            
            Caching is disabled.`);
                    shouldCache = false;
                }
            }
            if (shouldCache) {
                cache = await (0, cache_1.getCache)();
                const stringified = JSON.stringify({
                    prompt,
                    cacheKeyQueryOptions,
                    workingDirFingerprint,
                });
                // Hash to avoid super long cache keys or including sensitive env vars in the key
                const hash = crypto_1.default.createHash('sha256').update(stringified).digest('hex');
                cacheKey = `anthropic:claude-agent-sdk:${hash}`;
            }
        }
        const shouldReadCache = shouldCache && !context?.bustCache;
        const shouldWriteCache = shouldCache;
        if (shouldReadCache && cache && cacheKey) {
            try {
                const cachedResponse = await cache.get(cacheKey);
                if (cachedResponse) {
                    logger_1.default.debug(`Returning cached response for ${prompt} (cache key: ${cacheKey}): ${cachedResponse}`);
                    return JSON.parse(cachedResponse);
                }
            }
            catch (error) {
                logger_1.default.error(`Error getting cached response for ${prompt}: ${String(error)}`);
            }
        }
        // Transform MCP config to Claude Agent SDK MCP servers
        const mcpServers = config.mcp ? (0, transform_1.transformMCPConfigToClaudeCode)(config.mcp) : {};
        if (workingDir) {
            // verify the working dir exists and is a directory
            let stats;
            try {
                stats = fs_1.default.statSync(workingDir);
            }
            catch (err) {
                throw new Error(`Working dir ${config.working_dir} does not exist or isn't accessible: ${err.message}`);
            }
            if (!stats.isDirectory()) {
                throw new Error(`Working dir ${config.working_dir} is not a directory`);
            }
        }
        else if (isTempDir) {
            // use a temp dir
            workingDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'promptfoo-claude-agent-sdk-'));
        }
        // Make sure we didn't already abort
        if (callOptions?.abortSignal?.aborted) {
            return { error: 'Claude Agent SDK call aborted before it started' };
        }
        // Propagate abort signal to the Claude Agent SDK call
        const abortController = new AbortController();
        let abortHandler;
        if (callOptions?.abortSignal) {
            abortHandler = () => {
                abortController.abort(callOptions.abortSignal.reason);
            };
            callOptions.abortSignal.addEventListener('abort', abortHandler);
        }
        // Make the Claude Agent SDK call
        const options = {
            ...cacheKeyQueryOptions,
            abortController,
            mcpServers,
            cwd: workingDir,
        };
        const queryParams = { prompt, options };
        // Debug log for plugins specifically
        logger_1.default.debug('[Claude Agent SDK] Final plugins value being passed to SDK:', {
            plugins: options.plugins,
            pluginsType: typeof options.plugins,
            pluginsIsArray: Array.isArray(options.plugins),
        });
        // Log the query params for debugging
        logger_1.default.debug(`Calling Claude Agent SDK: ${JSON.stringify({
            prompt,
            options: {
                ...options,
                // overwrite with metadata instead of the full objects to avoid logging secrets
                mcpServers: options.mcpServers ? Object.keys(options.mcpServers) : undefined,
                env: Object.keys(env).length > 0 ? Object.keys(env) : undefined,
                plugins: options.plugins, // Include plugins in the log
            },
        })}`);
        try {
            // Dynamically import the ESM module once and cache it
            if (!this.claudeCodeModule) {
                this.claudeCodeModule = await loadClaudeCodeSDK();
            }
            const res = await this.claudeCodeModule.query(queryParams);
            for await (const msg of res) {
                if (msg.type == 'result') {
                    const raw = JSON.stringify(msg);
                    const tokenUsage = {
                        prompt: msg.usage?.input_tokens,
                        completion: msg.usage?.output_tokens,
                        total: msg.usage?.input_tokens && msg.usage?.output_tokens
                            ? msg.usage?.input_tokens + msg.usage?.output_tokens
                            : undefined,
                    };
                    const cost = msg.total_cost_usd ?? 0;
                    const sessionId = msg.session_id;
                    if (msg.subtype == 'success') {
                        logger_1.default.debug(`Claude Agent SDK response: ${raw}`);
                        const response = {
                            output: msg.result,
                            tokenUsage,
                            cost,
                            raw,
                            sessionId,
                        };
                        if (shouldWriteCache && cache && cacheKey) {
                            try {
                                await cache.set(cacheKey, JSON.stringify(response));
                            }
                            catch (error) {
                                logger_1.default.error(`Error caching response for ${prompt}: ${String(error)}`);
                            }
                        }
                        return response;
                    }
                    else {
                        return {
                            error: `Claude Agent SDK call failed: ${msg.subtype}`,
                            tokenUsage,
                            cost,
                            raw,
                            sessionId,
                        };
                    }
                }
            }
            return { error: "Claude Agent SDK call didn't return a result" };
        }
        catch (error) {
            const isAbort = error?.name === 'AbortError' || callOptions?.abortSignal?.aborted;
            if (isAbort) {
                logger_1.default.warn('Claude Agent SDK call aborted');
                return { error: 'Claude Agent SDK call aborted' };
            }
            logger_1.default.error(`Error calling Claude Agent SDK: ${error}`);
            return {
                error: `Error calling Claude Agent SDK: ${error}`,
            };
        }
        finally {
            if (isTempDir && workingDir) {
                // Clean up the temp dir
                fs_1.default.rmSync(workingDir, { recursive: true, force: true });
            }
            if (callOptions?.abortSignal && abortHandler) {
                callOptions.abortSignal.removeEventListener('abort', abortHandler);
            }
        }
    }
    toString() {
        return '[Anthropic Claude Agent SDK Provider]';
    }
    /**
     * For normal Claude Agent SDK support, just use the Anthropic API key
     * Users can also use Bedrock (with CLAUDE_CODE_USE_BEDROCK env var) or Vertex (with CLAUDE_CODE_USE_VERTEX env var)
     */
    getApiKey() {
        return this.config?.apiKey || this.env?.ANTHROPIC_API_KEY || (0, envars_1.getEnvString)('ANTHROPIC_API_KEY');
    }
    async cleanup() {
        // no cleanup needed
    }
}
exports.ClaudeCodeSDKProvider = ClaudeCodeSDKProvider;
ClaudeCodeSDKProvider.ANTHROPIC_MODELS = util_1.ANTHROPIC_MODELS;
ClaudeCodeSDKProvider.ANTHROPIC_MODELS_NAMES = util_1.ANTHROPIC_MODELS.map((model) => model.id);
/**
 * Get a fingerprint for the working directory to use as a cache key. Checks directory mtime and descendant file mtimes recursively.
 *
 * This allows for caching prompts that use the same working directory when the files haven't changed.
 *
 * Simple/naive approach with recursion, statSync/readdirSync, and sanity-check timeout should be fine for normal use cases—even with thousands of files it's likely fast enough. Could be optimized later to remove recursion and use async fs calls with a queue and batching if it ever becomes an issue.
 */
const FINGERPRINT_TIMEOUT_MS = 2000;
async function getWorkingDirFingerprint(workingDir) {
    const dirStat = fs_1.default.statSync(workingDir);
    const dirMtime = dirStat.mtimeMs;
    const startTime = Date.now();
    // Recursively get all files
    const getAllFiles = (dir, files = []) => {
        if (Date.now() - startTime > FINGERPRINT_TIMEOUT_MS) {
            throw new Error('Working directory fingerprint timed out');
        }
        const entries = fs_1.default.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path_1.default.join(dir, entry.name);
            if (entry.isDirectory()) {
                getAllFiles(fullPath, files);
            }
            else if (entry.isFile()) {
                files.push(fullPath);
            }
        }
        return files;
    };
    const allFiles = getAllFiles(workingDir);
    // Create fingerprint from directory mtime + all file mtimes
    const fileMtimes = allFiles
        .map((file) => {
        const stat = fs_1.default.statSync(file);
        const relativePath = path_1.default.relative(workingDir, file);
        return `${relativePath}:${stat.mtimeMs}`;
    })
        .sort(); // Sort for consistent ordering
    const fingerprintData = `dir:${dirMtime};files:${fileMtimes.join(',')}`;
    const fingerprint = crypto_1.default.createHash('sha256').update(fingerprintData).digest('hex');
    return fingerprint;
}
//# sourceMappingURL=claude-agent-sdk.js.map