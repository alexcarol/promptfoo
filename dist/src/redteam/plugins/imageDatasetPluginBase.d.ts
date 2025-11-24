import { RedteamGraderBase, RedteamPluginBase } from './base';
import { ImageDatasetManager } from './imageDatasetUtils';
import type { Assertion, AtomicTestCase, PluginConfig, TestCase } from '../../types/index';
/**
 * Configuration for image dataset plugins
 */
export interface ImageDatasetPluginConfig extends PluginConfig {
    categories?: string[];
    subcategories?: string[];
}
/**
 * Base class for image dataset plugins (VLGuard, UnsafeBench, etc.)
 */
export declare abstract class ImageDatasetPluginBase<TInput, TConfig extends ImageDatasetPluginConfig = ImageDatasetPluginConfig> extends RedteamPluginBase {
    protected abstract readonly pluginId: string;
    protected abstract readonly datasetManager: ImageDatasetManager<TInput>;
    protected pluginConfig?: TConfig;
    constructor(provider: any, purpose: string, injectVar: string, config?: TConfig);
    /**
     * Validate plugin configuration
     * Override in subclasses to add specific validation
     */
    protected validateConfig(_config?: TConfig): void;
    /**
     * Get the template for the plugin
     */
    getTemplate(): Promise<string>;
    /**
     * Get assertions for a test case
     */
    protected getAssertions(_prompt: string): Assertion[];
    /**
     * Get the metric name for assertions
     * Override if different from plugin name
     */
    protected abstract getMetricName(): string;
    /**
     * Map a record to test case metadata
     */
    protected abstract mapRecordToMetadata(record: TInput): Record<string, any>;
    /**
     * Extract the image data from a record
     */
    protected abstract extractImageFromRecord(record: TInput): string;
    /**
     * Extract assertion value from a record
     */
    protected abstract extractAssertionValue(record: TInput): any;
    /**
     * Generate test cases
     */
    generateTests(n: number, _delayMs?: number): Promise<TestCase[]>;
    /**
     * Get the log prefix for this plugin
     */
    protected abstract getLogPrefix(): string;
    /**
     * Get the error message when no records are found
     */
    protected getNoRecordsErrorMessage(): string;
}
/**
 * Base class for image dataset graders with category guidance
 */
export declare abstract class ImageDatasetGraderBase extends RedteamGraderBase {
    protected abstract readonly guidance: Record<string, string>;
    protected abstract readonly defaultGuidance: string;
    /**
     * Get the category from test metadata
     */
    protected getCategoryFromTest(test: AtomicTestCase): string;
    /**
     * Get the subcategory from test metadata
     */
    protected getSubcategoryFromTest(test: AtomicTestCase): string;
    /**
     * Get guidance for a specific category or subcategory
     */
    protected getGuidance(category: string, subcategory?: string): string;
    /**
     * Generate the rubric for a test
     */
    getRubricForTest(test: AtomicTestCase): string;
    /**
     * Format the rubric string
     * Override in subclasses for custom formatting
     */
    protected formatRubric(category: string, subcategory: string, guidance: string): string;
}
//# sourceMappingURL=imageDatasetPluginBase.d.ts.map