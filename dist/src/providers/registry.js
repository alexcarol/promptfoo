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
exports.providerMap = void 0;
const dedent_1 = __importDefault(require("dedent"));
const path_1 = __importDefault(require("path"));
const esm_1 = require("../esm");
const logger_1 = __importDefault(require("../logger"));
const memoryPoisoning_1 = require("../redteam/providers/agentic/memoryPoisoning");
const authoritativeMarkupInjection_1 = __importDefault(require("../redteam/providers/authoritativeMarkupInjection"));
const bestOfN_1 = __importDefault(require("../redteam/providers/bestOfN"));
const index_1 = require("../redteam/providers/crescendo/index");
const index_2 = __importDefault(require("../redteam/providers/custom/index"));
const goat_1 = __importDefault(require("../redteam/providers/goat"));
const index_3 = require("../redteam/providers/hydra/index");
const iterative_1 = __importDefault(require("../redteam/providers/iterative"));
const iterativeImage_1 = __importDefault(require("../redteam/providers/iterativeImage"));
const iterativeMeta_1 = __importDefault(require("../redteam/providers/iterativeMeta"));
const iterativeTree_1 = __importDefault(require("../redteam/providers/iterativeTree"));
const mischievousUser_1 = __importDefault(require("../redteam/providers/mischievousUser"));
const simba_1 = __importDefault(require("../redteam/providers/simba"));
const fileExtensions_1 = require("../util/fileExtensions");
const ai21_1 = require("./ai21");
const alibaba_1 = require("./alibaba");
const completion_1 = require("./anthropic/completion");
const messages_1 = require("./anthropic/messages");
const util_1 = require("./anthropic/util");
const assistant_1 = require("./azure/assistant");
const chat_1 = require("./azure/chat");
const completion_2 = require("./azure/completion");
const embedding_1 = require("./azure/embedding");
const foundry_agent_1 = require("./azure/foundry-agent");
const moderation_1 = require("./azure/moderation");
const responses_1 = require("./azure/responses");
const index_4 = require("./bedrock/index");
const browser_1 = require("./browser");
const cerebras_1 = require("./cerebras");
const cloudera_1 = require("./cloudera");
const cohere_1 = require("./cohere");
const databricks_1 = require("./databricks");
const deepseek_1 = require("./deepseek");
const echo_1 = require("./echo");
const envoy_1 = require("./envoy");
const fal_1 = require("./fal");
const index_5 = require("./github/index");
const golangCompletion_1 = require("./golangCompletion");
const ai_studio_1 = require("./google/ai.studio");
const image_1 = require("./google/image");
const live_1 = require("./google/live");
const vertex_1 = require("./google/vertex");
const groq_1 = require("./groq");
const helicone_1 = require("./helicone");
const http_1 = require("./http");
const huggingface_1 = require("./huggingface");
const jfrog_1 = require("./jfrog");
const llama_1 = require("./llama");
const llamaApi_1 = require("./llamaApi");
const localai_1 = require("./localai");
const manualInput_1 = require("./manualInput");
const index_6 = require("./mcp/index");
const mistral_1 = require("./mistral");
const nscale_1 = require("./nscale");
const ollama_1 = require("./ollama");
const agents_1 = require("./openai/agents");
const assistant_2 = require("./openai/assistant");
const chat_2 = require("./openai/chat");
const completion_3 = require("./openai/completion");
const embedding_2 = require("./openai/embedding");
const image_2 = require("./openai/image");
const moderation_2 = require("./openai/moderation");
const realtime_1 = require("./openai/realtime");
const responses_2 = require("./openai/responses");
const openrouter_1 = require("./openrouter");
const packageParser_1 = require("./packageParser");
const perplexity_1 = require("./perplexity");
const portkey_1 = require("./portkey");
const promptfooModel_1 = require("./promptfooModel");
const pythonCompletion_1 = require("./pythonCompletion");
const replicate_1 = require("./replicate");
const rubyCompletion_1 = require("./rubyCompletion");
const scriptBasedProvider_1 = require("./scriptBasedProvider");
const scriptCompletion_1 = require("./scriptCompletion");
const sequence_1 = require("./sequence");
const simulatedUser_1 = require("./simulatedUser");
const snowflake_1 = require("./snowflake");
const togetherai_1 = require("./togetherai");
const truefoundry_1 = require("./truefoundry");
const voyage_1 = require("./voyage");
const watsonx_1 = require("./watsonx");
const webhook_1 = require("./webhook");
const websocket_1 = require("./websocket");
const chat_3 = require("./xai/chat");
const image_3 = require("./xai/image");
exports.providerMap = [
    (0, scriptBasedProvider_1.createScriptBasedProviderFactory)('exec', null, scriptCompletion_1.ScriptCompletionProvider),
    (0, scriptBasedProvider_1.createScriptBasedProviderFactory)('golang', 'go', golangCompletion_1.GolangProvider),
    (0, scriptBasedProvider_1.createScriptBasedProviderFactory)('python', 'py', pythonCompletion_1.PythonProvider),
    (0, scriptBasedProvider_1.createScriptBasedProviderFactory)('ruby', 'rb', rubyCompletion_1.RubyProvider),
    {
        test: (providerPath) => providerPath === 'agentic:memory-poisoning',
        create: async (_providerPath, providerOptions, _context) => {
            return new memoryPoisoning_1.MemoryPoisoningProvider(providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('adaline:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            if (splits.length < 4) {
                throw new Error(`Invalid adaline provider path: ${providerPath}. path format should be 'adaline:<provider_name>:<model_type>:<model_name>' eg. 'adaline:openai:chat:gpt-4o'`);
            }
            const providerName = splits[1];
            const modelType = splits[2];
            const modelName = splits[3];
            try {
                const { AdalineGatewayChatProvider, AdalineGatewayEmbeddingProvider } = await Promise.resolve().then(() => __importStar(require('./adaline.gateway')));
                if (modelType === 'embedding' || modelType === 'embeddings') {
                    return new AdalineGatewayEmbeddingProvider(providerName, modelName, providerOptions);
                }
                return new AdalineGatewayChatProvider(providerName, modelName, providerOptions);
            }
            catch (error) {
                if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('@adaline/')) {
                    throw new Error('The Adaline Gateway provider requires @adaline packages. Please install them with:\n' +
                        'npm install @adaline/anthropic @adaline/azure @adaline/gateway @adaline/google @adaline/groq @adaline/open-router @adaline/openai @adaline/provider @adaline/together-ai @adaline/types @adaline/vertex');
                }
                throw error;
            }
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('ai21:'),
        create: async (providerPath, providerOptions, _context) => {
            const modelName = providerPath.split(':')[1];
            return new ai21_1.AI21ChatCompletionProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('alibaba:') ||
            providerPath.startsWith('alicloud:') ||
            providerPath.startsWith('aliyun:') ||
            providerPath.startsWith('dashscope:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new alibaba_1.AlibabaEmbeddingProvider(modelName || modelType, providerOptions);
            }
            return new alibaba_1.AlibabaChatCompletionProvider(modelName || modelType, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('anthropic:claude-agent-sdk') ||
            providerPath.startsWith('anthropic:claude-code'),
        create: async (_providerPath, providerOptions, context) => {
            const { ClaudeCodeSDKProvider } = await Promise.resolve().then(() => __importStar(require('./claude-agent-sdk')));
            return new ClaudeCodeSDKProvider({
                ...providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('anthropic:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits[2];
            if (modelType === 'messages') {
                return new messages_1.AnthropicMessagesProvider(modelName, providerOptions);
            }
            if (modelType === 'completion') {
                return new completion_1.AnthropicCompletionProvider(modelName, providerOptions);
            }
            if (completion_1.AnthropicCompletionProvider.ANTHROPIC_COMPLETION_MODELS.includes(modelType)) {
                return new completion_1.AnthropicCompletionProvider(modelType, providerOptions);
            }
            // Check if the second part is a valid Anthropic model name
            // If it is, assume it's a messages model
            const modelIds = util_1.ANTHROPIC_MODELS.map((model) => model.id);
            if (modelIds.includes(modelType)) {
                return new messages_1.AnthropicMessagesProvider(modelType, providerOptions);
            }
            throw new Error((0, dedent_1.default) `Unknown Anthropic model type or model name: ${modelType}. Use one of the following formats:
        - anthropic:messages:<model name> - For Messages API
        - anthropic:completion:<model name> - For Completion API
        - anthropic:<model name> - Shorthand for Messages API with a known model name`);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('azure:') ||
            providerPath.startsWith('azureopenai:') ||
            providerPath === 'azure:moderation',
        create: async (providerPath, providerOptions, _context) => {
            // Handle azure:moderation directly
            if (providerPath === 'azure:moderation') {
                const { deploymentName, modelName } = providerOptions.config || {};
                return new moderation_1.AzureModerationProvider(deploymentName || modelName || 'text-content-safety', providerOptions);
            }
            // Handle other Azure providers
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const deploymentName = splits[2];
            if (modelType === 'chat') {
                return new chat_1.AzureChatCompletionProvider(deploymentName, providerOptions);
            }
            if (modelType === 'assistant') {
                return new assistant_1.AzureAssistantProvider(deploymentName, providerOptions);
            }
            if (modelType === 'foundry-agent') {
                return new foundry_agent_1.AzureFoundryAgentProvider(deploymentName, providerOptions);
            }
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new embedding_1.AzureEmbeddingProvider(deploymentName || 'text-embedding-ada-002', providerOptions);
            }
            if (modelType === 'completion') {
                return new completion_2.AzureCompletionProvider(deploymentName, providerOptions);
            }
            if (modelType === 'responses') {
                return new responses_1.AzureResponsesProvider(deploymentName || 'gpt-4.1-2025-04-14', providerOptions);
            }
            throw new Error(`Unknown Azure model type: ${modelType}. Use one of the following providers: azure:chat:<model name>, azure:assistant:<assistant id>, azure:completion:<model name>, azure:moderation:<model name>, azure:responses:<model name>`);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('bam:'),
        create: async () => {
            throw new Error('IBM BAM provider has been deprecated. The service was sunset in March 2025. Please use the WatsonX provider instead. See https://promptfoo.dev/docs/providers/watsonx for migration instructions.');
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('bedrock:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            // Handle nova-sonic model
            if (modelType === 'nova-sonic' || modelType.includes('amazon.nova-sonic')) {
                const { NovaSonicProvider } = await Promise.resolve().then(() => __importStar(require('./bedrock/nova-sonic')));
                return new NovaSonicProvider('amazon.nova-sonic-v1:0', providerOptions);
            }
            // Handle Bedrock Agents
            if (modelType === 'agents') {
                const { AwsBedrockAgentsProvider } = await Promise.resolve().then(() => __importStar(require('./bedrock/agents')));
                return new AwsBedrockAgentsProvider(modelName, providerOptions);
            }
            if (modelType === 'completion') {
                // Backwards compatibility: `completion` used to be required
                return new index_4.AwsBedrockCompletionProvider(modelName, providerOptions);
            }
            if (modelType === 'embeddings' || modelType === 'embedding') {
                return new index_4.AwsBedrockEmbeddingProvider(modelName, providerOptions);
            }
            if (modelType === 'kb' || modelType === 'knowledge-base') {
                const { AwsBedrockKnowledgeBaseProvider } = await Promise.resolve().then(() => __importStar(require('./bedrock/knowledgeBase')));
                return new AwsBedrockKnowledgeBaseProvider(modelName, providerOptions);
            }
            // Reconstruct the full model name preserving the original format
            const fullModelName = splits.slice(1).join(':');
            return new index_4.AwsBedrockCompletionProvider(fullModelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('bedrock-agent:'),
        create: async (providerPath, providerOptions, _context) => {
            const agentId = providerPath.substring('bedrock-agent:'.length);
            const { AwsBedrockAgentsProvider } = await Promise.resolve().then(() => __importStar(require('./bedrock/agents')));
            return new AwsBedrockAgentsProvider(agentId, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('sagemaker:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const endpointName = splits.slice(2).join(':');
            // Dynamically import SageMaker provider
            const { SageMakerCompletionProvider, SageMakerEmbeddingProvider } = await Promise.resolve().then(() => __importStar(require('./sagemaker')));
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new SageMakerEmbeddingProvider(endpointName || modelType, providerOptions);
            }
            // Handle the 'sagemaker:<endpoint>' format (no model type specified)
            if (splits.length === 2) {
                return new SageMakerCompletionProvider(modelType, providerOptions);
            }
            // Handle special case for JumpStart models
            if (endpointName.includes('jumpstart') || modelType === 'jumpstart') {
                return new SageMakerCompletionProvider(endpointName, {
                    ...providerOptions,
                    config: {
                        ...providerOptions.config,
                        modelType: 'jumpstart',
                    },
                });
            }
            // Handle 'sagemaker:<model-type>:<endpoint>' format for other model types
            return new SageMakerCompletionProvider(endpointName, {
                ...providerOptions,
                config: {
                    ...providerOptions.config,
                    modelType,
                },
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('cerebras:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, cerebras_1.createCerebrasProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('cloudera:'),
        create: async (providerPath, providerOptions, _context) => {
            const modelName = providerPath.split(':')[1];
            return new cloudera_1.ClouderaAiChatCompletionProvider(modelName, {
                ...providerOptions,
                config: providerOptions.config || {},
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('cloudflare-ai:'),
        create: async (providerPath, providerOptions, context) => {
            const { createCloudflareAiProvider } = await Promise.resolve().then(() => __importStar(require('./cloudflare-ai')));
            return createCloudflareAiProvider(providerPath, {
                ...providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('cohere:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new cohere_1.CohereEmbeddingProvider(modelName, providerOptions);
            }
            if (modelType === 'chat' || modelType === undefined) {
                return new cohere_1.CohereChatCompletionProvider(modelName || modelType, providerOptions);
            }
            // Default to chat provider for any other model type
            return new cohere_1.CohereChatCompletionProvider(providerPath.substring('cohere:'.length), providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('databricks:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelName = splits.slice(1).join(':');
            return new databricks_1.DatabricksMosaicAiChatCompletionProvider(modelName, {
                ...providerOptions,
                config: providerOptions.config || {},
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('deepseek:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, deepseek_1.createDeepSeekProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath === 'echo',
        create: async (_providerPath, providerOptions, _context) => {
            return new echo_1.EchoProvider(providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('envoy:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, envoy_1.createEnvoyProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('f5:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            let endpoint = splits.slice(1).join(':');
            if (endpoint.startsWith('/')) {
                endpoint = endpoint.slice(1);
            }
            return new chat_2.OpenAiChatCompletionProvider(endpoint, {
                ...providerOptions,
                config: {
                    ...providerOptions.config,
                    apiBaseUrl: providerOptions.config?.apiBaseUrl + '/' + endpoint,
                    apiKeyEnvar: 'F5_API_KEY',
                },
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('fal:'),
        create: async (providerPath, providerOptions, _context) => {
            const [_, modelType, modelName] = providerPath.split(':');
            if (modelType === 'image') {
                return new fal_1.FalImageGenerationProvider(modelName, providerOptions);
            }
            throw new Error(`Invalid fal provider path: ${providerPath}. Use one of the following providers: fal:image:<model name>`);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('fireworks:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelName = splits.slice(1).join(':');
            return new chat_2.OpenAiChatCompletionProvider(modelName, {
                ...providerOptions,
                config: {
                    ...providerOptions.config,
                    apiBaseUrl: 'https://api.fireworks.ai/inference/v1',
                    apiKeyEnvar: 'FIREWORKS_API_KEY',
                },
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('github:'),
        create: async (providerPath, providerOptions, context) => (0, index_5.createGitHubProvider)(providerPath, providerOptions, context),
    },
    {
        test: (providerPath) => providerPath.startsWith('groq:'),
        create: async (providerPath, providerOptions, _context) => {
            const modelName = providerPath.split(':')[1];
            return new groq_1.GroqProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('helicone:'),
        create: async (providerPath, providerOptions, _context) => {
            // Parse helicone:model format (e.g., helicone:openai/gpt-4o)
            const model = providerPath.substring('helicone:'.length);
            if (!model) {
                throw new Error('Helicone provider requires a model in format helicone:<provider/model> (e.g., helicone:openai/gpt-4o, helicone:anthropic/claude-3-5-sonnet)');
            }
            return new helicone_1.HeliconeGatewayProvider(model, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('hyperbolic:'),
        create: async (providerPath, providerOptions, context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            // Handle hyperbolic:image:<model> format
            if (modelType === 'image') {
                const { createHyperbolicImageProvider } = await Promise.resolve().then(() => __importStar(require('./hyperbolic/image')));
                return createHyperbolicImageProvider(providerPath, {
                    ...providerOptions,
                    env: context.env,
                });
            }
            // Handle hyperbolic:audio:<model> format
            if (modelType === 'audio') {
                const { createHyperbolicAudioProvider } = await Promise.resolve().then(() => __importStar(require('./hyperbolic/audio')));
                return createHyperbolicAudioProvider(providerPath, {
                    ...providerOptions,
                    env: context.env,
                });
            }
            // Handle regular hyperbolic:<model> format for chat
            const { createHyperbolicProvider } = await Promise.resolve().then(() => __importStar(require('./hyperbolic/chat')));
            return createHyperbolicProvider(providerPath, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('litellm:'),
        create: async (providerPath, providerOptions, context) => {
            const { createLiteLLMProvider } = await Promise.resolve().then(() => __importStar(require('./litellm')));
            return createLiteLLMProvider(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('localai:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits[2];
            if (modelType === 'chat') {
                return new localai_1.LocalAiChatProvider(modelName, providerOptions);
            }
            if (modelType === 'completion') {
                return new localai_1.LocalAiCompletionProvider(modelName, providerOptions);
            }
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new localai_1.LocalAiEmbeddingProvider(modelName, providerOptions);
            }
            return new localai_1.LocalAiChatProvider(modelType, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('mistral:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new mistral_1.MistralEmbeddingProvider(providerOptions);
            }
            return new mistral_1.MistralChatCompletionProvider(modelName || modelType, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('nscale:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, nscale_1.createNscaleProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('ollama:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const firstPart = splits[1];
            if (firstPart === 'chat') {
                const modelName = splits.slice(2).join(':');
                return new ollama_1.OllamaChatProvider(modelName, providerOptions);
            }
            if (firstPart === 'completion') {
                const modelName = splits.slice(2).join(':');
                return new ollama_1.OllamaCompletionProvider(modelName, providerOptions);
            }
            if (firstPart === 'embedding' || firstPart === 'embeddings') {
                const modelName = splits.slice(2).join(':');
                return new ollama_1.OllamaEmbeddingProvider(modelName, providerOptions);
            }
            // Default to completion provider
            const modelName = splits.slice(1).join(':');
            return new ollama_1.OllamaCompletionProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('openai:'),
        create: async (providerPath, providerOptions, _context) => {
            // Load OpenAI module
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            if (modelType === 'chat') {
                return new chat_2.OpenAiChatCompletionProvider(modelName || 'gpt-4.1-2025-04-14', providerOptions);
            }
            if (modelType === 'embedding' || modelType === 'embeddings') {
                return new embedding_2.OpenAiEmbeddingProvider(modelName || 'text-embedding-3-large', providerOptions);
            }
            if (modelType === 'completion') {
                return new completion_3.OpenAiCompletionProvider(modelName || 'gpt-3.5-turbo-instruct', providerOptions);
            }
            if (modelType === 'moderation') {
                return new moderation_2.OpenAiModerationProvider(modelName || 'omni-moderation-latest', providerOptions);
            }
            if (modelType === 'realtime') {
                return new realtime_1.OpenAiRealtimeProvider(modelName || 'gpt-4o-realtime-preview-2024-12-17', providerOptions);
            }
            if (modelType === 'responses') {
                return new responses_2.OpenAiResponsesProvider(modelName || 'gpt-4.1-2025-04-14', providerOptions);
            }
            if (modelType === 'transcription') {
                const { OpenAiTranscriptionProvider } = await Promise.resolve().then(() => __importStar(require('./openai/transcription')));
                return new OpenAiTranscriptionProvider(modelName || 'gpt-4o-transcribe-diarize', providerOptions);
            }
            if (chat_2.OpenAiChatCompletionProvider.OPENAI_CHAT_MODEL_NAMES.includes(modelType)) {
                return new chat_2.OpenAiChatCompletionProvider(modelType, providerOptions);
            }
            if (completion_3.OpenAiCompletionProvider.OPENAI_COMPLETION_MODEL_NAMES.includes(modelType)) {
                return new completion_3.OpenAiCompletionProvider(modelType, providerOptions);
            }
            if (realtime_1.OpenAiRealtimeProvider.OPENAI_REALTIME_MODEL_NAMES.includes(modelType)) {
                return new realtime_1.OpenAiRealtimeProvider(modelType, providerOptions);
            }
            if (responses_2.OpenAiResponsesProvider.OPENAI_RESPONSES_MODEL_NAMES.includes(modelType)) {
                return new responses_2.OpenAiResponsesProvider(modelType, providerOptions);
            }
            if (modelType === 'agents') {
                return new agents_1.OpenAiAgentsProvider(modelName || 'default-agent', providerOptions);
            }
            if (modelType === 'assistant') {
                return new assistant_2.OpenAiAssistantProvider(modelName, providerOptions);
            }
            if (modelType === 'image') {
                return new image_2.OpenAiImageProvider(modelName, providerOptions);
            }
            // Assume user did not provide model type, and it's a chat model
            logger_1.default.warn(`Unknown OpenAI model type: ${modelType}. Treating it as a chat model. Use one of the following providers: openai:chat:<model name>, openai:completion:<model name>, openai:embeddings:<model name>, openai:image:<model name>, openai:realtime:<model name>, openai:agents:<agent name>`);
            return new chat_2.OpenAiChatCompletionProvider(modelType, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('openrouter:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, openrouter_1.createOpenRouterProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('package:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, packageParser_1.parsePackageProvider)(providerPath, context.basePath || process.cwd(), providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('perplexity:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, perplexity_1.createPerplexityProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('portkey:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelName = splits.slice(1).join(':');
            return new portkey_1.PortkeyChatCompletionProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('replicate:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            const modelName = splits.slice(2).join(':');
            if (modelType === 'moderation') {
                return new replicate_1.ReplicateModerationProvider(modelName, providerOptions);
            }
            if (modelType === 'image') {
                return new replicate_1.ReplicateImageProvider(modelName, providerOptions);
            }
            // By default, there is no model type.
            return new replicate_1.ReplicateProvider(modelName ? modelType + ':' + modelName : modelType, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('togetherai:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, togetherai_1.createTogetherAiProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('truefoundry:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, truefoundry_1.createTrueFoundryProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('llamaapi:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, llamaApi_1.createLlamaApiProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('aimlapi:'),
        create: async (providerPath, providerOptions, context) => {
            const { createAimlApiProvider } = await Promise.resolve().then(() => __importStar(require('./aimlapi')));
            return createAimlApiProvider(providerPath, {
                ...providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('cometapi:'),
        create: async (providerPath, providerOptions, context) => {
            const { createCometApiProvider } = await Promise.resolve().then(() => __importStar(require('./cometapi')));
            return createCometApiProvider(providerPath, {
                ...providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('docker:'),
        create: async (providerPath, providerOptions, context) => {
            const { createDockerProvider } = await Promise.resolve().then(() => __importStar(require('./docker')));
            return createDockerProvider(providerPath, {
                ...providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('vertex:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const firstPart = splits[1];
            if (firstPart === 'chat') {
                return new vertex_1.VertexChatProvider(splits.slice(2).join(':'), providerOptions);
            }
            if (firstPart === 'embedding' || firstPart === 'embeddings') {
                return new vertex_1.VertexEmbeddingProvider(splits.slice(2).join(':'), providerOptions);
            }
            // Default to chat provider
            return new vertex_1.VertexChatProvider(splits.slice(1).join(':'), providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('voyage:'),
        create: async (providerPath, providerOptions, _context) => {
            return new voyage_1.VoyageEmbeddingProvider(providerPath.split(':')[1], providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('watsonx:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelName = splits.slice(1).join(':');
            return new watsonx_1.WatsonXProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('webhook:'),
        create: async (providerPath, providerOptions, _context) => {
            const webhookUrl = providerPath.substring('webhook:'.length);
            return new webhook_1.WebhookProvider(webhookUrl, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('xai:'),
        create: async (providerPath, providerOptions, context) => {
            const splits = providerPath.split(':');
            const modelType = splits[1];
            // Handle xai:image:<model> format
            if (modelType === 'image') {
                return (0, image_3.createXAIImageProvider)(providerPath, {
                    ...providerOptions,
                    env: context.env,
                });
            }
            // Handle regular xai:<model> format
            return (0, chat_3.createXAIProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
    {
        test: (providerPath) => providerPath === 'browser',
        create: async (providerPath, providerOptions, _context) => {
            return new browser_1.BrowserProvider(providerPath, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('google:') || providerPath.startsWith('palm:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            if (splits.length >= 3) {
                const serviceType = splits[1];
                const modelName = splits.slice(2).join(':');
                if (serviceType === 'live') {
                    // This is a Live API request
                    return new live_1.GoogleLiveProvider(modelName, providerOptions);
                }
                else if (serviceType === 'image') {
                    // This is an Image Generation request
                    return new image_1.GoogleImageProvider(modelName, providerOptions);
                }
            }
            // Default to regular Google API
            const modelName = splits[1];
            return new ai_studio_1.AIStudioChatProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('http:') ||
            providerPath.startsWith('https:') ||
            providerPath === 'http' ||
            providerPath === 'https',
        create: async (providerPath, providerOptions, _context) => {
            return new http_1.HttpProvider(providerPath, providerOptions);
        },
    },
    {
        test: (providerPath) => (0, fileExtensions_1.isJavascriptFile)(providerPath),
        create: async (providerPath, providerOptions, context) => {
            // Preserve the original path as the provider ID
            const providerId = providerOptions.id ?? providerPath;
            if (providerPath.startsWith('file://')) {
                providerPath = providerPath.slice('file://'.length);
            }
            // Load custom module
            const modulePath = path_1.default.isAbsolute(providerPath)
                ? providerPath
                : path_1.default.join(context.basePath || process.cwd(), providerPath);
            const CustomApiProvider = await (0, esm_1.importModule)(modulePath);
            return new CustomApiProvider({ ...providerOptions, id: providerId });
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('jfrog:') || providerPath.startsWith('qwak:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            const modelName = splits.slice(1).join(':');
            return new jfrog_1.JfrogMlChatCompletionProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath === 'llama' || providerPath.startsWith('llama:'),
        create: async (providerPath, providerOptions, _context) => {
            const modelName = providerPath.split(':')[1];
            return new llama_1.LlamaProvider(modelName, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath === 'mcp' || providerPath.startsWith('mcp:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            let config = providerOptions.config || { enabled: true };
            // Handle mcp:<server_name> format for server-specific configs
            if (splits.length > 1) {
                const serverName = splits[1];
                // User can configure specific server in the config
                config = {
                    ...config,
                    serverName,
                };
            }
            return new index_6.MCPProvider({
                config,
                id: providerOptions.id,
            });
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:manual-input',
        create: async (_providerPath, providerOptions, _context) => {
            return new manualInput_1.ManualInputProvider(providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:best-of-n',
        create: async (_providerPath, providerOptions, _context) => {
            return new bestOfN_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:crescendo',
        create: async (_providerPath, providerOptions, _context) => {
            return new index_1.CrescendoProvider(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:custom' ||
            providerPath.startsWith('promptfoo:redteam:custom:'),
        create: async (_providerPath, providerOptions, _context) => {
            return new index_2.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:goat',
        create: async (_providerPath, providerOptions, _context) => {
            return new goat_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:authoritative-markup-injection',
        create: async (_providerPath, providerOptions, _context) => {
            return new authoritativeMarkupInjection_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:mischievous-user',
        create: async (_providerPath, providerOptions, _context) => {
            return new mischievousUser_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:simba',
        create: async (_providerPath, providerOptions, _context) => {
            return new simba_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:iterative',
        create: async (_providerPath, providerOptions, _context) => {
            return new iterative_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:iterative:image',
        create: async (_providerPath, providerOptions, _context) => {
            return new iterativeImage_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:iterative:tree',
        create: async (_providerPath, providerOptions, _context) => {
            return new iterativeTree_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:iterative:meta',
        create: async (_providerPath, providerOptions, _context) => {
            return new iterativeMeta_1.default(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:redteam:hydra',
        create: async (_providerPath, providerOptions, _context) => {
            return new index_3.HydraProvider(providerOptions.config);
        },
    },
    {
        test: (providerPath) => providerPath === 'promptfoo:simulated-user',
        create: async (_providerPath, providerOptions, _context) => {
            return new simulatedUser_1.SimulatedUser(providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('promptfoo:model:'),
        create: async (providerPath, providerOptions, _context) => {
            const modelName = providerPath.split(':')[2];
            return new promptfooModel_1.PromptfooModelProvider(modelName, {
                ...providerOptions,
                model: modelName,
            });
        },
    },
    {
        test: (providerPath) => providerPath === 'sequence',
        create: async (_providerPath, providerOptions, _context) => {
            return new sequence_1.SequenceProvider(providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('ws:') ||
            providerPath.startsWith('wss:') ||
            providerPath === 'websocket' ||
            providerPath === 'ws' ||
            providerPath === 'wss',
        create: async (providerPath, providerOptions, _context) => {
            return new websocket_1.WebSocketProvider(providerPath, providerOptions);
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('huggingface:') || providerPath.startsWith('hf:'),
        create: async (providerPath, providerOptions, _context) => {
            const splits = providerPath.split(':');
            if (splits.length < 3) {
                throw new Error(`Invalid Huggingface provider path: ${providerPath}. Use one of the following providers: huggingface:feature-extraction:<model name>, huggingface:text-generation:<model name>, huggingface:text-classification:<model name>, huggingface:token-classification:<model name>`);
            }
            const modelName = splits.slice(2).join(':');
            if (splits[1] === 'feature-extraction') {
                return new huggingface_1.HuggingfaceFeatureExtractionProvider(modelName, providerOptions);
            }
            if (splits[1] === 'sentence-similarity') {
                return new huggingface_1.HuggingfaceSentenceSimilarityProvider(modelName, providerOptions);
            }
            if (splits[1] === 'text-generation') {
                return new huggingface_1.HuggingfaceTextGenerationProvider(modelName, providerOptions);
            }
            if (splits[1] === 'text-classification') {
                return new huggingface_1.HuggingfaceTextClassificationProvider(modelName, providerOptions);
            }
            if (splits[1] === 'token-classification') {
                return new huggingface_1.HuggingfaceTokenExtractionProvider(modelName, providerOptions);
            }
            throw new Error(`Invalid Huggingface provider path: ${providerPath}. Use one of the following providers: huggingface:feature-extraction:<model name>, huggingface:text-generation:<model name>, huggingface:text-classification:<model name>, huggingface:token-classification:<model name>`);
        },
    },
    {
        test: (providerPath) => providerPath === 'slack' || providerPath.startsWith('slack:'),
        create: async (providerPath, providerOptions, _context) => {
            try {
                const { SlackProvider } = await Promise.resolve().then(() => __importStar(require('./slack')));
                // Handle plain 'slack' format
                if (providerPath === 'slack') {
                    return new SlackProvider(providerOptions);
                }
                // Handle slack:* formats
                const splits = providerPath.split(':');
                if (splits.length < 2) {
                    throw new Error('Invalid Slack provider path. Use slack:<channel_id> or slack:channel:<channel_id>');
                }
                // Handle slack:C0123ABCDEF format
                if (splits.length === 2) {
                    return new SlackProvider({
                        ...providerOptions,
                        config: {
                            ...providerOptions.config,
                            channel: splits[1],
                        },
                    });
                }
                // Handle slack:channel:C0123ABCDEF or slack:user:U0123ABCDEF format
                const targetType = splits[1];
                const targetId = splits.slice(2).join(':');
                if (targetType === 'channel' || targetType === 'user') {
                    return new SlackProvider({
                        ...providerOptions,
                        config: {
                            ...providerOptions.config,
                            channel: targetId,
                        },
                    });
                }
                else {
                    throw new Error(`Invalid Slack target type: ${targetType}. Use 'channel' or 'user'`);
                }
            }
            catch (error) {
                if (error.code === 'MODULE_NOT_FOUND' && error.message.includes('@slack/web-api')) {
                    throw new Error('The Slack provider requires the @slack/web-api package. Please install it with: npm install @slack/web-api');
                }
                throw error;
            }
        },
    },
    {
        test: (providerPath) => providerPath.startsWith('snowflake:'),
        create: async (providerPath, providerOptions, context) => {
            return (0, snowflake_1.createSnowflakeProvider)(providerPath, {
                config: providerOptions,
                env: context.env,
            });
        },
    },
];
//# sourceMappingURL=registry.js.map