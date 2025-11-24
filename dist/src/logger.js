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
exports.winstonLogger = exports.fileFormatter = exports.consoleFormatter = exports.sourceMapSupportInitialized = exports.LOG_LEVELS = exports.globalLogCallback = void 0;
exports.setLogCallback = setLogCallback;
exports.setStructuredLogging = setStructuredLogging;
exports.initializeSourceMapSupport = initializeSourceMapSupport;
exports.getCallerLocation = getCallerLocation;
exports.getLogLevel = getLogLevel;
exports.setLogLevel = setLogLevel;
exports.isDebugEnabled = isDebugEnabled;
exports.initializeRunLogging = initializeRunLogging;
exports.setLogger = setLogger;
exports.logRequestResponse = logRequestResponse;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const winston_1 = __importDefault(require("winston"));
const cliState_1 = __importDefault(require("./cliState"));
const envars_1 = require("./envars");
const manage_1 = require("./util/config/manage");
const json_1 = require("./util/json");
const sanitizer_1 = require("./util/sanitizer");
const MAX_LOG_FILES = 50;
exports.globalLogCallback = null;
function setLogCallback(callback) {
    exports.globalLogCallback = callback;
}
// Global configuration for structured logging
let useStructuredLogging = false;
function setStructuredLogging(enabled) {
    useStructuredLogging = enabled;
}
exports.LOG_LEVELS = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
// Lazy source map support - only loaded when debug is enabled
exports.sourceMapSupportInitialized = false;
async function initializeSourceMapSupport() {
    if (!exports.sourceMapSupportInitialized) {
        try {
            const sourceMapSupport = await Promise.resolve().then(() => __importStar(require('source-map-support')));
            sourceMapSupport.install();
            exports.sourceMapSupportInitialized = true;
        }
        catch {
            // Ignore errors. This happens in the production build, because source-map-support is a dev dependency.
        }
    }
}
/**
 * Gets the caller location (filename and line number)
 * @returns String with file location information
 */
function getCallerLocation() {
    try {
        const error = new Error();
        const stack = error.stack?.split('\n') || [];
        // Skip first 3 lines (Error, getCallerLocation, and the logger method)
        const callerLine = stack[3];
        if (callerLine) {
            // Handle different stack trace formats
            const matchParens = callerLine.match(/at (?:.*) \((.+):(\d+):(\d+)\)/);
            const matchNormal = callerLine.match(/at (.+):(\d+):(\d+)/);
            const match = matchParens || matchNormal;
            if (match) {
                // matchParens has filePath at index 1, matchNormal has it at index 1 too
                const filePath = match[1];
                const line = match[2];
                // Get just the filename from the path
                const fileName = path_1.default.basename(filePath);
                return `[${fileName}:${line}]`;
            }
        }
    }
    catch {
        // Silently handle any errors in stack trace parsing
    }
    return '';
}
/**
 * Extracts the actual message string from potentially nested info objects
 */
function extractMessage(info) {
    if (typeof info.message === 'object' && info.message !== null && 'message' in info.message) {
        return typeof info.message.message === 'string'
            ? info.message.message
            : String(info.message.message);
    }
    return typeof info.message === 'string' ? info.message : JSON.stringify(info.message);
}
exports.consoleFormatter = winston_1.default.format.printf((info) => {
    const message = extractMessage(info);
    // Call the callback if it exists
    if (exports.globalLogCallback) {
        (0, exports.globalLogCallback)(message);
    }
    const location = info.location ? `${info.location} ` : '';
    if (info.level === 'error') {
        return chalk_1.default.red(`${location}${message}`);
    }
    else if (info.level === 'warn') {
        return chalk_1.default.yellow(`${location}${message}`);
    }
    else if (info.level === 'info') {
        return `${location}${message}`;
    }
    else if (info.level === 'debug') {
        return `${chalk_1.default.cyan(location)}${message}`;
    }
    throw new Error(`Invalid log level: ${info.level}`);
});
exports.fileFormatter = winston_1.default.format.printf((info) => {
    const timestamp = new Date().toISOString();
    const location = info.location ? ` ${info.location}` : '';
    const message = extractMessage(info);
    return `${timestamp} [${info.level.toUpperCase()}]${location}: ${message}`;
});
exports.winstonLogger = winston_1.default.createLogger({
    levels: exports.LOG_LEVELS,
    transports: [
        new winston_1.default.transports.Console({
            level: (0, envars_1.getEnvString)('LOG_LEVEL', 'info'),
            format: winston_1.default.format.combine(winston_1.default.format.simple(), exports.consoleFormatter),
        }),
    ],
});
function getLogLevel() {
    return exports.winstonLogger.transports[0].level;
}
function setLogLevel(level) {
    if (level in exports.LOG_LEVELS) {
        exports.winstonLogger.transports[0].level = level;
        if (level === 'debug') {
            initializeSourceMapSupport();
        }
    }
    else {
        throw new Error(`Invalid log level: ${level}`);
    }
}
function isDebugEnabled() {
    return getLogLevel() === 'debug';
}
/**
 * Creates log directory and cleans up old log files
 * Respects PROMPTFOO_LOG_DIR environment variable to customize log location
 */
