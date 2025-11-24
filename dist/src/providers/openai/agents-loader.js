"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadAgentDefinition = loadAgentDefinition;
exports.loadTools = loadTools;
exports.loadHandoffs = loadHandoffs;
const path_1 = __importDefault(require("path"));
const esm_1 = require("../../esm");
const logger_1 = __importDefault(require("../../logger"));
const cliState_1 = __importDefault(require("../../cliState"));
/**
 * Load agent definition from file path or return inline definition
 */
async function loadAgentDefinition(agentConfig) {
    // If it's already an Agent instance, return it
    if (isAgentInstance(agentConfig)) {
        logger_1.default.debug('[AgentsLoader] Using provided Agent instance');
        return agentConfig;
    }
    // If it's a file path, load from file
    if (typeof agentConfig === 'string' && agentConfig.startsWith('file://')) {
        logger_1.default.debug('[AgentsLoader] Loading agent from file', { path: agentConfig });
        return await loadAgentFromFile(agentConfig);
    }
    // If it's an inline definition, convert to Agent
    if (typeof agentConfig === 'object') {
        logger_1.default.debug('[AgentsLoader] Creating agent from inline definition');
        return await createAgentFromDefinition(agentConfig);
    }
    logger_1.default.debug('[AgentsLoader] Invalid agent configuration', {
        type: typeof agentConfig,
        keys: typeof agentConfig === 'object' && agentConfig !== null
            ? Object.keys(agentConfig).slice(0, 5)
            : undefined,
    });
    throw new Error('Invalid agent configuration: expected Agent instance, file:// URL, or inline definition');
}
/**
 * Load tools from file path or return inline definitions
 */
async function loadTools(toolsConfig) {
    if (!toolsConfig) {
        return undefined;
    }
    // If it's a file path, load from file
    if (typeof toolsConfig === 'string' && toolsConfig.startsWith('file://')) {
        logger_1.default.debug('[AgentsLoader] Loading tools from file', { path: toolsConfig });
        return await loadToolsFromFile(toolsConfig);
    }
    // If it's an array, return as is
    if (Array.isArray(toolsConfig)) {
        logger_1.default.debug('[AgentsLoader] Using inline tool definitions');
        return toolsConfig;
    }
    logger_1.default.debug('[AgentsLoader] Invalid tools configuration', {
        type: typeof toolsConfig,
        isArray: Array.isArray(toolsConfig),
    });
    throw new Error('Invalid tools configuration: expected file:// URL or array');
}
/**
 * Load handoffs from file path or return inline definitions
 */
async function loadHandoffs(handoffsConfig) {
    if (!handoffsConfig) {
        return undefined;
    }
    // If it's a file path, load from file
    if (typeof handoffsConfig === 'string' && handoffsConfig.startsWith('file://')) {
        logger_1.default.debug('[AgentsLoader] Loading handoffs from file', { path: handoffsConfig });
        return await loadHandoffsFromFile(handoffsConfig);
    }
    // If it's an array, return as is
    if (Array.isArray(handoffsConfig)) {
        logger_1.default.debug('[AgentsLoader] Using inline handoff definitions');
        return handoffsConfig;
    }
    logger_1.default.debug('[AgentsLoader] Invalid handoffs configuration', {
        type: typeof handoffsConfig,
        isArray: Array.isArray(handoffsConfig),
    });
    throw new Error('Invalid handoffs configuration: expected file:// URL or array');
}
/**
 * Load agent from file
 */
async function loadAgentFromFile(filePath) {
    const resolvedPath = resolveFilePath(filePath);
    logger_1.default.debug('[AgentsLoader] Loading agent from resolved path', { path: resolvedPath });
    try {
        const module = await (0, esm_1.importModule)(resolvedPath);
        const agent = module.default || module;
        if (!isAgentInstance(agent)) {
            throw new Error(`File ${resolvedPath} does not export an Agent instance`);
        }
        return agent;
    }
    catch (error) {
        logger_1.default.error('[AgentsLoader] Failed to load agent from file', { path: resolvedPath, error });
        throw new Error(`Failed to load agent from ${resolvedPath}: ${error}`);
    }
}
/**
 * Load tools from file
 */
