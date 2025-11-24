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
exports.maybeCoerceToGeminiFormat = maybeCoerceToGeminiFormat;
exports.loadCredentials = loadCredentials;
exports.getGoogleClient = getGoogleClient;
exports.resolveProjectId = resolveProjectId;
exports.hasGoogleDefaultCredentials = hasGoogleDefaultCredentials;
exports.getCandidate = getCandidate;
exports.formatCandidateContents = formatCandidateContents;
exports.mergeParts = mergeParts;
exports.normalizeTools = normalizeTools;
exports.loadFile = loadFile;
exports.geminiFormatAndSystemInstructions = geminiFormatAndSystemInstructions;
exports.parseStringObject = parseStringObject;
exports.validateFunctionCall = validateFunctionCall;
const rfdc_1 = __importDefault(require("rfdc"));
const zod_1 = require("zod");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const file_1 = require("../../util/file");
const index_1 = require("../../util/index");
const json_1 = require("../../util/json");
const templates_1 = require("../../util/templates");
const shared_1 = require("../shared");
const types_1 = require("./types");
const ajv = (0, json_1.getAjv)();
// property_ordering is an optional field sometimes present in gemini tool configs, but ajv doesn't know about it.
// At the moment we will just ignore it, so the is-valid-function-call won't check property field ordering.
ajv.addKeyword('property_ordering');
const clone = (0, rfdc_1.default)();
const PartSchema = zod_1.z.object({
    text: zod_1.z.string().optional(),
    inline_data: zod_1.z
        .object({
        mime_type: zod_1.z.string(),
        data: zod_1.z.string(),
    })
        .optional(),
});
const ContentSchema = zod_1.z.object({
    role: zod_1.z.enum(['user', 'model']).optional(),
    parts: zod_1.z.array(PartSchema),
});
const GeminiFormatSchema = zod_1.z.array(ContentSchema);
function maybeCoerceToGeminiFormat(contents, options) {
    let coerced = false;
    const parseResult = GeminiFormatSchema.safeParse(contents);
    if (parseResult.success) {
        // Check for native Gemini system_instruction format
        let systemInst = undefined;
        if (typeof contents === 'object' && 'system_instruction' in contents) {
            systemInst = contents.system_instruction;
            // We need to modify the contents to remove system_instruction
            // since it's already extracted to systemInst
            if (typeof contents === 'object' && 'contents' in contents) {
                contents = contents.contents;
            }
            coerced = true;
        }
        return {
            contents: parseResult.data,
            coerced,
            systemInstruction: systemInst,
        };
    }
    let coercedContents;
    // Handle native Gemini format with system_instruction
    if (typeof contents === 'object' &&
        !Array.isArray(contents) &&
        'system_instruction' in contents) {
        const systemInst = contents.system_instruction;
        if ('contents' in contents) {
            coercedContents = contents.contents;
        }
        else {
            // If contents field is not present, use an empty array
            coercedContents = [];
        }
        return {
            contents: coercedContents,
            coerced: true,
            systemInstruction: systemInst,
        };
    }
    if (typeof contents === 'string') {
        coercedContents = [
            {
                parts: [{ text: contents }],
            },
        ];
        coerced = true;
    }
    else if (Array.isArray(contents) &&
        contents.every((item) => typeof item.content === 'string')) {
        // This looks like an OpenAI chat format
        const targetRole = options?.useAssistantRole ? 'assistant' : 'model';
        coercedContents = contents.map((item) => ({
            role: (item.role === 'assistant' ? targetRole : item.role),
            parts: [{ text: item.content }],
        }));
        coerced = true;
    }
    else if (Array.isArray(contents) && contents.every((item) => item.role && item.content)) {
        // This looks like an OpenAI chat format with content that might be an array or object
        const targetRole = options?.useAssistantRole ? 'assistant' : 'model';
        coercedContents = contents.map((item) => {
            const mappedRole = (item.role === 'assistant' ? targetRole : item.role);
            if (Array.isArray(item.content)) {
                // Handle array content
                const parts = item.content.map((contentItem) => {
                    if (typeof contentItem === 'string') {
                        return { text: contentItem };
                    }
                    else if (contentItem.type === 'text') {
                        return { text: contentItem.text };
                    }
                    else {
                        // Handle other content types if needed
                        return contentItem;
                    }
                });
                return {
                    role: mappedRole,
                    parts,
                };
            }
            else if (typeof item.content === 'object') {
                // Handle object content
                return {
                    role: mappedRole,
                    parts: [item.content],
                };
            }
            else {
                // Handle string content
                return {
                    role: mappedRole,
                    parts: [{ text: item.content }],
                };
            }
        });
        coerced = true;
    }
    else if (typeof contents === 'object' && 'parts' in contents) {
        // This might be a single content object
        coercedContents = [contents];
        coerced = true;
    }
    else {
        logger_1.default.warn(`Unknown format for Gemini: ${JSON.stringify(contents)}`);
        return { contents: contents, coerced: false, systemInstruction: undefined };
    }
    let systemPromptParts = [];
    coercedContents = coercedContents.filter((message) => {
        if (message.role === 'system' && message.parts.length > 0) {
            systemPromptParts.push(...message.parts.filter((part) => 'text' in part && typeof part.text === 'string'));
            return false;
        }
        return true;
    });
    // Convert system-only prompts to user messages
    // Gemini does not support execution with systemInstruction only
    if (coercedContents.length === 0 && systemPromptParts.length > 0) {
        coercedContents = [
            {
                role: 'user',
                parts: systemPromptParts,
            },
        ];
        coerced = true;
        systemPromptParts = [];
    }
    return {
        contents: coercedContents,
        coerced,
        systemInstruction: systemPromptParts.length > 0 ? { parts: systemPromptParts } : undefined,
    };
}
let cachedAuth;
/**
 * Loads and processes Google credentials from various sources
 */
