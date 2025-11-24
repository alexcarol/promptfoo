"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
exports.getSysExecutable = getSysExecutable;
exports.tryPath = tryPath;
exports.validateRubyPath = validateRubyPath;
exports.runRuby = runRuby;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const json_1 = require("../util/json");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Global state for Ruby executable path caching.
 * Ensures consistent Ruby executable usage across multiple provider instances.
 */
exports.state = {
    cachedRubyPath: null,
    validationPromise: null,
    validatingPath: null,
};
/**
 * Attempts to find Ruby using Windows 'where' command.
 * Only applicable on Windows platforms.
 * @returns The validated Ruby executable path, or null if not found
 */
async function tryWindowsWhere() {
    try {
        const result = await execFileAsync('where', ['ruby']);
        const output = result.stdout.trim();
        // Handle empty output
        if (!output) {
            logger_1.default.debug("Windows 'where ruby' returned empty output");
            return null;
        }
        const paths = output.split('\n').filter((path) => path.trim());
        for (const rubyPath of paths) {
            const trimmedPath = rubyPath.trim();
            // Skip non-executables
            if (!trimmedPath.endsWith('.exe')) {
                continue;
            }
            const validated = await tryPath(trimmedPath);
            if (validated) {
                return validated;
            }
        }
    }
    catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger_1.default.debug(`Windows 'where ruby' failed: ${errorMsg}`);
        // Log permission/access errors differently
        if (errorMsg.includes('Access is denied') || errorMsg.includes('EACCES')) {
            logger_1.default.warn(`Permission denied when searching for Ruby: ${errorMsg}`);
        }
    }
    return null;
}
/**
 * Attempts to get Ruby executable path by running Ruby commands.
 * Uses RbConfig.ruby to get the actual Ruby executable path.
 * @param commands - Array of Ruby command names to try (e.g., ['ruby'])
 * @returns The Ruby executable path, or null if all commands fail
 */
