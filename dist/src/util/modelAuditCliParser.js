"use strict";
/**
 * Utility for parsing and validating ModelAudit CLI arguments
 * Ensures compatibility between promptfoo and modelaudit CLI interfaces
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeValidateModelAuditOptions = exports.validateModelAuditOptions = exports.isValidFormat = exports.DEPRECATED_OPTIONS_MAP = exports.VALID_MODELAUDIT_OPTIONS = exports.ValidatedModelAuditArgsSchema = exports.ModelAuditCliOptionsSchema = void 0;
exports.parseModelAuditArgs = parseModelAuditArgs;
exports.validateModelAuditArgs = validateModelAuditArgs;
exports.suggestReplacements = suggestReplacements;
exports.formatUnsupportedArgsError = formatUnsupportedArgsError;
const zod_1 = require("zod");
/**
 * Zod schema for ModelAudit CLI options
 */
exports.ModelAuditCliOptionsSchema = zod_1.z.object({
    // Core output control
    blacklist: zod_1.z.array(zod_1.z.string()).optional(),
    format: zod_1.z.enum(['text', 'json', 'sarif']).optional(),
    output: zod_1.z.string().optional(),
    verbose: zod_1.z.boolean().optional(),
    quiet: zod_1.z.boolean().optional(),
    // Security behavior
    strict: zod_1.z.boolean().optional(),
    // Progress & reporting
    progress: zod_1.z.boolean().optional(),
    sbom: zod_1.z.string().optional(),
    // Override smart detection
    timeout: zod_1.z.number().positive().optional(),
    maxSize: zod_1.z
        .string()
        .regex(/^\s*\d+(\.\d+)?\s*(TB|GB|MB|KB|B)\s*$/i, 'Invalid size format (e.g., 1GB, 500MB, 1 GB)')
        .optional(),
    // Preview/debugging
    dryRun: zod_1.z.boolean().optional(),
    cache: zod_1.z.boolean().optional(), // when false, adds --no-cache
    stream: zod_1.z.boolean().optional(), // scan and delete files immediately
});
exports.ValidatedModelAuditArgsSchema = zod_1.z.object({
    args: zod_1.z.array(zod_1.z.string()),
    unsupportedOptions: zod_1.z.array(zod_1.z.string()),
});
/**
 * Valid ModelAudit CLI options as of version 0.2.5
 */
exports.VALID_MODELAUDIT_OPTIONS = new Set([
    '--format',
    '-f',
    '--output',
    '-o',
    '--verbose',
    '-v',
    '--quiet',
    '-q',
    '--blacklist',
    '-b',
    '--strict',
    '--progress',
    '--sbom',
    '--timeout',
    '-t',
    '--max-size',
    '--dry-run',
    '--no-cache',
    '--stream',
]);
/**
 * Options that were removed/changed from previous versions
 */
exports.DEPRECATED_OPTIONS_MAP = {
    '--max-file-size': '--max-size',
    '--max-total-size': null, // No equivalent
    '--registry-uri': null, // Use environment variables
    '--jfrog-api-token': null, // Use environment variables
    '--jfrog-access-token': null, // Use environment variables
    '--max-download-size': null, // No equivalent
    '--cache-dir': null, // No equivalent
    '--preview': '--dry-run',
    '--all-files': null, // No equivalent
    '--selective': null, // No equivalent
    '--skip-files': null, // No equivalent
    '--no-skip-files': null, // No equivalent
    '--strict-license': '--strict',
    '--no-large-model-support': null, // No equivalent
    '--no-progress': null, // No equivalent (progress is auto-detected)
    '--progress-log': null, // No equivalent
    '--progress-format': null, // No equivalent
    '--progress-interval': null, // No equivalent
};
/**
 * Configuration mapping from option keys to CLI arguments
 */