function loadCredentials(credentials) {
    if (!credentials) {
        return undefined;
    }
    if (credentials.startsWith('file://')) {
        try {
            return (0, file_1.maybeLoadFromExternalFile)(credentials);
        }
        catch (error) {
            throw new Error(`Failed to load credentials from file: ${error}`);
        }
    }
    return credentials;
}
/**
 * Creates a Google client with optional custom credentials
 */
async function getGoogleClient({ credentials } = {}) {
    if (!cachedAuth) {
        let GoogleAuth;
        try {
            const importedModule = await Promise.resolve().then(() => __importStar(require('google-auth-library')));
            GoogleAuth = importedModule.GoogleAuth;
            cachedAuth = new GoogleAuth({
                scopes: 'https://www.googleapis.com/auth/cloud-platform',
            });
        }
        catch {
            throw new Error('The google-auth-library package is required as a peer dependency. Please install it in your project or globally.');
        }
    }
    const processedCredentials = loadCredentials(credentials);
    let client;
    if (processedCredentials) {
        try {
            client = await cachedAuth.fromJSON(JSON.parse(processedCredentials));
        }
        catch (error) {
            logger_1.default.error(`[Vertex] Could not load credentials: ${error}`);
            throw new Error(`[Vertex] Could not load credentials: ${error}`);
        }
    }
    else {
        client = await cachedAuth.getClient();
    }
    // Try to get project ID from Google Auth Library, but don't fail if it can't detect it
    // This allows the fallback logic in resolveProjectId to work properly
    let projectId;
    try {
        projectId = await cachedAuth.getProjectId();
    }
    catch {
        // If Google Auth Library can't detect project ID from environment,
        // let resolveProjectId handle the fallback logic
        projectId = undefined;
    }
    return { client, projectId };
}
/**
 * Gets project ID from config, environment, or Google client
 */
