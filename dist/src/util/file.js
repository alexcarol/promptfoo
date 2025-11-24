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
exports.getNunjucksEngineForFilePath = getNunjucksEngineForFilePath;
exports.maybeLoadFromExternalFile = maybeLoadFromExternalFile;
exports.getResolvedRelativePath = getResolvedRelativePath;
exports.maybeLoadConfigFromExternalFile = maybeLoadConfigFromExternalFile;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const sync_1 = require("csv-parse/sync");
const glob_1 = require("glob");
const js_yaml_1 = __importDefault(require("js-yaml"));
const nunjucks_1 = __importDefault(require("nunjucks"));
const cliState_1 = __importDefault(require("../cliState"));
const logger_1 = __importDefault(require("../logger"));
const loadFunction_1 = require("./functions/loadFunction");
const fileExtensions_1 = require("./fileExtensions");
/**
 * Simple Nunjucks engine specifically for file paths
 * This function is separate from the main getNunjucksEngine to avoid circular dependencies
 */
function getNunjucksEngineForFilePath() {
    const env = nunjucks_1.default.configure({
        autoescape: false,
    });
    // Add environment variables as template globals
    env.addGlobal('env', {
        ...process.env,
        ...cliState_1.default.config?.env,
    });
    return env;
}
/**
 * Loads content from an external file if the input is a file path, otherwise
 * returns the input as-is. Supports Nunjucks templating for file paths.
 *
 * @param filePath - The input to process. Can be a file path string starting with "file://",
 * an array of file paths, or any other type of data.
 * @param context - Optional context to control file loading behavior. 'assertion' context
 * preserves Python/JS file references instead of loading their content.
 * @returns The loaded content if the input was a file path, otherwise the original input.
 * For JSON and YAML files, the content is parsed into an object.
 * For other file types, the raw file content is returned as a string.
 *
 * @throws {Error} If the specified file does not exist.
 */
