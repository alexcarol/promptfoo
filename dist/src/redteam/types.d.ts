import { z } from 'zod';
import type { ApiProvider, ProviderOptions } from '../types/providers';
import { type FrameworkComplianceId, type Plugin, Severity } from './constants';
export type Modifier = string | 'tone' | 'style' | 'context' | 'testGenerationInstructions';
export type Intent = string | string[];
export declare const PolicyObjectSchema: z.ZodObject<{
    id: z.ZodEffects<z.ZodString, string, string>;
    text: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    text?: string | undefined;
    name?: string | undefined;
}, {
    id: string;
    text?: string | undefined;
    name?: string | undefined;
}>;
export type PolicyObject = z.infer<typeof PolicyObjectSchema>;
export type Policy = string | PolicyObject;
export type PoliciesById = Map<PolicyObject['id'], {
    text: Required<PolicyObject>['text'];
    name: Required<PolicyObject>['name'];
    severity: Severity;
}>;
export type RedteamObjectConfig = Record<string, unknown>;
export interface TracingConfig {
    enabled?: boolean;
    includeInAttack?: boolean;
    includeInGrading?: boolean;
    includeInternalSpans?: boolean;
    maxSpans?: number;
    maxDepth?: number;
    maxRetries?: number;
    retryDelayMs?: number;
    spanFilter?: string[];
    sanitizeAttributes?: boolean;
    strategies?: Record<string, TracingConfig>;
}
export declare const PluginConfigSchema: z.ZodObject<{
    examples: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    graderExamples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        output: z.ZodString;
        pass: z.ZodBoolean;
        score: z.ZodNumber;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        output: string;
        pass: boolean;
        score: number;
        reason: string;
    }, {
        output: string;
        pass: boolean;
        score: number;
        reason: string;
    }>, "many">>;
    graderGuidance: z.ZodOptional<z.ZodString>;
    severity: z.ZodOptional<z.ZodNativeEnum<typeof Severity>>;
    language: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
    prompt: z.ZodOptional<z.ZodString>;
    purpose: z.ZodOptional<z.ZodString>;
    modifiers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
    targetIdentifiers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    targetSystems: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    mentions: z.ZodOptional<z.ZodBoolean>;
    targetUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    name: z.ZodOptional<z.ZodString>;
    multilingual: z.ZodOptional<z.ZodBoolean>;
    indirectInjectionVar: z.ZodOptional<z.ZodString>;
    intent: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>, "many">]>>;
    policy: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodObject<{
        id: z.ZodEffects<z.ZodString, string, string>;
        text: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        text?: string | undefined;
        name?: string | undefined;
    }, {
        id: string;
        text?: string | undefined;
        name?: string | undefined;
    }>]>>;
    systemPrompt: z.ZodOptional<z.ZodString>;
    excludeStrategies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    __nonce: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    prompt?: string | undefined;
    intent?: string | (string | string[])[] | undefined;
    policy?: string | {
        id: string;
        text?: string | undefined;
        name?: string | undefined;
    } | undefined;
    multilingual?: boolean | undefined;
    name?: string | undefined;
    examples?: string[] | undefined;
    graderExamples?: {
        output: string;
        pass: boolean;
        score: number;
        reason: string;
    }[] | undefined;
    graderGuidance?: string | undefined;
    severity?: Severity | undefined;
    language?: string | string[] | undefined;
    purpose?: string | undefined;
    modifiers?: Record<string, unknown> | undefined;
    targetIdentifiers?: string[] | undefined;
    targetSystems?: string[] | undefined;
    mentions?: boolean | undefined;
    targetUrls?: string[] | undefined;
    indirectInjectionVar?: string | undefined;
    systemPrompt?: string | undefined;
    excludeStrategies?: string[] | undefined;
    __nonce?: number | undefined;
}, {
    prompt?: string | undefined;
    intent?: string | (string | string[])[] | undefined;
    policy?: string | {
        id: string;
        text?: string | undefined;
        name?: string | undefined;
    } | undefined;
    multilingual?: boolean | undefined;
    name?: string | undefined;
    examples?: string[] | undefined;
    graderExamples?: {
        output: string;
        pass: boolean;
        score: number;
        reason: string;
    }[] | undefined;
    graderGuidance?: string | undefined;
    severity?: Severity | undefined;
    language?: string | string[] | undefined;
    purpose?: string | undefined;
    modifiers?: Record<string, unknown> | undefined;
    targetIdentifiers?: string[] | undefined;
    targetSystems?: string[] | undefined;
    mentions?: boolean | undefined;
    targetUrls?: string[] | undefined;
    indirectInjectionVar?: string | undefined;
    systemPrompt?: string | undefined;
    excludeStrategies?: string[] | undefined;
    __nonce?: number | undefined;
}>;
export type PluginConfig = z.infer<typeof PluginConfigSchema>;
export declare const StrategyConfigSchema: z.ZodObject<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodUnknown, z.objectOutputType<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodUnknown, "strip">, z.objectInputType<{
    enabled: z.ZodOptional<z.ZodBoolean>;
    plugins: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, z.ZodUnknown, "strip">>;
export type StrategyConfig = z.infer<typeof StrategyConfigSchema>;
export declare const ConversationMessageSchema: z.ZodObject<{
    role: z.ZodEnum<["assistant", "user"]>;
    content: z.ZodString;
}, "strip", z.ZodTypeAny, {
    role: "assistant" | "user";
    content: string;
}, {
    role: "assistant" | "user";
    content: string;
}>;
export type ConversationMessage = z.infer<typeof ConversationMessageSchema>;
type ConfigurableObject = {
    id: string;
    config?: RedteamObjectConfig;
};
type WithNumTests = {
    numTests?: number;
};
type TestCase = {
    description?: string;
    vars?: Record<string, unknown>;
    provider?: string | ProviderOptions | ApiProvider;
    providerOutput?: string | Record<string, unknown>;
    assert?: any;
    options?: any;
};
export type RedteamPluginObject = ConfigurableObject & WithNumTests & {
    severity?: Severity;
    config?: PluginConfig;
};
export type RedteamPlugin = string | RedteamPluginObject;
export type RedteamStrategyObject = {
    id: string;
    config?: StrategyConfig;
};
export type RedteamStrategy = string | RedteamStrategyObject;
export interface PluginActionParams {
    provider: ApiProvider;
    purpose: string;
    injectVar: string;
    n: number;
    delayMs: number;
    config?: PluginConfig;
}
type CommonOptions = {
    injectVar?: string;
    language?: string | string[];
    numTests?: number;
    plugins?: RedteamPluginObject[];
    provider?: string | ProviderOptions | ApiProvider;
    purpose?: string;
    strategies?: RedteamStrategy[];
    frameworks?: FrameworkComplianceId[];
    delay?: number;
    remote?: boolean;
    sharing?: boolean;
    excludeTargetOutputFromAgenticAttackGeneration?: boolean;
    testGenerationInstructions?: string;
    maxConcurrency?: number;
    tracing?: TracingConfig;
};
export interface RedteamCliGenerateOptions extends CommonOptions {
    cache: boolean;
    config?: string;
    target?: string;
    defaultConfig: Record<string, unknown>;
    defaultConfigPath?: string;
    envFile?: string;
    maxConcurrency?: number;
    output?: string;
    force?: boolean;
    write: boolean;
    inRedteamRun?: boolean;
    verbose?: boolean;
    abortSignal?: AbortSignal;
    burpEscapeJson?: boolean;
    progressBar?: boolean;
    liveRedteamConfig?: RedteamObjectConfig;
    configFromCloud?: any;
}
export interface RedteamFileConfig extends CommonOptions {
    entities?: string[];
    severity?: Record<Plugin, Severity>;
    excludeTargetOutputFromAgenticAttackGeneration?: boolean;
}
export interface SynthesizeOptions extends CommonOptions {
    abortSignal?: AbortSignal;
    entities?: string[];
    language?: string | string[];
    maxConcurrency?: number;
    numTests: number;
    plugins: (RedteamPluginObject & {
        id: string;
        numTests: number;
    })[];
    prompts: [string, ...string[]];
    strategies: RedteamStrategyObject[];
    targetLabels: string[];
    showProgressBar?: boolean;
}
export type RedteamAssertionTypes = `promptfoo:redteam:${string}`;
export interface RedteamRunOptions {
    id?: string;
    config?: string;
    target?: string;
    output?: string;
    cache?: boolean;
    envPath?: string;
    maxConcurrency?: number;
    delay?: number;
    remote?: boolean;
    force?: boolean;
    filterProviders?: string;
    filterTargets?: string;
    verbose?: boolean;
    progressBar?: boolean;
    liveRedteamConfig?: any;
    logCallback?: (message: string) => void;
    progressCallback?: (completed: number, total: number, index: number | string, evalStep: any, // RunEvalOptions, but introduces circular dependency
    metrics: any) => void;
    abortSignal?: AbortSignal;
    loadedFromCloud?: boolean;
}
export interface SavedRedteamConfig {
    description: string;
    prompts: string[];
    target: ProviderOptions;
    plugins: (RedteamPlugin | {
        id: string;
        config?: any;
    })[];
    strategies: RedteamStrategy[];
    purpose?: string;
    frameworks?: FrameworkComplianceId[];
    extensions?: string[];
    numTests?: number;
    maxConcurrency?: number;
    language?: string | string[];
    applicationDefinition: {
        purpose?: string;
        features?: string;
        hasAccessTo?: string;
        doesNotHaveAccessTo?: string;
        userTypes?: string;
        securityRequirements?: string;
        exampleIdentifiers?: string;
        industry?: string;
        sensitiveDataTypes?: string;
        criticalActions?: string;
        forbiddenTopics?: string;
        competitors?: string;
        systemPrompt?: string;
        redteamUser?: string;
        accessToData?: string;
        forbiddenData?: string;
        accessToActions?: string;
        forbiddenActions?: string;
        connectedSystems?: string;
        attackConstraints?: string;
    };
    testGenerationInstructions?: string;
    entities: string[];
    defaultTest?: TestCase;
}
/**
 * Base metadata interface shared by all redteam providers
 */
export interface BaseRedteamMetadata {
    redteamFinalPrompt?: string;
    messages: Record<string, any>[];
    stopReason: string;
    redteamHistory?: {
        prompt: string;
        output: string;
    }[];
    sessionIds?: string[];
    sessionId?: string;
}
/**
 * Options for generating red team tests via the public API
 * This is a cleaner subset of RedteamCliGenerateOptions for external use
 */
export type RedteamGenerateOptions = Partial<RedteamCliGenerateOptions>;
export {};
//# sourceMappingURL=types.d.ts.map