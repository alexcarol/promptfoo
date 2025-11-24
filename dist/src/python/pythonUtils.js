"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.state = void 0;
exports.getEnvInt = getEnvInt;
exports.getSysExecutable = getSysExecutable;
exports.tryPath = tryPath;
exports.validatePythonPath = validatePythonPath;
exports.runPython = runPython;
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const python_shell_1 = require("python-shell");
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
const json_1 = require("../util/json");
const child_process_1 = require("child_process");
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
/**
 * Gets an integer value from an environment variable.
 * @param key - The environment variable name
 * @returns The parsed integer value, or undefined if not set or not a valid integer
 */
function getEnvInt(key) {
    const value = process.env[key];
    if (value === undefined) {
        return undefined;
    }
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? undefined : parsed;
}
exports.state = {
    cachedPythonPath: null,
    validationPromise: null,
};
/**
 * Try to find Python using Windows 'where' command, filtering out Microsoft Store stubs.
 */
async function tryWindowsWhere() {
    try {
        const result = await execFileAsync('where', ['python']);
        const output = result.stdout.trim();
        // Handle empty output
        if (!output) {
            logger_1.default.debug("Windows 'where python' returned empty output");
            return null;
        }
        const paths = output.split('\n').filter((path) => path.trim());
        for (const pythonPath of paths) {
            const trimmedPath = pythonPath.trim();
            // Skip Microsoft Store stubs and non-executables
            if (trimmedPath.includes('WindowsApps') || !trimmedPath.endsWith('.exe')) {
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
        logger_1.default.debug(`Windows 'where python' failed: ${errorMsg}`);
        // Log permission/access errors differently
        if (errorMsg.includes('Access is denied') || errorMsg.includes('EACCES')) {
            logger_1.default.warn(`Permission denied when searching for Python: ${errorMsg}`);
        }
    }
    return null;
}
/**
 * Try Python commands to get sys.executable path.
 */
async function tryPythonCommands(commands) {
    for (const cmd of commands) {
        try {
            const result = await execFileAsync(cmd, ['-c', 'import sys; print(sys.executable)']);
            const executablePath = result.stdout.trim();
            if (executablePath && executablePath !== 'None') {
                // On Windows, ensure .exe suffix if missing (but only for Windows-style paths)
                if (process.platform === 'win32' && !executablePath.toLowerCase().endsWith('.exe')) {
                    // Only add .exe for Windows-style paths (drive letter or UNC paths)
                    if (executablePath.includes('\\') || /^[A-Za-z]:/.test(executablePath)) {
                        return executablePath + '.exe';
                    }
                }
                return executablePath;
            }
        }
        catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            logger_1.default.debug(`Python command "${cmd}" failed: ${errorMsg}`);
            // Log permission/access errors differently
            if (errorMsg.includes('Access is denied') ||
                errorMsg.includes('EACCES') ||
                errorMsg.includes('EPERM')) {
                logger_1.default.warn(`Permission denied when trying Python command "${cmd}": ${errorMsg}`);
            }
        }
    }
    return null;
}
/**
 * Try direct command validation as final fallback.
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
                logger_1.default.warn(`Permission denied when trying Python command "${cmd}": ${errorMsg}`);
            }
        }
    }
    return null;
}
/**
 * Attempts to get the Python executable path using platform-appropriate strategies.
 * @returns The Python executable path if successful, or null if failed.
 */
async function getSysExecutable() {
    if (process.platform === 'win32') {
        // Windows: Try 'where python' first to avoid Microsoft Store stubs
        const whereResult = await tryWindowsWhere();
        if (whereResult) {
            return whereResult;
        }
        // Then try py launcher commands (removing python3 as it's uncommon on Windows)
        const sysResult = await tryPythonCommands(['py', 'py -3']);
        if (sysResult) {
            return sysResult;
        }
        // Final fallback to direct python command
        return await tryDirectCommands(['python']);
    }
    else {
        // Unix: Standard python3/python detection
        return await tryPythonCommands(['python3', 'python']);
    }
}
/**
 * Attempts to validate a Python executable path.
 * @param path - The path to the Python executable to test.
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
        if (versionOutput.startsWith('Python')) {
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
 * Validates and caches the Python executable path.
 *
 * @param pythonPath - Path to the Python executable.
 * @param isExplicit - If true, only tries the provided path.
 * @returns Validated Python executable path.
 * @throws {Error} If no valid Python executable is found.
 */
async function validatePythonPath(pythonPath, isExplicit) {
    // Return cached result if available
    if (exports.state.cachedPythonPath) {
        return exports.state.cachedPythonPath;
    }
    // Create validation promise atomically if it doesn't exist
    // This prevents race conditions where multiple calls create separate validations
    if (!exports.state.validationPromise) {
        exports.state.validationPromise = (async () => {
            try {
                const primaryPath = await tryPath(pythonPath);
                if (primaryPath) {
                    exports.state.cachedPythonPath = primaryPath;
                    exports.state.validationPromise = null;
                    return primaryPath;
                }
                if (isExplicit) {
                    const error = new Error(`Python 3 not found. Tried "${pythonPath}" ` +
                        `Please ensure Python 3 is installed and set the PROMPTFOO_PYTHON environment variable ` +
                        `to your Python 3 executable path (e.g., '${process.platform === 'win32' ? 'C:\\Python39\\python.exe' : '/usr/bin/python3'}').`);
                    // Clear promise on error to allow retry
                    exports.state.validationPromise = null;
                    throw error;
                }
                // Try to get Python executable using comprehensive detection
                const detectedPath = await getSysExecutable();
                if (detectedPath) {
                    exports.state.cachedPythonPath = detectedPath;
                    exports.state.validationPromise = null;
                    return detectedPath;
                }
                const error = new Error(`Python 3 not found. Tried "${pythonPath}", sys.executable detection, and fallback commands. ` +
                    `Please ensure Python 3 is installed and set the PROMPTFOO_PYTHON environment variable ` +
                    `to your Python 3 executable path (e.g., '${process.platform === 'win32' ? 'C:\\Python39\\python.exe' : '/usr/bin/python3'}').`);
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
 * Runs a Python script with the specified method and arguments.
 *
 * @param scriptPath - The path to the Python script to run.
 * @param method - The name of the method to call in the Python script.
 * @param args - An array of arguments to pass to the Python script.
 * @param options - Optional settings for running the Python script.
 * @param options.pythonExecutable - Optional path to the Python executable.
 * @returns A promise that resolves to the output of the Python script.
 * @throws An error if there's an issue running the Python script or parsing its output.
 */
async function runPython(scriptPath, method, args, options = {}) {
    const absPath = path_1.default.resolve(scriptPath);
    const tempJsonPath = path_1.default.join(os_1.default.tmpdir(), `promptfoo-python-input-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const outputPath = path_1.default.join(os_1.default.tmpdir(), `promptfoo-python-output-json-${Date.now()}-${Math.random().toString(16).slice(2)}.json`);
    const customPath = options.pythonExecutable || (0, envars_1.getEnvString)('PROMPTFOO_PYTHON');
    let pythonPath = customPath || 'python';
    pythonPath = await validatePythonPath(pythonPath, typeof customPath === 'string');
    const pythonOptions = {
        args: [absPath, method, tempJsonPath, outputPath],
        env: process.env,
        mode: 'binary',
        pythonPath,
        scriptPath: __dirname,
        // When `inherit` is used, `import pdb; pdb.set_trace()` will work.
        ...((0, envars_1.getEnvBool)('PROMPTFOO_PYTHON_DEBUG_ENABLED') && { stdio: 'inherit' }),
    };
    try {
        fs_1.default.writeFileSync(tempJsonPath, (0, json_1.safeJsonStringify)(args), 'utf-8');
        logger_1.default.debug(`Running Python wrapper with args: ${(0, json_1.safeJsonStringify)(args)}`);
        await new Promise((resolve, reject) => {
            try {
                const pyshell = new python_shell_1.PythonShell('wrapper.py', pythonOptions);
                pyshell.stdout?.on('data', (chunk) => {
                    logger_1.default.debug(chunk.toString('utf-8').trim());
                });
                pyshell.stderr?.on('data', (chunk) => {
                    logger_1.default.error(chunk.toString('utf-8').trim());
                });
                pyshell.end((err) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
            catch (error) {
                reject(error);
            }
        });
        const output = fs_1.default.readFileSync(outputPath, 'utf-8');
        logger_1.default.debug(`Python script ${absPath} returned: ${output}`);
        let result;
        try {
            result = JSON.parse(output);
            logger_1.default.debug(`Python script ${absPath} parsed output type: ${typeof result}, structure: ${result ? JSON.stringify(Object.keys(result)) : 'undefined'}`);
        }
        catch (error) {
            throw new Error(`Invalid JSON: ${error.message} when parsing result: ${output}\nStack Trace: ${error.stack}`);
        }
        if (result?.type !== 'final_result') {
            throw new Error('The Python script `call_api` function must return a dict with an `output`');
        }
        return result.data;
    }
    catch (error) {
        logger_1.default.error(`Error running Python script: ${error.message}\nStack Trace: ${error.stack?.replace('--- Python Traceback ---', 'Python Traceback: ') ||
            'No Python traceback available'}`);
        throw new Error(`Error running Python script: ${error.message}\nStack Trace: ${error.stack?.replace('--- Python Traceback ---', 'Python Traceback: ') ||
            'No Python traceback available'}`);
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
//# sourceMappingURL=pythonUtils.js.map