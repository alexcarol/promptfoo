"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveTracingOptions = resolveTracingOptions;
const cliState_1 = __importDefault(require("../../cliState"));
const DEFAULT_TRACING_OPTIONS = {
    enabled: false,
    includeInAttack: true,
    includeInGrading: true,
    includeInternalSpans: false,
    maxSpans: 50,
    maxDepth: 5,
    maxRetries: 3,
    retryDelayMs: 500,
    spanFilter: undefined,
    sanitizeAttributes: true,
};
function mergeTracingConfig(...configs) {
    return configs.reduce((acc, config) => (config ? { ...acc, ...config } : acc), {});
}
function normalizeTracingOptions(config) {
    const merged = { ...DEFAULT_TRACING_OPTIONS, ...config };
    return {
        enabled: Boolean(merged.enabled),
        includeInAttack: merged.includeInAttack ?? DEFAULT_TRACING_OPTIONS.includeInAttack ?? true,
        includeInGrading: merged.includeInGrading ?? DEFAULT_TRACING_OPTIONS.includeInGrading ?? true,
        includeInternalSpans: merged.includeInternalSpans ?? DEFAULT_TRACING_OPTIONS.includeInternalSpans ?? false,
        maxSpans: merged.maxSpans ?? DEFAULT_TRACING_OPTIONS.maxSpans,
        maxDepth: merged.maxDepth ?? DEFAULT_TRACING_OPTIONS.maxDepth,
        maxRetries: merged.maxRetries ?? DEFAULT_TRACING_OPTIONS.maxRetries,
        retryDelayMs: merged.retryDelayMs ?? DEFAULT_TRACING_OPTIONS.retryDelayMs,
        spanFilter: merged.spanFilter,
        sanitizeAttributes: merged.sanitizeAttributes ?? DEFAULT_TRACING_OPTIONS.sanitizeAttributes,
    };
}
function resolveTracingOptions({ strategyId, test, config, }) {
    const globalConfig = cliState_1.default.config?.redteam?.tracing ?? undefined;
    const testConfig = test?.metadata?.tracing ?? undefined;
    const metadataStrategyConfig = test?.metadata?.strategyConfig?.tracing;
    const providerStrategyConfig = config?.tracing ?? undefined;
    const globalStrategyOverride = strategyId && globalConfig?.strategies ? globalConfig.strategies[strategyId] : undefined;
    const testStrategyOverride = strategyId && testConfig?.strategies ? testConfig.strategies[strategyId] : undefined;
    const metadataStrategyOverride = strategyId && metadataStrategyConfig?.strategies
        ? metadataStrategyConfig.strategies[strategyId]
        : undefined;
    const providerStrategyOverride = strategyId && providerStrategyConfig?.strategies
        ? providerStrategyConfig.strategies[strategyId]
        : undefined;
    const merged = mergeTracingConfig(globalConfig, testConfig, metadataStrategyConfig, providerStrategyConfig, globalStrategyOverride, testStrategyOverride, metadataStrategyOverride, providerStrategyOverride);
    return normalizeTracingOptions(merged);
}
//# sourceMappingURL=tracingOptions.js.map