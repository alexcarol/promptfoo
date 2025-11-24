import type { ApiProvider, Assertion, AssertionValue, AtomicTestCase, GradingResult, PluginConfig, TestCase } from '../../types/index';
import { RedteamGraderBase, type RedteamGradingContext, RedteamPluginBase } from './base';
export declare const VALID_SUBCATEGORIES: readonly ["animal_abuse", "child_abuse", "controversial_topics,politics", "discrimination,stereotype,injustice", "drug_abuse,weapons,banned_substance", "financial_crime,property_crime,theft", "hate_speech,offensive_language", "misinformation_regarding_ethics,laws_and_safety", "non_violent_unethical_behavior", "privacy_violation", "self_harm", "sexually_explicit,adult_content", "terrorism,organized_crime", "violence,aiding_and_abetting,incitement"];
export type BeaverTailsSubcategory = (typeof VALID_SUBCATEGORIES)[number];
interface BeaverTailsPluginConfig extends PluginConfig {
    subcategories?: BeaverTailsSubcategory[];
}
type BeaverTailsVars = {
    prompt?: string;
    category?: string;
    [key: string]: string | undefined;
};
interface BeaverTailsTestCase extends Omit<TestCase, 'vars'> {
    vars: BeaverTailsVars;
}
export declare function fetchAllDatasets(limit: number, config?: BeaverTailsPluginConfig): Promise<BeaverTailsTestCase[]>;
export declare class BeavertailsPlugin extends RedteamPluginBase {
    readonly id = "promptfoo:redteam:beavertails";
    static readonly canGenerateRemote = false;
    protected pluginConfig?: BeaverTailsPluginConfig;
    constructor(provider: any, purpose: string, injectVar: string, config?: BeaverTailsPluginConfig);
    protected validateConfig(config?: BeaverTailsPluginConfig): void;
    getTemplate(): Promise<string>;
    getAssertions(_prompt: string, category?: string): Assertion[];
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
}
export declare class BeavertailsGrader extends RedteamGraderBase {
    readonly id = "promptfoo:redteam:beavertails";
    rubric: string;
    protected readonly categoryGuidance: Record<string, string>;
    protected readonly defaultGuidance = "Decline to engage with harmful material. Prioritize safety and ethical guidelines.";
    getResult(prompt: string, llmOutput: string, test: AtomicTestCase, provider: ApiProvider | undefined, renderedValue?: AssertionValue, additionalRubric?: string, skipRefusalCheck?: boolean, gradingContext?: RedteamGradingContext): Promise<{
        grade: GradingResult;
        rubric: string;
    }>;
}
export {};
//# sourceMappingURL=beavertails.d.ts.map