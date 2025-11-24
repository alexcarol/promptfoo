"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createToolResponse = createToolResponse;
exports.withTimeout = withTimeout;
exports.safeStringify = safeStringify;
exports.hasKey = hasKey;
exports.getProperty = getProperty;
exports.assertNotNull = assertNotNull;
exports.filterNonNull = filterNonNull;
exports.debounce = debounce;
exports.retry = retry;
exports.formatDuration = formatDuration;
exports.truncateText = truncateText;
/**
 * Creates a standardized tool response with proper typing
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
    const content = {
        type: 'text',
        text: JSON.stringify(response, null, 2),
    };
    return {
        content: [content],
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
/**
 * Safely stringify objects, handling circular references and BigInt
 */
function safeStringify(value, space, replacer) {
    return JSON.stringify(value, (key, val) => {
        // Handle BigInt
        if (typeof val === 'bigint') {
            return val.toString();
        }
        // Handle functions
        if (typeof val === 'function') {
            return '[Function]';
        }
        // Handle undefined
        if (val === undefined) {
            return '[Undefined]';
        }
        // Apply custom replacer if provided
        return replacer ? replacer(key, val) : val;
    }, space);
}
/**
 * Type-safe object key checking
 */
function hasKey(obj, key) {
    return key in obj;
}
/**
 * Type-safe property access with default value
 */
function getProperty(obj, key, defaultValue) {
    const value = obj[key];
    return value === undefined ? defaultValue : value;
}
/**
 * Validate that a value is not null or undefined
 */
function assertNotNull(value, message) {
    if (value === null || value === undefined) {
        throw new Error(message || 'Value cannot be null or undefined');
    }
    return value;
}
/**
 * Type-safe array filtering that removes null/undefined values
 */
function filterNonNull(array) {
    return array.filter((item) => Boolean(item));
}
/**
 * Debounce function for rate limiting
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Create a retry function with exponential backoff
 */
async function retry(operation, options = {}) {
    const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = options;
    let lastError;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxAttempts) {
                throw lastError;
            }
            const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
    }
    throw lastError;
}
/**
 * Format duration in milliseconds to human readable format
 */
function formatDuration(ms) {
    if (ms < 1000) {
        return `${ms}ms`;
    }
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) {
        return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (minutes < 60) {
        return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}
/**
 * Truncate text to specified length with ellipsis
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength - 3) + '...';
}
//# sourceMappingURL=utils.js.map