function setupLogDirectory() {
    const configDir = (0, manage_1.getConfigDirectoryPath)(true);
    const logDir = (0, envars_1.getEnvString)('PROMPTFOO_LOG_DIR')
        ? path_1.default.resolve((0, envars_1.getEnvString)('PROMPTFOO_LOG_DIR'))
        : path_1.default.join(configDir, 'logs');
    if (!fs_1.default.existsSync(logDir)) {
        fs_1.default.mkdirSync(logDir, { recursive: true });
    }
    // Clean up old log files
    try {
        const logFiles = fs_1.default
            .readdirSync(logDir)
            .filter((file) => file.startsWith('promptfoo-') && file.endsWith('.log'))
            .map((file) => ({
            name: file,
            path: path_1.default.join(logDir, file),
            mtime: fs_1.default.statSync(path_1.default.join(logDir, file)).mtime,
        }))
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()); // Sort by newest first
        // Remove old files
        if (logFiles.length >= MAX_LOG_FILES) {
            logFiles.slice(MAX_LOG_FILES).forEach((file) => {
                try {
                    fs_1.default.unlinkSync(file.path);
                }
                catch (error) {
                    logger.warn(`Error removing old log file: ${file.name} ${error}`);
                }
            });
        }
    }
    catch (error) {
        logger.warn(`Error cleaning up old log files: ${error}`);
    }
    return logDir;
}
/**
 * Creates a new log file for the current CLI run
 */
function createRunLogFile(level, { date = new Date() } = {}) {
    const logDir = setupLogDirectory();
    const timestamp = date.toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const logFile = path_1.default.join(logDir, `promptfoo-${level}-${timestamp}.log`);
    return logFile;
}
/**
 * Initialize per-run logging
 */
