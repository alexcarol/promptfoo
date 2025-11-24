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
exports.HttpProvider = exports.HttpProviderConfigSchema = void 0;
exports.escapeJsonVariables = escapeJsonVariables;
exports.urlEncodeRawRequestPath = urlEncodeRawRequestPath;
exports.generateSignature = generateSignature;
exports.loadTransformModule = loadTransformModule;
exports.createSessionParser = createSessionParser;
exports.processJsonBody = processJsonBody;
exports.processTextBody = processTextBody;
exports.determineRequestBody = determineRequestBody;
exports.createValidateStatus = createValidateStatus;
exports.estimateTokenCount = estimateTokenCount;
const crypto_1 = __importDefault(require("crypto"));
const fs_1 = __importDefault(require("fs"));
const http_1 = __importDefault(require("http"));
const path_1 = __importDefault(require("path"));
const http_z_1 = __importDefault(require("http-z"));
const undici_1 = require("undici");
const zod_1 = require("zod");
const cache_1 = require("../cache");
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
const file_1 = require("../util/file");
const fileExtensions_1 = require("../util/fileExtensions");
const index_1 = require("../util/index");
const invariant_1 = __importDefault(require("../util/invariant"));
const json_1 = require("../util/json");
const pathUtils_1 = require("../util/pathUtils");
const sanitizer_1 = require("../util/sanitizer");
const templates_1 = require("../util/templates");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
const httpTransforms_1 = require("./httpTransforms");
const shared_1 = require("./shared");
/**
 * Escapes string values in variables for safe JSON template substitution.
 * Converts { key: "value\nwith\nnewlines" } to { key: "value\\nwith\\nnewlines" }
 */
function escapeJsonVariables(vars) {
    return Object.fromEntries(Object.entries(vars).map(([key, value]) => [
        key,
        typeof value === 'string' ? JSON.stringify(value).slice(1, -1) : value,
    ]));
}
/**
 * Maps promptfoo-cloud certificate fields to type-specific fields based on the certificate type.
 * This handles certificates stored in the database with generic field names.
 *
 * @param signatureAuth - The signature authentication configuration
 * @returns The processed signature authentication configuration
 */
function preprocessSignatureAuthConfig(signatureAuth) {
    if (!signatureAuth) {
        return signatureAuth;
    }
    // If generic certificate fields are present, map them to type-specific fields
    const { certificateContent, certificatePassword, certificateFilename, type, ...rest } = signatureAuth;
    let detectedType = type;
    if (!detectedType) {
        // Try to detect from certificateFilename first
        if (certificateFilename) {
            const ext = certificateFilename.toLowerCase();
            if (ext.endsWith('.pfx') || ext.endsWith('.p12')) {
                detectedType = 'pfx';
            }
            else if (ext.endsWith('.jks')) {
                detectedType = 'jks';
            }
            else if (ext.endsWith('.pem') || ext.endsWith('.key')) {
                detectedType = 'pem';
            }
        }
        // If still no type, try to detect from legacy fields
        if (!detectedType) {
            if (signatureAuth.privateKeyPath || signatureAuth.privateKey) {
                detectedType = 'pem';
            }
            else if (signatureAuth.keystorePath || signatureAuth.keystoreContent) {
                detectedType = 'jks';
            }
            else if (signatureAuth.pfxPath ||
                signatureAuth.pfxContent ||
                (signatureAuth.certPath && signatureAuth.keyPath)) {
                detectedType = 'pfx';
            }
        }
    }
    // Check if we have any generic fields to process
    const hasGenericFields = certificateContent || certificatePassword || certificateFilename;
    // If no generic fields and no type needs to be detected, return as-is
    if (!hasGenericFields && !detectedType) {
        return signatureAuth;
    }
    const processedAuth = { ...rest };
    // Always preserve the type if it was detected or provided
    if (detectedType) {
        processedAuth.type = detectedType;
    }
    // Only process if we have a determined type or generic fields
    if (detectedType) {
        switch (detectedType) {
            case 'pfx':
                if (certificateContent && !processedAuth.pfxContent) {
                    processedAuth.pfxContent = certificateContent;
                }
                if (certificatePassword && !processedAuth.pfxPassword) {
                    processedAuth.pfxPassword = certificatePassword;
                }
                if (certificateFilename && !processedAuth.pfxPath) {
                    // Store filename for reference, though content takes precedence
                    processedAuth.certificateFilename = certificateFilename;
                }
                break;
            case 'jks':
                // Map generic fields to JKS-specific fields
                if (certificateContent && !processedAuth.keystoreContent) {
                    processedAuth.keystoreContent = certificateContent;
                }
                if (certificatePassword && !processedAuth.keystorePassword) {
                    processedAuth.keystorePassword = certificatePassword;
                }
                if (certificateFilename && !processedAuth.keystorePath) {
                    processedAuth.certificateFilename = certificateFilename;
                }
                break;
            case 'pem':
                // Map generic fields to PEM-specific fields
                if (certificateContent && !processedAuth.privateKey) {
                    // For PEM, the certificate content is the private key
                    processedAuth.privateKey = Buffer.from(certificateContent, 'base64').toString('utf8');
                }
                // PEM doesn't typically have a password, but store it if provided
                if (certificatePassword) {
                    processedAuth.certificatePassword = certificatePassword;
                }
                if (certificateFilename) {
                    processedAuth.certificateFilename = certificateFilename;
                }
                break;
            default:
                // Unknown type - this is an error if we have generic fields that need mapping
                if (hasGenericFields) {
                    throw new Error(`[Http Provider] Unknown certificate type: ${detectedType}`);
                }
                // Even without generic fields, an unknown type is invalid
                throw new Error(`[Http Provider] Unknown certificate type: ${detectedType}`);
        }
    }
    else if (hasGenericFields) {
        // We have generic fields but couldn't determine the type
        throw new Error(`[Http Provider] Cannot determine certificate type from filename: ${certificateFilename || 'no filename provided'}`);
    }
    return processedAuth;
}
/**
 * Renders a JSON template string with proper escaping for JSON context.
 *
 * When template substitution would create invalid JSON (due to unescaped newlines,
 * quotes, etc.), this function attempts to fix it by re-rendering with escaped variables.
 *
 * @param template - The template string (should look like JSON)
 * @param vars - Variables to substitute into the template
 * @returns Parsed JSON object/array/primitive
 * @throws Error if the template cannot be rendered as valid JSON
 */
function renderJsonTemplate(template, vars) {
    // First attempt: try normal rendering and parsing
    const rendered = (0, index_1.renderVarsInObject)(template, vars);
    try {
        return JSON.parse(rendered);
    }
    catch {
        // Second attempt: re-render with JSON-escaped variables
        const escapedVars = escapeJsonVariables(vars);
        const reRendered = (0, index_1.renderVarsInObject)(template, escapedVars);
        return JSON.parse(reRendered); // This will throw if still invalid
    }
}
/**
 * Safely render raw HTTP templates with Nunjucks by wrapping the entire
 * template in raw blocks and selectively allowing only {{...}} variables.
 */
