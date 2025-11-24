"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatConfigBody = formatConfigBody;
exports.formatConfigHeaders = formatConfigHeaders;
exports.validateSessionConfig = validateSessionConfig;
exports.determineEffectiveSessionSource = determineEffectiveSessionSource;
const logger_1 = __importDefault(require("../logger"));
/**
 * Formats config body for troubleshooting display
 */
function formatConfigBody({ body }) {
    if (!body) {
        return 'None configured';
    }
    if (typeof body === 'string') {
        // Try to parse and pretty-print JSON strings
        try {
            const parsed = JSON.parse(body);
            return ('\n' +
                JSON.stringify(parsed, null, 2)
                    .split('\n')
                    .map((line) => `    ${line}`)
                    .join('\n'));
        }
        catch {
            // If not JSON, just indent it
            return '\n    ' + body;
        }
    }
    // If it's already an object, stringify it
    return ('\n' +
        JSON.stringify(body, null, 2)
            .split('\n')
            .map((line) => `    ${line}`)
            .join('\n'));
}
/**
 * Formats config headers for troubleshooting display
 */
function formatConfigHeaders({ headers, }) {
    if (!headers) {
        return 'None configured';
    }
    const headerLines = Object.entries(headers)
        .map(([key, value]) => `    ${key}: ${value}`)
        .join('\n');
    return `\n${headerLines}`;
}
/**
 * Validates session configuration for both client and server sessions
 * Logs warnings if configuration looks invalid but does not prevent test execution
 */
function validateSessionConfig({ provider, sessionSource, sessionConfig, }) {
    const configStr = JSON.stringify(provider.config || {});
    const hasSessionIdTemplate = configStr.includes('{{sessionId}}');
    // Both client and server sessions require {{sessionId}} in the config
    if (!hasSessionIdTemplate) {
        const reasonMessage = sessionSource === 'client'
            ? 'When using client-side sessions, you should include {{sessionId}} in your request headers or body to send the client-generated session ID.'
            : 'When using server-side sessions, you should include {{sessionId}} in your request headers or body to send the server-extracted session ID in subsequent requests.';
        logger_1.default.warn('[testProviderSession] Warning: {{sessionId}} not found in provider configuration. ' +
            reasonMessage, {
            providerId: provider.id,
            sessionSource,
        });
    }
    // Server sessions additionally require a sessionParser
    if (sessionSource === 'server') {
        const sessionParser = sessionConfig?.sessionParser || provider.config?.sessionParser;
        if (!sessionParser || sessionParser.trim() === '') {
            logger_1.default.warn('[testProviderSession] Warning: Session source is server but no session parser configured. ' +
                'When using server-side sessions, you should configure a session parser to extract the session ID from the response.', {
                providerId: provider.id,
            });
        }
    }
}
/**
 * Determines the effective session source based on config and defaults
 */
function determineEffectiveSessionSource({ provider, sessionConfig, }) {
    return (sessionConfig?.sessionSource ||
        provider.config?.sessionSource ||
        (provider.config.sessionParser ? 'server' : 'client'));
}
//# sourceMappingURL=util.js.map