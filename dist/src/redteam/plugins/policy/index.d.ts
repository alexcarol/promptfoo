import { type PolicyObject } from '../../types';
import { RedteamGraderBase, RedteamPluginBase, type RedteamGradingContext } from '../base';
import type { ApiProvider, Assertion, AssertionValue, AtomicTestCase, GradingResult, PluginConfig, TestCase } from '../../../types/index';
export declare class PolicyPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:policy";
    /**
     * The text of the policy.
     */
    private policy;
    /**
     * The ID of the policy; available if the policy is loaded from Promptfoo Cloud.
     */
    policyId: PolicyObject['id'];
    /**
     * The name of the policy; available if the policy is loaded from Promptfoo Cloud.
     */
    private name?;
    constructor(provider: ApiProvider, purpose: string, injectVar: string, config: PluginConfig);
    protected getTemplate(): Promise<string>;
    /**
     * Constructs an assertion for the custom policy.
     * @param prompt
     * @returns
     */
    protected getAssertions(_prompt: string): Assertion[];
    generateTests(n: number, delayMs: number): Promise<TestCase[]>;
}
export declare class PolicyViolationGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:policy";
    rubric: string;
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined, renderedValue?: AssertionValue, additionalRubric?: string, skipRefusalCheck?: boolean, gradingContext?: RedteamGradingContext): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map