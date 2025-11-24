"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAiAgentsProvider = void 0;
const agents_1 = require("@openai/agents");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("./index");
const agents_tracing_1 = require("./agents-tracing");
const agents_loader_1 = require("./agents-loader");
/**
 * OpenAI Agents Provider
 *
 * Integrates openai-agents-js SDK as a promptfoo provider.
 * Supports multi-turn agent workflows with tools, handoffs, and tracing.
 */
class OpenAiAgentsProvider extends index_1.OpenAiGenericProvider {
    constructor(modelName, options = {}) {
        super(modelName, options);
        this.agentConfig = options.config || {};
    }
    id() {
        return `openai:agents:${this.modelName}`;
    }
    toString() {
        return `[OpenAI Agents Provider ${this.modelName}]`;
    }
    /**
     * Call the agent with the given prompt
     */
    async callApi(prompt, context, callApiOptions) {
        logger_1.default.debug('[AgentsProvider] Starting agent call', {
            prompt: prompt.substring(0, 100),
            hasContext: !!context,
        });
        try {
            // Initialize agent if not already initialized
            if (!this.agent) {
                this.agent = await this.initializeAgent();
            }
            // Setup tracing if enabled
            await this.setupTracingIfNeeded(context);
            // Run the agent
            const result = await this.runAgent(prompt, context, callApiOptions);
            logger_1.default.debug('[AgentsProvider] Agent run completed', {
                outputLength: result.output?.length || 0,
                tokenUsage: result.tokenUsage,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('[AgentsProvider] Agent call failed', { error });
            throw error;
        }
    }
    /**
     * Initialize the agent from configuration
     */
    async initializeAgent() {
        logger_1.default.debug('[AgentsProvider] Initializing agent');
        if (!this.agentConfig.agent) {
            throw new Error('No agent configuration provided');
        }
        try {
            // Load agent definition (includes tools and handoffs if specified in agent file)
            const agent = await (0, agents_loader_1.loadAgentDefinition)(this.agentConfig.agent);
            logger_1.default.debug('[AgentsProvider] Agent initialized successfully', { name: agent.name });
            return agent;
        }
        catch (error) {
            logger_1.default.error('[AgentsProvider] Failed to initialize agent', { error });
            throw new Error(`Failed to initialize agent: ${error}`);
        }
    }
    /**
     * Setup tracing if enabled
     */
    async setupTracingIfNeeded(context) {
        const tracingEnabled = this.agentConfig.tracing === true ||
            context?.test?.metadata?.tracingEnabled === true ||
            process.env.PROMPTFOO_TRACING_ENABLED === 'true';
        if (!tracingEnabled) {
            logger_1.default.debug('[AgentsProvider] Tracing not enabled');
            return;
        }
        logger_1.default.debug('[AgentsProvider] Setting up tracing');
        try {
            // Create OTLP exporter
            this.tracingExporter = new agents_tracing_1.OTLPTracingExporter({
                otlpEndpoint: this.agentConfig.otlpEndpoint,
                evaluationId: context?.evaluationId,
                testCaseId: context?.testCaseId,
            });
            // Register with agent's tracing system
            await this.registerTracingExporter(this.tracingExporter);
            // Start the trace export loop
            (0, agents_1.startTraceExportLoop)();
            logger_1.default.debug('[AgentsProvider] Tracing setup complete');
        }
        catch (error) {
            logger_1.default.error('[AgentsProvider] Failed to setup tracing', { error });
            // Don't throw - tracing failure shouldn't block agent execution
        }
    }
    /**
     * Register tracing exporter with openai-agents-js tracing system
     */
    async registerTracingExporter(exporter) {
        try {
            // Create batch processor with our exporter
            const processor = new agents_1.BatchTraceProcessor(exporter, {
                maxQueueSize: 100,
                maxBatchSize: 10,
                scheduleDelay: 1000,
            });
            // Register processor
            (0, agents_1.addTraceProcessor)(processor);
            logger_1.default.debug('[AgentsProvider] Tracing processor registered');
        }
        catch (error) {
            logger_1.default.error('[AgentsProvider] Failed to register tracing processor', { error });
            throw error;
        }
    }
    /**
     * Run the agent with the given prompt
     */
    async runAgent(prompt, context, callApiOptions) {
        try {
            logger_1.default.debug('[AgentsProvider] Running agent', {
                agentName: this.agent?.name,
                maxTurns: this.agentConfig.maxTurns || 10,
            });
            // Build run options
            const runOptions = {
                context: context?.vars,
                maxTurns: this.agentConfig.maxTurns || 10,
                signal: callApiOptions?.abortSignal,
            };
            // Override model if specified in config
            if (this.agentConfig.model || this.modelName) {
                runOptions.model = this.agentConfig.model || this.modelName;
            }
            // Override model settings if specified
            if (this.agentConfig.modelSettings) {
                runOptions.modelSettings = this.agentConfig.modelSettings;
            }
            // Run the agent within a trace context to ensure proper trace ID generation
            const result = await (0, agents_1.getOrCreateTrace)(async () => {
                return await (0, agents_1.run)(this.agent, prompt, runOptions);
            });
            logger_1.default.debug('[AgentsProvider] Agent run result', {
                hasOutput: !!result.finalOutput,
                turns: result.newItems?.length || 0,
            });
            // Build provider response
            const response = {
                output: result.finalOutput,
                tokenUsage: this.extractTokenUsage(result),
                cached: false,
                cost: this.calculateCost(result),
            };
            return response;
        }
        catch (error) {
            logger_1.default.error('[AgentsProvider] Failed to run agent', { error });
            throw error;
        }
    }
    /**
     * Extract token usage from agent result
     */
    extractTokenUsage(result) {
        if (!result.usage) {
            return {};
        }
        const usage = result.usage;
        return {
            total: usage.totalTokens || undefined,
            prompt: usage.promptTokens || undefined,
            completion: usage.completionTokens || undefined,
        };
    }
    /**
     * Calculate cost from agent result
     */
    calculateCost(_result) {
        // Cost calculation would depend on the model and usage
        // For now, return undefined as we don't have pricing info
        return undefined;
    }
}
exports.OpenAiAgentsProvider = OpenAiAgentsProvider;
//# sourceMappingURL=agents.js.map