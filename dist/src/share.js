"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSharingEnabled = isSharingEnabled;
exports.isModelAuditSharingEnabled = isModelAuditSharingEnabled;
exports.determineShareDomain = determineShareDomain;
exports.stripAuthFromUrl = stripAuthFromUrl;
exports.getShareableUrl = getShareableUrl;
exports.createShareableUrl = createShareableUrl;
exports.hasEvalBeenShared = hasEvalBeenShared;
exports.hasModelAuditBeenShared = hasModelAuditBeenShared;
exports.createShareableModelAuditUrl = createShareableModelAuditUrl;
exports.getShareableModelAuditUrl = getShareableModelAuditUrl;
const url_1 = require("url");
const input_1 = __importDefault(require("@inquirer/input"));
const chalk_1 = __importDefault(require("chalk"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const constants_1 = require("./constants");
const envars_1 = require("./envars");
const accounts_1 = require("./globalConfig/accounts");
const cloud_1 = require("./globalConfig/cloud");
const logger_1 = __importStar(require("./logger"));
const cloud_2 = require("./util/cloud");
const index_1 = require("./util/fetch/index");
function isSharingEnabled(evalRecord) {
    const sharingConfigOnEval = typeof evalRecord.config.sharing === 'object' ? evalRecord.config.sharing.apiBaseUrl : null;
    const sharingEnvUrl = (0, constants_1.getShareApiBaseUrl)();
    const cloudSharingUrl = cloud_1.cloudConfig.isEnabled() ? cloud_1.cloudConfig.getApiHost() : null;
    if (sharingConfigOnEval) {
        return true;
    }
    if (sharingEnvUrl && !sharingEnvUrl.includes('api.promptfoo.app')) {
        return true;
    }
    if (cloudSharingUrl) {
        return true;
    }
    return false;
}
function isModelAuditSharingEnabled() {
    // Model audit sharing uses the same configuration as eval sharing
    const sharingEnvUrl = (0, constants_1.getShareApiBaseUrl)();
    const cloudSharingUrl = cloud_1.cloudConfig.isEnabled() ? cloud_1.cloudConfig.getApiHost() : null;
    if (sharingEnvUrl && !sharingEnvUrl.includes('api.promptfoo.app')) {
        return true;
    }
    if (cloudSharingUrl) {
        return true;
    }
    return false;
}
function determineShareDomain(eval_) {
    const sharing = eval_.config.sharing;
    logger_1.default.debug(`Share config: isCloudEnabled=${cloud_1.cloudConfig.isEnabled()}, sharing=${JSON.stringify(sharing)}, evalId=${eval_.id}`);
    const isPublicShare = !cloud_1.cloudConfig.isEnabled() && (!sharing || sharing === true || !('appBaseUrl' in sharing));
    const envAppBaseUrl = (0, envars_1.getEnvString)('PROMPTFOO_REMOTE_APP_BASE_URL');
    const domain = isPublicShare
        ? envAppBaseUrl || (0, constants_1.getDefaultShareViewBaseUrl)()
        : cloud_1.cloudConfig.isEnabled()
            ? cloud_1.cloudConfig.getAppUrl()
            : typeof sharing === 'object' && sharing.appBaseUrl
                ? sharing.appBaseUrl
                : envAppBaseUrl || (0, constants_1.getDefaultShareViewBaseUrl)();
    logger_1.default.debug(`Share domain determined: domain=${domain}, isPublic=${isPublicShare}`);
    return { domain, isPublicShare };
}
// Helper functions
function getResultSize(result) {
    return Buffer.byteLength(JSON.stringify(result), 'utf8');
}
function findLargestResultSize(results, sampleSize = 1000) {
    // Get the result size of the first sampleSize results
    const sampleSizes = results.slice(0, Math.min(sampleSize, results.length)).map(getResultSize);
    // find the largest result size
    const maxSize = Math.max(...sampleSizes);
    // return the largest result size
    return maxSize;
}
// This sends the eval record to the remote server
async function sendEvalRecord(evalRecord, url, headers) {
    const evalDataWithoutResults = { ...evalRecord, results: [] };
    const jsonData = JSON.stringify(evalDataWithoutResults);
    logger_1.default.debug(`Sending initial eval data to ${url} - eval ${evalRecord.id} with ${evalRecord.prompts.length} prompts`);
    const response = await (0, index_1.fetchWithProxy)(url, {
        method: 'POST',
        headers,
        body: jsonData,
        compress: true,
    });
    if (!response.ok) {
        const responseBody = await response.text();
        // Ensure full error is visible by formatting it properly
        const errorMessage = `Failed to send initial eval data to ${url}: ${response.statusText}`;
        const bodyMessage = responseBody ? `\nResponse body: ${responseBody}` : '';
        const debugInfo = {
            url,
            statusCode: response.status,
            statusText: response.statusText,
            headers: Object.keys(headers),
            evalId: evalRecord.id,
            errorMessage,
            bodyMessage,
        };
        logger_1.default.error(`Sharing your eval data to ${url} failed. Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
        throw new Error(`${errorMessage}${bodyMessage}`);
    }
    const responseJson = await response.json();
    if (!responseJson.id) {
        throw new Error(`Failed to send initial eval data to ${url}: ${response.statusText} ${responseJson}`);
    }
    return responseJson.id;
}
async function sendChunkOfResults(chunk, url, evalId, headers) {
    const targetUrl = `${url}/${evalId}/results`;
    const stringifiedChunk = JSON.stringify(chunk);
    const chunkSizeBytes = Buffer.byteLength(stringifiedChunk, 'utf8');
    logger_1.default.debug(`Sending chunk of ${chunk.length} results to ${targetUrl}`);
    const response = await (0, index_1.fetchWithProxy)(targetUrl, {
        method: 'POST',
        headers,
        body: stringifiedChunk,
        compress: true,
    });
    if (!response.ok) {
        const responseBody = await response.text();
        const debugInfo = {
            url: targetUrl,
            statusCode: response.status,
            statusText: response.statusText,
            chunkSize: chunk.length,
            chunkSizeBytes,
            chunkSizeMB: (chunkSizeBytes / 1024 / 1024).toFixed(2),
            headers: Object.keys(headers),
            evalId,
            responseBody: responseBody.length > 500 ? `${responseBody.slice(0, 500)}...` : responseBody,
        };
        logger_1.default.error(`Failed to send results chunk to ${targetUrl}: status code: ${response.status}, status text: ${response.statusText}, body: ${responseBody}`);
        logger_1.default.error(`Debug info: ${JSON.stringify(debugInfo, null, 2)}`);
        if (response.status === 413) {
            throw new Error(`Results chunk too large. It contained ${stringifiedChunk.length} bytes (${(chunkSizeBytes / 1024 / 1024).toFixed(2)} MB). Please reduce the number of results per chunk using the environment variable PROMPTFOO_SHARE_CHUNK_SIZE. Example: PROMPTFOO_SHARE_CHUNK_SIZE=10 promptfoo share`);
        }
        throw new Error(`Failed to send results chunk to ${targetUrl}. Status: ${response.status} ${response.statusText}. Chunk size: ${chunk.length} results (${(chunkSizeBytes / 1024 / 1024).toFixed(2)} MB). See debug logs for more details.`);
    }
}
async function rollbackEval(url, evalId, headers) {
    const targetUrl = `${url}/${evalId}`;
    logger_1.default.debug(`Attempting to roll back eval ${evalId} at ${targetUrl}`);
    try {
        const response = await (0, index_1.fetchWithProxy)(targetUrl, { method: 'DELETE', headers });
        if (response.ok) {
            logger_1.default.debug(`Successfully rolled back eval ${evalId}`);
        }
        else {
            logger_1.default.warn(`Rollback request returned non-OK status: ${response.statusText}`);
        }
    }
    catch (e) {
        logger_1.default.warn(`Failed to roll back eval ${evalId}: ${e}. You may need to manually delete this eval.`);
    }
}
async function sendChunkedResults(evalRecord, url) {
    const isVerbose = (0, logger_1.isDebugEnabled)();
    logger_1.default.debug(`Starting chunked results upload to ${url}`);
    await (0, cloud_2.checkCloudPermissions)(evalRecord.config);
    const sampleResults = (await evalRecord.fetchResultsBatched(100).next()).value ?? [];
    if (sampleResults.length === 0) {
        logger_1.default.debug(`No results found`);
        return null;
    }
    logger_1.default.debug(`Loaded ${sampleResults.length} sample results to determine chunk size`);
    // Calculate chunk sizes based on sample
    const largestSize = findLargestResultSize(sampleResults);
    logger_1.default.debug(`Largest result size from sample: ${largestSize} bytes`);
    // Determine how many results per chunk
    const TARGET_CHUNK_SIZE = 0.9 * 1024 * 1024; // 900KB in bytes
    const estimatedResultsPerChunk = (0, envars_1.getEnvInt)('PROMPTFOO_SHARE_CHUNK_SIZE') ??
        Math.max(1, Math.floor(TARGET_CHUNK_SIZE / largestSize));
    logger_1.default.debug(`Estimated results per chunk: ${estimatedResultsPerChunk}`);
    // Prepare headers
    const headers = {
        'Content-Type': 'application/json',
    };
    if (cloud_1.cloudConfig.isEnabled()) {
        headers['Authorization'] = `Bearer ${cloud_1.cloudConfig.getApiKey()}`;
    }
    const totalResults = await evalRecord.getResultsCount();
    logger_1.default.debug(`Total results to share: ${totalResults}`);
    // Setup progress bar only if not in verbose mode or CI
    let progressBar = null;
    if (!isVerbose && !(0, envars_1.isCI)()) {
        progressBar = new cli_progress_1.default.SingleBar({
            format: 'Sharing | {bar} | {percentage}% | {value}/{total} results',
            gracefulExit: true,
        }, cli_progress_1.default.Presets.shades_classic);
        progressBar.start(totalResults, 0);
    }
    let evalId;
    try {
        // Send initial data and get eval ID
        evalId = await sendEvalRecord(evalRecord, url, headers);
        logger_1.default.debug(`Initial eval data sent successfully - ${evalId}`);
        // Send chunks using batched cursor
        let currentChunk = [];
        let totalSent = 0;
        let chunkNumber = 0;
        for await (const batch of evalRecord.fetchResultsBatched(estimatedResultsPerChunk)) {
            for (const result of batch) {
                currentChunk.push(result);
                if (currentChunk.length >= estimatedResultsPerChunk) {
                    chunkNumber++;
                    logger_1.default.debug(`Sending chunk ${chunkNumber} with ${currentChunk.length} results`);
                    await sendChunkOfResults(currentChunk, url, evalId, headers);
                    totalSent += currentChunk.length;
                    if (progressBar) {
                        progressBar.increment(currentChunk.length);
                    }
                    else {
                        logger_1.default.info(`Progress: ${totalSent}/${totalResults} results shared (${Math.round((totalSent / totalResults) * 100)}%)`);
                    }
                    currentChunk = [];
                }
            }
        }
        // Send final chunk
        if (currentChunk.length > 0) {
            chunkNumber++;
            logger_1.default.debug(`Sending final chunk ${chunkNumber} with ${currentChunk.length} results`);
            await sendChunkOfResults(currentChunk, url, evalId, headers);
            totalSent += currentChunk.length;
            if (progressBar) {
                progressBar.increment(currentChunk.length);
            }
            else {
                logger_1.default.info(`Progress: ${totalSent}/${totalResults} results shared (100%)`);
            }
        }
        logger_1.default.debug(`Sharing complete. Total chunks sent: ${chunkNumber}, Total results: ${totalSent}`);
        return evalId;
    }
    catch (e) {
        if (progressBar) {
            progressBar.stop();
        }
        logger_1.default.error(`Upload failed: ${e instanceof Error ? e.message : String(e)}`);
        if (evalId) {
            logger_1.default.info(`Upload failed, rolling back...`);
            await rollbackEval(url, evalId, headers);
        }
        return null;
    }
    finally {
        if (progressBar) {
            progressBar.stop();
        }
    }
}
/**
 * Removes authentication information (username and password) from a URL.
 *
 * This function addresses a security concern raised in GitHub issue #1184,
 * where sensitive authentication information was being displayed in the CLI output.
 * By default, we now strip this information to prevent accidental exposure of credentials.
 *
 * @param urlString - The URL string that may contain authentication information.
 * @returns A new URL string with username and password removed, if present.
 *          If URL parsing fails, it returns the original string.
 */
function stripAuthFromUrl(urlString) {
    try {
        const url = new url_1.URL(urlString);
        url.username = '';
        url.password = '';
        return url.toString();
    }
    catch {
        logger_1.default.warn('Failed to parse URL, returning original');
        return urlString;
    }
}
async function handleEmailCollection(evalRecord) {
    if (!process.stdout.isTTY || (0, envars_1.isCI)() || (0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_SHARE_EMAIL_REQUEST')) {
        return;
    }
    let email = (0, accounts_1.getUserEmail)();
    if (!email) {
        email = await (0, input_1.default)({
            message: `${chalk_1.default.bold('Please enter your work email address')} (for managing shared URLs):`,
            validate: (value) => value.includes('@') || 'Please enter a valid email address',
        });
        (0, accounts_1.setUserEmail)(email);
    }
    evalRecord.author = email;
    await evalRecord.save();
}
async function getApiConfig(evalRecord) {
    if (cloud_1.cloudConfig.isEnabled()) {
        const apiBaseUrl = cloud_1.cloudConfig.getApiHost();
        return {
            url: `${apiBaseUrl}/api/v1/results`,
        };
    }
    const apiBaseUrl = typeof evalRecord.config.sharing === 'object'
        ? evalRecord.config.sharing.apiBaseUrl || (0, constants_1.getShareApiBaseUrl)()
        : (0, constants_1.getShareApiBaseUrl)();
    return {
        // This is going to a self-hosted instance so the api should match the Open Source API
        url: `${apiBaseUrl}/api/eval`,
    };
}
/**
 * Constructs the shareable URL for an eval.
 * @param eval_ The eval to get the shareable URL for.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the eval.
 */
async function getShareableUrl(eval_, remoteEvalId, showAuth = false) {
    const { domain } = determineShareDomain(eval_);
    // For custom self-hosted setups, ensure we're using the same domain as the API
    const customDomain = (0, envars_1.getEnvString)('PROMPTFOO_REMOTE_APP_BASE_URL');
    const finalDomain = customDomain || domain;
    const fullUrl = cloud_1.cloudConfig.isEnabled()
        ? `${finalDomain}/eval/${remoteEvalId}`
        : (0, constants_1.getShareViewBaseUrl)() === (0, constants_1.getDefaultShareViewBaseUrl)() && !customDomain
            ? `${finalDomain}/eval/${remoteEvalId}`
            : `${finalDomain}/eval/?evalId=${remoteEvalId}`;
    return showAuth ? fullUrl : stripAuthFromUrl(fullUrl);
}
/**
 * Shares an eval and returns the shareable URL.
 * @param evalRecord The eval to share.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the eval.
 */
async function createShareableUrl(evalRecord, showAuth = false) {
    // If sharing is explicitly disabled, return null
    if ((0, envars_1.getEnvBool)('PROMPTFOO_DISABLE_SHARING')) {
        logger_1.default.debug('Sharing is explicitly disabled, returning null');
        return null;
    }
    // Show org/team context before uploading (only when cloud is enabled)
    const orgContext = await (0, cloud_2.getOrgContext)();
    if (orgContext) {
        const teamSuffix = orgContext.teamName ? ` > ${orgContext.teamName}` : '';
        logger_1.default.info(`${chalk_1.default.dim('Sharing to:')} ${chalk_1.default.cyan(orgContext.organizationName)}${teamSuffix}`);
    }
    // 1. Handle email collection
    await handleEmailCollection(evalRecord);
    // 2. Get API configuration
    const { url } = await getApiConfig(evalRecord);
    // 3. Determine if we can use new results format
    const canUseNewResults = cloud_1.cloudConfig.isEnabled();
    logger_1.default.debug(`Sharing with ${url} canUseNewResults: ${canUseNewResults} Use old results: ${evalRecord.useOldResults()}`);
    const evalId = await sendChunkedResults(evalRecord, url);
    if (!evalId) {
        return null;
    }
    logger_1.default.debug(`New eval ID on remote instance: ${evalId}`);
    return getShareableUrl(evalRecord, evalId, showAuth);
}
/**
 * Checks whether an eval has been shared.
 * @param eval_ The eval to check.
 * @returns True if the eval has been shared, false otherwise.
 */
async function hasEvalBeenShared(eval_) {
    try {
        // GET /api/results/:id
        const res = await (0, cloud_2.makeRequest)(`results/${eval_.id}`, 'GET');
        switch (res.status) {
            // 200: Eval already exists i.e. it has been shared before.
            case 200:
                return true;
            // 404: Eval not found i.e. it has not been shared before.
            case 404:
                return false;
            default:
                throw new Error(`[hasEvalBeenShared]: unexpected API error: ${res.status}\n${res.statusText}`);
        }
    }
    catch (e) {
        logger_1.default.error(`[hasEvalBeenShared]: error checking if eval has been shared: ${e}`);
        return false;
    }
}
/**
 * Checks whether a model audit has been shared.
 * @param audit The model audit to check.
 * @returns True if the model audit has been shared, false otherwise.
 */
async function hasModelAuditBeenShared(audit) {
    try {
        // GET /api/v1/model-audits/:id
        const res = await (0, cloud_2.makeRequest)(`model-audits/${audit.id}`, 'GET');
        switch (res.status) {
            // 200: Model audit already exists i.e. it has been shared before.
            case 200:
                return true;
            // 404: Model audit not found i.e. it has not been shared before.
            case 404:
                return false;
            default:
                throw new Error(`[hasModelAuditBeenShared]: unexpected API error: ${res.status}\n${res.statusText}`);
        }
    }
    catch (e) {
        logger_1.default.debug(`[hasModelAuditBeenShared]: error checking if model audit has been shared: ${e}`);
        return false;
    }
}
/**
 * Creates a shareable URL for a model audit.
 * @param auditRecord The model audit to share.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the model audit.
 */
async function createShareableModelAuditUrl(auditRecord, showAuth = false) {
    // 1. Handle email collection (skip for model audits as they don't have eval config)
    // Model audits use cloud config directly
    // 2. Get API configuration
    const apiBaseUrl = cloud_1.cloudConfig.isEnabled() ? cloud_1.cloudConfig.getApiHost() : (0, constants_1.getShareApiBaseUrl)();
    const headers = {
        'Content-Type': 'application/json',
        ...(cloud_1.cloudConfig.isEnabled() && { Authorization: `Bearer ${cloud_1.cloudConfig.getApiKey()}` }),
    };
    const url = `${apiBaseUrl}/api/v1/model-audits/share`;
    // 3. Send the model audit data
    logger_1.default.debug(`Sharing model audit ${auditRecord.id} to ${url}`);
    try {
        const payload = {
            scanId: auditRecord.id,
            createdAt: auditRecord.createdAt,
            updatedAt: auditRecord.updatedAt,
            name: auditRecord.name,
            author: auditRecord.author,
            modelPath: auditRecord.modelPath,
            modelType: auditRecord.modelType,
            results: auditRecord.results,
            checks: auditRecord.checks,
            issues: auditRecord.issues,
            hasErrors: auditRecord.hasErrors,
            totalChecks: auditRecord.totalChecks,
            passedChecks: auditRecord.passedChecks,
            failedChecks: auditRecord.failedChecks,
            metadata: auditRecord.metadata,
            // Revision tracking fields for deduplication
            modelId: auditRecord.modelId,
            revisionSha: auditRecord.revisionSha,
            contentHash: auditRecord.contentHash,
            modelSource: auditRecord.modelSource,
            sourceLastModified: auditRecord.sourceLastModified,
            scannerVersion: auditRecord.scannerVersion,
        };
        // Log payload size for debugging large model audits
        const payloadSize = Buffer.byteLength(JSON.stringify(payload), 'utf8');
        logger_1.default.debug(`Model audit payload size: ${(payloadSize / 1024 / 1024).toFixed(2)} MB`);
        const response = await (0, index_1.fetchWithProxy)(url, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const responseBody = await response.text();
            throw new Error(`Failed to share model audit: ${response.status} ${response.statusText}\n${responseBody}`);
        }
        const { remoteId } = await response.json();
        logger_1.default.debug(`Model audit shared successfully. Remote ID: ${remoteId}`);
        return getShareableModelAuditUrl(auditRecord, remoteId || auditRecord.id, showAuth);
    }
    catch (error) {
        logger_1.default.error(`Error sharing model audit: ${error instanceof Error ? error.message : String(error)}`);
        return null;
    }
}
/**
 * Gets the shareable URL for a model audit.
 * @param audit The model audit.
 * @param remoteAuditId The remote ID of the model audit.
 * @param showAuth Whether to show the authentication information in the URL.
 * @returns The shareable URL for the model audit.
 */
function getShareableModelAuditUrl(_audit, remoteAuditId, showAuth = false) {
    const appBaseUrl = cloud_1.cloudConfig.isEnabled()
        ? cloud_1.cloudConfig.getAppUrl()
        : (0, constants_1.getShareViewBaseUrl)() || (0, constants_1.getDefaultShareViewBaseUrl)();
    const fullUrl = `${appBaseUrl}/model-audit/scan/${remoteAuditId}`;
    return showAuth ? fullUrl : stripAuthFromUrl(fullUrl);
}
//# sourceMappingURL=share.js.map