function renderRawRequestWithNunjucks(template, vars) {
    // Protect literal Nunjucks syntax in the source by raw-wrapping
    // and then re-enabling only variable tags.
    const VAR_TOKEN = '__PF_VAR__';
    let working = template;
    // 1) Temporarily replace all {{...}} occurrences with placeholders
    const placeholders = [];
    working = working.replace(/\{\{[\s\S]*?\}\}/g, (m) => {
        const idx = placeholders.push(m) - 1;
        return `${VAR_TOKEN}${idx}__`;
    });
    // 2) Wrap everything in raw so Nunjucks ignores any {%...%} found in headers/cookies
    working = `{% raw %}${working}{% endraw %}`;
    // 3) Re-enable variables by inserting endraw/raw around each placeholder
    working = working.replace(new RegExp(`${VAR_TOKEN}(\\d+)__`, 'g'), (_m, g1) => {
        const original = placeholders[Number(g1)];
        return `{% endraw %}${original}{% raw %}`;
    });
    // 4) Render with Nunjucks normally
    const nunjucks = (0, templates_1.getNunjucksEngine)();
    return nunjucks.renderString(working, vars);
}
// This function is used to encode the URL in the first line of a raw request
function urlEncodeRawRequestPath(rawRequest) {
    const firstLine = rawRequest.split('\n')[0];
    const firstSpace = firstLine.indexOf(' ');
    const method = firstLine.slice(0, firstSpace);
    if (!method || !http_1.default.METHODS.includes(method)) {
        logger_1.default.error(`[Http Provider] HTTP request method ${method} is not valid. From: ${firstLine}`);
        throw new Error(`[Http Provider] HTTP request method ${method} is not valid. From: ${firstLine}`);
    }
    const lastSpace = firstLine.lastIndexOf(' ');
    if (lastSpace === -1) {
        logger_1.default.error(`[Http Provider] HTTP request URL is not valid. Protocol is missing. From: ${firstLine}`);
        throw new Error(`[Http Provider] HTTP request URL is not valid. Protocol is missing. From: ${firstLine}`);
    }
    const url = firstLine.slice(firstSpace + 1, lastSpace);
    if (url.length === 0) {
        logger_1.default.error(`[Http Provider] HTTP request URL is not valid. From: ${firstLine}`);
        throw new Error(`[Http Provider] HTTP request URL is not valid. From: ${firstLine}`);
    }
    const protocol = lastSpace < firstLine.length ? firstLine.slice(lastSpace + 1) : '';
    if (!protocol.toLowerCase().startsWith('http')) {
        logger_1.default.error(`[Http Provider] HTTP request protocol is not valid. From: ${firstLine}`);
        throw new Error(`[Http Provider] HTTP request protocol is not valid. From: ${firstLine}`);
    }
    logger_1.default.debug(`[Http Provider] Encoding URL: ${url} from first line of raw request: ${firstLine}`);
    try {
        // Use the built-in URL class to parse and encode the URL
        const parsedUrl = new URL(url, 'http://placeholder-base.com');
        // Replace the original URL in the first line
        rawRequest = rawRequest.replace(firstLine, `${method} ${parsedUrl.pathname}${parsedUrl.search}${protocol ? ' ' + protocol : ''}`);
    }
    catch (err) {
        logger_1.default.error(`[Http Provider] Error parsing URL in HTTP request: ${String(err)}`);
        throw new Error(`[Http Provider] Error parsing URL in HTTP request: ${String(err)}`);
    }
    return rawRequest;
}
/**
 * Detects if a string is likely base64-encoded
 */
function isBase64(str) {
    // Check for common base64 patterns
    // Must be divisible by 4, only contain valid base64 chars, and optionally end with padding
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return str.length % 4 === 0 && base64Regex.test(str) && str.length > 100;
}
/**
 * Generate signature using different certificate types
 */
