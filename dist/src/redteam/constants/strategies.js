"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRATEGIES_REQUIRING_REMOTE = exports.LANGUAGE_DISALLOWED_STRATEGIES = exports.ENCODING_STRATEGIES = exports.CONFIGURABLE_STRATEGIES = exports.ALL_STRATEGIES = exports.STRATEGY_COLLECTION_MAPPINGS = exports.STRATEGY_COLLECTIONS = exports.ADDITIONAL_STRATEGIES = exports.DATASET_PLUGINS = exports.AGENTIC_STRATEGIES = exports.MULTI_MODAL_STRATEGIES = exports.isCustomStrategy = exports.isMultiTurnStrategy = exports.MULTI_TURN_STRATEGY_SET = exports.MULTI_TURN_STRATEGIES = exports.DEFAULT_MULTI_TURN_MAX_TURNS = exports.DEFAULT_STRATEGIES = exports.FRAMEWORK_COMPLIANCE_IDS = void 0;
exports.isEncodingStrategy = isEncodingStrategy;
exports.isLanguageDisallowedStrategy = isLanguageDisallowedStrategy;
exports.getDefaultNFanout = getDefaultNFanout;
exports.isFanoutStrategy = isFanoutStrategy;
// These are exposed on the frontend under the framework compliance section
exports.FRAMEWORK_COMPLIANCE_IDS = [
    'mitre:atlas',
    'nist:ai:measure',
    'owasp:api',
    'owasp:llm',
    'owasp:agentic',
    'eu:ai-act',
    'iso:42001',
    'gdpr',
];
exports.DEFAULT_STRATEGIES = ['basic', 'jailbreak:meta', 'jailbreak:composite'];
exports.DEFAULT_MULTI_TURN_MAX_TURNS = 5;
exports.MULTI_TURN_STRATEGIES = [
    'crescendo',
    'goat',
    'jailbreak:hydra',
    'custom',
    'mischievous-user',
    'simba',
];
exports.MULTI_TURN_STRATEGY_SET = new Set(exports.MULTI_TURN_STRATEGIES);
const isMultiTurnStrategy = (strategyId) => {
    return strategyId ? exports.MULTI_TURN_STRATEGY_SET.has(strategyId) : false;
};
exports.isMultiTurnStrategy = isMultiTurnStrategy;
// Helper function to check if a strategy is a custom variant
const isCustomStrategy = (strategyId) => {
    return strategyId === 'custom' || strategyId.startsWith('custom:');
};
exports.isCustomStrategy = isCustomStrategy;
exports.MULTI_MODAL_STRATEGIES = ['audio', 'image', 'video'];
exports.AGENTIC_STRATEGIES = [
    'crescendo',
    'goat',
    'custom',
    'jailbreak',
    'jailbreak:hydra',
    'jailbreak:meta',
    'jailbreak:tree',
    'mischievous-user',
    'simba',
];
exports.DATASET_PLUGINS = [
    'beavertails',
    'cyberseceval',
    'donotanswer',
    'harmbench',
    'toxic-chat',
    'aegis',
    'pliny',
    'unsafebench',
    'xstest',
];
exports.ADDITIONAL_STRATEGIES = [
    'audio',
    'authoritative-markup-injection',
    'base64',
    'best-of-n',
    'camelcase',
    'citation',
    'crescendo',
    'custom',
    'emoji',
    'gcg',
    'goat',
    'hex',
    'homoglyph',
    'image',
    'jailbreak:hydra',
    'jailbreak',
    'jailbreak:likert',
    'jailbreak:meta',
    'jailbreak:tree',
    'layer',
    'leetspeak',
    'math-prompt',
    'mischievous-user',
    'morse',
    'multilingual', // Deprecated: Use top-level language config instead
    'piglatin',
    'prompt-injection',
    'retry',
    'rot13',
    'simba',
    'video',
];
exports.STRATEGY_COLLECTIONS = ['other-encodings'];
exports.STRATEGY_COLLECTION_MAPPINGS = {
    'other-encodings': ['camelcase', 'morse', 'piglatin', 'emoji'],
};
const _ALL_STRATEGIES = [
    'default',
    ...exports.DEFAULT_STRATEGIES,
    ...exports.ADDITIONAL_STRATEGIES,
    ...exports.STRATEGY_COLLECTIONS,
    ...exports.AGENTIC_STRATEGIES,
];
exports.ALL_STRATEGIES = Array.from(new Set(_ALL_STRATEGIES)).sort();
exports.CONFIGURABLE_STRATEGIES = [
    'layer',
    'best-of-n',
    'goat',
    'crescendo',
    'jailbreak',
    'jailbreak:hydra',
    'jailbreak:meta',
    'jailbreak:tree',
    'gcg',
    'citation',
    'custom',
    'mischievous-user',
    'simba',
];
/**
 * Set of strategy IDs that represent encoding transformations where originalText should be shown
 */
exports.ENCODING_STRATEGIES = new Set([
    'base64',
    'hex',
    'rot13',
    'leetspeak',
    'homoglyph',
    'morse',
    'atbash',
    'piglatin',
    'camelcase',
    'emoji',
    'reverse',
    'binary',
    'octal',
    'audio',
    'image',
    'video',
]);
/**
 * Determines if a strategy represents an encoding where we should show the original text
 */
function isEncodingStrategy(strategyId) {
    return strategyId ? exports.ENCODING_STRATEGIES.has(strategyId) : false;
}
/**
 * Strategies that should not have language configuration applied to them.
 */
exports.LANGUAGE_DISALLOWED_STRATEGIES = new Set(['audio', 'video', 'image', 'math-prompt']);
/**
 * Determines if a strategy should not use language configuration
 */
function isLanguageDisallowedStrategy(strategyId) {
    return strategyId ? exports.LANGUAGE_DISALLOWED_STRATEGIES.has(strategyId) : false;
}
/**
 * Default 'n' fan out for strategies that can add additional test cases during generation
 */
const DEFAULT_N_FAN_OUT_BY_STRATEGY = {
    'jailbreak:composite': 5,
    gcg: 1,
};
for (const strategyId in DEFAULT_N_FAN_OUT_BY_STRATEGY) {
    if (!exports.ALL_STRATEGIES.includes(strategyId)) {
        throw new Error(`Default fan out strategy ${strategyId} is not in ALL_STRATEGIES`);
    }
}
function getDefaultNFanout(strategyId) {
    return DEFAULT_N_FAN_OUT_BY_STRATEGY[strategyId] ?? 1;
}
function isFanoutStrategy(strategyId) {
    return strategyId in DEFAULT_N_FAN_OUT_BY_STRATEGY;
}
// Strategies that require remote generation to function
// These strategies will be disabled in the UI when PROMPTFOO_DISABLE_REMOTE_GENERATION is set
exports.STRATEGIES_REQUIRING_REMOTE = [
    'audio',
    'citation',
    'gcg',
    'goat',
    'jailbreak:composite',
    'jailbreak:hydra',
    'jailbreak:likert',
    'jailbreak:meta',
];
//# sourceMappingURL=strategies.js.map