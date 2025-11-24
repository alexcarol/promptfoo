"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolResponse = createToolResponse;
exports.withTimeout = withTimeout;
/**
 * Creates a standardized tool response
 */
function createToolResponse(tool, success, data, error) {
    const response = {
        tool,
        success,
        timestamp: new Date().toISOString(),
    };
    if (success && data !== undefined) {
        response.data = data;
    }
    if (!success && error) {
        response.error = error;
    }
    return {
        content: [{ type: 'text', text: JSON.stringify(response, null, 2) }],
        isError: !success,
    };
}
/**
 * Creates a promise that rejects after the specified timeout
 */
function withTimeout(promise, timeoutMs, errorMessage) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
    ]);
}
//# sourceMappingURL=utils.js.map