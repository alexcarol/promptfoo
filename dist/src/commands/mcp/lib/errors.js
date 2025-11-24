"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileOperationError = exports.RateLimitError = exports.SharingError = exports.AuthenticationError = exports.ServiceUnavailableError = exports.TimeoutError = exports.ProviderError = exports.ConfigurationError = exports.NotFoundError = exports.ValidationError = exports.McpError = void 0;
exports.toMcpError = toMcpError;
exports.isMcpError = isMcpError;
/**
 * Base error class for all MCP tool errors
 */
class McpError extends Error {
    constructor(message, details) {
        super(message);
        this.name = this.constructor.name;
        this.details = details;
        Error.captureStackTrace(this, this.constructor);
    }
    toJSON() {
        return {
            code: this.code,
            message: this.message,
            details: this.details,
        };
    }
}
exports.McpError = McpError;
/**
 * Error thrown when a tool receives invalid arguments
 */
class ValidationError extends McpError {
    constructor() {
        super(...arguments);
        this.code = 'VALIDATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ValidationError = ValidationError;
/**
 * Error thrown when a requested resource is not found
 */
class NotFoundError extends McpError {
    constructor(resource, id) {
        const message = id ? `${resource} with ID "${id}" not found` : `${resource} not found`;
        super(message, { resource, id });
        this.code = 'NOT_FOUND';
        this.statusCode = 404;
    }
}
exports.NotFoundError = NotFoundError;
/**
 * Error thrown when configuration is invalid
 */
class ConfigurationError extends McpError {
    constructor(message, configPath) {
        super(message, { configPath });
        this.code = 'CONFIGURATION_ERROR';
        this.statusCode = 400;
    }
}
exports.ConfigurationError = ConfigurationError;
/**
 * Error thrown when a provider fails
 */
class ProviderError extends McpError {
    constructor(providerId, message, details) {
        super(`Provider "${providerId}" error: ${message}`, { providerId, ...details });
        this.code = 'PROVIDER_ERROR';
        this.statusCode = 500;
    }
}
exports.ProviderError = ProviderError;
/**
 * Error thrown when an operation times out
 */
class TimeoutError extends McpError {
    constructor(operation, timeoutMs) {
        super(`Operation "${operation}" timed out after ${timeoutMs}ms`, { operation, timeoutMs });
        this.code = 'TIMEOUT_ERROR';
        this.statusCode = 408;
    }
}
exports.TimeoutError = TimeoutError;
/**
 * Error thrown when an external service is unavailable
 */
class ServiceUnavailableError extends McpError {
    constructor(service, details) {
        super(`Service "${service}" is unavailable`, { service, ...details });
        this.code = 'SERVICE_UNAVAILABLE';
        this.statusCode = 503;
    }
}
exports.ServiceUnavailableError = ServiceUnavailableError;
/**
 * Error thrown when authentication or authorization fails
 */
class AuthenticationError extends McpError {
    constructor(message = 'Authentication failed') {
        super(message);
        this.code = 'AUTHENTICATION_ERROR';
        this.statusCode = 401;
    }
}
exports.AuthenticationError = AuthenticationError;
/**
 * Error thrown when sharing functionality is not available
 */
class SharingError extends McpError {
    constructor() {
        super(...arguments);
        this.code = 'SHARING_ERROR';
        this.statusCode = 503;
    }
}
exports.SharingError = SharingError;
/**
 * Error thrown when rate limits are exceeded
 */
class RateLimitError extends McpError {
    constructor(service, retryAfter, details) {
        const message = retryAfter
            ? `Rate limit exceeded for ${service}. Retry after ${retryAfter} seconds.`
            : `Rate limit exceeded for ${service}`;
        super(message, { service, retryAfter, ...details });
        this.code = 'RATE_LIMIT_ERROR';
        this.statusCode = 429;
    }
}
exports.RateLimitError = RateLimitError;
/**
 * Error thrown when file operations fail
 */
class FileOperationError extends McpError {
    constructor(operation, filePath, originalError) {
        super(`Failed to ${operation} file: ${filePath}`, {
            operation,
            filePath,
            originalError: originalError?.message,
        });
        this.code = 'FILE_OPERATION_ERROR';
        this.statusCode = 500;
    }
}
exports.FileOperationError = FileOperationError;
/**
 * Utility function to convert unknown errors to McpError
 */
function toMcpError(error, defaultMessage = 'Unknown error occurred') {
    if (error instanceof McpError) {
        return error;
    }
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        // Check for specific error patterns
        if (message.includes('rate limit')) {
            return new RateLimitError('service', undefined, { originalError: error.message });
        }
        if (message.includes('not found') || message.includes('enoent')) {
            return new NotFoundError('Resource', undefined);
        }
        if (message.includes('timeout') || message.includes('timed out')) {
            return new TimeoutError('Operation', 30000);
        }
        if (message.includes('auth') ||
            message.includes('unauthorized') ||
            message.includes('forbidden')) {
            return new AuthenticationError(error.message);
        }
        if (message.includes('config') || message.includes('invalid')) {
            return new ConfigurationError(error.message);
        }
        return new ValidationError(error.message);
    }
    return new ValidationError(defaultMessage, { originalError: error });
}
/**
 * Type guard to check if an error is an McpError
 */
function isMcpError(error) {
    return error instanceof McpError;
}
//# sourceMappingURL=errors.js.map