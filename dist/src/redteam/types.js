"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationMessageSchema = exports.StrategyConfigSchema = exports.PluginConfigSchema = exports.PolicyObjectSchema = void 0;
const zod_1 = require("zod");
const constants_1 = require("./constants");
const validators_1 = require("./plugins/policy/validators");
// Policy Types
exports.PolicyObjectSchema = zod_1.z.object({
    id: zod_1.z
        .string()
        .refine(validators_1.isValidPolicyId, { message: 'ID must be either a UUID or a 12-character hex string' }),
    text: zod_1.z.string().optional(),
    name: zod_1.z.string().optional(),
});
exports.PluginConfigSchema = zod_1.z.object({
    examples: zod_1.z.array(zod_1.z.string()).optional(),
    graderExamples: zod_1.z
        .array(zod_1.z.object({
        output: zod_1.z.string(),
        pass: zod_1.z.boolean(),
        score: zod_1.z.number(),
        reason: zod_1.z.string(),
    }))
        .optional(),
    graderGuidance: zod_1.z.string().optional(),
    severity: zod_1.z.nativeEnum(constants_1.Severity).optional(),
    language: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    prompt: zod_1.z.string().optional(),
    purpose: zod_1.z.string().optional(),
    // TODO: should be z.record(Modifier, z.unknown())
    modifiers: zod_1.z.record(zod_1.z.unknown()).optional(),
    // BOLA
    targetIdentifiers: zod_1.z.array(zod_1.z.string()).optional(),
    // BFLA
    targetSystems: zod_1.z.array(zod_1.z.string()).optional(),
    // Competitor
    mentions: zod_1.z.boolean().optional(),
    // SSRF
    targetUrls: zod_1.z.array(zod_1.z.string()).optional(),
    // PII
    name: zod_1.z.string().optional(),
    // CyberSecEval
    multilingual: zod_1.z.boolean().optional(),
    indirectInjectionVar: zod_1.z.string().optional(),
    intent: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]))]).optional(),
    policy: zod_1.z.union([zod_1.z.string(), exports.PolicyObjectSchema]).optional(),
    systemPrompt: zod_1.z.string().optional(),
    // Strategy exclusions - allows plugins to exclude incompatible strategies
    excludeStrategies: zod_1.z.array(zod_1.z.string()).optional(),
    // Allow for the inclusion of a nonce to prevent caching of test cases.
    __nonce: zod_1.z.number().optional(),
});
exports.StrategyConfigSchema = zod_1.z
    .object({
    enabled: zod_1.z.boolean().optional(),
    plugins: zod_1.z.array(zod_1.z.string()).optional(),
    // Allow arbitrary extra fields for strategy configs
    // Use .catchall to accept any additional unknown properties
    // See: https://github.com/colinhacks/zod#catchall
})
    .catchall(zod_1.z.unknown());
exports.ConversationMessageSchema = zod_1.z.object({
    role: zod_1.z.enum(['assistant', 'user']),
    content: zod_1.z.string(),
});
//# sourceMappingURL=types.js.map