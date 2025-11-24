"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketProvider = exports.processResult = void 0;
exports.createTransformResponse = createTransformResponse;
exports.createStreamResponse = createStreamResponse;
const path_1 = __importDefault(require("path"));
const ws_1 = __importDefault(require("ws"));
const cliState_1 = __importDefault(require("../cliState"));
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
const fileExtensions_1 = require("../util/fileExtensions");
const invariant_1 = __importDefault(require("../util/invariant"));
const json_1 = require("../util/json");
const templates_1 = require("../util/templates");
const shared_1 = require("./shared");
const nunjucks = (0, templates_1.getNunjucksEngine)();
const processResult = (transformedResponse) => {
    if (typeof transformedResponse === 'object' &&
        (transformedResponse.output || transformedResponse.error)) {
        return transformedResponse;
    }
    return { output: transformedResponse };
};
exports.processResult = processResult;
function createTransformResponse(parser) {
    if (typeof parser === 'function') {
        return parser;
    }
    if (typeof parser === 'string') {
        return new Function('data', `return ${parser}`);
    }
    return (data) => ({ output: data });
}
async function createStreamResponse(transform) {
    if (!transform) {
        return (_accumulator, data) => [(0, exports.processResult)(data), true];
    }
    if (typeof transform === 'function') {
        return (accumulator, data, context) => {
            try {
                // Pass accumulator, data, and context to user-provided function (extra args are safe)
                return transform(accumulator, data, context);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                const wrappedError = new Error(`Error in stream response function: ${errorMessage}`);
                logger_1.default.error(wrappedError.message);
                throw wrappedError;
            }
        };
    }
    if (typeof transform === 'string' && transform.startsWith('file://')) {
        let filename = transform.slice('file://'.length);
        let functionName;
        if (filename.includes(':')) {
            const splits = filename.split(':');
            if (splits[0] && (0, fileExtensions_1.isJavascriptFile)(splits[0])) {
                [filename, functionName] = splits;
            }
        }
        const requiredModule = await (0, esm_1.importModule)(path_1.default.resolve(cliState_1.default.basePath || '', filename), functionName);
        if (typeof requiredModule === 'function') {
            return (accumulator, data, context) => {
                try {
                    return requiredModule(accumulator, data, context);
                }
                catch (err) {
                    const errorMessage = err instanceof Error ? err.message : String(err);
                    const wrappedError = new Error(`Error in stream response function from ${filename}: ${errorMessage}`);
                    logger_1.default.error(wrappedError.message);
                    throw wrappedError;
                }
            };
        }
        throw new Error(`stream response malformed: ${filename} must export a function or have a default export as a function`);
    }
    else if (typeof transform === 'string') {
        return (accumulator, data, context) => {
            const trimmedTransform = transform.trim();
            // Check if it's a function expression (either arrow or regular)
            const isFunctionExpression = /^(\(.*?\)\s*=>|function\s*\(.*?\))/.test(trimmedTransform);
            let transformFn;
            if (isFunctionExpression) {
                // For function expressions, call them with the arguments
                transformFn = new Function('accumulator', 'data', 'context', `try { return (${trimmedTransform})(accumulator, data, context); } catch(e) { throw new Error('Error executing streamResponse function: ' + e.message) }`);
            }
            else {
                // Check if it contains a return statement
                const hasReturn = /\breturn\b/.test(trimmedTransform);
                if (hasReturn) {
                    // Use as function body if it has return statements
                    transformFn = new Function('accumulator', 'data', 'context', `try { ${trimmedTransform} } catch(e) { throw new Error('Error executing streamResponse function: ' + e.message); }`);
                }
                else {
                    // Wrap simple expressions with return
                    transformFn = new Function('accumulator', 'data', 'context', `try { return (${trimmedTransform}); } catch(e) { throw new Error('Error executing streamResponse function: ' + e.message); }`);
                }
            }
            const result = transformFn(accumulator, data, context);
            return result;
        };
    }
    throw new Error(`Unsupported request transform type: ${typeof transform}. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.`);
}
class WebSocketProvider {
    constructor(url, options) {
        this.config = options.config;
        this.url = this.config.url || url;
        this.timeoutMs = this.config.timeoutMs || shared_1.REQUEST_TIMEOUT_MS;
        this.transformResponse = createTransformResponse(this.config.transformResponse || this.config.responseParser);
        this.streamResponse = this.config.streamResponse
            ? createStreamResponse(this.config.streamResponse)
            : undefined;
        (0, invariant_1.default)(this.config.messageTemplate, `Expected WebSocket provider ${this.url} to have a config containing {messageTemplate}, but got ${(0, json_1.safeJsonStringify)(this.config)}`);
    }
    id() {
        return this.url;
    }
    toString() {
        return `[WebSocket Provider ${this.url}]`;
    }
    async callApi(prompt, context) {
        const vars = {
            ...(context?.vars || {}),
            prompt,
        };
        const message = nunjucks.renderString(this.config.messageTemplate, vars);
        const streamResponse = this.streamResponse ? await this.streamResponse : undefined;
        logger_1.default.debug(`Sending WebSocket message to ${this.url}: ${message}`);
        let accumulator = { error: 'unknown error occurred' };
        return new Promise((resolve, reject) => {
            const wsOptions = {};
            if (this.config.headers) {
                wsOptions.headers = this.config.headers;
            }
            const ws = new ws_1.default(this.url, wsOptions);
            const timeout = setTimeout(() => {
                ws.close();
                logger_1.default.error(`[WebSocket Provider] Request timed out`);
                reject(new Error(`WebSocket request timed out after ${this.timeoutMs}ms`));
            }, this.timeoutMs);
            ws.on('open', () => {
                logger_1.default.debug(`[WebSocket Provider]: WebSocket connection opened successfully`);
            });
            ws.onmessage = (event) => {
                clearTimeout(timeout);
                if (streamResponse) {
                    try {
                        logger_1.default.debug(`[WebSocket Provider] Data Received: ${JSON.stringify(event.data)}`);
                    }
                    catch {
                        // ignore
                    }
                    try {
                        const [newAccumulator, isComplete] = streamResponse(accumulator, event, context);
                        accumulator = newAccumulator;
                        if (isComplete) {
                            ws.close();
                            const response = (0, exports.processResult)(accumulator);
                            resolve(response);
                        }
                    }
                    catch (err) {
                        logger_1.default.debug(`[WebSocket Provider]: ${err.message}`);
                        ws.close();
                        reject(new Error(`Error executing streamResponse function: ${err.message}`));
                    }
                }
                else {
                    try {
                        let data = event.data;
                        if (typeof data === 'string') {
                            try {
                                data = JSON.parse(data);
                            }
                            catch {
                                // If parsing fails, assume it's a text response
                            }
                            logger_1.default.debug(`[WebSocket Provider] Data Received: ${(0, json_1.safeJsonStringify)(data)}`);
                        }
                        try {
                            const result = (0, exports.processResult)(this.transformResponse(data));
                            if (result.error) {
                                logger_1.default.debug(`[WebSocket Provider]: Error from provider ${result.error}`);
                                ws.close();
                                reject(new Error(result.error));
                            }
                            else if (result.output === undefined) {
                                ws.close();
                                reject(new Error('No output from provider'));
                            }
                            ws.close();
                            resolve(result);
                        }
                        catch (err) {
                            logger_1.default.debug(`[WebSocket Provider]: Error in transform response: ${err.message}`);
                            ws.close();
                            reject(new Error(`Failed to process response: ${err.message}`));
                        }
                    }
                    catch (err) {
                        logger_1.default.debug(`[WebSocket Provider]: Error processing response: ${err.message}`);
                        ws.close();
                        reject(new Error(`Failed to process response: ${err.message}`));
                    }
                }
            };
            ws.onerror = (err) => {
                clearTimeout(timeout);
                ws.close();
                logger_1.default.error(`[WebSocket Provider] Error:${JSON.stringify(err)}`);
                reject(new Error(`WebSocket error: ${JSON.stringify(err)}`));
            };
            ws.onopen = () => {
                logger_1.default.debug(`[WebSocket Provider] Message sent: ${(0, json_1.safeJsonStringify)(message)}`);
                ws.send(message);
            };
        });
    }
}
exports.WebSocketProvider = WebSocketProvider;
//# sourceMappingURL=websocket.js.map