/**
 * Fetches an image from a URL and converts it to base64
 * @param url - The URL of the image to fetch
 * @param pluginId - The plugin ID for logging purposes
 * @returns Base64 encoded image with data URI prefix, or null on failure
 */
export declare function fetchImageAsBase64(url: string, pluginId: string): Promise<string | null>;
/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * @param array - Array to shuffle
 * @returns Shuffled array (mutates in place and returns same array)
 */
export declare function fisherYatesShuffle<T>(array: T[]): T[];
/**
 * Type guard for object with src property
 */
export declare function hasStringSrc(obj: unknown): obj is {
    src: string;
};
/**
 * Type guard for object with bytes property
 */
export declare function hasBytes(obj: unknown): obj is {
    bytes: unknown;
};
/**
 * Safe string field getter with default value
 */
export declare function getStringField(field: unknown, defaultValue?: string): string;
/**
 * Process image data from various formats to base64
 * @param imageData - The image data (URL, base64, object with src, or bytes)
 * @param pluginId - The plugin ID for logging purposes
 * @returns Base64 encoded image with data URI prefix, or null on failure
 */
export declare function processImageData(imageData: unknown, pluginId: string): Promise<string | null>;
/**
 * Base class for image dataset managers with caching
 */
export declare abstract class ImageDatasetManager<T> {
    protected datasetCache: T[] | null;
    protected abstract pluginId: string;
    protected abstract datasetPath: string;
    protected abstract fetchLimit: number;
    /**
     * Ensure the dataset is loaded into cache
     */
    protected ensureDatasetLoaded(): Promise<void>;
    /**
     * Process raw records from Hugging Face into the desired format
     * Must be implemented by subclasses
     */
    protected abstract processRecords(records: any[]): Promise<T[]>;
    /**
     * Get filtered records based on plugin configuration
     * Must be implemented by subclasses
     */
    abstract getFilteredRecords(limit: number, config?: any): Promise<T[]>;
    /**
     * Clear the cache - useful for testing
     */
    clearCache(): void;
}
//# sourceMappingURL=imageDatasetUtils.d.ts.map