async function generateSignature(signatureAuth, signatureTimestamp) {
    try {
        let privateKey;
        // For backward compatibility, detect type from legacy fields if not explicitly set
        let authType = signatureAuth.type;
        if (!authType) {
            if (signatureAuth.privateKeyPath || signatureAuth.privateKey) {
                authType = 'pem';
            }
            else if (signatureAuth.keystorePath || signatureAuth.keystoreContent) {
                authType = 'jks';
            }
            else if (signatureAuth.pfxPath ||
                signatureAuth.pfxContent ||
                (signatureAuth.certPath && signatureAuth.keyPath)) {
                authType = 'pfx';
            }
        }
        switch (authType) {
            case 'pem': {
                if (signatureAuth.privateKeyPath) {
                    const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.privateKeyPath);
                    privateKey = fs_1.default.readFileSync(resolvedPath, 'utf8');
                }
                else if (signatureAuth.privateKey) {
                    privateKey = signatureAuth.privateKey;
                }
                else if (signatureAuth.certificateContent) {
                    logger_1.default.debug(`[Signature Auth] Loading PEM from remote certificate content`);
                    privateKey = Buffer.from(signatureAuth.certificateContent, 'base64').toString('utf8');
                }
                else {
                    throw new Error('PEM private key is required. Provide privateKey, privateKeyPath, or certificateContent');
                }
                break;
            }
            case 'jks': {
                // Check for keystore password in config first, then fallback to environment variable
                const keystorePassword = signatureAuth.keystorePassword ||
                    signatureAuth.certificatePassword ||
                    (0, envars_1.getEnvString)('PROMPTFOO_JKS_PASSWORD');
                if (!keystorePassword) {
                    throw new Error('JKS keystore password is required. Provide it via config keystorePassword/certificatePassword or PROMPTFOO_JKS_PASSWORD environment variable');
                }
                // Use eval to avoid TypeScript static analysis of the dynamic import
                const jksModule = await Promise.resolve().then(() => __importStar(require('jks-js'))).catch(() => {
                    throw new Error('JKS certificate support requires the "jks-js" package. Install it with: npm install jks-js');
                });
                const jks = jksModule;
                let keystoreData;
                if (signatureAuth.keystoreContent || signatureAuth.certificateContent) {
                    // Use base64 encoded content from database
                    const content = signatureAuth.keystoreContent || signatureAuth.certificateContent;
                    logger_1.default.debug(`[Signature Auth] Loading JKS from base64 content`);
                    keystoreData = Buffer.from(content, 'base64');
                }
                else if (signatureAuth.keystorePath) {
                    // Use file path (existing behavior)
                    const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.keystorePath);
                    keystoreData = fs_1.default.readFileSync(resolvedPath);
                }
                else {
                    throw new Error('JKS keystore content or path is required. Provide keystoreContent/certificateContent or keystorePath');
                }
                const keystore = jks.toPem(keystoreData, keystorePassword);
                const aliases = Object.keys(keystore);
                if (aliases.length === 0) {
                    throw new Error('No certificates found in JKS file');
                }
                const targetAlias = signatureAuth.keyAlias || aliases[0];
                const entry = keystore[targetAlias];
                if (!entry) {
                    throw new Error(`Alias '${targetAlias}' not found in JKS file. Available aliases: ${aliases.join(', ')}`);
                }
                if (!entry.key) {
                    throw new Error('No private key found for the specified alias in JKS file');
                }
                privateKey = entry.key;
                break;
            }
            case 'pfx': {
                // Check for PFX-specific fields first, then fallback to generic fields
                const hasPfxContent = signatureAuth.pfxContent || signatureAuth.certificateContent;
                const hasPfxPath = signatureAuth.pfxPath;
                const hasCertAndKey = (signatureAuth.certPath && signatureAuth.keyPath) ||
                    (signatureAuth.certContent && signatureAuth.keyContent);
                // Add detailed, safe debug logging for PFX configuration sources
                logger_1.default.debug(`[Signature Auth][PFX] Source detection: hasPfxContent=${Boolean(hasPfxContent)}, hasPfxPath=${Boolean(hasPfxPath)}, hasCertAndKey=${Boolean(hasCertAndKey)}; filename=${signatureAuth.certificateFilename || signatureAuth.pfxPath || 'n/a'}`);
                if (hasPfxPath || hasPfxContent) {
                    // Check for PFX password in config first, then fallback to environment variable
                    const pfxPassword = signatureAuth.pfxPassword ||
                        signatureAuth.certificatePassword ||
                        (0, envars_1.getEnvString)('PROMPTFOO_PFX_PASSWORD');
                    if (!pfxPassword) {
                        throw new Error('PFX certificate password is required. Provide it via config pfxPassword/certificatePassword or PROMPTFOO_PFX_PASSWORD environment variable');
                    }
                    try {
                        // Use eval to avoid TypeScript static analysis of the dynamic import
                        const pemModule = await Promise.resolve().then(() => __importStar(require('pem'))).catch(() => {
                            throw new Error('PFX certificate support requires the "pem" package. Install it with: npm install pem');
                        });
                        const pem = pemModule.default;
                        let result;
                        if (signatureAuth.pfxContent || signatureAuth.certificateContent) {
                            // Use base64 encoded content from database
                            const content = signatureAuth.pfxContent || signatureAuth.certificateContent;
                            logger_1.default.debug(`[Signature Auth] Loading PFX from base64 content`);
                            const pfxBuffer = Buffer.from(content, 'base64');
                            logger_1.default.debug(`[Signature Auth][PFX] Base64 content length: ${content.length}, decoded bytes: ${pfxBuffer.byteLength}`);
                            result = await new Promise((resolve, reject) => {
                                pem.readPkcs12(pfxBuffer, { p12Password: pfxPassword }, (err, data) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        resolve(data);
                                    }
                                });
                            });
                        }
                        else {
                            // Use file path (existing behavior)
                            const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.pfxPath);
                            logger_1.default.debug(`[Signature Auth] Loading PFX file: ${resolvedPath}`);
                            try {
                                const stat = await fs_1.default.promises.stat(resolvedPath);
                                logger_1.default.debug(`[Signature Auth][PFX] PFX file size: ${stat.size} bytes`);
                            }
                            catch (e) {
                                logger_1.default.debug(`[Signature Auth][PFX] Could not stat PFX file: ${String(e)}`);
                            }
                            result = await new Promise((resolve, reject) => {
                                pem.readPkcs12(resolvedPath, { p12Password: pfxPassword }, (err, data) => {
                                    if (err) {
                                        reject(err);
                                    }
                                    else {
                                        resolve(data);
                                    }
                                });
                            });
                        }
                        if (!result.key) {
                            logger_1.default.error('[Signature Auth][PFX] No private key extracted from PFX');
                            throw new Error('No private key found in PFX file');
                        }
                        privateKey = result.key;
                        logger_1.default.debug(`[Signature Auth] Successfully extracted private key from PFX using pem library`);
                    }
                    catch (err) {
                        if (err instanceof Error) {
                            if (err.message.includes('ENOENT') && signatureAuth.pfxPath) {
                                const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.pfxPath);
                                throw new Error(`PFX file not found: ${resolvedPath}`);
                            }
                            if (err.message.includes('invalid') || err.message.includes('decrypt')) {
                                throw new Error(`Invalid PFX file format or wrong password: ${err.message}`);
                            }
                        }
                        logger_1.default.error(`Error loading PFX certificate: ${String(err)}`);
                        throw new Error(`Failed to load PFX certificate. Make sure the ${signatureAuth.pfxContent || signatureAuth.certificateContent ? 'content is valid' : 'file exists'} and the password is correct: ${String(err)}`);
                    }
                }
                else if (hasCertAndKey) {
                    try {
                        if (signatureAuth.keyContent) {
                            // Use base64 encoded content from database
                            logger_1.default.debug(`[Signature Auth] Loading private key from base64 content`);
                            privateKey = Buffer.from(signatureAuth.keyContent, 'base64').toString('utf8');
                            logger_1.default.debug(`[Signature Auth][PFX] Decoded keyContent length: ${privateKey.length} characters`);
                        }
                        else {
                            // Use file paths (existing behavior)
                            const resolvedCertPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.certPath);
                            const resolvedKeyPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', signatureAuth.keyPath);
                            logger_1.default.debug(`[Signature Auth] Loading separate CRT and KEY files: ${resolvedCertPath}, ${resolvedKeyPath}`);
                            // Read the private key directly from the key file
                            if (!fs_1.default.existsSync(resolvedKeyPath)) {
                                throw new Error(`Key file not found: ${resolvedKeyPath}`);
                            }
                            if (!fs_1.default.existsSync(resolvedCertPath)) {
                                throw new Error(`Certificate file not found: ${resolvedCertPath}`);
                            }
                            privateKey = fs_1.default.readFileSync(resolvedKeyPath, 'utf8');
                            logger_1.default.debug(`[Signature Auth][PFX] Loaded key file characters: ${privateKey.length}`);
                        }
                        logger_1.default.debug(`[Signature Auth] Successfully loaded private key from separate key file`);
                    }
                    catch (err) {
                        logger_1.default.error(`Error loading certificate/key files: ${String(err)}`);
                        throw new Error(`Failed to load certificate/key files. Make sure both files exist and are readable: ${String(err)}`);
                    }
                }
                else {
                    throw new Error('PFX type requires either pfxPath, pfxContent, both certPath and keyPath, or both certContent and keyContent');
                }
                break;
            }
            default:
                throw new Error(`Unsupported signature auth type: ${signatureAuth.type}`);
        }
        const data = (0, templates_1.getNunjucksEngine)()
            .renderString(signatureAuth.signatureDataTemplate, {
            signatureTimestamp,
        })
            .replace(/\\n/g, '\n');
        // Pre-sign validation logging
        logger_1.default.debug(`[Signature Auth] Preparing to sign with algorithm=${signatureAuth.signatureAlgorithm}, dataLength=${data.length}, keyProvided=${Boolean(privateKey)}`);
        const sign = crypto_1.default.createSign(signatureAuth.signatureAlgorithm);
        sign.update(data);
        sign.end();
        try {
            const signature = sign.sign(privateKey);
            return signature.toString('base64');
        }
        catch (e) {
            logger_1.default.error(`[Signature Auth] Signing failed: ${String(e)}; keyLength=${privateKey?.length || 0}, algorithm=${signatureAuth.signatureAlgorithm}`);
            throw e;
        }
    }
    catch (err) {
        logger_1.default.error(`Error generating signature: ${String(err)}`);
        throw new Error(`Failed to generate signature: ${String(err)}`);
    }
}
function needsSignatureRefresh(timestamp, validityMs, bufferMs) {
    const now = Date.now();
    const timeElapsed = now - timestamp;
    const effectiveBufferMs = bufferMs ?? Math.floor(validityMs * 0.1); // Default to 10% of validity time
    return timeElapsed + effectiveBufferMs >= validityMs;
}
const TokenEstimationConfigSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(false),
    multiplier: zod_1.z.number().min(0.01).default(1.3),
});
// Base signature auth fields
const BaseSignatureAuthSchema = zod_1.z.object({
    signatureValidityMs: zod_1.z.number().default(300000),
    signatureDataTemplate: zod_1.z.string().default('{{signatureTimestamp}}'),
    signatureAlgorithm: zod_1.z.string().default('SHA256'),
    signatureRefreshBufferMs: zod_1.z.number().optional(),
});
// PEM signature auth schema
const PemSignatureAuthSchema = BaseSignatureAuthSchema.extend({
    type: zod_1.z.literal('pem'),
    privateKeyPath: zod_1.z.string().optional(),
    privateKey: zod_1.z.string().optional(),
}).refine((data) => data.privateKeyPath !== undefined || data.privateKey !== undefined, {
    message: 'Either privateKeyPath or privateKey must be provided for PEM type',
});
// JKS signature auth schema
const JksSignatureAuthSchema = BaseSignatureAuthSchema.extend({
    type: zod_1.z.literal('jks'),
    keystorePath: zod_1.z.string().optional(),
    keystoreContent: zod_1.z.string().optional(), // Base64 encoded JKS content
    keystorePassword: zod_1.z.string().optional(),
    keyAlias: zod_1.z.string().optional(),
}).refine((data) => data.keystorePath !== undefined || data.keystoreContent !== undefined, {
    message: 'Either keystorePath or keystoreContent must be provided for JKS type',
});
// PFX signature auth schema
const PfxSignatureAuthSchema = BaseSignatureAuthSchema.extend({
    type: zod_1.z.literal('pfx'),
    pfxPath: zod_1.z.string().optional(),
    pfxContent: zod_1.z.string().optional(), // Base64 encoded PFX content
    pfxPassword: zod_1.z.string().optional(),
    certPath: zod_1.z.string().optional(),
    keyPath: zod_1.z.string().optional(),
    certContent: zod_1.z.string().optional(), // Base64 encoded certificate content
    keyContent: zod_1.z.string().optional(), // Base64 encoded private key content
}).refine((data) => {
    return (data.pfxPath ||
        data.pfxContent ||
        (data.certPath && data.keyPath) ||
        (data.certContent && data.keyContent));
}, {
    message: 'Either pfxPath, pfxContent, both certPath and keyPath, or both certContent and keyContent must be provided for PFX type',
});
// Legacy signature auth schema (for backward compatibility)
const LegacySignatureAuthSchema = BaseSignatureAuthSchema.extend({
    privateKeyPath: zod_1.z.string().optional(),
    privateKey: zod_1.z.string().optional(),
    keystorePath: zod_1.z.string().optional(),
    keystorePassword: zod_1.z.string().optional(),
    keyAlias: zod_1.z.string().optional(),
    keyPassword: zod_1.z.string().optional(),
    pfxPath: zod_1.z.string().optional(),
    pfxPassword: zod_1.z.string().optional(),
    certPath: zod_1.z.string().optional(),
    keyPath: zod_1.z.string().optional(),
}).passthrough();
// Generic certificate auth schema (for UI-based certificate uploads)
const GenericCertificateAuthSchema = BaseSignatureAuthSchema.extend({
    certificateContent: zod_1.z.string().optional(),
    certificatePassword: zod_1.z.string().optional(),
    certificateFilename: zod_1.z.string().optional(),
    type: zod_1.z.enum(['pem', 'jks', 'pfx']).optional(),
    // Include type-specific fields that might be present or added by transform
    pfxContent: zod_1.z.string().optional(),
    pfxPassword: zod_1.z.string().optional(),
    pfxPath: zod_1.z.string().optional(),
    keystoreContent: zod_1.z.string().optional(),
    keystorePassword: zod_1.z.string().optional(),
    keystorePath: zod_1.z.string().optional(),
    privateKey: zod_1.z.string().optional(),
    privateKeyPath: zod_1.z.string().optional(),
    keyAlias: zod_1.z.string().optional(),
    certPath: zod_1.z.string().optional(),
    keyPath: zod_1.z.string().optional(),
    certContent: zod_1.z.string().optional(),
    keyContent: zod_1.z.string().optional(),
}).passthrough();
// TLS Certificate configuration schema for HTTPS connections
const TlsCertificateSchema = zod_1.z
    .object({
    // CA certificate for verifying server certificates
    ca: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    caPath: zod_1.z.string().optional(),
    // Client certificate for mutual TLS
    cert: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    certPath: zod_1.z.string().optional(),
    // Private key for client certificate
    key: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    keyPath: zod_1.z.string().optional(),
    // PFX/PKCS12 certificate bundle
    // Supports inline content as base64-encoded string or Buffer
    pfx: zod_1.z
        .union([zod_1.z.string(), zod_1.z.instanceof(Buffer)])
        .optional()
        .describe('PFX/PKCS12 certificate bundle. Can be a file path via pfxPath, or inline as a base64-encoded string or Buffer'),
    pfxPath: zod_1.z.string().optional().describe('Path to PFX/PKCS12 certificate file'),
    passphrase: zod_1.z.string().optional().describe('Passphrase for PFX certificate'),
    // Security options
    rejectUnauthorized: zod_1.z.boolean().default(true),
    servername: zod_1.z.string().optional(),
    // Cipher configuration
    ciphers: zod_1.z.string().optional(),
    secureProtocol: zod_1.z.string().optional(),
    minVersion: zod_1.z.string().optional(),
    maxVersion: zod_1.z.string().optional(),
})
    .refine((data) => {
    // Ensure that if cert is provided, key is also provided (and vice versa)
    const hasCert = data.cert || data.certPath;
    const hasKey = data.key || data.keyPath;
    const hasPfx = data.pfx || data.pfxPath;
    // If using PFX, don't need separate cert/key
    if (hasPfx) {
        return true;
    }
    // If using cert/key, both must be provided
    if (hasCert || hasKey) {
        return hasCert && hasKey;
    }
    return true;
}, {
    message: 'Both certificate and key must be provided for client certificate authentication (unless using PFX)',
});
exports.HttpProviderConfigSchema = zod_1.z.object({
    body: zod_1.z.union([zod_1.z.record(zod_1.z.any()), zod_1.z.string(), zod_1.z.array(zod_1.z.any())]).optional(),
    headers: zod_1.z.record(zod_1.z.string()).optional(),
    maxRetries: zod_1.z.number().min(0).optional(),
    method: zod_1.z.string().optional(),
    queryParams: zod_1.z.record(zod_1.z.string()).optional(),
    request: zod_1.z.string().optional(),
    useHttps: zod_1.z
        .boolean()
        .optional()
        .describe('Use HTTPS for the request. This only works with the raw request option'),
    sessionParser: zod_1.z.union([zod_1.z.string(), zod_1.z.function()]).optional(),
    sessionSource: zod_1.z.enum(['client', 'server']).optional(),
    stateful: zod_1.z.boolean().optional(),
    transformRequest: zod_1.z.union([zod_1.z.string(), zod_1.z.function()]).optional(),
    transformResponse: zod_1.z.union([zod_1.z.string(), zod_1.z.function()]).optional(),
    url: zod_1.z.string().optional(),
    validateStatus: zod_1.z
        .union([zod_1.z.string(), zod_1.z.function().returns(zod_1.z.boolean()).args(zod_1.z.number())])
        .optional(),
    /**
     * @deprecated use transformResponse instead
     */
    responseParser: zod_1.z.union([zod_1.z.string(), zod_1.z.function()]).optional(),
    // Token estimation configuration
    tokenEstimation: TokenEstimationConfigSchema.optional(),
    // Digital Signature Authentication with support for multiple certificate types
    signatureAuth: zod_1.z
        .union([
        LegacySignatureAuthSchema,
        PemSignatureAuthSchema,
        JksSignatureAuthSchema,
        PfxSignatureAuthSchema,
        GenericCertificateAuthSchema,
    ])
        .optional()
        .transform(preprocessSignatureAuthConfig),
    // TLS Certificate configuration for HTTPS connections
    tls: TlsCertificateSchema.optional(),
});
function contentTypeIsJson(headers) {
    if (!headers) {
        return false;
    }
    return Object.keys(headers).some((key) => {
        if (key.toLowerCase().startsWith('content-type')) {
            return headers?.[key].includes('application/json');
        }
        return false;
    });
}
/**
 * Loads a module from a file:// reference if needed
 * This function should be called before passing transforms to createTransformResponse/createTransformRequest
 *
 * @param transform - The transform config (string or function)
 * @returns The loaded function, or the original value if not a file:// reference
 */