async function resolveProjectId(config, env) {
    const processedCredentials = loadCredentials(config.credentials);
    const { projectId: googleProjectId } = await getGoogleClient({
        credentials: processedCredentials,
    });
    return (config.projectId ||
        env?.VERTEX_PROJECT_ID ||
        env?.GOOGLE_PROJECT_ID ||
        (0, envars_1.getEnvString)('VERTEX_PROJECT_ID') ||
        (0, envars_1.getEnvString)('GOOGLE_PROJECT_ID') ||
        googleProjectId ||
        '');
}
async function hasGoogleDefaultCredentials() {
    try {
        await getGoogleClient();
        return true;
    }
    catch {
        return false;
    }
}
function getCandidate(data) {
    if (!data || !data.candidates || data.candidates.length < 1) {
        // Check if the prompt was blocked
        let errorDetails = 'No candidates returned in API response.';
        if (data?.promptFeedback?.blockReason) {
            errorDetails = `Response blocked: ${data.promptFeedback.blockReason}`;
            if (data.promptFeedback.safetyRatings) {
                const flaggedCategories = data.promptFeedback.safetyRatings
                    .filter((rating) => rating.probability !== 'NEGLIGIBLE')
                    .map((rating) => `${rating.category}: ${rating.probability}`);
                if (flaggedCategories.length > 0) {
                    errorDetails += ` (Safety ratings: ${flaggedCategories.join(', ')})`;
                }
            }
        }
        else if (data?.promptFeedback?.safetyRatings) {
            const flaggedCategories = data.promptFeedback.safetyRatings
                .filter((rating) => rating.probability !== 'NEGLIGIBLE')
                .map((rating) => `${rating.category}: ${rating.probability}`);
            if (flaggedCategories.length > 0) {
                errorDetails = `Response may have been blocked due to safety filters: ${flaggedCategories.join(', ')}`;
            }
        }
        errorDetails += `\n\nGot response: ${JSON.stringify(data)}`;
        throw new Error(errorDetails);
    }
    if (data.candidates.length > 1) {
        logger_1.default.debug(`Expected one candidate in AI Studio API response, but got ${data.candidates.length}: ${JSON.stringify(data)}`);
    }
    const candidate = data.candidates[0];
    return candidate;
}
function formatCandidateContents(candidate) {
    // Check if the candidate was blocked or stopped for safety reasons
    if (candidate.finishReason &&
        ['SAFETY', 'RECITATION', 'PROHIBITED_CONTENT', 'BLOCKLIST', 'SPII'].includes(candidate.finishReason)) {
        let errorMessage = `Response was blocked with finish reason: ${candidate.finishReason}`;
        if (candidate.safetyRatings) {
            const flaggedCategories = candidate.safetyRatings
                .filter((rating) => rating.probability !== 'NEGLIGIBLE' || rating.blocked)
                .map((rating) => `${rating.category}: ${rating.probability}${rating.blocked ? ' (BLOCKED)' : ''}`);
            if (flaggedCategories.length > 0) {
                errorMessage += `\nSafety ratings: ${flaggedCategories.join(', ')}`;
            }
        }
        if (candidate.finishReason === 'RECITATION') {
            errorMessage +=
                "\n\nThis typically occurs when the response is too similar to content from the model's training data.";
        }
        else if (candidate.finishReason === 'SAFETY') {
            errorMessage +=
                '\n\nThe response was blocked due to safety filters. Consider adjusting safety settings or modifying your prompt.';
        }
        throw new Error(errorMessage);
    }
    if (candidate.content?.parts) {
        let output = '';
        let is_text = true;
        for (const part of candidate.content.parts) {
            if ('text' in part) {
                output += part.text;
            }
            else {
                is_text = false;
            }
        }
        if (is_text) {
            return output;
        }
        else {
            return candidate.content.parts;
        }
    }
    else {
        throw new Error(`No output found in response: ${JSON.stringify(candidate)}`);
    }
}
function mergeParts(parts1, parts2) {
    if (parts1 === undefined) {
        return parts2;
    }
    if (typeof parts1 === 'string' && typeof parts2 === 'string') {
        return parts1 + parts2;
    }
    const array1 = typeof parts1 === 'string' ? [{ text: parts1 }] : parts1;
    const array2 = typeof parts2 === 'string' ? [{ text: parts2 }] : parts2;
    array1.push(...array2);
    return array1;
}
/**
 * Normalizes tools configuration to handle both snake_case and camelCase formats.
 * This ensures compatibility with both Google API formats while maintaining
 * consistent behavior in our codebase.
 */
