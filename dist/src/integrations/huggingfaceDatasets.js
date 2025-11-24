"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseDatasetPath = parseDatasetPath;
exports.fetchHuggingFaceDataset = fetchHuggingFaceDataset;
const cli_progress_1 = __importDefault(require("cli-progress"));
const dedent_1 = __importDefault(require("dedent"));
const cache_1 = require("../cache");
const cliState_1 = __importDefault(require("../cliState"));
const envars_1 = require("../envars");
const logger_1 = __importDefault(require("../logger"));
/**
 * Safely casts HuggingFace row data to Vars type
 * HuggingFace typically returns string/number/boolean values which are compatible with Vars
 */
function castRowToVars(row) {
    return row;
}
// Constants for performance optimization thresholds
/** Multiplier for increasing page size when rows are small (<256B each) */
const SMALL_ROW_PAGE_SIZE_MULTIPLIER = 1.5;
/** Minimum pages remaining to trigger concurrent fetching */
const CONCURRENT_FETCH_PAGES_THRESHOLD = 2;
/** Progress threshold (80%) below which concurrent fetching is enabled */
const CONCURRENT_FETCH_PROGRESS_THRESHOLD = 0.8;
/** Maximum number of concurrent requests to make */
const MAX_CONCURRENT_REQUESTS = 3;
/** Frequency of progress logging (every N pages) */
const PROGRESS_LOG_FREQUENCY_PAGES = 5;
/**
 * Manages progress bar for HuggingFace dataset downloads
 */