async function loadTransformModule(transform) {
    if (!transform) {
        return transform;
    }
    if (typeof transform === 'function') {
        return transform;
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
            return requiredModule;
        }
        throw new Error(`Transform module malformed: ${filename} must export a function or have a default export as a function`);
    }
    // For string expressions, return as-is
    return transform;
}
async function createSessionParser(parser) {
    if (!parser) {
        return () => '';
    }
    if (typeof parser === 'function') {
        return (response) => parser(response);
    }
    if (typeof parser === 'string' && parser.startsWith('file://')) {
        let filename = parser.slice('file://'.length);
        let functionName;
        if (filename.includes(':')) {
            const splits = filename.split(':');
            if (splits[0] && (0, fileExtensions_1.isJavascriptFile)(splits[0])) {
                [filename, functionName] = splits;
            }
        }
        const requiredModule = await (0, esm_1.importModule)(path_1.default.resolve(cliState_1.default.basePath || '', filename), functionName);
        if (typeof requiredModule === 'function') {
            return requiredModule;
        }
        throw new Error(`Response transform malformed: ${filename} must export a function or have a default export as a function`);
    }
    else if (typeof parser === 'string') {
        return (data) => {
            const trimmedParser = parser.trim();
            return new Function('data', `return (${trimmedParser});`)(data);
        };
    }
    throw new Error(`Unsupported response transform type: ${typeof parser}. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.`);
}
/**
 * Substitutes template variables in a JSON object or array.
 *
 * This function walks through all properties of the provided JSON structure
 * and replaces template expressions (like {{varName}}) with their actual values.
 * If a substituted string is valid JSON, it will be parsed into an object or array.
 *
 * Example:
 * Input: {"greeting": "Hello {{name}}!", "data": {"id": "{{userId}}"}}
 * Vars: {name: "World", userId: 123}
 * Output: {"greeting": "Hello World!", "data": {"id": 123}}
 *
 * @param body The JSON object or array containing template expressions
 * @param vars Dictionary of variable names and their values for substitution
 * @returns A new object or array with all template expressions replaced
 */
