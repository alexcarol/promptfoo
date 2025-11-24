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
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultRateLimiter = exports.RateLimiter = void 0;
exports.validateFilePath = validateFilePath;
exports.sanitizeInput = sanitizeInput;
exports.validateProviderId = validateProviderId;
const path = __importStar(require("path"));
const errors_1 = require("./errors");
/**
 * Security utilities for MCP server operations
 */
/**
 * Validates that a file path is safe and within allowed boundaries
 */
function validateFilePath(filePath, allowedPaths) {
    // Normalize the path
    const normalizedPath = path.normalize(filePath);
    // Check for path traversal attempts
    if (normalizedPath.includes('..') || normalizedPath.includes('~')) {
        throw new errors_1.ConfigurationError('Path traversal detected. Paths cannot contain ".." or "~"', filePath);
    }
    // Check absolute paths on different platforms
    const isAbsolute = path.isAbsolute(normalizedPath);
    if (isAbsolute && !allowedPaths?.some((allowed) => normalizedPath.startsWith(allowed))) {
        throw new errors_1.ConfigurationError('Absolute paths are not allowed unless explicitly permitted', filePath);
    }
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /^\/etc\//,
        /^\/sys\//,
        /^\/proc\//,
        /^C:\\Windows\\/i,
        /^C:\\Program Files\\/i,
    ];
    if (suspiciousPatterns.some((pattern) => pattern.test(normalizedPath))) {
        throw new errors_1.ConfigurationError('Access to system directories is not allowed', filePath);
    }
}
/**
 * Sanitizes a command or provider ID to prevent injection attacks
 */
function sanitizeInput(input) {
    // Remove any shell metacharacters
    const sanitized = input.replace(/[;&|`$()<>\\]/g, '');
    // Limit length to prevent DoS
    if (sanitized.length > 1000) {
        throw new errors_1.ConfigurationError('Input exceeds maximum allowed length');
    }
    return sanitized;
}
/**
 * Validates provider ID format
 */
function validateProviderId(providerId) {
    // Allow common provider formats
    const validFormats = [
        /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_.-]+$/, // provider:model format
        /^[a-zA-Z0-9_/-]+\.(js|ts|py|mjs)$/, // file path format
        /^https?:\/\/.+$/, // HTTP provider format
    ];
    if (!validFormats.some((format) => format.test(providerId))) {
        throw new errors_1.ConfigurationError(`Invalid provider ID format: ${providerId}. Expected format like "openai:gpt-4" or path to provider file.`);
    }
}
/**
 * Rate limiting tracker for preventing abuse
 */
class RateLimiter {
    constructor(maxRequests = 100, windowMs = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.requests = new Map();
    }
    /**
     * Check if a request should be allowed
     */
    isAllowed(key) {
        const now = Date.now();
        const requests = this.requests.get(key) || [];
        // Remove old requests outside the window
        const validRequests = requests.filter((time) => now - time < this.windowMs);
        if (validRequests.length >= this.maxRequests) {
            return false;
        }
        // Add current request
        validRequests.push(now);
        this.requests.set(key, validRequests);
        // Cleanup old entries periodically
        if (this.requests.size > 1000) {
            this.cleanup();
        }
        return true;
    }
    /**
     * Get remaining requests for a key
     */
    getRemaining(key) {
        const now = Date.now();
        const requests = this.requests.get(key) || [];
        const validRequests = requests.filter((time) => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - validRequests.length);
    }
    /**
     * Clean up old entries
     */
    cleanup() {
        const now = Date.now();
        for (const [key, requests] of this.requests.entries()) {
            const validRequests = requests.filter((time) => now - time < this.windowMs);
            if (validRequests.length === 0) {
                this.requests.delete(key);
            }
            else {
                this.requests.set(key, validRequests);
            }
        }
    }
}
exports.RateLimiter = RateLimiter;
/**
 * Default rate limiter instance
 */
exports.defaultRateLimiter = new RateLimiter();
//# sourceMappingURL=security.js.map