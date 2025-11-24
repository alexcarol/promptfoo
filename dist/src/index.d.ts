import assertions from './assertions/index';
import * as cache from './cache';
import guardrails from './guardrails';
import Eval from './models/eval';
import { loadApiProvider } from './providers/index';
import { doGenerateRedteam } from './redteam/commands/generate';
import { extractEntities } from './redteam/extraction/entities';
import { extractMcpToolsInfo } from './redteam/extraction/mcpTools';
import { extractSystemPurpose } from './redteam/extraction/purpose';
import { RedteamGraderBase, RedteamPluginBase } from './redteam/plugins/base';
import { doRedteamRun } from './redteam/shared';
import type { EvaluateOptions, EvaluateTestSuite } from './types/index';
export { generateTable } from './table';
export * from './types/index';
declare function evaluate(testSuite: EvaluateTestSuite, options?: EvaluateOptions): Promise<Eval>;
declare const redteam: {
    Extractors: {
        extractEntities: typeof extractEntities;
        extractMcpToolsInfo: typeof extractMcpToolsInfo;
        extractSystemPurpose: typeof extractSystemPurpose;
    };
    Graders: Record<`promptfoo:redteam:${string}`, RedteamGraderBase>;
    Plugins: import("./redteam/plugins/index").PluginFactory[];
    Strategies: import("./redteam/strategies/types").Strategy[];
    Base: {
        Plugin: typeof RedteamPluginBase;
        Grader: typeof RedteamGraderBase;
    };
    generate: typeof doGenerateRedteam;
    run: typeof doRedteamRun;
};
export { assertions, cache, evaluate, guardrails, loadApiProvider, redteam };
declare const _default: {
    assertions: {
        runAssertion: typeof import("./assertions/index").runAssertion;
        runAssertions: typeof import("./assertions/index").runAssertions;
        matchesSimilarity: typeof import("./matchers").matchesSimilarity;
        matchesClassification: typeof import("./matchers").matchesClassification;
        matchesLlmRubric: typeof import("./matchers").matchesLlmRubric;
        matchesFactuality: typeof import("./matchers").matchesFactuality;
        matchesClosedQa: typeof import("./matchers").matchesClosedQa;
        matchesAnswerRelevance: typeof import("./matchers").matchesAnswerRelevance;
        matchesContextRecall: typeof import("./matchers").matchesContextRecall;
        matchesContextRelevance: typeof import("./matchers").matchesContextRelevance;
        matchesContextFaithfulness: typeof import("./matchers").matchesContextFaithfulness;
        matchesComparisonBoolean: typeof import("./matchers").matchesSelectBest;
        matchesModeration: typeof import("./matchers").matchesModeration;
        matchesConversationRelevance: typeof import("./external/matchers/deepeval").matchesConversationRelevance;
    };
    cache: typeof cache;
    evaluate: typeof evaluate;
    guardrails: {
        guard(input: string): Promise<import("./guardrails").GuardResult>;
        pii(input: string): Promise<import("./guardrails").GuardResult>;
        harm(input: string): Promise<import("./guardrails").GuardResult>;
        adaptive(request: import("./guardrails").AdaptiveRequest): Promise<import("./guardrails").AdaptiveResult>;
    };
    loadApiProvider: typeof loadApiProvider;
    redteam: {
        Extractors: {
            extractEntities: typeof extractEntities;
            extractMcpToolsInfo: typeof extractMcpToolsInfo;
            extractSystemPurpose: typeof extractSystemPurpose;
        };
        Graders: Record<`promptfoo:redteam:${string}`, RedteamGraderBase>;
        Plugins: import("./redteam/plugins/index").PluginFactory[];
        Strategies: import("./redteam/strategies/types").Strategy[];
        Base: {
            Plugin: typeof RedteamPluginBase;
            Grader: typeof RedteamGraderBase;
        };
        generate: typeof doGenerateRedteam;
        run: typeof doRedteamRun;
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map