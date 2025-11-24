"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertionFromString = assertionFromString;
exports.testCaseFromCsvRow = testCaseFromCsvRow;
exports.serializeObjectArrayAsCSV = serializeObjectArrayAsCSV;
// Helpers for parsing CSV eval files, shared by frontend and backend. Cannot import native modules.
const logger_1 = __importDefault(require("./logger"));
const index_1 = require("./types/index");
const fileExtensions_1 = require("./util/fileExtensions");
const invariant_1 = __importDefault(require("./util/invariant"));
const DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD = 0.8;
let _assertionRegex = null;
function getAssertionRegex() {
    if (!_assertionRegex) {
        const assertionTypesRegex = index_1.BaseAssertionTypesSchema.options.join('|');
        _assertionRegex = new RegExp(`^(not-)?(${assertionTypesRegex})(?:\\((\\d+(?:\\.\\d+)?)\\))?(?::([\\s\\S]*))?$`);
    }
    return _assertionRegex;
}
function assertionFromString(expected) {
    // Legacy options
    if (expected.startsWith('javascript:') ||
        expected.startsWith('fn:') ||
        expected.startsWith('eval:') ||
        (expected.startsWith('file://') && (0, fileExtensions_1.isJavascriptFile)(expected.slice('file://'.length)))) {
        // TODO(1.0): delete eval: legacy option
        let sliceLength = 0;
        if (expected.startsWith('javascript:')) {
            sliceLength = 'javascript:'.length;
        }
        if (expected.startsWith('fn:')) {
            sliceLength = 'fn:'.length;
        }
        if (expected.startsWith('eval:')) {
            sliceLength = 'eval:'.length;
        }
        const functionBody = expected.slice(sliceLength).trim();
        return {
            type: 'javascript',
            value: functionBody,
        };
    }
    if (expected.startsWith('grade:') || expected.startsWith('llm-rubric:')) {
        return {
            type: 'llm-rubric',
            value: expected.slice(expected.startsWith('grade:') ? 6 : 11),
        };
    }
    if (expected.startsWith('python:') ||
        (expected.startsWith('file://') && (expected.endsWith('.py') || expected.includes('.py:')))) {
        const sliceLength = expected.startsWith('python:') ? 'python:'.length : 'file://'.length;
        const functionBody = expected.slice(sliceLength).trim();
        return {
            type: 'python',
            value: functionBody,
        };
    }
    const regexMatch = expected.match(getAssertionRegex());
    if (regexMatch) {
        const [_, notPrefix, type, thresholdStr, value] = regexMatch;
        const fullType = notPrefix ? `not-${type}` : type;
        const parsedThreshold = thresholdStr ? Number.parseFloat(thresholdStr) : Number.NaN;
        const threshold = Number.isFinite(parsedThreshold) ? parsedThreshold : undefined;
        if (type === 'contains-all' ||
            type === 'contains-any' ||
            type === 'icontains-all' ||
            type === 'icontains-any') {
            return {
                type: fullType,
                value: value ? value.split(',').map((s) => s.trim()) : value,
            };
        }
        else if (type === 'contains-json' || type === 'is-json') {
            return {
                type: fullType,
                value,
            };
        }
        else if (type === 'answer-relevance' ||
            type === 'classifier' ||
            type === 'context-faithfulness' ||
            type === 'context-recall' ||
            type === 'context-relevance' ||
            type === 'cost' ||
            type === 'latency' ||
            type === 'levenshtein' ||
            type === 'perplexity-score' ||
            type === 'perplexity' ||
            type === 'rouge-n' ||
            type === 'similar' ||
            type === 'starts-with') {
            const defaultThreshold = type === 'similar' ? DEFAULT_SEMANTIC_SIMILARITY_THRESHOLD : 0.75;
            return {
                type: fullType,
                value: value?.trim?.(),
                threshold: threshold ?? defaultThreshold,
            };
        }
        else {
            return {
                type: fullType,
                value: value?.trim?.(),
            };
        }
    }
    // Default to equality
    return {
        type: 'equals',
        value: expected,
    };
}
const uniqueErrorMessages = new Set();
function testCaseFromCsvRow(row) {
    const vars = {};
    const asserts = [];
    const options = {};
    const metadata = {};
    // Map from assertion index (or '*' for all) to config properties
    const assertionConfigs = {};
    let providerOutput;
    let description;
    let metric;
    let threshold;
    const specialKeys = [
        'expected',
        'prefix',
        'suffix',
        'description',
        'providerOutput',
        'metric',
        'threshold',
        'metadata',
        'config',
    ].map((k) => `_${k}`);
    // Remove leading and trailing whitespace from keys, as leading/trailing whitespace interferes with
    // meta key parsing.
    const sanitizedRows = Object.entries(row).map(([key, value]) => [key.trim(), value]);
    for (const [key, value] of sanitizedRows) {
        // Check for single underscore usage with reserved keys
        if (!key.startsWith('__') &&
            specialKeys.some((k) => key.startsWith(k)) &&
            !uniqueErrorMessages.has(key)) {
            const error = `You used a single underscore for the key "${key}". Did you mean to use "${key.replace('_', '__')}" instead?`;
            uniqueErrorMessages.add(key);
            logger_1.default.warn(error);
        }
        if (key.startsWith('__expected')) {
            if (value.trim() !== '') {
                asserts.push(assertionFromString(value.trim()));
            }
        }
        else if (key === '__prefix') {
            options.prefix = value;
        }
        else if (key === '__suffix') {
            options.suffix = value;
        }
        else if (key === '__description') {
            description = value;
        }
        else if (key === '__providerOutput') {
            providerOutput = value;
        }
        else if (key === '__metric') {
            metric = value;
        }
        else if (key === '__threshold') {
            threshold = Number.parseFloat(value);
        }
        else if (key.startsWith('__metadata:')) {
            const metadataKey = key.slice('__metadata:'.length);
            if (metadataKey.endsWith('[]')) {
                // Handle array metadata with comma splitting and escape support
                const arrayKey = metadataKey.slice(0, -2);
                if (value.trim() !== '') {
                    // Split by commas, but respect escaped commas (\,)
                    const values = value
                        .split(/(?<!\\),/)
                        .map((v) => v.trim())
                        .map((v) => v.replace('\\,', ','));
                    metadata[arrayKey] = values;
                }
            }
            else {
                // Handle single value metadata
                if (value.trim() !== '') {
                    metadata[metadataKey] = value;
                }
            }
        }
        else if (key === '__metadata' && !uniqueErrorMessages.has(key)) {
            uniqueErrorMessages.add(key);
            logger_1.default.warn('The "__metadata" column requires a key, e.g. "__metadata:category". This column will be ignored.');
        }
        else if (key.startsWith('__config:')) {
            // Parse __config columns
            // Formats: __config:__expected:threshold or __config:__expected<N>:threshold
            const configParts = key.slice('__config:'.length).split(':');
            if (configParts.length !== 2) {
                logger_1.default.warn(`Invalid __config column format: "${key}". Expected format: __config:__expected:threshold or __config:__expected<N>:threshold`);
            }
            else {
                const [expectedKey, configKey] = configParts;
                // Parse the expected key to determine which assertion(s) to target
                let targetIndex;
                if (expectedKey === '__expected') {
                    // There is only one expected assertion, so we target it directly.
                    targetIndex = 0;
                }
                else if (expectedKey.startsWith('__expected')) {
                    // Extract the numeric index (e.g., __expected1 -> 0, __expected2 -> 1)
                    const indexMatch = expectedKey.match(/^__expected(\d+)$/);
                    if (indexMatch) {
                        targetIndex = Number.parseInt(indexMatch[1], 10) - 1; // Convert to 0-based index
                    }
                }
                if (targetIndex === undefined) {
                    logger_1.default.error(`Invalid expected key "${expectedKey}" in __config column "${key}". ` +
                        `Must be __expected or __expected<N> where N is a positive integer.`);
                    throw new Error(`Invalid expected key "${expectedKey}" in __config column`);
                }
                // Validate the config key; currently only threshold is supported
                if (!['threshold'].includes(configKey)) {
                    logger_1.default.error(`Invalid config key "${configKey}" in __config column "${key}". ` +
                        `Valid config keys include: threshold`);
                    throw new Error(`Invalid config key "${configKey}" in __config column`);
                }
                // Initialize config object for this index if it doesn't exist
                if (!assertionConfigs[targetIndex]) {
                    assertionConfigs[targetIndex] = {};
                }
                // Parse the value based on the config key
                let parsedValue = value.trim();
                if (configKey === 'threshold') {
                    parsedValue = Number.parseFloat(value);
                    if (!Number.isFinite(parsedValue)) {
                        logger_1.default.error(`Invalid numeric value "${value}" for config key "${configKey}" in column "${key}"`);
                        throw new Error(`Invalid numeric value for ${configKey}`);
                    }
                }
                assertionConfigs[targetIndex][configKey] = parsedValue;
            }
        }
        else {
            vars[key] = value;
        }
    }
    // Apply assertion configurations and metric to assertions
    for (let i = 0; i < asserts.length; i++) {
        const assert = asserts[i];
        assert.metric = metric;
        // Apply index-specific configuration (if exists) - overrides global
        const indexConfig = assertionConfigs[i];
        if (indexConfig) {
            for (const [configKey, configValue] of Object.entries(indexConfig)) {
                assert[configKey] = configValue;
                // Include each key/value on the metadata object
                metadata[configKey] = configValue;
            }
        }
    }
    return {
        vars,
        assert: asserts,
        options,
        ...(description ? { description } : {}),
        ...(providerOutput ? { providerOutput } : {}),
        ...(threshold ? { threshold } : {}),
        ...(Object.keys(metadata).length > 0 ? { metadata } : {}),
    };
}
/**
 * Serialize a list of VarMapping objects as a CSV string.
 * @param vars - The list of VarMapping objects to serialize.
 * @returns A CSV string.
 */
function serializeObjectArrayAsCSV(vars) {
    (0, invariant_1.default)(vars.length > 0, 'No variables to serialize');
    const columnNames = Object.keys(vars[0]).join(',');
    const rows = vars
        .map((result) => `"${Object.values(result)
        .map((value) => value.toString().replace(/"/g, '""'))
        .join('","')}"`)
        .join('\n');
    return [columnNames, rows].join('\n') + '\n';
}
//# sourceMappingURL=csv.js.map