function maybeLoadFromExternalFile(filePath, context) {
    if (Array.isArray(filePath)) {
        return filePath.map((path) => {
            const content = maybeLoadFromExternalFile(path, context);
            return content;
        });
    }
    if (typeof filePath !== 'string') {
        return filePath;
    }
    if (!filePath.startsWith('file://')) {
        return filePath;
    }
    // Render the file path using Nunjucks
    const renderedFilePath = getNunjucksEngineForFilePath().renderString(filePath, {});
    // Parse the file URL to extract file path and function name using existing utility
    // This handles colon splitting correctly, including Windows drive letters (C:\path)
    const { filePath: cleanPath, functionName } = (0, loadFunction_1.parseFileUrl)(renderedFilePath);
    // In assertion contexts, always preserve Python/JS file references
    // This prevents premature dereferencing of assertion files that should be
    // handled by the assertion system, not the generic config loader
    if (context === 'assertion' && (cleanPath.endsWith('.py') || (0, fileExtensions_1.isJavascriptFile)(cleanPath))) {
        logger_1.default.debug(`Preserving Python/JS file reference in assertion context: ${renderedFilePath}`);
        return renderedFilePath;
    }
    // In vars contexts, preserve file:// glob patterns for test case expansion
    // This prevents premature glob expansion that should be handled by generateVarCombinations
    if (context === 'vars' && (0, glob_1.hasMagic)(renderedFilePath)) {
        logger_1.default.debug(`Preserving glob pattern in vars context: ${renderedFilePath}`);
        return renderedFilePath;
    }
    // For Python/JS files with function names, return the original string unchanged
    // to allow the assertion system to handle function loading at execution time.
    // This prevents premature file existence checks that would fail for function references.
    if (functionName && (cleanPath.endsWith('.py') || (0, fileExtensions_1.isJavascriptFile)(cleanPath))) {
        return renderedFilePath;
    }
    // For non-Python/JS files, use the original path (ignore potential function name)
    const pathToUse = functionName && !(cleanPath.endsWith('.py') || (0, fileExtensions_1.isJavascriptFile)(cleanPath))
        ? renderedFilePath.slice('file://'.length) // Use original path for non-script files
        : cleanPath;
    const resolvedPath = path.resolve(cliState_1.default.basePath || '', pathToUse);
    // Check if the path contains glob patterns
    if ((0, glob_1.hasMagic)(pathToUse)) {
        // Use globSync to expand the pattern
        const matchedFiles = (0, glob_1.globSync)(resolvedPath, {
            windowsPathsNoEscape: true,
        });
        if (matchedFiles.length === 0) {
            throw new Error(`No files found matching pattern: ${resolvedPath}`);
        }
        // Load all matched files and combine their contents
        const allContents = [];
        for (const matchedFile of matchedFiles) {
            const contents = fs.readFileSync(matchedFile, 'utf8');
            if (matchedFile.endsWith('.json')) {
                const parsed = JSON.parse(contents);
                if (Array.isArray(parsed)) {
                    allContents.push(...parsed);
                }
                else {
                    allContents.push(parsed);
                }
            }
            else if (matchedFile.endsWith('.yaml') || matchedFile.endsWith('.yml')) {
                const parsed = js_yaml_1.default.load(contents);
                if (parsed === null || parsed === undefined) {
                    continue; // Skip empty files
                }
                if (Array.isArray(parsed)) {
                    allContents.push(...parsed);
                }
                else {
                    allContents.push(parsed);
                }
            }
            else if (matchedFile.endsWith('.csv')) {
                const csvOptions = {
                    columns: true,
                };
                const records = (0, sync_1.parse)(contents, csvOptions);
                // If single column, return array of values to match single file behavior
                if (records.length > 0 && Object.keys(records[0]).length === 1) {
                    allContents.push(...records.map((record) => Object.values(record)[0]));
                }
                else {
                    allContents.push(...records);
                }
            }
            else {
                allContents.push(contents);
            }
        }
        return allContents;
    }
    // Original single file logic
    const finalPath = resolvedPath;
    if (!fs.existsSync(finalPath)) {
        throw new Error(`File does not exist: ${finalPath}`);
    }
    let contents;
    try {
        contents = fs.readFileSync(finalPath, 'utf8');
    }
    catch (error) {
        throw new Error(`Failed to read file ${finalPath}: ${error}`);
    }
    if (finalPath.endsWith('.json')) {
        try {
            return JSON.parse(contents);
        }
        catch (error) {
            throw new Error(`Failed to parse JSON file ${finalPath}: ${error}`);
        }
    }
    if (finalPath.endsWith('.yaml') || finalPath.endsWith('.yml')) {
        try {
            return js_yaml_1.default.load(contents);
        }
        catch (error) {
            throw new Error(`Failed to parse YAML file ${finalPath}: ${error}`);
        }
    }
    if (finalPath.endsWith('.csv')) {
        const csvOptions = {
            columns: true,
        };
        const records = (0, sync_1.parse)(contents, csvOptions);
        // If single column, return array of values
        if (records.length > 0 && Object.keys(records[0]).length === 1) {
            return records.map((record) => Object.values(record)[0]);
        }
        return records;
    }
    return contents;
}
/**
 * Resolves a relative file path with respect to a base path, handling cloud configuration appropriately.
 * When using a cloud configuration, the current working directory is always used instead of the context's base path.
 *
 * @param filePath - The relative or absolute file path to resolve.
 * @param isCloudConfig - Whether this is a cloud configuration.
 * @returns The resolved absolute file path.
 */
function getResolvedRelativePath(filePath, isCloudConfig) {
    // If it's already an absolute path, or not a cloud config, return it as is
    if (path.isAbsolute(filePath) || !isCloudConfig) {
        return filePath;
    }
    // Join the basePath and filePath to get the resolved path
    return path.join(process.cwd(), filePath);
}
/**
 * Recursively loads external file references from a configuration object.
 *
 * @param config - The configuration object to process
 * @param context - Optional context to control file loading behavior
 * @returns The configuration with external file references resolved
 */
function maybeLoadConfigFromExternalFile(config, context) {
    if (Array.isArray(config)) {
        return config.map((item) => maybeLoadConfigFromExternalFile(item, context));
    }
    if (config && typeof config === 'object' && config !== null) {
        const result = {};
        for (const key of Object.keys(config)) {
            // Detect assertion contexts: if we have a sibling 'type' key with 'python' or 'javascript'
            // and current key is 'value', switch to assertion context
            const isAssertionValue = key === 'value' &&
                typeof config === 'object' &&
                config &&
                'type' in config &&
                typeof config.type === 'string' &&
                (config.type === 'python' || config.type === 'javascript');
            // Detect vars contexts: if we're processing a 'vars' key, switch to vars context
            // This preserves file:// glob patterns for test case expansion
            const isVarsField = key === 'vars';
            const childContext = isAssertionValue ? 'assertion' : isVarsField ? 'vars' : context;
            result[key] = maybeLoadConfigFromExternalFile(config[key], childContext);
        }
        return result;
    }
    return maybeLoadFromExternalFile(config, context);
}
//# sourceMappingURL=file.js.map