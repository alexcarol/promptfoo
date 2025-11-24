export declare const FRAMEWORK_COMPLIANCE_IDS: readonly ["mitre:atlas", "nist:ai:measure", "owasp:api", "owasp:llm", "owasp:agentic", "eu:ai-act", "iso:42001", "gdpr"];
export type FrameworkComplianceId = (typeof FRAMEWORK_COMPLIANCE_IDS)[number];
export declare const DEFAULT_STRATEGIES: readonly ["basic", "jailbreak:meta", "jailbreak:composite"];
export type DefaultStrategy = (typeof DEFAULT_STRATEGIES)[number];
export declare const DEFAULT_MULTI_TURN_MAX_TURNS = 5;
export declare const MULTI_TURN_STRATEGIES: readonly ["crescendo", "goat", "jailbreak:hydra", "custom", "mischievous-user", "simba"];
export type MultiTurnStrategy = (typeof MULTI_TURN_STRATEGIES)[number];
export declare const MULTI_TURN_STRATEGY_SET: ReadonlySet<MultiTurnStrategy>;
export declare const isMultiTurnStrategy: (strategyId: string | undefined) => strategyId is MultiTurnStrategy;
export declare const isCustomStrategy: (strategyId: string) => boolean;
export declare const MULTI_MODAL_STRATEGIES: readonly ["audio", "image", "video"];
export type MultiModalStrategy = (typeof MULTI_MODAL_STRATEGIES)[number];
export declare const AGENTIC_STRATEGIES: readonly ["crescendo", "goat", "custom", "jailbreak", "jailbreak:hydra", "jailbreak:meta", "jailbreak:tree", "mischievous-user", "simba"];
export type AgenticStrategy = (typeof AGENTIC_STRATEGIES)[number];
export declare const DATASET_PLUGINS: readonly ["beavertails", "cyberseceval", "donotanswer", "harmbench", "toxic-chat", "aegis", "pliny", "unsafebench", "xstest"];
export type DatasetPlugin = (typeof DATASET_PLUGINS)[number];
export declare const ADDITIONAL_STRATEGIES: readonly ["audio", "authoritative-markup-injection", "base64", "best-of-n", "camelcase", "citation", "crescendo", "custom", "emoji", "gcg", "goat", "hex", "homoglyph", "image", "jailbreak:hydra", "jailbreak", "jailbreak:likert", "jailbreak:meta", "jailbreak:tree", "layer", "leetspeak", "math-prompt", "mischievous-user", "morse", "multilingual", "piglatin", "prompt-injection", "retry", "rot13", "simba", "video"];
export type AdditionalStrategy = (typeof ADDITIONAL_STRATEGIES)[number];
export declare const STRATEGY_COLLECTIONS: readonly ["other-encodings"];
export type StrategyCollection = (typeof STRATEGY_COLLECTIONS)[number];
export declare const STRATEGY_COLLECTION_MAPPINGS: Record<StrategyCollection, string[]>;
export declare const ALL_STRATEGIES: ("default" | "custom" | "basic" | "jailbreak:meta" | "jailbreak:composite" | "crescendo" | "goat" | "jailbreak:hydra" | "mischievous-user" | "simba" | "audio" | "image" | "video" | "jailbreak" | "jailbreak:tree" | "authoritative-markup-injection" | "base64" | "best-of-n" | "camelcase" | "citation" | "emoji" | "gcg" | "hex" | "homoglyph" | "jailbreak:likert" | "layer" | "leetspeak" | "math-prompt" | "morse" | "multilingual" | "piglatin" | "prompt-injection" | "retry" | "rot13" | "other-encodings")[];
export type Strategy = (typeof ALL_STRATEGIES)[number];
export declare const CONFIGURABLE_STRATEGIES: readonly ["layer", "best-of-n", "goat", "crescendo", "jailbreak", "jailbreak:hydra", "jailbreak:meta", "jailbreak:tree", "gcg", "citation", "custom", "mischievous-user", "simba"];
export type ConfigurableStrategy = (typeof CONFIGURABLE_STRATEGIES)[number];
/**
 * Set of strategy IDs that represent encoding transformations where originalText should be shown
 */
export declare const ENCODING_STRATEGIES: Set<string>;
/**
 * Determines if a strategy represents an encoding where we should show the original text
 */
export declare function isEncodingStrategy(strategyId: string | undefined): boolean;
/**
 * Strategies that should not have language configuration applied to them.
 */
export declare const LANGUAGE_DISALLOWED_STRATEGIES: Set<string>;
/**
 * Determines if a strategy should not use language configuration
 */
export declare function isLanguageDisallowedStrategy(strategyId: string | undefined): boolean;
/**
 * Default 'n' fan out for strategies that can add additional test cases during generation
 */
declare const DEFAULT_N_FAN_OUT_BY_STRATEGY: {
    readonly 'jailbreak:composite': 5;
    readonly gcg: 1;
};
type FanOutStrategy = keyof typeof DEFAULT_N_FAN_OUT_BY_STRATEGY;
export declare function getDefaultNFanout(strategyId: FanOutStrategy): number;
export declare function isFanoutStrategy(strategyId: string): strategyId is FanOutStrategy;
export declare const STRATEGIES_REQUIRING_REMOTE: readonly ["audio", "citation", "gcg", "goat", "jailbreak:composite", "jailbreak:hydra", "jailbreak:likert", "jailbreak:meta"];
export {};
//# sourceMappingURL=strategies.d.ts.map