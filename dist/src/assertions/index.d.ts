import { matchesConversationRelevance } from '../external/matchers/deepeval';
import { matchesAnswerRelevance, matchesClassification, matchesClosedQa, matchesContextFaithfulness, matchesContextRecall, matchesContextRelevance, matchesFactuality, matchesLlmRubric, matchesModeration, matchesSelectBest, matchesSimilarity } from '../matchers';
import { type ApiProvider, type Assertion, type AssertionType, type AtomicTestCase, type CallApiContextParams, type GradingResult } from '../types/index';
import type { ProviderResponse, ScoringFunction } from '../types/index';
export declare const MODEL_GRADED_ASSERTION_TYPES: Set<"moderation" | "cost" | `promptfoo:redteam:${string}` | "factuality" | "answer-relevance" | "bleu" | "classifier" | "contains" | "contains-all" | "contains-any" | "contains-html" | "contains-json" | "contains-sql" | "contains-xml" | "context-faithfulness" | "context-recall" | "context-relevance" | "conversation-relevance" | "equals" | "finish-reason" | "g-eval" | "gleu" | "guardrails" | "icontains" | "icontains-all" | "icontains-any" | "is-html" | "is-json" | "is-refusal" | "is-sql" | "is-valid-function-call" | "is-valid-openai-function-call" | "is-valid-openai-tools-call" | "is-xml" | "javascript" | "latency" | "levenshtein" | "llm-rubric" | "pi" | "meteor" | "model-graded-closedqa" | "model-graded-factuality" | "perplexity" | "perplexity-score" | "python" | "regex" | "rouge-n" | "ruby" | "similar" | "similar:cosine" | "similar:dot" | "similar:euclidean" | "starts-with" | "trace-error-spans" | "trace-span-count" | "trace-span-duration" | "webhook" | "not-moderation" | "not-cost" | "not-factuality" | "not-answer-relevance" | "not-bleu" | "not-classifier" | "not-contains" | "not-contains-all" | "not-contains-any" | "not-contains-html" | "not-contains-json" | "not-contains-sql" | "not-contains-xml" | "not-context-faithfulness" | "not-context-recall" | "not-context-relevance" | "not-conversation-relevance" | "not-equals" | "not-finish-reason" | "not-g-eval" | "not-gleu" | "not-guardrails" | "not-icontains" | "not-icontains-all" | "not-icontains-any" | "not-is-html" | "not-is-json" | "not-is-refusal" | "not-is-sql" | "not-is-valid-function-call" | "not-is-valid-openai-function-call" | "not-is-valid-openai-tools-call" | "not-is-xml" | "not-javascript" | "not-latency" | "not-levenshtein" | "not-llm-rubric" | "not-pi" | "not-meteor" | "not-model-graded-closedqa" | "not-model-graded-factuality" | "not-perplexity" | "not-perplexity-score" | "not-python" | "not-regex" | "not-rouge-n" | "not-ruby" | "not-similar" | "not-similar:cosine" | "not-similar:dot" | "not-similar:euclidean" | "not-starts-with" | "not-trace-error-spans" | "not-trace-span-count" | "not-trace-span-duration" | "not-webhook" | "select-best" | "human" | "max-score">;
/**
 * Tests whether an assertion is inverse e.g. "not-equals" is inverse of "equals"
 * or "not-contains" is inverse of "contains".
 * @param assertion - The assertion to test
 * @returns true if the assertion is inverse, false otherwise
 */
export declare function isAssertionInverse(assertion: Assertion): boolean;
/**
 * Returns the base type of an assertion i.e. "not-equals" returns "equals"
 * and "equals" returns "equals".
 * @param assertion - The assertion to get the base type.
 * @returns The base type of the assertion.
 */
export declare function getAssertionBaseType(assertion: Assertion): AssertionType;
export declare function runAssertion({ prompt, provider, assertion, test, latencyMs, providerResponse, traceId, }: {
    prompt?: string;
    provider?: ApiProvider;
    assertion: Assertion;
    test: AtomicTestCase;
    providerResponse: ProviderResponse;
    latencyMs?: number;
    assertIndex?: number;
    traceId?: string;
}): Promise<GradingResult>;
export declare function runAssertions({ assertScoringFunction, latencyMs, prompt, provider, providerResponse, test, traceId, }: {
    assertScoringFunction?: ScoringFunction;
    latencyMs?: number;
    prompt?: string;
    provider?: ApiProvider;
    providerResponse: ProviderResponse;
    test: AtomicTestCase;
    traceId?: string;
}): Promise<GradingResult>;
export declare function runCompareAssertion(test: AtomicTestCase, assertion: Assertion, outputs: string[], context?: CallApiContextParams): Promise<GradingResult[]>;
export declare function readAssertions(filePath: string): Promise<Assertion[]>;
declare const _default: {
    runAssertion: typeof runAssertion;
    runAssertions: typeof runAssertions;
    matchesSimilarity: typeof matchesSimilarity;
    matchesClassification: typeof matchesClassification;
    matchesLlmRubric: typeof matchesLlmRubric;
    matchesFactuality: typeof matchesFactuality;
    matchesClosedQa: typeof matchesClosedQa;
    matchesAnswerRelevance: typeof matchesAnswerRelevance;
    matchesContextRecall: typeof matchesContextRecall;
    matchesContextRelevance: typeof matchesContextRelevance;
    matchesContextFaithfulness: typeof matchesContextFaithfulness;
    matchesComparisonBoolean: typeof matchesSelectBest;
    matchesModeration: typeof matchesModeration;
    matchesConversationRelevance: typeof matchesConversationRelevance;
};
export default _default;
//# sourceMappingURL=index.d.ts.map