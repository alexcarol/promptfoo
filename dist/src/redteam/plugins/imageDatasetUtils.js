"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageDatasetManager = void 0;
exports.fetchImageAsBase64 = fetchImageAsBase64;
exports.fisherYatesShuffle = fisherYatesShuffle;
exports.hasStringSrc = hasStringSrc;
exports.hasBytes = hasBytes;
exports.getStringField = getStringField;
exports.processImageData = processImageData;
const index_1 = require("../../util/fetch/index");
const huggingfaceDatasets_1 = require("../../integrations/huggingfaceDatasets");
const logger_1 = __importDefault(require("../../logger"));
/**
 * Detect image format from buffer
 */
function detectImageFormat(buffer) {
    // Check JPEG signature
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        return 'image/jpeg';
    }
    // Check PNG signature
    if (buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a) {
        return 'image/png';
    }
    // Check GIF signature
    if (buffer.length >= 6 &&
        ((buffer[0] === 0x47 &&
            buffer[1] === 0x49 &&
            buffer[2] === 0x46 &&
            buffer[3] === 0x38 &&
            buffer[4] === 0x37 &&
            buffer[5] === 0x61) ||
            (buffer[0] === 0x47 &&
                buffer[1] === 0x49 &&
                buffer[2] === 0x46 &&
                buffer[3] === 0x38 &&
                buffer[4] === 0x39 &&
                buffer[5] === 0x61))) {
        return 'image/gif';
    }
    // Check WebP signature
    if (buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50) {
        return 'image/webp';
    }
    // Default to JPEG for unknown formats
    return 'image/jpeg';
}
/**
 * Fetches an image from a URL and converts it to base64
 * @param url - The URL of the image to fetch
 * @param pluginId - The plugin ID for logging purposes
 * @returns Base64 encoded image with data URI prefix, or null on failure
 */
async function fetchImageAsBase64(url, pluginId) {
    try {
        logger_1.default.debug(`[${pluginId}] Fetching image from URL`);
        const response = await (0, index_1.fetchWithProxy)(url);
        if (!response.ok) {
            logger_1.default.warn(`[${pluginId}] Failed to fetch image: ${response.statusText}`);
            return null;
        }
        // Get image as array buffer
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        // Convert to base64
        const base64 = buffer.toString('base64');
        // Determine MIME type from response headers or detect from buffer
        let contentType = response.headers.get('content-type');
        if (!contentType || contentType === 'binary/octet-stream') {
            contentType = detectImageFormat(buffer);
        }
        return `data:${contentType};base64,${base64}`;
    }
    catch (error) {
        logger_1.default.error(`[${pluginId}] Error fetching image: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
/**
 * Fisher-Yates shuffle algorithm for unbiased randomization
 * @param array - Array to shuffle
 * @returns Shuffled array (mutates in place and returns same array)
 */
function fisherYatesShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
/**
 * Type guard for object with src property
 */
function hasStringSrc(obj) {
    return (typeof obj === 'object' && obj !== null && 'src' in obj && typeof obj.src === 'string');
}
/**
 * Type guard for object with bytes property
 */
function hasBytes(obj) {
    return typeof obj === 'object' && obj !== null && 'bytes' in obj;
}
/**
 * Safe string field getter with default value
 */
function getStringField(field, defaultValue = '') {
    return typeof field === 'string' ? field : defaultValue;
}
/**
 * Process image data from various formats to base64
 * @param imageData - The image data (URL, base64, object with src, or bytes)
 * @param pluginId - The plugin ID for logging purposes
 * @returns Base64 encoded image with data URI prefix, or null on failure
 */
async function processImageData(imageData, pluginId) {
    if (typeof imageData === 'string') {
        if (imageData.startsWith('http')) {
            // It's a URL, download and convert to base64
            return await fetchImageAsBase64(imageData, pluginId);
        }
        else {
            // It's already a suitable string (base64 or data URI)
            return imageData;
        }
    }
    else if (hasStringSrc(imageData)) {
        // It's an object with an image URL
        logger_1.default.debug(`[${pluginId}] Found image URL from src property`);
        return await fetchImageAsBase64(imageData.src, pluginId);
    }
    else if (hasBytes(imageData)) {
        // Handle bytes format (common in Hugging Face datasets)
        const bytes = imageData.bytes;
        let base64Image;
        if (typeof bytes === 'string') {
            // If bytes is already a base64 string - decode it to detect format
            const buffer = Buffer.from(bytes, 'base64');
            const mimeType = detectImageFormat(buffer);
            base64Image = `data:${mimeType};base64,${bytes}`;
        }
        else if (bytes instanceof Buffer) {
            // If bytes is a Buffer - detect format from buffer
            const mimeType = detectImageFormat(bytes);
            base64Image = `data:${mimeType};base64,${bytes.toString('base64')}`;
        }
        else {
            logger_1.default.warn(`[${pluginId}] Unsupported bytes format for image`);
            return null;
        }
        return base64Image;
    }
    else {
        logger_1.default.warn(`[${pluginId}] Invalid image format`);
        return null;
    }
}
/**
 * Base class for image dataset managers with caching
 */
class ImageDatasetManager {
    constructor() {
        this.datasetCache = null;
    }
    /**
     * Ensure the dataset is loaded into cache
     */
    async ensureDatasetLoaded() {
        if (this.datasetCache !== null) {
            logger_1.default.debug(`[${this.pluginId}] Using cached dataset with ${this.datasetCache.length} records`);
            return;
        }
        logger_1.default.debug(`[${this.pluginId}] Fetching ${this.fetchLimit} records from dataset`);
        try {
            const records = await (0, huggingfaceDatasets_1.fetchHuggingFaceDataset)(this.datasetPath, this.fetchLimit);
            if (!records || records.length === 0) {
                throw new Error(`No records returned from dataset. Check your Hugging Face API token.`);
            }
            logger_1.default.debug(`[${this.pluginId}] Fetched ${records.length} total records`);
            // Process records - to be implemented by subclass
            this.datasetCache = await this.processRecords(records);
            logger_1.default.debug(`[${this.pluginId}] Cached ${this.datasetCache.length} processed records`);
        }
        catch (error) {
            logger_1.default.error(`[${this.pluginId}] Error fetching dataset: ${error instanceof Error ? error.message : String(error)}`);
            throw new Error(`Failed to fetch dataset: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    /**
     * Clear the cache - useful for testing
     */
    clearCache() {
        this.datasetCache = null;
    }
}
exports.ImageDatasetManager = ImageDatasetManager;
//# sourceMappingURL=imageDatasetUtils.js.map