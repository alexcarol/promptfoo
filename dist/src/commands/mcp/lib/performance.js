"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configCache = exports.evaluationCache = exports.BatchProcessor = exports.EvaluationCache = void 0;
exports.paginate = paginate;
exports.streamProcess = streamProcess;
const lru_cache_1 = require("lru-cache");
/**
 * Performance utilities for MCP server operations
 */
/**
 * Simple in-memory cache for evaluation results
 */
class EvaluationCache {
    constructor(maxSize = 100, ttlMs = 5 * 60 * 1000) {
        // 5 minutes default
        this.cache = new lru_cache_1.LRUCache({
            max: maxSize,
            ttl: ttlMs,
        });
    }
    get(key) {
        return this.cache.get(key);
    }
    set(key, value) {
        this.cache.set(key, value);
    }
    has(key) {
        return this.cache.has(key);
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        return {
            size: this.cache.size,
            calculatedSize: this.cache.calculatedSize,
        };
    }
}
exports.EvaluationCache = EvaluationCache;
function paginate(items, options = {}) {
    const { page = 1, pageSize = 20, maxPageSize = 100 } = options;
    // Validate and constrain parameters
    const validPageSize = Math.min(Math.max(1, pageSize), maxPageSize);
    const validPage = Math.max(1, page);
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / validPageSize);
    const startIndex = (validPage - 1) * validPageSize;
    const endIndex = startIndex + validPageSize;
    return {
        data: items.slice(startIndex, endIndex),
        pagination: {
            page: validPage,
            pageSize: validPageSize,
            totalItems,
            totalPages,
            hasNextPage: validPage < totalPages,
            hasPreviousPage: validPage > 1,
        },
    };
}
/**
 * Batch processor for handling multiple operations efficiently
 */
class BatchProcessor {
    constructor(processor, batchSize = 10, delayMs = 100) {
        this.processor = processor;
        this.batchSize = batchSize;
        this.delayMs = delayMs;
        this.queue = [];
        this.processing = false;
    }
    async add(item) {
        return new Promise((resolve, reject) => {
            this.queue.push({ item, resolve, reject });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        // Wait for more items or process immediately if batch is full
        if (this.queue.length < this.batchSize) {
            await new Promise((resolve) => setTimeout(resolve, this.delayMs));
        }
        // Process batch
        const batch = this.queue.splice(0, this.batchSize);
        const items = batch.map((b) => b.item);
        try {
            const results = await this.processor(items);
            batch.forEach((b, i) => b.resolve(results[i]));
        }
        catch (error) {
            batch.forEach((b) => b.reject(error));
        }
        this.processing = false;
        // Continue processing if more items
        if (this.queue.length > 0) {
            this.processQueue();
        }
    }
}
exports.BatchProcessor = BatchProcessor;
/**
 * Stream processor for handling large datasets
 */
async function* streamProcess(items, processor, concurrency = 5) {
    const executing = [];
    for (const item of items) {
        const promise = processor(item);
        executing.push(promise);
        if (executing.length >= concurrency) {
            yield await Promise.race(executing);
            const index = executing.findIndex((p) => p === promise);
            executing.splice(index, 1);
        }
    }
    // Yield remaining results
    while (executing.length > 0) {
        yield await Promise.race(executing);
        executing.shift();
    }
}
/**
 * Default cache instances
 */
exports.evaluationCache = new EvaluationCache();
exports.configCache = new EvaluationCache(50, 10 * 60 * 1000); // 10 minutes for configs
//# sourceMappingURL=performance.js.map