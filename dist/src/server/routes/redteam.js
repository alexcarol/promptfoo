"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redteamRouter = void 0;
const express_1 = require("express");
const uuid_1 = require("uuid");
const cliState_1 = __importDefault(require("../../cliState"));
const logger_1 = __importDefault(require("../../logger"));
const constants_1 = require("../../redteam/constants");
const index_1 = require("../../redteam/plugins/index");
const shared_1 = require("../../redteam/providers/shared");
const remoteGeneration_1 = require("../../redteam/remoteGeneration");
const shared_2 = require("../../redteam/shared");
const index_2 = require("../../redteam/strategies/index");
const index_3 = require("../../util/fetch/index");
const eval_1 = require("./eval");
const chat_1 = require("../../providers/openai/chat");
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const types_1 = require("../../redteam/types");
const redteamTestCaseGenerationService_1 = require("../services/redteamTestCaseGenerationService");
exports.redteamRouter = (0, express_1.Router)();
const TestCaseGenerationSchema = zod_1.z.object({
    plugin: zod_1.z.object({
        id: zod_1.z.string().refine((val) => constants_1.ALL_PLUGINS.includes(val), {
            message: `Invalid plugin ID. Must be one of: ${constants_1.ALL_PLUGINS.join(', ')}`,
        }),
        config: types_1.PluginConfigSchema.optional().default({}),
    }),
    strategy: zod_1.z.object({
        id: zod_1.z.string().refine((val) => constants_1.ALL_STRATEGIES.includes(val), {
            message: `Invalid strategy ID. Must be one of: ${constants_1.ALL_STRATEGIES.join(', ')}`,
        }),
        config: types_1.StrategyConfigSchema.optional().default({}),
    }),
    config: zod_1.z.object({
        applicationDefinition: zod_1.z.object({
            purpose: zod_1.z.string().nullable(),
        }),
    }),
    turn: zod_1.z.number().int().min(0).optional().default(0),
    maxTurns: zod_1.z.number().int().min(1).optional(),
    history: zod_1.z.array(types_1.ConversationMessageSchema).optional().default([]),
    goal: zod_1.z.string().optional(),
    stateful: zod_1.z.boolean().optional(),
});
/**
 * Generates a test case for a given plugin/strategy combination.
 */
