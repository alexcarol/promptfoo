"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transformMCPToolsToOpenAi = transformMCPToolsToOpenAi;
exports.transformMCPToolsToAnthropic = transformMCPToolsToAnthropic;
exports.transformMCPToolsToGoogle = transformMCPToolsToGoogle;
exports.transformMCPConfigToClaudeCode = transformMCPConfigToClaudeCode;
const util_1 = require("./util");
function transformMCPToolsToOpenAi(tools) {
    return tools.map((tool) => {
        const schema = tool.inputSchema;
        let properties = {};
        let required = undefined;
        let additionalProperties = undefined;
        if (schema && typeof schema === 'object' && 'properties' in schema) {
            // Extract properties and required fields from the schema
            properties = schema.properties ?? {};
            required = schema.required;
            // Preserve additionalProperties if it exists
            if ('additionalProperties' in schema) {
                additionalProperties = schema.additionalProperties;
            }
        }
        else if (schema && typeof schema === 'object') {
            // Schema exists but doesn't have properties field
            // This shouldn't normally happen with MCP SDK, but handle it gracefully
            properties = {};
        }
        else {
            // No schema or invalid schema
            properties = {};
        }
        return {
            type: 'function',
            function: {
                name: tool.name,
                description: tool.description,
                parameters: {
                    type: 'object',
                    properties,
                    ...(required && required.length > 0 ? { required } : {}),
                    ...(additionalProperties !== undefined ? { additionalProperties } : {}),
                },
            },
        };
    });
}
function transformMCPToolsToAnthropic(tools) {
    return tools.map((tool) => {
        // Remove $schema field if present to prevent provider errors
        const { $schema: _$schema, ...cleanSchema } = tool.inputSchema;
        return {
            name: tool.name,
            description: tool.description,
            input_schema: {
                type: 'object',
                ...cleanSchema,
            },
        };
    });
}
function transformMCPToolsToGoogle(tools) {
    const functionDeclarations = tools.map((tool) => {
        const schema = tool.inputSchema;
        let parameters = { type: 'OBJECT', properties: {} };
        if (schema && typeof schema === 'object' && 'properties' in schema) {
            // Remove $schema field if present
            const { $schema: _$schema, ...cleanSchema } = schema;
            parameters = { type: 'OBJECT', ...cleanSchema };
        }
        else {
            parameters = {
                type: 'OBJECT',
                properties: schema || {},
            };
        }
        return {
            name: tool.name,
            description: tool.description,
            parameters,
        };
    });
    return [{ functionDeclarations }];
}
function transformMCPConfigToClaudeCode(config) {
    const servers = config.servers?.map((server) => transformMCPServerConfigToClaudeCode(server)) ?? [];
    if (config.server) {
        servers.push(transformMCPServerConfigToClaudeCode(config.server));
    }
    return servers.reduce((acc, transformed) => {
        const [key, out] = transformed;
        acc[key] = out;
        return acc;
    }, {});
}
function transformMCPServerConfigToClaudeCode(config) {
    const key = config.name ?? config.url ?? config.command ?? 'default';
    let out;
    if (config.url) {
        out = {
            type: 'http',
            url: config.url,
            headers: { ...(config.headers ?? {}), ...(0, util_1.getAuthHeaders)(config) },
        };
    }
    else if (config.command && config.args) {
        out = { type: 'stdio', command: config.command, args: config.args };
    }
    else if (config.path) {
        const isPy = config.path.endsWith('.py');
        const command = isPy ? (process.platform === 'win32' ? 'python' : 'python3') : process.execPath;
        out = { type: 'stdio', command, args: [config.path] };
    }
    else {
        throw new Error('MCP configuration cannot be converted to Claude Agent SDK MCP server config');
    }
    return [key, out];
}
//# sourceMappingURL=transform.js.map