function normalizeTools(tools) {
    return tools.map((tool) => {
        const normalizedTool = { ...tool };
        // Use index access with type assertion to avoid TypeScript errors
        // Handle google_search -> googleSearch conversion
        if (tool.google_search && !normalizedTool.googleSearch) {
            normalizedTool.googleSearch = tool.google_search;
        }
        // Handle code_execution -> codeExecution conversion
        if (tool.code_execution && !normalizedTool.codeExecution) {
            normalizedTool.codeExecution = tool.code_execution;
        }
        // Handle google_search_retrieval -> googleSearchRetrieval conversion
        if (tool.google_search_retrieval && !normalizedTool.googleSearchRetrieval) {
            normalizedTool.googleSearchRetrieval = tool.google_search_retrieval;
        }
        return normalizedTool;
    });
}
function loadFile(config_var, context_vars) {
    // Ensures that files are loaded correctly. Files may be defined in multiple ways:
    // 1. Directly in the provider:
    //    config_var will be the file path, which will be loaded here in maybeLoadFromExternalFile.
    // 2. In a test variable that is used in the provider via a nunjucks:
    //    context_vars will contain a string of the contents of the file with whitespace.
    //    This will be inserted into the nunjucks in contfig_tools and the output needs to be parsed.
    const fileContents = (0, file_1.maybeLoadFromExternalFile)((0, index_1.renderVarsInObject)(config_var, context_vars));
    if (typeof fileContents === 'string') {
        try {
            const parsedContents = JSON.parse(fileContents);
            return Array.isArray(parsedContents) ? normalizeTools(parsedContents) : parsedContents;
        }
        catch (err) {
            logger_1.default.debug(`ERROR: failed to convert file contents to JSON:\n${JSON.stringify(err)}`);
            return fileContents;
        }
    }
    // If fileContents is already an array of tools, normalize them
    if (Array.isArray(fileContents)) {
        return normalizeTools(fileContents);
    }
    return fileContents;
}
function isValidBase64Image(data) {
    if (!data || data.length < 100) {
        return false;
    }
    try {
        // Verify it's valid base64
        Buffer.from(data, 'base64');
        // Check for known image format headers
        return (data.startsWith('/9j/') || // JPEG
            data.startsWith('iVBORw0KGgo') || // PNG
            data.startsWith('R0lGODlh') || // GIF
            data.startsWith('UklGR') // WebP
        );
    }
    catch {
        return false;
    }
}
function getMimeTypeFromBase64(base64Data) {
    if (base64Data.startsWith('/9j/')) {
        return 'image/jpeg';
    }
    else if (base64Data.startsWith('iVBORw0KGgo')) {
        return 'image/png';
    }
    else if (base64Data.startsWith('R0lGODlh')) {
        return 'image/gif';
    }
    else if (base64Data.startsWith('UklGR')) {
        return 'image/webp';
    }
    // Default to jpeg for unknown formats
    return 'image/jpeg';
}
function processImagesInContents(contents, contextVars) {
    if (!contextVars) {
        return contents;
    }
    const base64ToVarName = new Map();
    for (const [varName, value] of Object.entries(contextVars)) {
        if (typeof value === 'string' && isValidBase64Image(value)) {
            base64ToVarName.set(value, varName);
        }
    }
    return contents.map((content) => {
        if (content.parts) {
            const newParts = [];
            for (const part of content.parts) {
                if (part.text) {
                    const lines = part.text.split('\n');
                    let foundValidImage = false;
                    let currentTextBlock = '';
                    const processedParts = [];
                    // First pass: check if any line is a valid base64 image from context variables
                    for (const line of lines) {
                        const trimmedLine = line.trim();
                        // Check if this line is a base64 image that was loaded from a variable
                        if (base64ToVarName.has(trimmedLine) && isValidBase64Image(trimmedLine)) {
                            foundValidImage = true;
                            // Add any accumulated text as a text part
                            if (currentTextBlock.length > 0) {
                                processedParts.push({
                                    text: currentTextBlock,
                                });
                                currentTextBlock = '';
                            }
                            // Add the image part
                            const mimeType = getMimeTypeFromBase64(trimmedLine);
                            processedParts.push({
                                inlineData: {
                                    mimeType,
                                    data: trimmedLine,
                                },
                            });
                        }
                        else {
                            // Accumulate text, preserving original formatting including newlines
                            if (currentTextBlock.length > 0) {
                                currentTextBlock += '\n';
                            }
                            currentTextBlock += line;
                        }
                    }
                    // Add any remaining text block
                    if (currentTextBlock.length > 0) {
                        processedParts.push({
                            text: currentTextBlock,
                        });
                    }
                    // If we found valid images, use the processed parts; otherwise, keep the original part
                    if (foundValidImage) {
                        newParts.push(...processedParts);
                    }
                    else {
                        newParts.push(part);
                    }
                }
                else {
                    // Keep non-text parts as is
                    newParts.push(part);
                }
            }
            return {
                ...content,
                parts: newParts,
            };
        }
        return content;
    });
}
/**
 * Parses and processes config-level systemInstruction.
 * Handles file loading, string-to-Content conversion, and Nunjucks template rendering.
 *
 * @param configSystemInstruction - The systemInstruction from config (can be string, Content, or undefined)
 * @param contextVars - Variables for Nunjucks template rendering
 * @returns Processed Content object or undefined
 */