async function tryRubyCommands(commands) {
    for (const cmd of commands) {
        try {
            const result = await execFileAsync(cmd, ['-e', 'puts RbConfig.ruby']);
            const executablePath = result.stdout.trim();
            if (executablePath && executablePath !== 'None') {
                return executablePath;
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger_1.default.debug(`Ruby command "${cmd}" failed: ${errorMsg}`);
            // Log permission/access errors differently
            if (errorMsg.includes('Access is denied') ||
                errorMsg.includes('EACCES') ||
                errorMsg.includes('EPERM')) {
                logger_1.default.warn(`Permission denied when trying Ruby command "${cmd}": ${errorMsg}`);
            }
        }
    }
    return null;
}
/**
 * Attempts to validate Ruby commands directly as a final fallback.
 * Validates each command by running it with --version.
 * @param commands - Array of Ruby command names to try (e.g., ['ruby'])
 * @returns The validated Ruby executable path, or null if all commands fail
 */
async function tryDirectCommands(commands) {
    for (const cmd of commands) {
        try {
            const validated = await tryPath(cmd);
            if (validated) {
                return validated;
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger_1.default.debug(`Direct command "${cmd}" failed: ${errorMsg}`);
            // Log permission/access errors differently
            if (errorMsg.includes('Access is denied') ||
                errorMsg.includes('EACCES') ||
                errorMsg.includes('EPERM')) {
                logger_1.default.warn(`Permission denied when trying Ruby command "${cmd}": ${errorMsg}`);
            }
        }
    }
    return null;
}
/**
 * Attempts to get the Ruby executable path using platform-appropriate strategies.
 * @returns The Ruby executable path if successful, or null if failed.
 */
async function getSysExecutable() {
    if (process.platform === 'win32') {
        // Windows: Try 'where ruby' first
        const whereResult = await tryWindowsWhere();
        if (whereResult) {
            return whereResult;
        }
        // Then try ruby commands
        const sysResult = await tryRubyCommands(['ruby']);
        if (sysResult) {
            return sysResult;
        }
        // Final fallback to direct ruby command
        return await tryDirectCommands(['ruby']);
    }
    else {
        // Unix: Standard ruby detection
        return await tryRubyCommands(['ruby']);
    }
}
/**
 * Attempts to validate a Ruby executable path.
 * @param path - The path to the Ruby executable to test.
 * @returns The validated path if successful, or null if invalid.
 */
async function tryPath(path) {
    let timeoutId;
    try {
        const timeoutPromise = new Promise((_, reject) => {
            timeoutId = setTimeout(() => reject(new Error('Command timed out')), 2500);
        });
        const result = await Promise.race([execFileAsync(path, ['--version']), timeoutPromise]);
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        const versionOutput = result.stdout.trim();
        if (versionOutput.toLowerCase().includes('ruby')) {
            return path;
        }
        return null;
    }
    catch {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        return null;
    }
}
/**
 * Validates and caches the Ruby executable path.
 *
 * @param rubyPath - Path to the Ruby executable.
 * @param isExplicit - If true, only tries the provided path.
 * @returns Validated Ruby executable path.
 * @throws {Error} If no valid Ruby executable is found.
 */
async function validateRubyPath(rubyPath, isExplicit) {
    // Return cached result only if it matches the requested path
    if (exports.state.cachedRubyPath && exports.state.validatingPath === rubyPath) {
        return exports.state.cachedRubyPath;
    }
    // If validating a different path, clear cache and promise
    if (exports.state.validatingPath !== rubyPath) {
        exports.state.cachedRubyPath = null;
        exports.state.validationPromise = null;
        exports.state.validatingPath = rubyPath;
    }
    // Create validation promise atomically if it doesn't exist
    // This prevents race conditions where multiple calls create separate validations
    if (!exports.state.validationPromise) {
        exports.state.validationPromise = (async () => {
            try {
                const primaryPath = await tryPath(rubyPath);
                if (primaryPath) {
                    exports.state.cachedRubyPath = primaryPath;
                    exports.state.validationPromise = null;
                    return primaryPath;
                }
                if (isExplicit) {
                    const error = new Error(`Ruby not found. Tried "${rubyPath}" ` +
                        `Please ensure Ruby is installed and set the PROMPTFOO_RUBY environment variable ` +
                        `to your Ruby executable path (e.g., '${process.platform === 'win32' ? 'C:\\Ruby32\\bin\\ruby.exe' : '/usr/bin/ruby'}').`);
                    // Clear promise on error to allow retry
                    exports.state.validationPromise = null;
                    throw error;
                }
                // Try to get Ruby executable using comprehensive detection
                const detectedPath = await getSysExecutable();
                if (detectedPath) {
                    exports.state.cachedRubyPath = detectedPath;
                    exports.state.validationPromise = null;
                    return detectedPath;
                }
                const error = new Error(`Ruby not found. Tried "${rubyPath}", ruby executable detection, and fallback commands. ` +
                    `Please ensure Ruby is installed and set the PROMPTFOO_RUBY environment variable ` +
                    `to your Ruby executable path (e.g., '${process.platform === 'win32' ? 'C:\\Ruby32\\bin\\ruby.exe' : '/usr/bin/ruby'}').`);
                // Clear promise on error to allow retry
                exports.state.validationPromise = null;
                throw error;
            }
            catch (error) {
                // Ensure promise is cleared on any error
                exports.state.validationPromise = null;
                throw error;
            }
        })();
    }
    // Return the existing or newly-created promise
    return exports.state.validationPromise;
}
/**
 * Runs a Ruby script with the specified method and arguments.
 *
 * @param scriptPath - The path to the Ruby script to run.
 * @param method - The name of the method to call in the Ruby script.
 * @param args - An array of arguments to pass to the Ruby script.
 * @param options - Optional settings for running the Ruby script.
 * @param options.rubyExecutable - Optional path to the Ruby executable.
 * @returns A promise that resolves to the output of the Ruby script.
 * @throws An error if there's an issue running the Ruby script or parsing its output.
 */
async function runRuby(scriptPath, method, args, options = {}) {
    const absPath = path_1.default.resolve(scriptPath);
    const tempJsonPath = path_1.default.join(os_1.default.tmpdir(), `promptfoo-ruby-input-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const outputPath = path_1.default.join(os_1.default.tmpdir(), `promptfoo-ruby-output-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const customPath = options.rubyExecutable || (0, envars_1.getEnvString)('PROMPTFOO_RUBY');
    let rubyPath = customPath || 'ruby';
    rubyPath = await validateRubyPath(rubyPath, typeof customPath === 'string');
    const wrapperPath = path_1.default.join(__dirname, 'wrapper.rb');
    try {
        fs_1.default.writeFileSync(tempJsonPath, (0, json_1.safeJsonStringify)(args), 'utf-8');
        logger_1.default.debug(`Running Ruby wrapper with args: ${(0, json_1.safeJsonStringify)(args)}`);
        const { stdout, stderr } = await execFileAsync(rubyPath, [
            wrapperPath,
            absPath,
            method,
            tempJsonPath,
            outputPath,
        ]);
        if (stdout) {
            logger_1.default.debug(stdout.trim());
        }
        if (stderr) {
            logger_1.default.error(stderr.trim());
        }
        const output = fs_1.default.readFileSync(outputPath, 'utf-8');
        logger_1.default.debug(`Ruby script ${absPath} returned: ${output}`);
        let result;
        try {
            result = JSON.parse(output);
            logger_1.default.debug(`Ruby script ${absPath} parsed output type: ${typeof result}, structure: ${result ? JSON.stringify(Object.keys(result)) : 'undefined'}`);
        }
        catch (error) {
            throw new Error(`Invalid JSON: ${error.message} when parsing result: ${output}\nStack Trace: ${error.stack}`);
        }
        if (result?.type !== 'final_result') {
            throw new Error('The Ruby script `call_api` function must return a hash with an `output`');
        }
        return result.data;
    }
    catch (error) {
        logger_1.default.error(`Error running Ruby script: ${error.message}\nStack Trace: ${error.stack || 'No Ruby traceback available'}`);
        throw new Error(`Error running Ruby script: ${error.message}\nStack Trace: ${error.stack || 'No Ruby traceback available'}`);
    }
    finally {
        [tempJsonPath, outputPath].forEach((file) => {
            try {
                fs_1.default.unlinkSync(file);
            }
            catch (error) {
                logger_1.default.error(`Error removing ${file}: ${error}`);
            }
        });
    }
}
//# sourceMappingURL=rubyUtils.js.map