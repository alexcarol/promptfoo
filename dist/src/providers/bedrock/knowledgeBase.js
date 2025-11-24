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
exports.AwsBedrockKnowledgeBaseProvider = void 0;
const cache_1 = require("../../cache");
const envars_1 = require("../../envars");
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const tokenUsageUtils_1 = require("../../util/tokenUsageUtils");
const index_1 = require("./index");
/**
 * AWS Bedrock Knowledge Base provider for RAG (Retrieval Augmented Generation).
 * Allows querying an existing AWS Bedrock Knowledge Base with text queries.
 */
class AwsBedrockKnowledgeBaseProvider extends index_1.AwsBedrockGenericProvider {
    constructor(modelName, options = {}) {
        super(modelName, options);
        // Ensure we have a knowledgeBaseId
        if (!options.config?.knowledgeBaseId) {
            throw new Error('Knowledge Base ID is required. Please provide a knowledgeBaseId in the provider config.');
        }
        this.kbConfig = options.config || { knowledgeBaseId: '' };
        telemetry_1.default.record('feature_used', {
            feature: 'knowledge_base',
            provider: 'bedrock',
        });
    }
    id() {
        return `bedrock:kb:${this.kbConfig.knowledgeBaseId}`;
    }
    toString() {
        return `[Amazon Bedrock Knowledge Base Provider ${this.kbConfig.knowledgeBaseId}]`;
    }
    async getKnowledgeBaseClient() {
        if (!this.knowledgeBaseClient) {
            let handler;
            const apiKey = this.getApiKey();
            // Create request handler for proxy or API key scenarios
            if ((0, envars_1.getEnvString)('HTTP_PROXY') || (0, envars_1.getEnvString)('HTTPS_PROXY') || apiKey) {
                try {
                    const { NodeHttpHandler } = await Promise.resolve().then(() => __importStar(require('@smithy/node-http-handler')));
                    const { ProxyAgent } = await Promise.resolve().then(() => __importStar(require('proxy-agent')));
                    // Create handler with proxy support if needed
                    const proxyAgent = (0, envars_1.getEnvString)('HTTP_PROXY') || (0, envars_1.getEnvString)('HTTPS_PROXY')
                        ? new ProxyAgent()
                        : undefined;
                    handler = new NodeHttpHandler({
                        ...(proxyAgent ? { httpsAgent: proxyAgent } : {}),
                        requestTimeout: 300000, // 5 minutes
                    });
                    // Add Bearer token middleware for API key authentication
                    if (apiKey) {
                        const originalHandle = handler.handle.bind(handler);
                        handler.handle = async (request, options) => {
                            // Add Authorization header with Bearer token
                            request.headers = {
                                ...request.headers,
                                Authorization: `Bearer ${apiKey}`,
                            };
                            return originalHandle(request, options);
                        };
                    }
                }
                catch {
                    const reason = apiKey
                        ? 'API key authentication requires the @smithy/node-http-handler package'
                        : 'Proxy configuration requires the @smithy/node-http-handler package';
                    throw new Error(`${reason}. Please install it in your project or globally.`);
                }
            }
            try {
                const { BedrockAgentRuntimeClient } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-bedrock-agent-runtime')));
                const credentials = await this.getCredentials();
                const client = new BedrockAgentRuntimeClient({
                    region: this.getRegion(),
                    maxAttempts: (0, envars_1.getEnvInt)('AWS_BEDROCK_MAX_RETRIES', 10),
                    retryMode: 'adaptive',
                    ...(credentials ? { credentials } : {}),
                    ...(handler ? { requestHandler: handler } : {}),
                });
                this.knowledgeBaseClient = client;
            }
            catch (err) {
                throw new Error(`The @aws-sdk/client-bedrock-agent-runtime package is required as a peer dependency. Please install it in your project or globally. Error: ${err}`);
            }
        }
        return this.knowledgeBaseClient;
    }
    async callApi(prompt) {
        const client = await this.getKnowledgeBaseClient();
        // Prepare the request parameters
        let modelArn = this.kbConfig.modelArn;
        if (!modelArn) {
            if (this.modelName.includes('arn:aws:bedrock')) {
                modelArn = this.modelName; // Already has full ARN format
            }
            else if (this.modelName.startsWith('us.') ||
                this.modelName.startsWith('eu.') ||
                this.modelName.startsWith('apac.')) {
                // This is a cross-region inference profile - use inference-profile ARN format
                // Note: We'll use the modelName directly as the inference profile ID since Knowledge Bases
                // expect the inference profile ID, not a full ARN for these
                modelArn = this.modelName;
            }
            else {
                // Regular foundation model
                modelArn = `arn:aws:bedrock:${this.getRegion()}::foundation-model/${this.modelName}`;
            }
        }
        const knowledgeBaseConfiguration = {
            knowledgeBaseId: this.kbConfig.knowledgeBaseId,
        };
        // Only include modelArn if explicitly configured or if it's a valid model
        if (this.kbConfig.modelArn || this.modelName !== 'default') {
            knowledgeBaseConfiguration.modelArn = modelArn;
        }
        const params = {
            input: { text: prompt },
            retrieveAndGenerateConfiguration: {
                type: 'KNOWLEDGE_BASE',
                knowledgeBaseConfiguration,
            },
        };
        logger_1.default.debug('Calling Amazon Bedrock Knowledge Base API', { params });
        const cache = await (0, cache_1.getCache)();
        const sensitiveKeys = ['accessKeyId', 'secretAccessKey', 'sessionToken'];
        const cacheConfig = {
            region: this.getRegion(),
            modelName: this.modelName,
            ...Object.fromEntries(Object.entries(this.kbConfig).filter(([key]) => !sensitiveKeys.includes(key))),
        };
        const configStr = JSON.stringify(cacheConfig, Object.keys(cacheConfig).sort());
        const cacheKey = `bedrock-kb:${Buffer.from(configStr).toString('base64')}:${prompt}`;
        if ((0, cache_1.isCacheEnabled)()) {
            const cachedResponse = await cache.get(cacheKey);
            if (cachedResponse) {
                logger_1.default.debug(`Returning cached response for ${prompt}`);
                const parsedResponse = JSON.parse(cachedResponse);
                return {
                    output: parsedResponse.output,
                    metadata: { citations: parsedResponse.citations },
                    tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(), // TODO: Add token usage once Bedrock Knowledge Base API supports it
                    cached: true,
                };
            }
        }
        try {
            const { RetrieveAndGenerateCommand } = await Promise.resolve().then(() => __importStar(require('@aws-sdk/client-bedrock-agent-runtime')));
            const command = new RetrieveAndGenerateCommand(params);
            const response = await client.send(command);
            logger_1.default.debug('Amazon Bedrock Knowledge Base API response', { response });
            let output = '';
            if (response && response.output && response.output.text) {
                output = response.output.text;
            }
            let citations = [];
            if (response && response.citations && Array.isArray(response.citations)) {
                citations = response.citations;
            }
            if ((0, cache_1.isCacheEnabled)()) {
                try {
                    await cache.set(cacheKey, JSON.stringify({
                        output,
                        citations,
                    }));
                }
                catch (err) {
                    logger_1.default.error(`Failed to cache knowledge base response: ${String(err)}`);
                }
            }
            return {
                output,
                metadata: { citations },
                tokenUsage: (0, tokenUsageUtils_1.createEmptyTokenUsage)(), // TODO: Add token usage once Bedrock Knowledge Base API supports it
            };
        }
        catch (err) {
            return {
                error: `Bedrock Knowledge Base API error: ${String(err)}`,
            };
        }
    }
}
exports.AwsBedrockKnowledgeBaseProvider = AwsBedrockKnowledgeBaseProvider;
//# sourceMappingURL=knowledgeBase.js.map