function processJsonBody(body, vars) {
    // First apply the standard variable rendering
    const rendered = (0, index_1.renderVarsInObject)(body, vars);
    // For objects and arrays, we need to check each string value to see if it can be parsed as JSON
    if (typeof rendered === 'object' && rendered !== null) {
        // Function to process nested values
        const processNestedValues = (obj) => {
            if (Array.isArray(obj)) {
                return obj.map(processNestedValues);
            }
            else if (typeof obj === 'object' && obj !== null) {
                const result = {};
                for (const [key, value] of Object.entries(obj)) {
                    result[key] = processNestedValues(value);
                }
                return result;
            }
            else if (typeof obj === 'string') {
                try {
                    return JSON.parse(obj);
                }
                catch {
                    return obj;
                }
            }
            return obj;
        };
        return processNestedValues(rendered);
    }
    // If it's a string, attempt to parse as JSON
    if (typeof rendered === 'string') {
        try {
            return JSON.parse(rendered);
        }
        catch (err) {
            // If it looks like JSON but parsing failed, try with escaped variables
            const trimmed = rendered.trim();
            if ((trimmed.startsWith('{') || trimmed.startsWith('[')) && typeof body === 'string') {
                try {
                    return renderJsonTemplate(body, vars);
                }
                catch {
                    // Fall back to original behavior
                }
            }
            // JSON.parse failed, return the string as-is
            // This string will be used directly as the request body without further JSON.stringify()
            logger_1.default.debug(`[HTTP Provider] Body is a string that failed JSON parsing, using as-is: ${String(err)}`);
            return rendered;
        }
    }
    return rendered;
}
/**
 * Substitutes template variables in a text string.
 *
 * Replaces template expressions (like {{varName}}) in the string with their
 * actual values from the provided variables dictionary.
 *
 * Example:
 * Input: "Hello {{name}}! Your user ID is {{userId}}."
 * Vars: {name: "World", userId: 123}
 * Output: "Hello World! Your user ID is 123."
 *
 * @param body The string containing template expressions to substitute
 * @param vars Dictionary of variable names and their values for substitution
 * @returns A new string with all template expressions replaced
 * @throws Error if body is an object instead of a string
 */
function processTextBody(body, vars) {
    if (body == null) {
        return body;
    }
    (0, invariant_1.default)(typeof body !== 'object', 'Expected body to be a string when content type is not application/json');
    try {
        return (0, index_1.renderVarsInObject)(body, vars);
    }
    catch (err) {
        logger_1.default.warn(`Error rendering body template: ${err}`);
        return body;
    }
}
function parseRawRequest(input) {
    const normalized = input.replace(/\r\n/g, '\n').trim();
    const adjusted = normalized.replace(/\n/g, '\r\n') + '\r\n\r\n';
    // If the injectVar is in a query param, we need to encode the URL in the first line
    const encoded = urlEncodeRawRequestPath(adjusted);
    try {
        const messageModel = http_z_1.default.parse(encoded);
        // Type assertion for request model (http-z v8 doesn't export types)
        const requestModel = messageModel;
        return {
            method: requestModel.method,
            url: requestModel.target,
            headers: requestModel.headers.reduce((acc, header) => {
                acc[header.name.toLowerCase()] = header.value;
                return acc;
            }, {}),
            body: requestModel.body,
        };
    }
    catch (err) {
        throw new Error(`Error parsing raw HTTP request: ${String(err)}`);
    }
}
function determineRequestBody(contentType, parsedPrompt, configBody, vars) {
    // Parse stringified JSON body if needed (handles legacy data saved as strings)
    let actualConfigBody = configBody;
    if (typeof configBody === 'string' && contentType) {
        try {
            actualConfigBody = JSON.parse(configBody);
            logger_1.default.debug('[HTTP Provider] Parsed stringified config body to object');
        }
        catch (err) {
            // If parsing fails, it's probably a template string or non-JSON content, leave as-is
            logger_1.default.debug(`[HTTP Provider] Config body is a string that couldn't be parsed as JSON, treating as template: ${String(err)}`);
        }
    }
    if (contentType) {
        // For JSON content type
        if (typeof parsedPrompt === 'object' && parsedPrompt !== null) {
            // If parser returned an object, merge it with config body
            return Object.assign({}, actualConfigBody || {}, parsedPrompt);
        }
        // Otherwise process the config body with parsed prompt
        return processJsonBody(actualConfigBody, {
            ...vars,
            prompt: parsedPrompt,
        });
    }
    // For non-JSON content type, process as text
    return processTextBody(actualConfigBody, {
        ...vars,
        prompt: parsedPrompt,
    });
}
async function createValidateStatus(validator) {
    if (!validator) {
        return (_status) => true;
    }
    if (typeof validator === 'function') {
        return validator;
    }
    if (typeof validator === 'string') {
        if (validator.startsWith('file://')) {
            let filename = validator.slice('file://'.length);
            let functionName;
            if (filename.includes(':')) {
                const splits = filename.split(':');
                if (splits[0] && (0, fileExtensions_1.isJavascriptFile)(splits[0])) {
                    [filename, functionName] = splits;
                }
            }
            try {
                const requiredModule = await (0, esm_1.importModule)(path_1.default.resolve(cliState_1.default.basePath || '', filename), functionName);
                if (typeof requiredModule === 'function') {
                    return requiredModule;
                }
                throw new Error('Exported value must be a function');
            }
            catch (err) {
                throw new Error(`Status validator malformed: ${filename} - ${err?.message || String(err)}`);
            }
        }
        // Handle string template - wrap in a function body
        try {
            const trimmedValidator = validator.trim();
            // Check if it's an arrow function or regular function
            if (trimmedValidator.includes('=>') || trimmedValidator.startsWith('function')) {
                // For arrow functions and regular functions, evaluate the whole function
                return new Function(`return ${trimmedValidator}`)();
            }
            // For expressions, wrap in a function body
            return new Function('status', `return ${trimmedValidator}`);
        }
        catch (err) {
            throw new Error(`Invalid status validator expression: ${err?.message || String(err)}`);
        }
    }
    throw new Error(`Unsupported status validator type: ${typeof validator}. Expected a function, a string starting with 'file://' pointing to a JavaScript file, or a string containing a JavaScript expression.`);
}
/**
 * Estimates token count for a given text using word-based counting
 */
function estimateTokenCount(text, multiplier = 1.3) {
    if (!text || typeof text !== 'string') {
        return 0;
    }
    // Split by whitespace and filter out empty strings
    const words = text
        .trim()
        .split(/\s+/)
        .filter((word) => word.length > 0);
    return Math.ceil(words.length * multiplier);
}
/**
 * Creates an HTTPS agent with TLS configuration for secure connections
 */
