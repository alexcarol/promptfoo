"use strict";
/**
 * HuggingFace metadata utilities for fetching model revision information.
 * Used for deduplication of model scans.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isHuggingFaceModel = isHuggingFaceModel;
exports.parseHuggingFaceModel = parseHuggingFaceModel;
exports.fetchHuggingFaceMetadata = fetchHuggingFaceMetadata;
exports.getHuggingFaceMetadata = getHuggingFaceMetadata;
const cache_1 = require("../cache");
const logger_1 = __importDefault(require("../logger"));
/**
 * Check if a path is a HuggingFace model reference
 * @param path - Model path to check
 * @returns true if path refers to a HuggingFace model
 */
function isHuggingFaceModel(path) {
    return (path.startsWith('hf://') ||
        path.startsWith('https://huggingface.co/') ||
        path.startsWith('https://hf.co/'));
}
/**
 * Parse HuggingFace model path into owner and repo
 * @param path - HuggingFace model path (hf://owner/repo or https://huggingface.co/owner/repo)
 * @returns Object with owner and repo, or null if not a valid HuggingFace path
 */
function parseHuggingFaceModel(path) {
    // Handle hf:// protocol
    if (path.startsWith('hf://')) {
        const parts = path.slice(5).split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    // Handle https://huggingface.co/ URLs
    if (path.startsWith('https://huggingface.co/')) {
        const parts = path.slice(23).split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    // Handle https://hf.co/ URLs (short form)
    if (path.startsWith('https://hf.co/')) {
        const parts = path.slice(14).split('/');
        if (parts.length >= 2) {
            return { owner: parts[0], repo: parts[1] };
        }
    }
    return null;
}
/**
 * Fetch metadata from HuggingFace Hub API
 * @param modelId - Model ID in format "owner/repo" (e.g., "meta-llama/Llama-2-7b-hf")
 * @returns HuggingFace metadata including Git SHA and last modified time
 * @throws Error if API request fails or model not found
 */
async function fetchHuggingFaceMetadata(modelId) {
    const url = `https://huggingface.co/api/models/${modelId}`;
    try {
        logger_1.default.debug(`Fetching HuggingFace metadata for ${modelId}`);
        const response = await (0, cache_1.fetchWithCache)(url, {
            method: 'GET',
            headers: {
                'User-Agent': 'promptfoo-cli',
            },
        }, 10000, // 10 second timeout
        'json');
        if (response.status !== 200) {
            throw new Error(`HuggingFace API returned status ${response.status}: ${response.statusText}`);
        }
        const data = response.data;
        // Extract SHA from the API response
        // HuggingFace API returns sha in the root level
        if (!data.sha) {
            throw new Error('HuggingFace API response missing sha field');
        }
        // Extract author (owner)
        const author = data.author || modelId.split('/')[0];
        // Extract last modified time
        const lastModified = data.lastModified || new Date().toISOString();
        return {
            sha: data.sha,
            lastModified,
            author,
            modelId,
        };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger_1.default.warn(`Failed to fetch HuggingFace metadata for ${modelId}: ${message}`);
        throw new Error(`Failed to fetch HuggingFace metadata: ${message}`);
    }
}
/**
 * Get metadata from HuggingFace model path
 * @param modelPath - HuggingFace model path (hf://owner/repo or https://huggingface.co/owner/repo)
 * @returns HuggingFace metadata or null if not a HuggingFace model
 */
async function getHuggingFaceMetadata(modelPath) {
    if (!isHuggingFaceModel(modelPath)) {
        return null;
    }
    const parsed = parseHuggingFaceModel(modelPath);
    if (!parsed) {
        logger_1.default.warn(`Failed to parse HuggingFace model path: ${modelPath}`);
        return null;
    }
    const modelId = `${parsed.owner}/${parsed.repo}`;
    return await fetchHuggingFaceMetadata(modelId);
}
//# sourceMappingURL=huggingfaceMetadata.js.map