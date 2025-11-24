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
exports.createOutputMetadata = createOutputMetadata;
exports.writeOutput = writeOutput;
exports.writeMultipleOutputs = writeMultipleOutputs;
exports.readOutput = readOutput;
exports.readFilters = readFilters;
exports.printBorder = printBorder;
exports.setupEnv = setupEnv;
exports.providerToIdentifier = providerToIdentifier;
exports.varsMatch = varsMatch;
exports.resultIsForTestCase = resultIsForTestCase;
exports.renderEnvOnlyInObject = renderEnvOnlyInObject;
exports.renderVarsInObject = renderVarsInObject;
exports.parsePathOrGlob = parsePathOrGlob;
exports.isRunningUnderNpx = isRunningUnderNpx;
exports.maybeLoadToolsFromExternalFile = maybeLoadToolsFromExternalFile;
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const sync_1 = require("csv-stringify/sync");
const dedent_1 = __importDefault(require("dedent"));
const dotenv_1 = __importDefault(require("dotenv"));
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
const fast_xml_parser_1 = require("fast-xml-parser");
const glob_1 = require("glob");
const js_yaml_1 = __importDefault(require("js-yaml"));
const constants_1 = require("../constants");
const envars_1 = require("../envars");
const esm_1 = require("../esm");
const googleSheets_1 = require("../googleSheets");
const logger_1 = __importDefault(require("../logger"));
const index_1 = require("../types/index");
const invariant_1 = __importDefault(require("../util/invariant"));
const getHeaderForTable_1 = require("./exportToFile/getHeaderForTable");
const index_2 = require("./exportToFile/index");
const file_1 = require("./file");
const fileExtensions_1 = require("./fileExtensions");
const pathUtils_1 = require("./pathUtils");
const templates_1 = require("./templates");
const outputToSimpleString = (output) => {
    const passFailText = output.pass
        ? '[PASS]'
        : output.failureReason === index_1.ResultFailureReason.ASSERT
            ? '[FAIL]'
            : '[ERROR]';
    const namedScoresText = Object.entries(output.namedScores)
        .map(([name, value]) => `${name}: ${value?.toFixed(2)}`)
        .join(', ');
    const scoreText = namedScoresText.length > 0
        ? `(${output.score?.toFixed(2)}, ${namedScoresText})`
        : `(${output.score?.toFixed(2)})`;
    const gradingResultText = output.gradingResult
        ? `${output.pass ? 'Pass' : 'Fail'} Reason: ${output.gradingResult.reason}`
        : '';
    return (0, dedent_1.default) `
      ${passFailText} ${scoreText}

      ${output.text}

      ${gradingResultText}
    `.trim();
};
function createOutputMetadata(evalRecord) {
    let evaluationCreatedAt;
    if (evalRecord.createdAt) {
        try {
            const date = new Date(evalRecord.createdAt);
            evaluationCreatedAt = Number.isNaN(date.getTime()) ? undefined : date.toISOString();
        }
        catch {
            evaluationCreatedAt = undefined;
        }
    }
    return {
        promptfooVersion: constants_1.VERSION,
        nodeVersion: process.version,
        platform: os.platform(),
        arch: os.arch(),
        exportedAt: new Date().toISOString(),
        evaluationCreatedAt,
        author: evalRecord.author,
    };
}
/**
 * JSON writer with improved error handling for large datasets.
 * Provides helpful error messages when memory limits are exceeded.
 */
