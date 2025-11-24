"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTransformResponse = createTransformResponse;
exports.createTransformRequest = createTransformRequest;
const logger_1 = __importDefault(require("../logger"));
const json_1 = require("../util/json");
const sanitizer_1 = require("../util/sanitizer");
// This is in another module so it can be imported by the frontend
// Useful to test these in the UI before running an eval
// Note: file:// references should be pre-loaded in http.ts using loadTransformModule
// before being passed to this function. This is because we can't use importModule in the frontend.
async function createTransformResponse(parser) {
    if (!parser) {
        return (data, text) => ({ output: data || text });
    }
    if (typeof parser === 'function') {
        return (data, text, context) => {
            try {
                const result = parser(data, text, context);
                if (typeof result === 'object') {
                    return result;
                }
                else {
                    return { output: result };
                }
            }
            catch (err) {
                logger_1.default.error(`[Http Provider] Error in response transform function: ${String(err)}. Data: ${(0, json_1.safeJsonStringify)(data)}. Text: ${text}. Context: ${(0, json_1.safeJsonStringify)(context)}.`);
                throw err;
            }
        };
    }
    if (typeof parser === 'string' && parser.startsWith('file://')) {
        // This should have been pre-loaded in http.ts using loadTransformModule
        throw new Error(`Response transform with file:// reference should be pre-loaded before calling createTransformResponse. This is a bug in the HTTP provider implementation.`);
    }
    else if (typeof parser === 'string') {
        return (data, text, context) => {
            try {
                const trimmedParser = parser.trim();
                // Check if it's a function expression (either arrow or regular)
                const isFunctionExpression = /^(\(.*?\)\s*=>|function\s*\(.*?\))/.test(trimmedParser);
                const transformFn = new Function('json', 'text', 'context', isFunctionExpression
                    ? `try { return (${trimmedParser})(json, text, context); } catch(e) { throw new Error('Transform failed: ' + e.message + ' : ' + text + ' : ' + JSON.stringify(json) + ' : ' + JSON.stringify(context)); }`
                    : `try { return (${trimmedParser}); } catch(e) { throw new Error('Transform failed: ' + e.message + ' : ' + text + ' : ' + JSON.stringify(json) + ' : ' + JSON.stringify(context)); }`);
                let resp;
                if (context) {
                    resp = transformFn(data || null, text, context);
                }
                else {
                    resp = transformFn(data || null, text);
                }
                if (typeof resp === 'string') {
                    return { output: resp };
                }
                return resp;
            }
            catch (err) {
                logger_1.default.error(`[Http Provider] Error in response transform: ${String(err)}. Data: ${(0, json_1.safeJsonStringify)(data)}. Text: ${text}. Context: ${(0, json_1.safeJsonStringify)(context)}.`);
                throw new Error(`Failed to transform response: ${String(err)}`);
            }
        };
    }
    throw new Error(`Unsupported response transform type: ${typeof parser}. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.`);
}
async function createTransformRequest(transform) {
    if (!transform) {
        return (prompt) => prompt;
    }
    if (typeof transform === 'function') {
        return async (prompt, vars, context) => {
            try {
                // Pass prompt, vars, and context to user-provided function (extra args are safe)
                return await transform(prompt, vars, context);
            }
            catch (err) {
                const errorMessage = err instanceof Error ? err.message : String(err);
                const wrappedError = new Error(`Error in request transform function: ${errorMessage}`);
                logger_1.default.error(wrappedError.message);
                throw wrappedError;
            }
        };
    }
    if (typeof transform === 'string' && transform.startsWith('file://')) {
        // This should have been pre-loaded in http.ts using loadTransformModule
        throw new Error(`Request transform with file:// reference should be pre-loaded before calling createTransformRequest. This is a bug in the HTTP provider implementation.`);
    }
    else if (typeof transform === 'string') {
        return async (prompt, vars, context) => {
            try {
                const trimmedTransform = transform.trim();
                // Check if it's a function expression (either arrow or regular)
                const isFunctionExpression = /^(\(.*?\)\s*=>|function\s*\(.*?\))/.test(trimmedTransform);
                let transformFn;
                if (isFunctionExpression) {
                    // For function expressions, call them with the arguments
                    transformFn = new Function('prompt', 'vars', 'context', `try { return (${trimmedTransform})(prompt, vars, context); } catch(e) { throw new Error('Transform failed: ' + e.message) }`);
                }
                else {
                    // Check if it contains a return statement
                    const hasReturn = /\breturn\b/.test(trimmedTransform);
                    if (hasReturn) {
                        // Use as function body if it has return statements
                        transformFn = new Function('prompt', 'vars', 'context', `try { ${trimmedTransform} } catch(e) { throw new Error('Transform failed: ' + e.message); }`);
                    }
                    else {
                        // Wrap simple expressions with return
                        transformFn = new Function('prompt', 'vars', 'context', `try { return (${trimmedTransform}); } catch(e) { throw new Error('Transform failed: ' + e.message); }`);
                    }
                }
                let result;
                if (context) {
                    result = await transformFn(prompt, vars, context);
                }
                else {
                    result = await transformFn(prompt, vars);
                }
                return result;
            }
            catch (err) {
                logger_1.default.error(`[Http Provider] Error in request transform: ${String(err)}. Prompt: ${prompt}. Vars: ${(0, json_1.safeJsonStringify)(vars)}. Context: ${(0, json_1.safeJsonStringify)((0, sanitizer_1.sanitizeObject)(context, { context: 'request transform' }))}.`);
                throw new Error(`Failed to transform request: ${String(err)}`);
            }
        };
    }
    throw new Error(`Unsupported request transform type: ${typeof transform}. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.`);
}
//# sourceMappingURL=httpTransforms.js.map