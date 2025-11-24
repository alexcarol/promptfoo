import winston from 'winston';
type LogCallback = (message: string) => void;
export declare let globalLogCallback: LogCallback | null;
export declare function setLogCallback(callback: LogCallback | null): void;
export declare function setStructuredLogging(enabled: boolean): void;
export declare const LOG_LEVELS: {
    readonly error: 0;
    readonly warn: 1;
    readonly info: 2;
    readonly debug: 3;
};
type LogLevel = keyof typeof LOG_LEVELS;
/**
 * Context object for sanitized logging
 * Allows passing structured data that will be automatically sanitized
 */
export interface SanitizedLogContext {
    url?: string;
    headers?: Record<string, string>;
    body?: any;
    queryParams?: Record<string, string>;
    [key: string]: any;
}
export declare let sourceMapSupportInitialized: boolean;
export declare function initializeSourceMapSupport(): Promise<void>;
/**
 * Gets the caller location (filename and line number)
 * @returns String with file location information
 */
export declare function getCallerLocation(): string;
type StrictLogMethod = (message: string) => winston.Logger;
type StrictLogger = Omit<winston.Logger, keyof typeof LOG_LEVELS> & {
    [K in keyof typeof LOG_LEVELS]: StrictLogMethod;
};
export declare const consoleFormatter: winston.Logform.Format;
export declare const fileFormatter: winston.Logform.Format;
export declare const winstonLogger: winston.Logger;
export declare function getLogLevel(): LogLevel;
export declare function setLogLevel(level: LogLevel): void;
export declare function isDebugEnabled(): boolean;
/**
 * Initialize per-run logging
 */
export declare function initializeRunLogging(): void;
/**
 * Replace the logger instance with a custom logger
 * Useful for integrating with external logging systems
 * @param customLogger - Logger instance that implements the required interface
 * @throws Error if customLogger is missing required methods
 */
export declare function setLogger(customLogger: Pick<StrictLogger, 'debug' | 'info' | 'warn' | 'error'>): void;
declare const logger: {
    error: (message: string, context?: SanitizedLogContext) => void;
    warn: (message: string, context?: SanitizedLogContext) => void;
    info: (message: string, context?: SanitizedLogContext) => void;
    debug: (message: string, context?: SanitizedLogContext) => void;
    add: (transport: winston.transport) => winston.Logger | undefined;
    remove: (transport: winston.transport) => winston.Logger | undefined;
    readonly transports: winston.transport[];
    level: string;
};
/**
 * Logs request/response details in a formatted way
 * @param url - Request URL
 * @param requestBody - Request body object
 * @param response - Response object (optional)
 * @param error - Whether to log as error (true) or debug (false)
 */
export declare function logRequestResponse(options: {
    url: string;
    requestBody: BodyInit | null | undefined;
    requestMethod: string;
    response?: Response | null;
    error?: boolean;
}): Promise<void>;
export default logger;
//# sourceMappingURL=logger.d.ts.map