const CLI_ARG_MAP = {
    blacklist: { flag: '--blacklist', type: 'array' },
    format: { flag: '--format', type: 'string' },
    output: { flag: '--output', type: 'string' },
    verbose: { flag: '--verbose', type: 'boolean' },
    quiet: { flag: '--quiet', type: 'boolean' },
    strict: { flag: '--strict', type: 'boolean' },
    progress: { flag: '--progress', type: 'boolean' },
    sbom: { flag: '--sbom', type: 'string' },
    timeout: { flag: '--timeout', type: 'number', transform: (v) => v.toString() },
    maxSize: { flag: '--max-size', type: 'string' },
    dryRun: { flag: '--dry-run', type: 'boolean' },
    cache: { flag: '--no-cache', type: 'inverted-boolean' },
    stream: { flag: '--stream', type: 'boolean' },
};
/**
 * Elegant, configuration-driven CLI argument parser
 */
function parseModelAuditArgs(paths, options) {
    const validatedOptions = exports.ModelAuditCliOptionsSchema.parse(options);
    const args = ['scan', ...paths];
    // Build arguments using configuration map
    for (const [key, config] of Object.entries(CLI_ARG_MAP)) {
        const value = validatedOptions[key];
        if (value === undefined || value === null) {
            continue;
        }
        switch (config.type) {
            case 'boolean':
                if (value) {
                    args.push(config.flag);
                }
                break;
            case 'inverted-boolean':
                if (value === false) {
                    args.push(config.flag);
                }
                break;
            case 'string':
                args.push(config.flag, String(value));
                break;
            case 'number':
                args.push(config.flag, config.transform?.(value) ?? String(value));
                break;
            case 'array':
                if (Array.isArray(value)) {
                    value.forEach((item) => args.push(config.flag, String(item)));
                }
                break;
        }
    }
    return { args, unsupportedOptions: [] };
}
/**
 * Validates that CLI arguments are supported by modelaudit
 */
function validateModelAuditArgs(args) {
    const unsupportedArgs = [];
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        // Skip non-option arguments (paths, values)
        if (!arg.startsWith('--') && !arg.startsWith('-')) {
            continue;
        }
        // Skip 'scan' command
        if (arg === 'scan') {
            continue;
        }
        if (!exports.VALID_MODELAUDIT_OPTIONS.has(arg)) {
            unsupportedArgs.push(arg);
        }
    }
    return {
        valid: unsupportedArgs.length === 0,
        unsupportedArgs,
    };
}
/**
 * Suggests replacements for deprecated options
 */
function suggestReplacements(deprecatedOptions) {
    const suggestions = {};
    for (const option of deprecatedOptions) {
        if (option in exports.DEPRECATED_OPTIONS_MAP) {
            suggestions[option] = exports.DEPRECATED_OPTIONS_MAP[option];
        }
    }
    return suggestions;
}
/**
 * Creates a user-friendly error message for unsupported arguments
 */
function formatUnsupportedArgsError(unsupportedArgs) {
    if (unsupportedArgs.length === 0) {
        return '';
    }
    const suggestions = suggestReplacements(unsupportedArgs);
    let message = `Unsupported ModelAudit arguments: ${unsupportedArgs.join(', ')}`;
    const replacements = Object.entries(suggestions)
        .filter(([_, replacement]) => replacement !== null)
        .map(([old, replacement]) => `${old} → ${replacement}`);
    const noReplacements = Object.entries(suggestions)
        .filter(([_, replacement]) => replacement === null)
        .map(([old, _]) => old);
    if (replacements.length > 0) {
        message += `\n\nSuggested replacements:\n${replacements.join('\n')}`;
    }
    if (noReplacements.length > 0) {
        message += `\n\nNo replacement available for: ${noReplacements.join(', ')}`;
        message +=
            '\nThese options may be handled automatically by modelaudit or use environment variables.';
    }
    return message;
}
/**
 * Compact validation utilities using Zod
 */
const isValidFormat = (format) => zod_1.z.enum(['text', 'json', 'sarif']).safeParse(format).success;
exports.isValidFormat = isValidFormat;
const validateModelAuditOptions = (options) => exports.ModelAuditCliOptionsSchema.parse(options);
exports.validateModelAuditOptions = validateModelAuditOptions;
const safeValidateModelAuditOptions = (options) => {
    const result = exports.ModelAuditCliOptionsSchema.safeParse(options);
    return result.success
        ? { success: true, data: result.data }
        : { success: false, error: result.error };
};
exports.safeValidateModelAuditOptions = safeValidateModelAuditOptions;
//# sourceMappingURL=modelAuditCliParser.js.map