async function loadToolsFromFile(filePath) {
    const resolvedPath = resolveFilePath(filePath);
    logger_1.default.debug('[AgentsLoader] Loading tools from resolved path', { path: resolvedPath });
    try {
        const module = await (0, esm_1.importModule)(resolvedPath);
        const tools = module.default || module;
        if (!Array.isArray(tools)) {
            throw new Error(`File ${resolvedPath} does not export an array of tools`);
        }
        return tools;
    }
    catch (error) {
        logger_1.default.error('[AgentsLoader] Failed to load tools from file', { path: resolvedPath, error });
        throw new Error(`Failed to load tools from ${resolvedPath}: ${error}`);
    }
}
/**
 * Load handoffs from file
 */
async function loadHandoffsFromFile(filePath) {
    const resolvedPath = resolveFilePath(filePath);
    logger_1.default.debug('[AgentsLoader] Loading handoffs from resolved path', { path: resolvedPath });
    try {
        const module = await (0, esm_1.importModule)(resolvedPath);
        const handoffs = module.default || module;
        if (!Array.isArray(handoffs)) {
            throw new Error(`File ${resolvedPath} does not export an array of handoffs`);
        }
        return handoffs;
    }
    catch (error) {
        logger_1.default.error('[AgentsLoader] Failed to load handoffs from file', {
            path: resolvedPath,
            error,
        });
        throw new Error(`Failed to load handoffs from ${resolvedPath}: ${error}`);
    }
}
/**
 * Create an Agent instance from an inline definition
 */
async function createAgentFromDefinition(definition) {
    try {
        // Dynamically import Agent class
        const { Agent } = await Promise.resolve().then(() => __importStar(require('@openai/agents')));
        // Create agent with definition
        // Note: tools and handoffs should be actual Tool/Handoff objects, not definitions
        // They should be included in the definition if needed
        const agent = new Agent({
            name: definition.name,
            instructions: definition.instructions,
            model: definition.model,
            handoffDescription: definition.handoffDescription,
            // @ts-ignore - outputType might be various types
            outputType: definition.outputType,
            // @ts-ignore - tools and handoffs will be added separately if needed
            tools: definition.tools,
            // @ts-ignore
            handoffs: definition.handoffs,
        });
        return agent;
    }
    catch (error) {
        logger_1.default.error('[AgentsLoader] Failed to create agent from definition', {
            name: definition?.name,
            model: definition?.model,
            toolCount: definition?.tools?.length,
            handoffCount: definition?.handoffs?.length,
            error,
        });
        throw new Error(`Failed to create agent from definition: ${error}`);
    }
}
/**
 * Check if a value is an Agent instance
 */
function isAgentInstance(value) {
    // Check if it has the Agent class properties/methods
    return (value &&
        typeof value === 'object' &&
        'name' in value &&
        'instructions' in value &&
        typeof value.name === 'string');
}
/**
 * Resolve file:// path to absolute file system path
 */
function resolveFilePath(filePath) {
    // Remove file:// prefix
    const cleanPath = filePath.replace(/^file:\/\//, '');
    // If it's already absolute, return it
    if (path_1.default.isAbsolute(cleanPath)) {
        return cleanPath;
    }
    // Otherwise, resolve relative to current working directory
    const basePath = cliState_1.default.basePath || process.cwd();
    const resolvedPath = path_1.default.resolve(basePath, cleanPath);
    logger_1.default.debug('[AgentsLoader] Resolved file path', {
        original: filePath,
        basePath,
        resolved: resolvedPath,
    });
    return resolvedPath;
}
//# sourceMappingURL=agents-loader.js.map