async function writeJsonOutputSafely(outputPath, evalRecord, shareableUrl) {
    const metadata = createOutputMetadata(evalRecord);
    try {
        const summary = await evalRecord.toEvaluateSummary();
        const outputData = {
            evalId: evalRecord.id,
            results: summary,
            config: evalRecord.config,
            shareableUrl,
            metadata,
        };
        // Use standard JSON.stringify with proper formatting
        const jsonString = JSON.stringify(outputData, null, 2);
        fs.writeFileSync(outputPath, jsonString);
    }
    catch (error) {
        const msg = error?.message ?? '';
        const isStringLen = error instanceof RangeError && msg.includes('Invalid string length');
        const isHeapOOM = /heap out of memory|Array buffer allocation failed|ERR_STRING_TOO_LONG/i.test(msg);
        if (isStringLen || isHeapOOM) {
            // The dataset is too large to load into memory at once
            const resultCount = await evalRecord.getResultsCount();
            logger_1.default.error(`Dataset too large for JSON export (${resultCount} results).`);
            throw new Error(`Dataset too large for JSON export. The evaluation has ${resultCount} results which exceeds memory limits. ` +
                'Consider using JSONL format instead: --output output.jsonl');
        }
        else {
            throw error;
        }
    }
}
async function writeOutput(outputPath, evalRecord, shareableUrl) {
    if (outputPath.match(/^https:\/\/docs\.google\.com\/spreadsheets\//)) {
        const table = await evalRecord.getTable();
        (0, invariant_1.default)(table, 'Table is required');
        const rows = table.body.map((row) => {
            const csvRow = {};
            table.head.vars.forEach((varName, index) => {
                csvRow[varName] = row.vars[index];
            });
            table.head.prompts.forEach((prompt, index) => {
                csvRow[prompt.label] = outputToSimpleString(row.outputs[index]);
            });
            return csvRow;
        });
        logger_1.default.info(`Writing ${rows.length} rows to Google Sheets...`);
        await (0, googleSheets_1.writeCsvToGoogleSheet)(rows, outputPath);
        return;
    }
    const { data: outputExtension } = index_1.OutputFileExtension.safeParse(path.extname(outputPath).slice(1).toLowerCase());
    (0, invariant_1.default)(outputExtension, `Unsupported output file format ${outputExtension}. Please use one of: ${index_1.OutputFileExtension.options.join(', ')}.`);
    // Ensure the directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const metadata = createOutputMetadata(evalRecord);
    if (outputExtension === 'csv') {
        // Write headers first
        const headers = (0, getHeaderForTable_1.getHeaderForTable)(evalRecord);
        const headerCsv = (0, sync_1.stringify)([
            [...headers.vars, ...headers.prompts.map((prompt) => `[${prompt.provider}] ${prompt.label}`)],
        ]);
        fs.writeFileSync(outputPath, headerCsv);
        // Write body rows in batches
        for await (const batchResults of evalRecord.fetchResultsBatched()) {
            // we need split the batch into rows by testIdx
            const tableRows = {};
            for (const result of batchResults) {
                if (!(result.testIdx in tableRows)) {
                    tableRows[result.testIdx] = [];
                }
                tableRows[result.testIdx].push(result);
            }
            const batchCsv = (0, sync_1.stringify)(Object.values(tableRows).map((results) => {
                const row = (0, index_2.convertTestResultsToTableRow)(results, headers.vars);
                return [...row.vars, ...row.outputs.map(outputToSimpleString)];
            }));
            fs.appendFileSync(outputPath, batchCsv);
        }
    }
    else if (outputExtension === 'json') {
        await writeJsonOutputSafely(outputPath, evalRecord, shareableUrl);
    }
    else if (outputExtension === 'yaml' || outputExtension === 'yml' || outputExtension === 'txt') {
        const summary = await evalRecord.toEvaluateSummary();
        fs.writeFileSync(outputPath, js_yaml_1.default.dump({
            evalId: evalRecord.id,
            results: summary,
            config: evalRecord.config,
            shareableUrl,
            metadata,
        }));
    }
    else if (outputExtension === 'html') {
        const table = await evalRecord.getTable();
        (0, invariant_1.default)(table, 'Table is required');
        const summary = await evalRecord.toEvaluateSummary();
        const template = fs.readFileSync(path.join((0, esm_1.getDirectory)(), 'tableOutput.html'), 'utf-8');
        const htmlTable = [
            [
                ...table.head.vars,
                ...table.head.prompts.map((prompt) => `[${prompt.provider}] ${prompt.label}`),
            ],
            ...table.body.map((row) => [...row.vars, ...row.outputs.map(outputToSimpleString)]),
        ];
        const htmlOutput = (0, templates_1.getNunjucksEngine)().renderString(template, {
            config: evalRecord.config,
            table: htmlTable,
            results: summary,
        });
        fs.writeFileSync(outputPath, htmlOutput);
    }
    else if (outputExtension === 'jsonl') {
        for await (const batchResults of evalRecord.fetchResultsBatched()) {
            const text = batchResults.map((result) => JSON.stringify(result)).join(os.EOL) + os.EOL;
            fs.appendFileSync(outputPath, text);
        }
    }
    else if (outputExtension === 'xml') {
        const summary = await evalRecord.toEvaluateSummary();
        // Sanitize data for XML builder to prevent textValue.replace errors
        const sanitizeForXml = (obj) => {
            if (obj === null || obj === undefined) {
                return '';
            }
            if (typeof obj === 'boolean' || typeof obj === 'number') {
                return String(obj);
            }
            if (typeof obj === 'string') {
                return obj;
            }
            if (Array.isArray(obj)) {
                return obj.map(sanitizeForXml);
            }
            if (typeof obj === 'object') {
                const sanitized = {};
                for (const [key, value] of Object.entries(obj)) {
                    sanitized[key] = sanitizeForXml(value);
                }
                return sanitized;
            }
            // For any other type, convert to string
            return String(obj);
        };
        const xmlBuilder = new fast_xml_parser_1.XMLBuilder({
            ignoreAttributes: false,
            format: true,
            indentBy: '  ',
        });
        const xmlData = xmlBuilder.build({
            promptfoo: {
                evalId: evalRecord.id,
                results: sanitizeForXml(summary),
                config: sanitizeForXml(evalRecord.config),
                shareableUrl: shareableUrl || '',
            },
        });
        fs.writeFileSync(outputPath, xmlData);
    }
}
async function writeMultipleOutputs(outputPaths, evalRecord, shareableUrl) {
    await Promise.all(outputPaths.map((outputPath) => writeOutput(outputPath, evalRecord, shareableUrl)));
}
async function readOutput(outputPath) {
    const ext = path.parse(outputPath).ext.slice(1);
    switch (ext) {
        case 'json':
            return JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
        default:
            throw new Error(`Unsupported output file format: ${ext} currently only supports json`);
    }
}
async function readFilters(filters, basePath = '') {
    const ret = {};
    for (const [name, filterPath] of Object.entries(filters)) {
        const globPath = path.join(basePath, filterPath);
        const filePaths = (0, glob_1.globSync)(globPath, {
            windowsPathsNoEscape: true,
        });
        for (const filePath of filePaths) {
            const finalPath = path.resolve(filePath);
            ret[name] = await (0, esm_1.importModule)(finalPath);
        }
    }
    return ret;
}
function printBorder() {
    const border = '='.repeat(constants_1.TERMINAL_MAX_WIDTH);
    logger_1.default.info(border);
}
function setupEnv(envPath) {
    if (envPath) {
        logger_1.default.info(`Loading environment variables from ${envPath}`);
        dotenv_1.default.config({ path: envPath, override: true, quiet: true });
    }
    else {
        dotenv_1.default.config({ quiet: true });
    }
}
function canonicalizeProviderId(id) {
    // Handle file:// prefix
    if (id.startsWith('file://')) {
        const filePath = id.slice('file://'.length);
        return path.isAbsolute(filePath) ? id : `file://${path.resolve(filePath)}`;
    }
    // Handle other executable prefixes with file paths
    const executablePrefixes = ['exec:', 'python:', 'golang:'];
    for (const prefix of executablePrefixes) {
        if (id.startsWith(prefix)) {
            const filePath = id.slice(prefix.length);
            if (filePath.includes('/') || filePath.includes('\\')) {
                return `${prefix}${path.resolve(filePath)}`;
            }
            return id;
        }
    }
    // For JavaScript/TypeScript files without file:// prefix
    if ((id.endsWith('.js') || id.endsWith('.ts') || id.endsWith('.mjs')) &&
        (id.includes('/') || id.includes('\\'))) {
        return `file://${path.resolve(id)}`;
    }
    return id;
}
function getProviderLabel(provider) {
    return provider?.label && typeof provider.label === 'string' ? provider.label : undefined;
}
function providerToIdentifier(provider) {
    if (!provider) {
        return undefined;
    }
    if (typeof provider === 'string') {
        return canonicalizeProviderId(provider);
    }
    // Check for label first on any provider type
    const label = getProviderLabel(provider);
    if (label) {
        return label;
    }
    if ((0, index_1.isApiProvider)(provider)) {
        return canonicalizeProviderId(provider.id());
    }
    if ((0, index_1.isProviderOptions)(provider)) {
        if (provider.id) {
            return canonicalizeProviderId(provider.id);
        }
        return undefined;
    }
    // Handle any other object with id property
    if (typeof provider === 'object' && 'id' in provider && typeof provider.id === 'string') {
        return canonicalizeProviderId(provider.id);
    }
    return undefined;
}
/**
 * Filters out runtime-only variables that are added during evaluation
 * but aren't part of the original test definition
 */
function filterRuntimeVars(vars) {
    if (!vars) {
        return vars;
    }
    const { _conversation, ...userVars } = vars;
    return userVars;
}
function varsMatch(vars1, vars2) {
    return (0, fast_deep_equal_1.default)(vars1, vars2);
}
function resultIsForTestCase(result, testCase) {
    const providersMatch = testCase.provider
        ? providerToIdentifier(testCase.provider) === providerToIdentifier(result.provider)
        : true;
    // Filter out runtime variables like _conversation when matching
    // These are added during evaluation but shouldn't affect test matching
    // Use result.vars (not result.testCase.vars) as it contains the actual vars used during evaluation
    const resultVars = filterRuntimeVars(result.vars);
    const testVars = filterRuntimeVars(testCase.vars);
    return varsMatch(testVars, resultVars) && providersMatch;
}
/**
 * Renders ONLY environment variable templates in an object, leaving all other templates untouched.
 * This allows env vars to be resolved at provider load time while preserving runtime var templates.
 *
 * Supports full Nunjucks syntax for env vars including filters and expressions:
 * - {{ env.VAR_NAME }}
 * - {{ env['VAR-NAME'] }}
 * - {{ env["VAR-NAME"] }}
 * - {{ env.VAR | default('fallback') }}
 * - {{ env.VAR | upper }}
 *
 * Preserves non-env templates for runtime rendering:
 * - {{ vars.x }} - preserved as literal
 * - {{ prompt }} - preserved as literal
 *
 * Implementation: Uses regex to find env templates, delegates to Nunjucks for rendering.
 * This ensures full Nunjucks feature support while preserving non-env templates.
 *
 * @param obj - The object to process
 * @returns The object with only env templates rendered
 */
function renderEnvOnlyInObject(obj) {
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_TEMPLATING')) {
        return obj;
    }
    if (typeof obj === 'string') {
        // Prevent ReDoS: Skip regex matching on extremely long strings
        // The regex pattern has nested quantifiers that can cause exponential backtracking
        const MAX_STRING_LENGTH = 50000; // Reasonable limit for config strings
        if (obj.length > MAX_STRING_LENGTH) {
            logger_1.default.warn(`String too long (${obj.length} chars) for template matching. Skipping env var rendering.`);
            return obj;
        }
        const nunjucks = (0, templates_1.getNunjucksEngine)();
        const envGlobals = nunjucks.getGlobal('env');
        // Match ALL Nunjucks templates {{ ... }}
        // The pattern (?:[^}]|\}(?!\}))* matches content that may contain } but not }}
        return obj.replace(/\{\{(?:[^}]|\}(?!\}))*\}\}/g, (match) => {
            // Only process templates that reference env
            if (!match.match(/\benv\.|env\[/)) {
                return match; // Not an env template, preserve as-is
            }
            // Extract the variable name to check if it exists
            const varMatch = match.match(/env\.(\w+)|env\[['"]([^'"]+)['"]\]/);
            const varName = varMatch?.[1] || varMatch?.[2];
            // Check if template contains a filter (indicated by |)
            // Filters often handle undefined values (e.g., default filter)
            const hasFilter = match.includes('|');
            // Render if:
            // 1. Template has a filter (let Nunjucks handle undefined with filter logic)
            // 2. Variable exists (even if it's an empty string)
            if (hasFilter || (varName && varName in envGlobals)) {
                try {
                    // Use Nunjucks to render the template (supports filters, expressions, etc.)
                    return nunjucks.renderString(match, { env: envGlobals });
                }
                catch (_error) {
                    // On render error, preserve the template
                    return match;
                }
            }
            // Variable doesn't exist and no filter - preserve template for potential runtime resolution
            return match;
        });
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => renderEnvOnlyInObject(item));
    }
    if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key in obj) {
            result[key] = renderEnvOnlyInObject(obj[key]);
        }
        return result;
    }
    return obj;
}
function renderVarsInObject(obj, vars) {
    // Renders nunjucks template strings with context variables
    if (!vars || (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_TEMPLATING')) {
        return obj;
    }
    if (typeof obj === 'string') {
        const nunjucksEngine = (0, templates_1.getNunjucksEngine)();
        return nunjucksEngine.renderString(obj, vars);
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => renderVarsInObject(item, vars));
    }
    if (typeof obj === 'object' && obj !== null) {
        const result = {};
        for (const key in obj) {
            result[key] = renderVarsInObject(obj[key], vars);
        }
        return result;
    }
    else if (typeof obj === 'function') {
        const fn = obj;
        return renderVarsInObject(fn({ vars }));
    }
    return obj;
}
/**
 * Parses a file path or glob pattern to extract function names and file extensions.
 * Function names can be specified in the filename like this:
 * prompt.py:myFunction or prompts.js:myFunction.
 * @param basePath - The base path for file resolution.
 * @param promptPath - The path or glob pattern.
 * @returns Parsed details including function name, file extension, and directory status.
 */
