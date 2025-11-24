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
exports.monkeyPatchFetch = monkeyPatchFetch;
const util_1 = require("util");
const zlib_1 = require("zlib");
const constants_1 = require("../../constants");
const cloud_1 = require("../../globalConfig/cloud");
const logger_1 = __importStar(require("../../logger"));
const gzipAsync = (0, util_1.promisify)(zlib_1.gzip);
function isConnectionError(error) {
    return (error instanceof TypeError &&
        error.message === 'fetch failed' &&
        // @ts-expect-error undici error cause
        error.cause?.stack?.includes('internalConnectMultiple'));
}
/**
 * Enhanced fetch wrapper that adds logging, authentication, error handling, and optional compression
 */
async function monkeyPatchFetch(url, options) {
    const NO_LOG_URLS = [constants_1.R_ENDPOINT, constants_1.CONSENT_ENDPOINT, constants_1.EVENTS_ENDPOINT];
    const headers = options?.headers || {};
    const isSilent = headers['x-promptfoo-silent'] === 'true';
    const logEnabled = !NO_LOG_URLS.some((logUrl) => url.toString().startsWith(logUrl)) && !isSilent;
    const opts = {
        ...options,
    };
    const originalBody = opts.body;
    // Handle compression if requested
    if (options?.compress && opts.body && typeof opts.body === 'string') {
        try {
            const compressed = await gzipAsync(opts.body);
            opts.body = compressed;
            opts.headers = {
                ...(opts.headers || {}),
                'Content-Encoding': 'gzip',
            };
        }
        catch (e) {
            logger_1.default.warn(`Failed to compress request body: ${e}`);
        }
    }
    if ((typeof url === 'string' && url.startsWith(cloud_1.CLOUD_API_HOST)) ||
        (url instanceof URL && url.host === cloud_1.CLOUD_API_HOST.replace(/^https?:\/\//, ''))) {
        const token = cloud_1.cloudConfig.getApiKey();
        opts.headers = {
            ...(opts.headers || {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        };
    }
    try {
        // biome-ignore lint/style/noRestrictedGlobals: we need raw fetch here
        const response = await fetch(url, opts);
        if (logEnabled) {
            (0, logger_1.logRequestResponse)({
                url: url.toString(),
                requestBody: originalBody,
                requestMethod: opts.method || 'GET',
                response,
            });
        }
        return response;
    }
    catch (e) {
        if (logEnabled) {
            (0, logger_1.logRequestResponse)({
                url: url.toString(),
                requestBody: opts.body,
                requestMethod: opts.method || 'GET',
                response: null,
            });
            if (isConnectionError(e)) {
                logger_1.default.debug(`Connection error, please check your network connectivity to the host: ${url} ${process.env.HTTP_PROXY || process.env.HTTPS_PROXY ? `or Proxy: ${process.env.HTTP_PROXY || process.env.HTTPS_PROXY}` : ''}`);
                throw e;
            }
            logger_1.default.debug(`Error in fetch: ${JSON.stringify(e, Object.getOwnPropertyNames(e), 2)} ${e instanceof Error ? e.stack : ''}`);
        }
        throw e;
    }
}
//# sourceMappingURL=monkeyPatchFetch.js.map