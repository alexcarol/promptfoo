/**
 * Base error class for all MCP tool errors
 */
export declare abstract class McpError extends Error {
    abstract readonly code: string;
    abstract readonly statusCode: number;
    readonly details?: Record<string, unknown>;
    constructor(message: string, details?: Record<string, unknown>);
    toJSON(): {
        code: string;
        message: string;
        details: Record<string, unknown> | undefined;
    };
}
/**
 * Error thrown when a tool receives invalid arguments
 */
export declare class ValidationError extends McpError {
    readonly code = "VALIDATION_ERROR";
    readonly statusCode = 400;
}
/**
 * Error thrown when a requested resource is not found
 */
export declare class NotFoundError extends McpError {
    readonly code = "NOT_FOUND";
    readonly statusCode = 404;
    constructor(resource: string, id?: string);
}
/**
 * Error thrown when configuration is invalid
 */
export declare class ConfigurationError extends McpError {
    readonly code = "CONFIGURATION_ERROR";
    readonly statusCode = 400;
    constructor(message: string, configPath?: string);
}
/**
 * Error thrown when a provider fails
 */
export declare class ProviderError extends McpError {
    readonly code = "PROVIDER_ERROR";
    readonly statusCode = 500;
    constructor(providerId: string, message: string, details?: Record<string, unknown>);
}
/**
 * Error thrown when an operation times out
 */
export declare class TimeoutError extends McpError {
    readonly code = "TIMEOUT_ERROR";
    readonly statusCode = 408;
    constructor(operation: string, timeoutMs: number);
}
/**
 * Error thrown when an external service is unavailable
 */
export declare class ServiceUnavailableError extends McpError {
    readonly code = "SERVICE_UNAVAILABLE";
    readonly statusCode = 503;
    constructor(service: string, details?: Record<string, unknown>);
}
/**
 * Error thrown when authentication or authorization fails
 */
export declare class AuthenticationError extends McpError {
    readonly code = "AUTHENTICATION_ERROR";
    readonly statusCode = 401;
    constructor(message?: string);
}
/**
 * Error thrown when sharing functionality is not available
 */
export declare class SharingError extends McpError {
    readonly code = "SHARING_ERROR";
    readonly statusCode = 503;
}
/**
 * Error thrown when rate limits are exceeded
 */
export declare class RateLimitError extends McpError {
    readonly code = "RATE_LIMIT_ERROR";
    readonly statusCode = 429;
    constructor(service: string, retryAfter?: number, details?: Record<string, unknown>);
}
/**
 * Error thrown when file operations fail
 */
export declare class FileOperationError extends McpError {
    readonly code = "FILE_OPERATION_ERROR";
    readonly statusCode = 500;
    constructor(operation: 'read' | 'write' | 'delete' | 'create', filePath: string, originalError?: Error);
}
/**
 * Utility function to convert unknown errors to McpError
 */
export declare function toMcpError(error: unknown, defaultMessage?: string): McpError;
/**
 * Type guard to check if an error is an McpError
 */
export declare function isMcpError(error: unknown): error is McpError;
//# sourceMappingURL=errors.d.ts.map