async function createHttpsAgent(tlsConfig) {
    const tlsOptions = {};
    // Load CA certificates
    if (tlsConfig.ca) {
        tlsOptions.ca = tlsConfig.ca;
    }
    else if (tlsConfig.caPath) {
        const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', tlsConfig.caPath);
        tlsOptions.ca = fs_1.default.readFileSync(resolvedPath, 'utf8');
        logger_1.default.debug(`[HTTP Provider] Loaded CA certificate from ${resolvedPath}`);
    }
    // Handle JKS certificates for TLS (extract cert and key)
    if (tlsConfig.jksPath || tlsConfig.jksContent) {
        try {
            const jksModule = await Promise.resolve().then(() => __importStar(require('jks-js'))).catch(() => {
                throw new Error('JKS certificate support requires the "jks-js" package. Install it with: npm install jks-js');
            });
            const jks = jksModule;
            let keystoreData;
            const keystorePassword = tlsConfig.keystorePassword ||
                tlsConfig.passphrase ||
                (0, envars_1.getEnvString)('PROMPTFOO_JKS_PASSWORD');
            if (!keystorePassword) {
                throw new Error('JKS keystore password is required for TLS. Provide it via passphrase or PROMPTFOO_JKS_PASSWORD environment variable');
            }
            if (tlsConfig.jksContent) {
                // Use base64 encoded content
                logger_1.default.debug(`[HTTP Provider] Loading JKS from base64 content for TLS`);
                keystoreData = Buffer.from(tlsConfig.jksContent, 'base64');
            }
            else if (tlsConfig.jksPath) {
                // Use file path
                const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', tlsConfig.jksPath);
                logger_1.default.debug(`[HTTP Provider] Loading JKS from file for TLS: ${resolvedPath}`);
                keystoreData = fs_1.default.readFileSync(resolvedPath);
            }
            else {
                throw new Error('JKS content or path is required');
            }
            const keystore = jks.toPem(keystoreData, keystorePassword);
            const aliases = Object.keys(keystore);
            if (aliases.length === 0) {
                throw new Error('No certificates found in JKS file');
            }
            const targetAlias = tlsConfig.keyAlias || aliases[0];
            const entry = keystore[targetAlias];
            if (!entry) {
                throw new Error(`Alias '${targetAlias}' not found in JKS file. Available aliases: ${aliases.join(', ')}`);
            }
            // Extract certificate and key from JKS entry
            if (entry.cert) {
                tlsOptions.cert = entry.cert;
                logger_1.default.debug(`[HTTP Provider] Extracted certificate from JKS for TLS (alias: ${targetAlias})`);
            }
            if (entry.key) {
                tlsOptions.key = entry.key;
                logger_1.default.debug(`[HTTP Provider] Extracted private key from JKS for TLS (alias: ${targetAlias})`);
            }
            if (!tlsOptions.cert || !tlsOptions.key) {
                throw new Error('Failed to extract both certificate and key from JKS file');
            }
        }
        catch (err) {
            logger_1.default.error(`[HTTP Provider] Failed to load JKS certificate for TLS: ${String(err)}`);
            throw new Error(`Failed to load JKS certificate: ${String(err)}`);
        }
    }
    else {
        // Load client certificate (non-JKS)
        if (tlsConfig.cert) {
            tlsOptions.cert = tlsConfig.cert;
        }
        else if (tlsConfig.certPath) {
            const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', tlsConfig.certPath);
            tlsOptions.cert = fs_1.default.readFileSync(resolvedPath, 'utf8');
            logger_1.default.debug(`[HTTP Provider] Loaded client certificate from ${resolvedPath}`);
        }
        // Load private key (non-JKS)
        if (tlsConfig.key) {
            tlsOptions.key = tlsConfig.key;
        }
        else if (tlsConfig.keyPath) {
            const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', tlsConfig.keyPath);
            tlsOptions.key = fs_1.default.readFileSync(resolvedPath, 'utf8');
            logger_1.default.debug(`[HTTP Provider] Loaded private key from ${resolvedPath}`);
        }
    }
    // Load PFX certificate
    if (tlsConfig.pfx) {
        // Handle inline PFX content
        if (typeof tlsConfig.pfx === 'string') {
            // Check if it's base64-encoded (common for embedding binary data in config files)
            if (isBase64(tlsConfig.pfx)) {
                tlsOptions.pfx = Buffer.from(tlsConfig.pfx, 'base64');
                logger_1.default.debug(`[HTTP Provider] Using base64-encoded inline PFX certificate`);
            }
            else {
                // Assume it's already in the correct format
                tlsOptions.pfx = tlsConfig.pfx;
                logger_1.default.debug(`[HTTP Provider] Using inline PFX certificate`);
            }
        }
        else {
            // It's already a Buffer
            tlsOptions.pfx = tlsConfig.pfx;
            logger_1.default.debug(`[HTTP Provider] Using inline PFX certificate buffer`);
        }
    }
    else if (tlsConfig.pfxPath) {
        const resolvedPath = (0, pathUtils_1.safeResolve)(cliState_1.default.basePath || '', tlsConfig.pfxPath);
        tlsOptions.pfx = fs_1.default.readFileSync(resolvedPath);
        logger_1.default.debug(`[HTTP Provider] Loaded PFX certificate from ${resolvedPath}`);
    }
    // Set passphrase if provided
    if (tlsConfig.passphrase) {
        tlsOptions.passphrase = tlsConfig.passphrase;
    }
    // Set security options
    tlsOptions.rejectUnauthorized = tlsConfig.rejectUnauthorized !== false;
    if (tlsConfig.servername) {
        tlsOptions.servername = tlsConfig.servername;
    }
    // Set cipher configuration
    if (tlsConfig.ciphers) {
        tlsOptions.ciphers = tlsConfig.ciphers;
    }
    if (tlsConfig.secureProtocol) {
        tlsOptions.secureProtocol = tlsConfig.secureProtocol;
    }
    if (tlsConfig.minVersion) {
        tlsOptions.minVersion = tlsConfig.minVersion;
    }
    if (tlsConfig.maxVersion) {
        tlsOptions.maxVersion = tlsConfig.maxVersion;
    }
    logger_1.default.debug(`[HTTP Provider] Creating HTTPS agent with TLS configuration`);
    // Create an undici Agent with the TLS options
    return new undici_1.Agent({
        connect: tlsOptions,
    });
}
class HttpProvider {
    constructor(url, options) {
        this.config = exports.HttpProviderConfigSchema.parse(options.config);
        if (!this.config.tokenEstimation && cliState_1.default.config?.redteam) {
            this.config.tokenEstimation = { enabled: true, multiplier: 1.3 };
        }
        this.url = this.config.url || url;
        // Pre-load any file:// references before passing to transform functions
        // This ensures httpTransforms.ts doesn't need to import from ../esm
        this.transformResponse = loadTransformModule(this.config.transformResponse || this.config.responseParser).then(httpTransforms_1.createTransformResponse);
        this.sessionParser = createSessionParser(this.config.sessionParser);
        this.transformRequest = loadTransformModule(this.config.transformRequest).then(httpTransforms_1.createTransformRequest);
        this.validateStatus = createValidateStatus(this.config.validateStatus);
        // Initialize HTTPS agent if TLS configuration is provided
        // Note: We can't use async in constructor, so we'll initialize on first use
        if (this.config.tls) {
            logger_1.default.debug('[HTTP Provider] TLS configuration detected, HTTPS agent will be created on first use');
        }
        if (this.config.request) {
            this.config.request = (0, file_1.maybeLoadFromExternalFile)(this.config.request);
        }
        else {
            (0, invariant_1.default)(this.config.body || this.config.method === 'GET', `Expected HTTP provider ${this.url} to have a config containing {body}, but instead got ${(0, json_1.safeJsonStringify)(this.config)}`);
        }
        // Process body to resolve file:// references
        if (this.config.body) {
            this.config.body = (0, file_1.maybeLoadConfigFromExternalFile)(this.config.body);
        }
    }
    id() {
        return this.url;
    }
    toString() {
        return `[HTTP Provider ${this.url}]`;
    }
    /**
     * Estimates token usage for prompt and completion text
     */
    async estimateTokenUsage(promptText, completionText) {
        if (!this.config.tokenEstimation?.enabled) {
            return undefined;
        }
        try {
            const config = this.config.tokenEstimation;
            const promptTokens = estimateTokenCount(promptText, config.multiplier);
            const completionTokens = estimateTokenCount(completionText, config.multiplier);
            const totalTokens = promptTokens + completionTokens;
            return {
                prompt: promptTokens,
                completion: completionTokens,
                total: totalTokens,
                numRequests: 1,
            };
        }
        catch (err) {
            logger_1.default.warn(`Failed to estimate tokens: ${String(err)}`);
            return undefined;
        }
    }
    async refreshSignatureIfNeeded() {
        if (!this.config.signatureAuth) {
            logger_1.default.debug('[HTTP Provider Auth]: No signature auth configured');
            return;
        }
        const signatureAuth = this.config.signatureAuth;
        if (!this.lastSignatureTimestamp ||
            !this.lastSignature ||
            needsSignatureRefresh(this.lastSignatureTimestamp, signatureAuth.signatureValidityMs, signatureAuth.signatureRefreshBufferMs)) {
            logger_1.default.debug('[HTTP Provider Auth]: Generating new signature');
            this.lastSignatureTimestamp = Date.now();
            // Determine the signature auth type for legacy configurations
            let authConfig = signatureAuth;
            if (!('type' in signatureAuth)) {
                authConfig = { ...signatureAuth, type: 'pem' };
            }
            this.lastSignature = await generateSignature(authConfig, this.lastSignatureTimestamp);
            logger_1.default.debug('[HTTP Provider Auth]: Generated new signature successfully');
        }
        else {
            logger_1.default.debug('[HTTP Provider Auth]: Using cached signature');
        }
        (0, invariant_1.default)(this.lastSignature, 'Signature should be defined at this point');
        (0, invariant_1.default)(this.lastSignatureTimestamp, 'Timestamp should be defined at this point');
    }
    async getHttpsAgent() {
        if (!this.config.tls) {
            return undefined;
        }
        // If agent is already created, return it
        if (this.httpsAgent) {
            return this.httpsAgent;
        }
        // If agent creation is in progress, wait for it
        if (this.httpsAgentPromise) {
            return this.httpsAgentPromise;
        }
        // Create the agent
        this.httpsAgentPromise = createHttpsAgent(this.config.tls);
        try {
            this.httpsAgent = await this.httpsAgentPromise;
            logger_1.default.debug('[HTTP Provider] HTTPS agent created successfully');
            return this.httpsAgent;
        }
        catch (err) {
            // Clear the promise so we can retry
            this.httpsAgentPromise = undefined;
            throw err;
        }
    }
    getDefaultHeaders(body) {
        if (this.config.method === 'GET') {
            return {};
        }
        if (typeof body === 'object' && body !== null) {
            return { 'content-type': 'application/json' };
        }
        else if (typeof body === 'string') {
            return { 'content-type': 'application/x-www-form-urlencoded' };
        }
        return {};
    }
    validateContentTypeAndBody(headers, body) {
        if (body != null) {
            if (typeof body == 'object' && !contentTypeIsJson(headers)) {
                throw new Error('Content-Type is not application/json, but body is an object or array. The body must be a string if the Content-Type is not application/json.');
            }
            try {
                if (typeof body === 'string' && contentTypeIsJson(headers)) {
                    JSON.parse(body);
                }
            }
            catch {
                logger_1.default.warn(`[HTTP Provider] Content-Type is application/json, but body is a string. This is likely to cause unexpected results. It should be an object or array. Body: ${body} headers: ${(0, json_1.safeJsonStringify)(headers)}`);
            }
        }
    }
    async getHeaders(defaultHeaders, vars) {
        const configHeaders = this.config.headers || {};
        // Convert all keys in configHeaders to lowercase
        const headers = Object.fromEntries(Object.entries(configHeaders).map(([key, value]) => [key.toLowerCase(), value]));
        const nunjucks = (0, templates_1.getNunjucksEngine)();
        return Object.fromEntries(Object.entries({ ...defaultHeaders, ...headers }).map(([key, value]) => [
            key,
            nunjucks.renderString(value, vars),
        ]));
    }
    async callApi(prompt, context) {
        const vars = {
            ...(context?.vars || {}),
            prompt,
        };
        // Add signature values to vars if signature auth is enabled
        if (this.config.signatureAuth) {
            await this.refreshSignatureIfNeeded();
            (0, invariant_1.default)(this.lastSignature, 'Signature should be defined at this point');
            (0, invariant_1.default)(this.lastSignatureTimestamp, 'Timestamp should be defined at this point');
            if (vars.signature) {
                logger_1.default.warn('[HTTP Provider Auth]: `signature` is already defined in vars and will be overwritten');
            }
            if (vars.signatureTimestamp) {
                logger_1.default.warn('[HTTP Provider Auth]: `signatureTimestamp` is already defined in vars and will be overwritten');
            }
            vars.signature = this.lastSignature;
            vars.signatureTimestamp = this.lastSignatureTimestamp;
        }
        if (this.config.request) {
            return this.callApiWithRawRequest(vars, context);
        }
        const defaultHeaders = this.getDefaultHeaders(this.config.body);
        const headers = await this.getHeaders(defaultHeaders, vars);
        // Add W3C Trace Context headers if provided
        if (context?.traceparent) {
            headers.traceparent = context.traceparent;
            logger_1.default.debug(`[HTTP Provider]: Adding traceparent header: ${context.traceparent}`);
        }
        if (context?.tracestate) {
            headers.tracestate = context.tracestate;
        }
        this.validateContentTypeAndBody(headers, this.config.body);
        // Transform prompt using request transform
        const transformedPrompt = await (await this.transformRequest)(prompt, vars, context);
        logger_1.default.debug(`[HTTP Provider]: Transformed prompt: ${(0, json_1.safeJsonStringify)(transformedPrompt)}. Original prompt: ${(0, json_1.safeJsonStringify)(prompt)}`);
        const renderedConfig = {
            url: (0, templates_1.getNunjucksEngine)().renderString(this.url, vars),
            method: (0, templates_1.getNunjucksEngine)().renderString(this.config.method || 'GET', vars),
            headers,
            body: determineRequestBody(contentTypeIsJson(headers), transformedPrompt, this.config.body, vars),
            queryParams: this.config.queryParams
                ? Object.fromEntries(Object.entries(this.config.queryParams).map(([key, value]) => [
                    key,
                    (0, templates_1.getNunjucksEngine)().renderString(value, vars),
                ]))
                : undefined,
            transformResponse: this.config.transformResponse || this.config.responseParser,
        };
        const method = renderedConfig.method || 'POST';
        (0, invariant_1.default)(typeof method === 'string', 'Expected method to be a string');
        (0, invariant_1.default)(typeof headers === 'object', 'Expected headers to be an object');
        // Template the base URL first, then construct URL with query parameters
        let url = renderedConfig.url;
        if (renderedConfig.queryParams) {
            try {
                const urlObj = new URL(url);
                // Add each query parameter to the URL object
                Object.entries(renderedConfig.queryParams).forEach(([key, value]) => {
                    urlObj.searchParams.append(key, value);
                });
                url = urlObj.toString();
            }
            catch (err) {
                // Fallback for potentially malformed URLs
                logger_1.default.warn(`[HTTP Provider]: Failed to construct URL object: ${String(err)}`);
                const queryString = new URLSearchParams(renderedConfig.queryParams).toString();
                url = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
            }
        }
        logger_1.default.debug(`[HTTP Provider]: Calling ${(0, sanitizer_1.sanitizeUrl)(url)} with config.`, {
            config: renderedConfig,
        });
        // Prepare fetch options with dispatcher if HTTPS agent is configured
        const httpsAgent = await this.getHttpsAgent();
        const fetchOptions = {
            method: renderedConfig.method,
            headers: renderedConfig.headers,
            ...(method !== 'GET' &&
                renderedConfig.body != null && {
                body: contentTypeIsJson(headers)
                    ? typeof renderedConfig.body === 'string'
                        ? renderedConfig.body // Already a JSON string, use as-is
                        : JSON.stringify(renderedConfig.body) // Object, needs stringifying
                    : typeof renderedConfig.body === 'string'
                        ? renderedConfig.body.trim()
                        : String(renderedConfig.body),
            }),
        };
        // Add HTTPS agent as dispatcher if configured
        if (httpsAgent) {
            fetchOptions.dispatcher = httpsAgent;
            logger_1.default.debug('[HTTP Provider]: Using custom HTTPS agent for TLS connection');
        }
        let data, cached = false, status, statusText, responseHeaders, latencyMs;
        try {
            ({
                data,
                cached,
                status,
                statusText,
                headers: responseHeaders,
                latencyMs,
            } = await (0, cache_1.fetchWithCache)(url, fetchOptions, shared_1.REQUEST_TIMEOUT_MS, 'text', context?.bustCache ?? context?.debug, this.config.maxRetries));
        }
        catch (err) {
            throw err;
        }
        if (!(await this.validateStatus)(status)) {
            throw new Error(`HTTP call failed with status ${status} ${statusText}: ${data}`);
        }
        logger_1.default.debug(`[HTTP Provider]: Response (HTTP ${status}) received`, {
            length: typeof data === 'string' ? data.length : undefined,
            cached,
        });
        const ret = {};
        ret.raw = data;
        ret.latencyMs = latencyMs;
        ret.cached = cached;
        ret.metadata = {
            http: {
                status,
                statusText,
                headers: (0, sanitizer_1.sanitizeObject)(responseHeaders, { context: 'response headers' }),
                ...(context?.debug && {
                    requestHeaders: (0, sanitizer_1.sanitizeObject)(renderedConfig.headers, { context: 'request headers' }),
                }),
            },
        };
        if (context?.debug) {
            ret.metadata.transformedRequest = transformedPrompt;
            ret.metadata.finalRequestBody = renderedConfig.body;
        }
        const rawText = data;
        let parsedData;
        try {
            parsedData = JSON.parse(rawText);
        }
        catch {
            parsedData = null;
        }
        try {
            const sessionId = this.sessionParser == null
                ? undefined
                : (await this.sessionParser)({ headers: responseHeaders, body: parsedData ?? rawText });
            if (sessionId) {
                ret.sessionId = sessionId;
            }
        }
        catch (err) {
            logger_1.default.error(`Error parsing session ID: ${String(err)}. Got headers: ${(0, json_1.safeJsonStringify)((0, sanitizer_1.sanitizeObject)(responseHeaders, { context: 'response headers' }))} and parsed body: ${(0, json_1.safeJsonStringify)((0, sanitizer_1.sanitizeObject)(parsedData, { context: 'response body' }))}`);
            throw err;
        }
        const parsedOutput = (await this.transformResponse)(parsedData, rawText, {
            response: { data, status, statusText, headers: responseHeaders, cached, latencyMs },
        });
        return this.processResponseWithTokenEstimation(ret, parsedOutput, rawText, transformedPrompt, prompt);
    }
    async callApiWithRawRequest(vars, context) {
        (0, invariant_1.default)(this.config.request, 'Expected request to be set in http provider config');
        // Transform prompt using request transform
        const prompt = vars.prompt;
        const transformFn = await this.transformRequest;
        const transformedPrompt = await transformFn(prompt, vars, context);
        logger_1.default.debug(`[HTTP Provider]: Transformed prompt: ${(0, json_1.safeJsonStringify)(transformedPrompt)}. Original prompt: ${(0, json_1.safeJsonStringify)(prompt)}`);
        // JSON-escape all string variables for safe substitution in raw request body
        // This prevents control characters and quotes from breaking JSON strings
        const escapedVars = escapeJsonVariables({
            ...vars,
            prompt: transformedPrompt,
        });
        const renderedRequest = renderRawRequestWithNunjucks(this.config.request, escapedVars);
        const parsedRequest = parseRawRequest(renderedRequest.trim());
        const protocol = this.url.startsWith('https') || this.config.useHttps ? 'https' : 'http';
        const url = new URL(parsedRequest.url, `${protocol}://${parsedRequest.headers['host']}`).toString();
        // Remove content-length header from raw request if the user added it, it will be added by fetch with the correct value
        delete parsedRequest.headers['content-length'];
        // Add W3C Trace Context headers if provided
        if (context?.traceparent) {
            parsedRequest.headers.traceparent = context.traceparent;
            logger_1.default.debug(`[HTTP Provider]: Adding traceparent header: ${context.traceparent}`);
        }
        if (context?.tracestate) {
            parsedRequest.headers.tracestate = context.tracestate;
        }
        logger_1.default.debug(`[HTTP Provider]: Calling ${(0, sanitizer_1.sanitizeUrl)(url)} with raw request: ${parsedRequest.method}`, {
            request: parsedRequest,
        });
        // Prepare fetch options with dispatcher if HTTPS agent is configured
        const httpsAgent = await this.getHttpsAgent();
        const fetchOptions = {
            method: parsedRequest.method,
            headers: parsedRequest.headers,
            ...(parsedRequest.body?.text && { body: parsedRequest.body.text.trim() }),
        };
        // Add HTTPS agent as dispatcher if configured
        if (httpsAgent) {
            fetchOptions.dispatcher = httpsAgent;
            logger_1.default.debug('[HTTP Provider]: Using custom HTTPS agent for TLS connection');
        }
        let data, cached = false, status, statusText, responseHeaders, latencyMs;
        try {
            ({
                data,
                cached,
                status,
                statusText,
                headers: responseHeaders,
                latencyMs,
            } = await (0, cache_1.fetchWithCache)(url, fetchOptions, shared_1.REQUEST_TIMEOUT_MS, 'text', context?.bustCache ?? context?.debug, this.config.maxRetries));
        }
        catch (err) {
            throw err;
        }
        logger_1.default.debug('[HTTP Provider]: Response received', {
            length: typeof data === 'string' ? data.length : undefined,
            cached,
        });
        if (!(await this.validateStatus)(status)) {
            throw new Error(`HTTP call failed with status ${status} ${statusText}: ${data}`);
        }
        const rawText = data;
        let parsedData;
        try {
            parsedData = JSON.parse(rawText);
        }
        catch {
            parsedData = null;
        }
        const ret = {};
        ret.latencyMs = latencyMs;
        ret.cached = cached;
        if (context?.debug) {
            ret.raw = data;
            ret.metadata = {
                headers: (0, sanitizer_1.sanitizeObject)(responseHeaders, { context: 'response headers' }),
                // If no transform was applied, show the final raw request body with nunjucks applied
                // Otherwise show the transformed prompt
                transformedRequest: this.config.transformRequest
                    ? transformedPrompt
                    : parsedRequest.body?.text || renderedRequest.trim(),
                finalRequestBody: parsedRequest.body?.text,
                http: {
                    status,
                    statusText,
                    headers: (0, sanitizer_1.sanitizeObject)(responseHeaders, { context: 'response headers' }),
                    requestHeaders: (0, sanitizer_1.sanitizeObject)(parsedRequest.headers, { context: 'request headers' }),
                },
            };
        }
        const parsedOutput = (await this.transformResponse)(parsedData, rawText, {
            response: { data, status, statusText, headers: responseHeaders, cached, latencyMs },
        });
        return this.processResponseWithTokenEstimation(ret, parsedOutput, rawText, transformedPrompt, prompt);
    }
    /**
     * Extracts completion text from parsed output with fallback to raw text
     */
    getCompletionText(parsedOutput, rawText) {
        if (typeof parsedOutput === 'string') {
            return parsedOutput;
        }
        if (parsedOutput?.output && typeof parsedOutput.output === 'string') {
            return parsedOutput.output;
        }
        return rawText;
    }
    /**
     * Processes response and adds token estimation if enabled
     */
    async processResponseWithTokenEstimation(ret, parsedOutput, rawText, transformedPrompt, prompt) {
        // Estimate tokens if enabled
        let estimatedTokenUsage;
        if (this.config.tokenEstimation?.enabled) {
            const promptText = typeof transformedPrompt === 'string' ? transformedPrompt : prompt;
            const completionText = this.getCompletionText(parsedOutput, rawText);
            estimatedTokenUsage = await this.estimateTokenUsage(promptText, completionText);
        }
        if (parsedOutput?.output) {
            const result = {
                ...ret,
                ...parsedOutput,
            };
            // Add estimated token usage if available and not already present
            if (!result.tokenUsage) {
                if (estimatedTokenUsage) {
                    result.tokenUsage = estimatedTokenUsage;
                }
                else {
                    result.tokenUsage = { ...(0, tokenUsageUtils_1.createEmptyTokenUsage)(), numRequests: 1 };
                }
            }
            return result;
        }
        const result = {
            ...ret,
            output: parsedOutput,
        };
        // Add estimated token usage if available
        if (!result.tokenUsage) {
            if (estimatedTokenUsage) {
                result.tokenUsage = estimatedTokenUsage;
            }
            else {
                result.tokenUsage = { ...(0, tokenUsageUtils_1.createEmptyTokenUsage)(), numRequests: 1 };
            }
        }
        return result;
    }
}
exports.HttpProvider = HttpProvider;
//# sourceMappingURL=http.js.map