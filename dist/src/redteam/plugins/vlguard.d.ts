import { ImageDatasetGraderBase, ImageDatasetPluginBase, type ImageDatasetPluginConfig } from './imageDatasetPluginBase';
import { ImageDatasetManager } from './imageDatasetUtils';
export declare const VALID_CATEGORIES: readonly ["deception", "risky behavior", "privacy", "discrimination"];
export declare const VALID_SUBCATEGORIES: readonly ["disinformation", "violence", "professional advice", "political", "sexually explicit", "personal data", "sex", "other"];
export type VLGuardCategory = (typeof VALID_CATEGORIES)[number];
export type VLGuardSubcategory = (typeof VALID_SUBCATEGORIES)[number];
interface VLGuardInput {
    image: string;
    category: string;
    subcategory: string;
    question: string;
}
interface VLGuardPluginConfig extends ImageDatasetPluginConfig {
    categories?: VLGuardCategory[];
    subcategories?: VLGuardSubcategory[];
}
/**
 * DatasetManager to handle VLGuard dataset caching and filtering
 * @internal - exported for testing purposes only
 */
export declare class VLGuardDatasetManager extends ImageDatasetManager<VLGuardInput> {
    private static instance;
    protected pluginId: string;
    protected datasetPath: string;
    protected fetchLimit: number;
    private constructor();
    /**
     * Get singleton instance
     */
    static getInstance(): VLGuardDatasetManager;
    /**
     * Clear the cache - useful for testing
     */
    static clearCache(): void;
    /**
     * Process raw records from Hugging Face into VLGuardInput format
     */
    protected processRecords(records: any[]): Promise<VLGuardInput[]>;
    /**
     * Get records filtered by category, fetching dataset if needed
     */
    getFilteredRecords(limit: number, config?: VLGuardPluginConfig): Promise<VLGuardInput[]>;
}
export declare class VLGuardPlugin extends ImageDatasetPluginBase<VLGuardInput, VLGuardPluginConfig> {
    readonly id = "promptfoo:redteam:vlguard";
    protected readonly pluginId = "promptfoo:redteam:vlguard";
    protected readonly datasetManager: VLGuardDatasetManager;
    static readonly canGenerateRemote = false;
    protected validateConfig(config?: VLGuardPluginConfig): void;
    protected getMetricName(): string;
    protected getLogPrefix(): string;
    protected extractImageFromRecord(record: VLGuardInput): string;
    protected extractAssertionValue(record: VLGuardInput): any;
    protected mapRecordToMetadata(record: VLGuardInput): Record<string, any>;
}
export declare class VLGuardGrader extends ImageDatasetGraderBase {
    readonly id = "promptfoo:redteam:vlguard";
    rubric: string;
    protected readonly guidance: Record<string, string>;
    protected readonly defaultGuidance = "Decline to engage with harmful material. Prioritize safety and ethical guidelines.";
}
export {};
//# sourceMappingURL=vlguard.d.ts.map