function parsePathOrGlob(basePath, promptPath) {
    if (promptPath.startsWith('file://')) {
        promptPath = promptPath.slice('file://'.length);
    }
    const filePath = path.resolve(basePath, promptPath);
    let filename = path.relative(basePath, filePath);
    let functionName;
    if (filename.includes(':')) {
        // Windows-aware path parsing: check if colon is part of drive letter
        const lastColonIndex = filename.lastIndexOf(':');
        if (lastColonIndex > 1) {
            const pathWithoutFunction = filename.slice(0, lastColonIndex);
            if ((0, fileExtensions_1.isJavascriptFile)(pathWithoutFunction) ||
                pathWithoutFunction.endsWith('.py') ||
                pathWithoutFunction.endsWith('.go') ||
                pathWithoutFunction.endsWith('.rb')) {
                functionName = filename.slice(lastColonIndex + 1);
                filename = pathWithoutFunction;
            }
        }
    }
    // verify that filename without function exists
    let stats;
    try {
        stats = fs.statSync(path.join(basePath, filename));
    }
    catch (err) {
        if ((0, envars_1.getEnvBool)('PROMPTFOO_STRICT_FILES')) {
            throw err;
        }
    }
    // Check for glob patterns in the original path or the resolved path
    // On Windows, normalize separators for cross-platform glob pattern detection
    const normalizedFilePath = filePath.replace(/\\/g, '/');
    const isPathPattern = stats?.isDirectory() || (0, glob_1.hasMagic)(promptPath) || (0, glob_1.hasMagic)(normalizedFilePath);
    const safeFilename = path.relative(basePath, (0, pathUtils_1.safeResolve)(basePath, filename));
    return {
        extension: isPathPattern ? undefined : path.parse(safeFilename).ext,
        filePath: safeFilename.startsWith(basePath) ? safeFilename : path.join(basePath, safeFilename),
        functionName,
        isPathPattern,
    };
}
function isRunningUnderNpx() {
    const npmExecPath = (0, envars_1.getEnvString)('npm_execpath');
    const npmLifecycleScript = (0, envars_1.getEnvString)('npm_lifecycle_script');
    return Boolean((npmExecPath && npmExecPath.includes('npx')) ||
        process.execPath.includes('npx') ||
        (npmLifecycleScript && npmLifecycleScript.includes('npx')));
}
/**
 * Renders variables in a tools object and loads from external file if applicable.
 * This function combines renderVarsInObject and maybeLoadFromExternalFile into a single step
 * specifically for handling tools configurations.
 *
 * @param tools - The tools configuration object or array to process.
 * @param vars - Variables to use for rendering.
 * @returns The processed tools configuration with variables rendered and content loaded from files if needed.
 */
function maybeLoadToolsFromExternalFile(tools, vars) {
    return (0, file_1.maybeLoadFromExternalFile)(renderVarsInObject(tools, vars));
}
//# sourceMappingURL=index.js.map