class DatasetProgressBar {
    constructor() {
        this.totalRows = 0;
        this.fetchedRows = 0;
        this.isWebUI = Boolean(cliState_1.default.webUI);
    }
    /**
     * Initialize progress bar for dataset fetching
     */
    initialize(totalRows, userLimit) {
        if (this.isWebUI || (0, envars_1.isCI)()) {
            return;
        }
        this.totalRows = userLimit || totalRows;
        this.fetchedRows = 0;
        // Only show progress bar for datasets with multiple pages (>100 rows)
        if (this.totalRows <= 100) {
            return;
        }
        this.progressBar = new cli_progress_1.default.SingleBar({
            format: 'Downloading dataset [{bar}] {percentage}% | {value}/{total} rows | ETA: {eta}s',
            hideCursor: true,
            stopOnComplete: true,
        }, cli_progress_1.default.Presets.shades_classic);
        this.progressBar.start(this.totalRows, 0);
    }
    /**
     * Update progress with newly fetched rows
     */
    update(newRows) {
        if (this.isWebUI || (0, envars_1.isCI)() || !this.progressBar) {
            return;
        }
        this.fetchedRows += newRows;
        this.progressBar.update(Math.min(this.fetchedRows, this.totalRows));
    }
    /**
     * Complete and stop the progress bar
     */
    stop() {
        if (this.progressBar) {
            this.progressBar.stop();
        }
    }
}
function parseDatasetPath(path) {
    // Remove the huggingface://datasets/ prefix and split into path and query
    const [pathPart, queryPart] = path.replace('huggingface://datasets/', '').split('?');
    const [owner, repo] = pathPart.split('/');
    // Start with default parameters
    const defaultParams = new URLSearchParams({
        split: 'test',
        config: 'default',
    });
    // Parse user query parameters
    const userParams = new URLSearchParams(queryPart || '');
    // Merge user params into defaults (user params override defaults)
    const queryParams = new URLSearchParams();
    for (const [key, value] of defaultParams) {
        queryParams.set(key, value);
    }
    for (const [key, value] of userParams) {
        queryParams.set(key, value);
    }
    return { owner, repo, queryParams };
}
async function fetchHuggingFaceDataset(datasetPath, limit) {
    const baseUrl = 'https://datasets-server.huggingface.co/rows';
    const { owner, repo, queryParams } = parseDatasetPath(datasetPath);
    const tests = [];
    let offset = 0;
    let pageSize = 100; // Number of rows per request (adaptive)
    const queryParamLimit = queryParams.get('limit');
    const userLimit = limit ?? (queryParamLimit ? Number.parseInt(queryParamLimit, 10) : undefined);
    let totalRows;
    // Honor explicit 0 limit and avoid network traffic
    if (userLimit === 0) {
        logger_1.default.debug('[HF Dataset] User-specified limit is 0; returning no test cases');
        return [];
    }
    // Single request optimization for small datasets
    if (userLimit !== undefined && userLimit <= pageSize) {
        logger_1.default.debug(`[HF Dataset] Single request optimization for ${owner}/${repo} (limit: ${userLimit})`);
        // Build single request URL with exact limit needed
        const requestParams = new URLSearchParams(queryParams);
        requestParams.set('offset', '0');
        requestParams.set('length', userLimit.toString());
        const url = `${baseUrl}?dataset=${encodeURIComponent(`${owner}/${repo}`)}&${requestParams.toString()}`;
        // Set up headers for authentication
        const hfToken = (0, envars_1.getEnvString)('HF_TOKEN') ||
            (0, envars_1.getEnvString)('HF_API_TOKEN') ||
            (0, envars_1.getEnvString)('HUGGING_FACE_HUB_TOKEN');
        const headers = {};
        if (hfToken) {
            headers.Authorization = `Bearer ${hfToken}`;
        }
        const response = await (0, cache_1.fetchWithCache)(url, { headers });
        if (response.status < 200 || response.status >= 300) {
            const error = `[HF Dataset] Failed to fetch dataset: ${response.statusText}.\nFetched ${url}`;
            logger_1.default.error(error);
            throw new Error(error);
        }
        const data = response.data;
        const config = queryParams.get('config') || 'default';
        const split = queryParams.get('split') || 'test';
        const cacheStr = response.cached ? ' [cached]' : '';
        logger_1.default.info(`[HF Dataset] ${owner}/${repo} [${split}/${config}]: ${data.num_rows_total} rows (limit: ${userLimit})${cacheStr}`);
        // Convert HuggingFace rows to test cases
        const singleRequestTests = [];
        for (const { row } of data.rows) {
            const test = {
                vars: castRowToVars(row),
                options: {
                    disableVarExpansion: true,
                },
            };
            singleRequestTests.push(test);
        }
        logger_1.default.debug(`[HF Dataset] Successfully loaded ${singleRequestTests.length} test cases`);
        return singleRequestTests;
    }
    // Initialize progress bar for multi-page datasets
    const progressBar = new DatasetProgressBar();
    try {
        while (true) {
            // Create a new URLSearchParams for this request
            const requestParams = new URLSearchParams(queryParams);
            requestParams.set('offset', offset.toString());
            const remainingUserLimit = userLimit !== undefined ? Math.max(userLimit - offset, 0) : undefined;
            const remainingDatasetRows = totalRows !== undefined ? Math.max(totalRows - offset, 0) : undefined;
            const requestedLength = remainingUserLimit !== undefined
                ? Math.min(pageSize, remainingUserLimit)
                : remainingDatasetRows !== undefined
                    ? Math.min(pageSize, remainingDatasetRows)
                    : pageSize;
            if (requestedLength <= 0) {
                logger_1.default.debug(`[HF Dataset] No remaining rows to fetch for ${owner}/${repo} (offset ${offset})`);
                break;
            }
            requestParams.set('length', requestedLength.toString());
            const url = `${baseUrl}?dataset=${encodeURIComponent(`${owner}/${repo}`)}&${requestParams.toString()}`;
            logger_1.default.debug(`[HF Dataset] Fetching page from ${url}`);
            const hfToken = (0, envars_1.getEnvString)('HF_TOKEN') ||
                (0, envars_1.getEnvString)('HF_API_TOKEN') ||
                (0, envars_1.getEnvString)('HUGGING_FACE_HUB_TOKEN');
            const headers = {};
            if (hfToken) {
                logger_1.default.debug('[HF Dataset] Using token for authentication');
                headers.Authorization = `Bearer ${hfToken}`;
            }
            // Use fetchWithCache defaults (30s timeout, json format, 4 retries)
            const response = await (0, cache_1.fetchWithCache)(url, { headers });
            if (response.status < 200 || response.status >= 300) {
                if (response.status === 422) {
                    const previousPageSize = pageSize;
                    pageSize = Math.max(1, Math.floor(pageSize / 2));
                    logger_1.default.warn(`[HF Dataset] ${owner}/${repo}: received 422 Unprocessable Entity at offset ${offset} (requested length ${requestedLength}). Reducing page size from ${previousPageSize} to ${pageSize} and retrying.`);
                    if (pageSize === previousPageSize) {
                        const error = `[HF Dataset] Failed to fetch dataset: ${response.statusText} after reducing page size.\nFetched ${url}`;
                        logger_1.default.error(error);
                        throw new Error(error);
                    }
                    continue;
                }
                const error = `[HF Dataset] Failed to fetch dataset: ${response.statusText}.\nFetched ${url}`;
                logger_1.default.error(error);
                throw new Error(error);
            }
            const data = response.data;
            if (offset === 0) {
                // Smart logging: contextual info with cache status on first successful request
                const config = queryParams.get('config') || 'default';
                const split = queryParams.get('split') || 'test';
                const limitStr = userLimit ? ` (limit: ${userLimit})` : '';
                const cacheStr = response.cached ? ' [cached]' : '';
                logger_1.default.info(`[HF Dataset] ${owner}/${repo} [${split}/${config}]: ${data.num_rows_total} rows${limitStr}${cacheStr}`);
                totalRows = data.num_rows_total;
                // Initialize progress bar now that we know the total row count
                progressBar.initialize(data.num_rows_total, userLimit);
                // Log features at debug level
                logger_1.default.debug(`[HF Dataset] Dataset features: ${JSON.stringify(data.features)}`);
                logger_1.default.debug((0, dedent_1.default) `[HF Dataset] Using query parameters:
        ${Object.fromEntries(queryParams)}`);
                // Memory-aware adaptive page sizing based on actual row size
                if (data.rows.length > 0) {
                    const avgRowSize = JSON.stringify(data.rows).length / data.rows.length;
                    const previousPageSize = pageSize;
                    if (avgRowSize > 2048) {
                        // Large rows (>2KB each)
                        pageSize = Math.max(25, Math.min(pageSize, 50)); // Reduce to 25-50 rows
                    }
                    else if (avgRowSize > 1024) {
                        // Medium rows (>1KB each)
                        pageSize = Math.max(50, Math.min(pageSize, 75)); // Reduce to 50-75 rows
                    }
                    else if (avgRowSize < 256) {
                        // Small rows (<256B each)
                        pageSize = Math.min(200, Math.round(pageSize * SMALL_ROW_PAGE_SIZE_MULTIPLIER)); // Can increase to up to 200 rows
                    }
                    if (pageSize !== previousPageSize) {
                        logger_1.default.debug(`[HF Dataset] Adjusted page size from ${previousPageSize} to ${pageSize} (avg row: ${Math.round(avgRowSize)}B)`);
                    }
                }
                // Update progress with first batch of rows
                progressBar.update(data.rows.length);
            }
            else {
                // Update progress for subsequent pages
                progressBar.update(data.rows.length);
                // Progress logging for subsequent pages (debug level)
                logger_1.default.debug(`[HF Dataset] Received ${data.rows.length} rows (${tests.length + data.rows.length}/${userLimit || data.num_rows_total})`);
                if (totalRows === undefined) {
                    totalRows = data.num_rows_total;
                }
            }
            // Convert HuggingFace rows to test cases
            for (const { row } of data.rows) {
                const test = {
                    vars: castRowToVars(row),
                    options: {
                        disableVarExpansion: true,
                    },
                };
                tests.push(test);
            }
            // Check if we've reached user's limit or end of dataset
            if (userLimit && tests.length >= userLimit) {
                logger_1.default.debug(`[HF Dataset] Reached user-specified limit of ${userLimit}`);
                break;
            }
            // Check if we've fetched all rows
            if (offset + data.rows.length >= data.num_rows_total) {
                logger_1.default.debug(`[HF Dataset] Finished fetching all rows`);
                break;
            }
            offset += data.rows.length;
            // Concurrent fetching optimization for large datasets
            const totalNeeded = userLimit || data.num_rows_total;
            const remainingRows = totalNeeded - tests.length;
            const pagesRemaining = Math.ceil(remainingRows / pageSize);
            if (pagesRemaining > CONCURRENT_FETCH_PAGES_THRESHOLD &&
                tests.length < totalNeeded * CONCURRENT_FETCH_PROGRESS_THRESHOLD) {
                // Still have significant work left
                const maxConcurrent = Math.min(MAX_CONCURRENT_REQUESTS, pagesRemaining);
                const concurrentPromises = [];
                for (let i = 1; i < maxConcurrent; i++) {
                    // Start from next page
                    const futureOffset = offset + i * pageSize;
                    const futureParams = new URLSearchParams(queryParams);
                    futureParams.set('offset', futureOffset.toString());
                    futureParams.set('length', Math.min(pageSize, totalNeeded - futureOffset).toString());
                    const futureUrl = `${baseUrl}?dataset=${encodeURIComponent(`${owner}/${repo}`)}&${futureParams.toString()}`;
                    concurrentPromises.push((0, cache_1.fetchWithCache)(futureUrl, { headers })
                        .then((resp) => ({
                        offset: futureOffset,
                        response: resp,
                        success: resp.status >= 200 && resp.status < 300,
                    }))
                        .catch((err) => ({
                        offset: futureOffset,
                        response: null,
                        success: false,
                        error: err,
                    })));
                }
                if (concurrentPromises.length > 0) {
                    logger_1.default.debug(`[HF Dataset] Fetching ${concurrentPromises.length} pages concurrently`);
                    const concurrentResults = await Promise.allSettled(concurrentPromises);
                    // Process concurrent results in order
                    let concurrentRowCount = 0;
                    for (const result of concurrentResults) {
                        if (result.status === 'fulfilled' && result.value.success) {
                            const concurrentData = result.value.response.data;
                            if (totalRows === undefined && typeof concurrentData.num_rows_total === 'number') {
                                totalRows = concurrentData.num_rows_total;
                            }
                            for (const { row } of concurrentData.rows) {
                                if (tests.length >= totalNeeded) {
                                    break;
                                }
                                tests.push({
                                    vars: castRowToVars(row),
                                    options: { disableVarExpansion: true },
                                });
                                concurrentRowCount++;
                            }
                        }
                    }
                    // Update progress with concurrent results
                    progressBar.update(concurrentRowCount);
                    // Skip ahead by the actual number of rows fetched concurrently
                    offset += concurrentRowCount;
                    logger_1.default.debug(`[HF Dataset] Processed ${concurrentPromises.length} concurrent pages, now at offset ${offset}`);
                }
            }
            // Progress logging for large datasets (every PROGRESS_LOG_FREQUENCY_PAGES pages)
            if (offset > 0 && offset % (pageSize * PROGRESS_LOG_FREQUENCY_PAGES) === 0) {
                const progress = Math.round((tests.length / (userLimit || data.num_rows_total)) * 100);
                logger_1.default.info(`[HF Dataset] ${owner}/${repo}: ${progress}% (${tests.length}/${userLimit || data.num_rows_total} rows)`);
            }
            else {
                logger_1.default.debug(`[HF Dataset] Fetching next page starting at offset ${offset}`);
            }
        }
        // Stop the progress bar
        progressBar.stop();
        // If user specified a limit, ensure we don't return more than that
        const finalTests = userLimit ? tests.slice(0, userLimit) : tests;
        logger_1.default.debug(`[HF Dataset] Successfully loaded ${finalTests.length} test cases`);
        return finalTests;
    }
    catch (error) {
        // Ensure progress bar is stopped even if an error occurs
        progressBar.stop();
        throw error;
    }
}
//# sourceMappingURL=huggingfaceDatasets.js.map