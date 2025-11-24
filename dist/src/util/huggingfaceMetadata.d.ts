/**
 * HuggingFace metadata utilities for fetching model revision information.
 * Used for deduplication of model scans.
 */
/**
 * HuggingFace model metadata containing revision information
 */
export interface HuggingFaceMetadata {
    /** Git SHA-1 of the model revision (40-character hex string) */
    sha: string;
    /** Last modified timestamp in ISO 8601 format */
    lastModified: string;
    /** Model author/organization */
    author: string;
    /** Model ID (e.g., "meta-llama/Llama-2-7b-hf") */
    modelId: string;
}
/**
 * Check if a path is a HuggingFace model reference
 * @param path - Model path to check
 * @returns true if path refers to a HuggingFace model
 */
export declare function isHuggingFaceModel(path: string): boolean;
/**
 * Parse HuggingFace model path into owner and repo
 * @param path - HuggingFace model path (hf://owner/repo or https://huggingface.co/owner/repo)
 * @returns Object with owner and repo, or null if not a valid HuggingFace path
 */
export declare function parseHuggingFaceModel(path: string): {
    owner: string;
    repo: string;
} | null;
/**
 * Fetch metadata from HuggingFace Hub API
 * @param modelId - Model ID in format "owner/repo" (e.g., "meta-llama/Llama-2-7b-hf")
 * @returns HuggingFace metadata including Git SHA and last modified time
 * @throws Error if API request fails or model not found
 */
export declare function fetchHuggingFaceMetadata(modelId: string): Promise<HuggingFaceMetadata>;
/**
 * Get metadata from HuggingFace model path
 * @param modelPath - HuggingFace model path (hf://owner/repo or https://huggingface.co/owner/repo)
 * @returns HuggingFace metadata or null if not a HuggingFace model
 */
export declare function getHuggingFaceMetadata(modelPath: string): Promise<HuggingFaceMetadata | null>;
//# sourceMappingURL=huggingfaceMetadata.d.ts.map