exports.redteamRouter.post('/generate-test', async (req, res) => {
    try {
        const parsedBody = TestCaseGenerationSchema.safeParse(req.body);
        if (!parsedBody.success) {
            res.status(400).json({ error: 'Invalid request body', details: parsedBody.error.message });
            return;
        }
        const { plugin, strategy, config, turn, maxTurns, history, goal: goalOverride, stateful, } = parsedBody.data;
        const pluginConfigurationError = (0, redteamTestCaseGenerationService_1.getPluginConfigurationError)(plugin);
        if (pluginConfigurationError) {
            res.status(400).json({ error: pluginConfigurationError });
            return;
        }
        logger_1.default.debug('Generating red team test case', { plugin, strategy });
        // Find the plugin
        const pluginFactory = index_1.Plugins.find((p) => p.key === plugin.id);
        // TODO: Add support for this? Was previously misconfigured such that the no value would ever
        // be passed in as a configuration option.
        const injectVar = 'query';
        // Get the red team provider
        const redteamProvider = await shared_1.redteamProviderManager.getProvider({ provider: constants_1.REDTEAM_MODEL });
        const testCases = await pluginFactory.action({
            provider: redteamProvider,
            purpose: config.applicationDefinition.purpose ?? 'general AI assistant',
            injectVar,
            n: 1, // Generate only one test case
            delayMs: 0,
            config: {
                ...plugin.config,
                language: plugin.config.language ?? 'en',
                __nonce: Math.floor(Math.random() * 1000000), // Use a nonce to prevent caching
            },
        });
        if (testCases.length === 0) {
            res.status(500).json({ error: 'Failed to generate test case' });
            return;
        }
        // Apply strategy to test case
        let finalTestCases = testCases;
        // Skip applying strategy if it's 'basic' as they don't transform test cases
        if (!['basic', 'default'].includes(strategy.id)) {
            try {
                const strategyFactory = index_2.Strategies.find((s) => s.id === strategy.id);
                const strategyTestCases = await strategyFactory.action(testCases, // Cast to TestCaseWithPlugin[]
                injectVar, strategy.config || {}, strategy.id);
                if (strategyTestCases && strategyTestCases.length > 0) {
                    finalTestCases = strategyTestCases;
                }
            }
            catch (error) {
                logger_1.default.error(`Error applying strategy ${strategy.id}: ${error}`);
                res.status(500).json({
                    error: `Failed to apply strategy ${strategy.id}`,
                    details: error instanceof Error ? error.message : String(error),
                });
                return;
            }
        }
        const testCase = finalTestCases[0];
        const generatedPrompt = (0, redteamTestCaseGenerationService_1.extractGeneratedPrompt)(testCase, injectVar);
        const baseMetadata = testCase.metadata && typeof testCase.metadata === 'object' ? testCase.metadata : {};
        const metadataForStrategy = {
            ...baseMetadata,
            strategyId: strategy.id,
        };
        const context = `This test case targets the ${plugin.id} plugin with strategy ${strategy.id} and was generated based on your application context. If the test case is not relevant to your application, you can modify the application definition to improve relevance.`;
        const purpose = config.applicationDefinition.purpose ?? null;
        if ((0, constants_1.isMultiTurnStrategy)(strategy.id)) {
            try {
                const multiTurnResult = await (0, redteamTestCaseGenerationService_1.generateMultiTurnPrompt)({
                    pluginId: plugin.id,
                    strategyId: strategy.id,
                    strategyConfigRecord: strategy.config,
                    history,
                    turn,
                    maxTurns,
                    goalOverride,
                    baseMetadata: metadataForStrategy,
                    generatedPrompt,
                    purpose,
                    stateful,
                });
                res.json({
                    prompt: multiTurnResult.prompt,
                    context,
                    metadata: multiTurnResult.metadata,
                });
                return;
            }
            catch (error) {
                if (error instanceof redteamTestCaseGenerationService_1.RemoteGenerationDisabledError) {
                    res.status(400).json({ error: error.message });
                    return;
                }
                logger_1.default.error('[Multi-turn] Error generating prompt', {
                    message: error instanceof Error ? error.message : String(error),
                    strategy: strategy.id,
                });
                res.status(500).json({
                    error: 'Failed to generate multi-turn prompt',
                    details: error instanceof Error ? error.message : String(error),
                });
            }
        }
        res.json({
            prompt: generatedPrompt,
            context,
            metadata: baseMetadata,
        });
    }
    catch (error) {
        logger_1.default.error(`Error generating test case: ${error}`);
        res.status(500).json({
            error: 'Failed to generate test case',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
// Track the current running job
let currentJobId = null;
let currentAbortController = null;
exports.redteamRouter.post('/run', async (req, res) => {
    // If there's a current job running, abort it
    if (currentJobId) {
        if (currentAbortController) {
            currentAbortController.abort();
        }
        const existingJob = eval_1.evalJobs.get(currentJobId);
        if (existingJob) {
            existingJob.status = 'error';
            existingJob.logs.push('Job cancelled - new job started');
        }
    }
    const { config, force, verbose, delay, maxConcurrency } = req.body;
    const id = (0, uuid_1.v4)();
    currentJobId = id;
    currentAbortController = new AbortController();
    // Initialize job status with empty logs array
    eval_1.evalJobs.set(id, {
        evalId: null,
        status: 'in-progress',
        progress: 0,
        total: 0,
        result: null,
        logs: [],
    });
    // Set web UI mode
    cliState_1.default.webUI = true;
    // Validate and normalize maxConcurrency
    const normalizedMaxConcurrency = Math.max(1, Number(maxConcurrency || '1'));
    // Run redteam in background
    (0, shared_2.doRedteamRun)({
        liveRedteamConfig: config,
        force,
        verbose,
        delay: Number(delay || '0'),
        maxConcurrency: normalizedMaxConcurrency,
        logCallback: (message) => {
            if (currentJobId === id) {
                const job = eval_1.evalJobs.get(id);
                if (job) {
                    job.logs.push(message);
                }
            }
        },
        abortSignal: currentAbortController.signal,
    })
        .then(async (evalResult) => {
        const summary = evalResult ? await evalResult.toEvaluateSummary() : null;
        const job = eval_1.evalJobs.get(id);
        if (job && currentJobId === id) {
            job.status = 'complete';
            job.result = summary;
            job.evalId = evalResult?.id ?? null;
        }
        if (currentJobId === id) {
            cliState_1.default.webUI = false;
            currentJobId = null;
            currentAbortController = null;
        }
    })
        .catch((error) => {
        logger_1.default.error(`Error running red team: ${error}\n${error.stack || ''}`);
        const job = eval_1.evalJobs.get(id);
        if (job && currentJobId === id) {
            job.status = 'error';
            job.logs.push(`Error: ${error.message}`);
            if (error.stack) {
                job.logs.push(`Stack trace: ${error.stack}`);
            }
        }
        if (currentJobId === id) {
            cliState_1.default.webUI = false;
            currentJobId = null;
            currentAbortController = null;
        }
    });
    res.json({ id });
});
exports.redteamRouter.post('/cancel', async (_req, res) => {
    if (!currentJobId) {
        res.status(400).json({ error: 'No job currently running' });
        return;
    }
    const jobId = currentJobId;
    if (currentAbortController) {
        currentAbortController.abort();
    }
    const job = eval_1.evalJobs.get(jobId);
    if (job) {
        job.status = 'error';
        job.logs.push('Job cancelled by user');
    }
    // Clear state
    cliState_1.default.webUI = false;
    currentJobId = null;
    currentAbortController = null;
    // Wait a moment to ensure cleanup
    await new Promise((resolve) => setTimeout(resolve, 100));
    res.json({ message: 'Job cancelled' });
});
exports.redteamRouter.post('/generate-custom-policy', async (req, res) => {
    try {
        const { applicationDefinition, existingPolicies } = req.body;
        // Check if OpenAI API key is available before attempting to generate policies
        // This feature requires an OpenAI API key and has no remote generation fallback
        if (!process.env.OPENAI_API_KEY) {
            res.status(400).json({
                error: 'OpenAI API key required',
                details: 'Set the OPENAI_API_KEY environment variable to use custom policy generation',
            });
            return;
        }
        const provider = new chat_1.OpenAiChatCompletionProvider('gpt-5-mini-2025-08-07', {
            config: {
                response_format: {
                    type: 'json_schema',
                    json_schema: {
                        name: 'policies',
                        strict: true,
                        schema: {
                            type: 'object',
                            properties: {
                                policies: {
                                    type: 'array',
                                    items: {
                                        type: 'object',
                                        properties: {
                                            name: { type: 'string' },
                                            text: { type: 'string' },
                                        },
                                        required: ['name', 'text'],
                                        additionalProperties: false,
                                    },
                                },
                            },
                            required: ['policies'],
                            additionalProperties: false,
                        },
                    },
                },
                temperature: 0.7,
            },
        });
        const systemPrompt = (0, dedent_1.default) `
      You are an expert at defining red teaming policies for AI applications.
      Your goal is to suggest custom policies (validators) that should be enforced based on the application definition.
      Return a JSON object with a "policies" array, where each policy has a "name" and "text".
      The "text" should be a clear, specific instruction for what the AI should not do or should check for.
      Do not suggest policies that are already in the existing list.
    `;
        const userPrompt = (0, dedent_1.default) `
      Application Definition:
      ${JSON.stringify(applicationDefinition, null, 2)}

      Existing Policies:
      ${JSON.stringify(existingPolicies, null, 2)}

      Suggest 3-5 new, unique, and relevant policies.`;
        const response = await provider.callApi(JSON.stringify([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ]));
        if (response.error) {
            throw new Error(response.error);
        }
        let policies = [];
        try {
            const output = typeof response.output === 'string' ? JSON.parse(response.output) : response.output;
            policies = output.policies || [];
        }
        catch (e) {
            logger_1.default.error(`Failed to parse generated policies: ${e}`);
        }
        res.json({ policies });
    }
    catch (error) {
        logger_1.default.error(`Error generating policies: ${error}`);
        res.status(500).json({
            error: 'Failed to generate policies',
            details: error instanceof Error ? error.message : String(error),
        });
    }
});
// NOTE: This comes last, so the other routes take precedence
exports.redteamRouter.post('/:task', async (req, res) => {
    const { task } = req.params;
    const cloudFunctionUrl = (0, remoteGeneration_1.getRemoteGenerationUrl)();
    logger_1.default.debug(`Received ${task} task request: ${JSON.stringify({
        method: req.method,
        url: req.url,
        body: req.body,
    })}`);
    try {
        logger_1.default.debug(`Sending request to cloud function: ${cloudFunctionUrl}`);
        const response = await (0, index_3.fetchWithProxy)(cloudFunctionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                task,
                ...req.body,
            }),
        });
        if (!response.ok) {
            logger_1.default.error(`Cloud function responded with status ${response.status}`);
            throw new Error(`Cloud function responded with status ${response.status}`);
        }
        const data = await response.json();
        logger_1.default.debug(`Received response from cloud function: ${JSON.stringify(data)}`);
        res.json(data);
    }
    catch (error) {
        logger_1.default.error(`Error in ${task} task: ${error}`);
        res.status(500).json({ error: `Failed to process ${task} task` });
    }
});
exports.redteamRouter.get('/status', async (_req, res) => {
    res.json({
        hasRunningJob: currentJobId !== null,
        jobId: currentJobId,
    });
});
//# sourceMappingURL=redteam.js.map