function initializeRunLogging() {
    try {
        const date = new Date();
        if (!(0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_DEBUG_LOG', false)) {
            cliState_1.default.debugLogFile = createRunLogFile('debug', { date });
            const runLogTransport = new winston_1.default.transports.File({
                filename: cliState_1.default.debugLogFile,
                level: 'debug', // Capture all levels in the file
                format: winston_1.default.format.combine(winston_1.default.format.simple(), exports.fileFormatter),
            });
            exports.winstonLogger.add(runLogTransport);
        }
        if (!(0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_ERROR_LOG', false)) {
            cliState_1.default.errorLogFile = createRunLogFile('error', { date });
            const errorLogTransport = new winston_1.default.transports.File({
                filename: cliState_1.default.errorLogFile,
                level: 'error',
                format: winston_1.default.format.combine(winston_1.default.format.simple(), exports.fileFormatter),
            });
            exports.winstonLogger.add(errorLogTransport);
        }
    }
    catch (error) {
        logger.warn(`Error creating run log file: ${error}`);
    }
}
/**
 * Creates a logger method for the specified log level
 */
function createLogMethod(level) {
    return (message) => {
        const location = level === 'debug' ? getCallerLocation() : isDebugEnabled() ? getCallerLocation() : '';
        if (level === 'debug') {
            initializeSourceMapSupport();
        }
        return exports.winstonLogger[level]({ message, location });
    };
}
// Internal logger implementation
let internalLogger = Object.assign({}, exports.winstonLogger, {
    error: createLogMethod('error'),
    warn: createLogMethod('warn'),
    info: createLogMethod('info'),
    debug: createLogMethod('debug'),
    add: exports.winstonLogger.add.bind(exports.winstonLogger),
    remove: exports.winstonLogger.remove.bind(exports.winstonLogger),
    transports: exports.winstonLogger.transports,
});
/**
 * Replace the logger instance with a custom logger
 * Useful for integrating with external logging systems
 * @param customLogger - Logger instance that implements the required interface
 * @throws Error if customLogger is missing required methods
 */
function setLogger(customLogger) {
    // Validate that customLogger is not null or undefined
    if (!customLogger || typeof customLogger !== 'object') {
        throw new Error('Custom logger must be a valid object with required logging methods.');
    }
    // Runtime validation guards
    const requiredMethods = ['debug', 'info', 'warn', 'error'];
    const missingMethods = requiredMethods.filter((method) => typeof customLogger[method] !== 'function');
    if (missingMethods.length > 0) {
        throw new Error(`Custom logger is missing required methods: ${missingMethods.join(', ')}. ` +
            'Logger must implement { debug: Function; info: Function; warn: Function; error: Function }');
    }
    internalLogger = customLogger;
}
/**
 * Sanitizes context object for logging using generic sanitization
 */
function sanitizeContext(context) {
    // Special handling for URLs to preserve the URL-specific sanitization logic
    const contextWithSanitizedUrls = {};
    for (const [key, value] of Object.entries(context)) {
        if (key === 'url' && typeof value === 'string') {
            contextWithSanitizedUrls[key] = (0, sanitizer_1.sanitizeUrl)(value);
        }
        else {
            contextWithSanitizedUrls[key] = value;
        }
    }
    // Apply generic object sanitization to handle all sensitive fields
    return (0, sanitizer_1.sanitizeObject)(contextWithSanitizedUrls, { context: 'log context' });
}
/**
 * Creates a log method that accepts an optional context parameter
 * If context is provided, it will be sanitized and formatted
 */
function createLogMethodWithContext(level) {
    return (message, context) => {
        if (!context) {
            internalLogger[level](message);
            return;
        }
        const sanitized = sanitizeContext(context);
        const contextStr = (0, json_1.safeJsonStringify)(sanitized, true);
        internalLogger[level](`${message}\n${contextStr}`);
    };
}
// Wrapper that delegates to the current logger instance
const logger = {
    error: createLogMethodWithContext('error'),
    warn: createLogMethodWithContext('warn'),
    info: createLogMethodWithContext('info'),
    debug: createLogMethodWithContext('debug'),
    add: (transport) => internalLogger.add ? internalLogger.add(transport) : undefined,
    remove: (transport) => internalLogger.remove ? internalLogger.remove(transport) : undefined,
    get transports() {
        return internalLogger.transports || [];
    },
    get level() {
        return internalLogger.transports?.[0]?.level || 'info';
    },
    set level(newLevel) {
        if (internalLogger.transports?.[0]) {
            internalLogger.transports[0].level = newLevel;
        }
    },
};
/**
 * Logs request/response details in a formatted way
 * @param url - Request URL
 * @param requestBody - Request body object
 * @param response - Response object (optional)
 * @param error - Whether to log as error (true) or debug (false)
 */
async function logRequestResponse(options) {
    const { url, requestBody, requestMethod, response, error } = options;
    const logMethod = error ? logger.error : logger.debug;
    let responseText = '';
    if (response) {
        try {
            responseText = await response.clone().text();
        }
        catch {
            responseText = 'Unable to read response';
        }
    }
    const logObject = {
        message: 'API request',
        url: (0, sanitizer_1.sanitizeUrl)(url),
        method: requestMethod,
        requestBody: (0, sanitizer_1.sanitizeObject)(requestBody, { context: 'request body' }),
        ...(response && {
            status: response.status,
            statusText: response.statusText,
        }),
        ...(responseText && { response: responseText }),
    };
    if (useStructuredLogging) {
        logMethod((0, sanitizer_1.sanitizeObject)(logObject, { context: 'log object for structured logging' }));
    }
    else {
        logMethod(`Api Request`, logObject);
    }
}
// Initialize source maps if debug is enabled at startup
if ((0, envars_1.getEnvString)('LOG_LEVEL', 'info') === 'debug') {
    initializeSourceMapSupport();
}
exports.default = logger;
//# sourceMappingURL=logger.js.map