function parseConfigSystemInstruction(configSystemInstruction, contextVars) {
    if (!configSystemInstruction) {
        return undefined;
    }
    // Make a copy to avoid mutating the original
    let configInstruction = clone(configSystemInstruction);
    // Load systemInstruction from file if it's a file path
    if (typeof configSystemInstruction === 'string') {
        configInstruction = loadFile(configSystemInstruction, contextVars);
    }
    // Convert string to Content structure
    if (typeof configInstruction === 'string') {
        configInstruction = { parts: [{ text: configInstruction }] };
    }
    // Render Nunjucks templates in all text parts
    if (contextVars && configInstruction) {
        const nunjucks = (0, templates_1.getNunjucksEngine)();
        for (const part of configInstruction.parts) {
            if (part.text) {
                try {
                    part.text = nunjucks.renderString(part.text, contextVars);
                }
                catch (err) {
                    throw new Error(`Unable to render nunjucks in systemInstruction: ${err}`);
                }
            }
        }
    }
    return configInstruction;
}
function geminiFormatAndSystemInstructions(prompt, contextVars, configSystemInstruction, options) {
    let contents = (0, shared_1.parseChatPrompt)(prompt, [
        {
            parts: [
                {
                    text: prompt,
                },
            ],
            role: 'user',
        },
    ]);
    const { contents: updatedContents, coerced, systemInstruction: parsedSystemInstruction, } = maybeCoerceToGeminiFormat(contents, options);
    if (coerced) {
        logger_1.default.debug(`Coerced JSON prompt to Gemini format: ${JSON.stringify(contents)}`);
        contents = updatedContents;
    }
    let systemInstruction = parsedSystemInstruction;
    const parsedConfigInstruction = parseConfigSystemInstruction(configSystemInstruction, contextVars);
    if (parsedConfigInstruction) {
        systemInstruction = systemInstruction
            ? { parts: [...parsedConfigInstruction.parts, ...systemInstruction.parts] }
            : parsedConfigInstruction;
    }
    // Process images in contents
    contents = processImagesInContents(contents, contextVars);
    return { contents, systemInstruction };
}
/**
 * Recursively traverses a JSON schema object and converts
 * uppercase type keywords (string values) to lowercase.
 * Handles nested objects and arrays within the schema.
 * Creates a deep copy to avoid modifying the original schema.
 *
 * @param {object | any} schemaNode - The current node (object or value) being processed.
 * @returns {object | any} - The processed node with type keywords lowercased.
 */
