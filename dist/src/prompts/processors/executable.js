"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executablePromptFunction = void 0;
exports.processExecutableFile = processExecutableFile;
const child_process_1 = require("child_process");
const promises_1 = require("fs/promises");
const logger_1 = __importDefault(require("../../logger"));
const scriptCompletion_1 = require("../../providers/scriptCompletion");
const cache_1 = require("../../cache");
const invariant_1 = __importDefault(require("../../util/invariant"));
const json_1 = require("../../util/json");
const ANSI_ESCAPE = /\x1b(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g;
function stripText(text) {
    return text.replace(ANSI_ESCAPE, '');
}
/**
 * Executable prompt function. Executes any script/binary and returns its output as the prompt.
 * The script receives context as JSON in its arguments.
 * @param scriptPath - Path to the executable script.
 * @param context - Context for the prompt.
 * @returns The prompt output from the script.
 */
const executablePromptFunction = async (scriptPath, context) => {
    (0, invariant_1.default)(context.provider?.id, 'provider.id is required');
    const transformedContext = {
        vars: context.vars,
        provider: {
            id: typeof context.provider?.id === 'function' ? context.provider?.id() : context.provider?.id,
            label: context.provider?.label,
        },
        config: context.config ?? {},
    };
    const scriptParts = (0, scriptCompletion_1.parseScriptParts)(scriptPath);
    const fileHashes = (0, scriptCompletion_1.getFileHashes)(scriptParts);
    const cacheKey = `exec-prompt:${scriptPath}:${fileHashes.join(':')}:${(0, json_1.safeJsonStringify)(transformedContext)}`;
    let cachedResult;
    if (fileHashes.length > 0 && (0, cache_1.isCacheEnabled)()) {
        const cache = (0, cache_1.getCache)();
        cachedResult = await cache.get(cacheKey);
        if (cachedResult) {
            logger_1.default.debug(`Returning cached result for executable prompt ${scriptPath}`);
            return cachedResult;
        }
    }
    return new Promise((resolve, reject) => {
        const command = scriptParts.shift();
        (0, invariant_1.default)(command, 'No command found in script path');
        // Pass context as JSON argument to the script
        const scriptArgs = scriptParts.concat([(0, json_1.safeJsonStringify)(transformedContext)]);
        const options = {
            cwd: context.config?.basePath,
            timeout: context.config?.timeout || 60000, // Default 60 second timeout
        };
        logger_1.default.debug(`Executing prompt script: ${command} ${scriptArgs.join(' ')}`);
        (0, child_process_1.execFile)(command, scriptArgs, options, async (error, stdout, stderr) => {
            if (error) {
                logger_1.default.error(`Error running executable prompt ${scriptPath}: ${error.message}`);
                reject(error);
                return;
            }
            const standardOutput = stripText(Buffer.from(stdout).toString('utf8').trim());
            const errorOutput = stripText(Buffer.from(stderr).toString('utf8').trim());
            if (errorOutput) {
                logger_1.default.debug(`Error output from executable prompt ${scriptPath}: ${errorOutput}`);
                if (!standardOutput) {
                    reject(new Error(errorOutput));
                    return;
                }
            }
            logger_1.default.debug(`Output from executable prompt ${scriptPath}: ${standardOutput}`);
            if (fileHashes.length > 0 && (0, cache_1.isCacheEnabled)()) {
                const cache = (0, cache_1.getCache)();
                await cache.set(cacheKey, standardOutput);
            }
            resolve(standardOutput);
        });
    });
};
exports.executablePromptFunction = executablePromptFunction;
/**
 * Processes an executable file to generate prompts.
 * The executable can be any script or binary that outputs prompt text to stdout.
 * It receives the context as JSON in its first argument.
 *
 * @param filePath - Path to the executable file (can include arguments).
 * @param prompt - The raw prompt data.
 * @param functionName - Not used for executables, but kept for interface consistency.
 * @returns Array of prompts generated from the executable.
 */
async function processExecutableFile(filePath, prompt, _functionName) {
    // For display purposes, try to read the file if it exists and is a text file
    let rawContent = filePath;
    const scriptParts = (0, scriptCompletion_1.parseScriptParts)(filePath);
    const firstPart = scriptParts[0];
    if (firstPart) {
        try {
            const stats = await (0, promises_1.stat)(firstPart);
            if (stats.isFile() && stats.size < 1024 * 100) {
                // Only read files < 100KB
                const content = await (0, promises_1.readFile)(firstPart, 'utf-8');
                // Check if it's likely a text file
                if (!/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(content.substring(0, 1000))) {
                    rawContent = content;
                }
            }
        }
        catch (_e) {
            // Ignore errors, use the path as raw content
        }
    }
    const label = prompt.label ?? filePath;
    return [
        {
            raw: rawContent,
            label,
            function: (context) => (0, exports.executablePromptFunction)(filePath, { ...context, config: prompt.config }),
            config: prompt.config,
        },
    ];
}
//# sourceMappingURL=executable.js.map