function normalizeSchemaTypes(schemaNode) {
    // Handle non-objects (including null) and arrays directly by iterating/returning
    if (typeof schemaNode !== 'object' || schemaNode === null) {
        return schemaNode;
    }
    if (Array.isArray(schemaNode)) {
        return schemaNode.map(normalizeSchemaTypes); // Recurse for array elements
    }
    // Create a new object to avoid modifying the original
    const newNode = {};
    for (const key in schemaNode) {
        if (Object.prototype.hasOwnProperty.call(schemaNode, key)) {
            const value = schemaNode[key];
            if (key === 'type') {
                if (typeof value === 'string' &&
                    types_1.VALID_SCHEMA_TYPES.includes(value)) {
                    // Convert type value(s) to lowercase
                    newNode[key] = value.toLowerCase();
                }
                else if (Array.isArray(value)) {
                    // Handle type arrays like ["STRING", "NULL"]
                    newNode[key] = value.map((t) => typeof t === 'string' && types_1.VALID_SCHEMA_TYPES.includes(t)
                        ? t.toLowerCase()
                        : t);
                }
                else {
                    // Handle type used as function field rather than a schema type definition
                    newNode[key] = normalizeSchemaTypes(value);
                }
            }
            else {
                // Recursively process nested objects/arrays
                newNode[key] = normalizeSchemaTypes(value);
            }
        }
    }
    return newNode;
}
function parseStringObject(input) {
    if (typeof input === 'string') {
        return JSON.parse(input);
    }
    return input;
}
function validateFunctionCall(output, functions, vars) {
    let functionCalls;
    try {
        let parsedOutput = parseStringObject(output);
        if ('toolCall' in parsedOutput) {
            // Live Format
            parsedOutput = parsedOutput.toolCall;
            functionCalls = parsedOutput.functionCalls;
        }
        else if (Array.isArray(parsedOutput)) {
            // Vertex and AIS Format
            functionCalls = parsedOutput
                .filter((obj) => Object.prototype.hasOwnProperty.call(obj, 'functionCall'))
                .map((obj) => obj.functionCall);
        }
        else {
            throw new Error();
        }
    }
    catch {
        throw new Error(`Google did not return a valid-looking function call: ${JSON.stringify(output)}`);
    }
    const interpolatedFunctions = loadFile(functions, vars);
    for (const functionCall of functionCalls) {
        // Parse function call and validate it against schema
        const functionName = functionCall.name;
        const functionArgs = parseStringObject(functionCall.args);
        const functionDeclarations = interpolatedFunctions?.find((f) => 'functionDeclarations' in f);
        const functionSchema = functionDeclarations?.functionDeclarations?.find((f) => f.name === functionName);
        if (!functionSchema) {
            throw new Error(`Called "${functionName}", but there is no function with that name`);
        }
        if (Object.keys(functionArgs).length !== 0 && functionSchema?.parameters) {
            const parameterSchema = normalizeSchemaTypes(functionSchema.parameters);
            let validate;
            try {
                validate = ajv.compile(parameterSchema);
            }
            catch (err) {
                throw new Error(`Tool schema doesn't compile with ajv: ${err}. If this is a valid tool schema you may need to reformulate your assertion without is-valid-function-call.`);
            }
            if (!validate(functionArgs)) {
                throw new Error(`Call to "${functionName}":\n${JSON.stringify(functionCall)}\ndoes not match schema:\n${JSON.stringify(validate.errors)}`);
            }
        }
        else if (!(JSON.stringify(functionArgs) === '{}' && !functionSchema?.parameters)) {
            throw new Error(`Call to "${functionName}":\n${JSON.stringify(functionCall)}\ndoes not match schema:\n${JSON.stringify(functionSchema)}`);
        }
    }
}
//# sourceMappingURL=util.js.map