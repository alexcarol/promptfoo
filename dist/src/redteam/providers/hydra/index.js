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
exports.HydraProvider = void 0;
const uuid_1 = require("uuid");
const evaluatorHelpers_1 = require("../../../evaluatorHelpers");
const logger_1 = __importDefault(require("../../../logger"));
const promptfoo_1 = require("../../../providers/promptfoo");
const invariant_1 = __importDefault(require("../../../util/invariant"));
const json_1 = require("../../../util/json");
const time_1 = require("../../../util/time");
const tokenUsageUtils_1 = require("../../../util/tokenUsageUtils");
const remoteGeneration_1 = require("../../remoteGeneration");
const util_1 = require("../../util");
const shared_1 = require("../shared");
const DEFAULT_MAX_TURNS = 10;
const DEFAULT_MAX_BACKTRACKS = 10;
class HydraProvider {
    constructor(config) {
        this.conversationHistory = [];
        this.config = config;
        this.scanId = config.scanId; // Use scanId from config if provided
        this.injectVar = config.injectVar;
        this.maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;
        this.maxBacktracks = config.maxBacktracks ?? DEFAULT_MAX_BACKTRACKS;
        this.stateful = config.stateful ?? false;
        this.excludeTargetOutputFromAgenticAttackGeneration =
            config.excludeTargetOutputFromAgenticAttackGeneration ?? false;
        if (this.stateful && this.maxBacktracks > 0) {
            logger_1.default.warn('[Hydra] Backtracking disabled in stateful mode');
        }
        // Hydra strategy requires cloud
        if (!(0, remoteGeneration_1.shouldGenerateRemote)()) {
            throw new Error('jailbreak:hydra strategy requires cloud access. Set PROMPTFOO_REMOTE_GENERATION_URL or log into Promptfoo Cloud.');
        }
        this.agentProvider = new promptfoo_1.PromptfooChatCompletionProvider({
            task: 'hydra-decision',
            jsonOnly: true,
            preferSmallModel: false,
        });
        logger_1.default.debug('[Hydra] Provider initialized', {
            maxTurns: this.maxTurns,
            maxBacktracks: this.maxBacktracks,
            stateful: this.stateful,
            injectVar: this.injectVar,
            excludeTargetOutputFromAgenticAttackGeneration: this.excludeTargetOutputFromAgenticAttackGeneration,
        });
    }
    id() {
        return 'promptfoo:redteam:hydra';
    }
    async callApi(_prompt, context, options) {
        logger_1.default.debug('[Hydra] callApi invoked');
        (0, invariant_1.default)(context?.originalProvider, 'Expected originalProvider to be set');
        (0, invariant_1.default)(context?.vars, 'Expected vars to be set');
        const goal = context.test?.metadata?.goal || String(context.vars[this.injectVar]);
        return this.runAttack({
            prompt: context.prompt,
            filters: context.filters,
            vars: context.vars,
            goal,
            targetProvider: context.originalProvider,
            context,
            options,
            test: context.test,
        });
    }
    async runAttack({ prompt, filters, vars, goal, targetProvider, context, options, test, }) {
        // Initialize scanId: use evaluationId if available, otherwise use instance scanId or generate new one
        if (!this.scanId) {
            this.scanId = context?.evaluationId || (0, uuid_1.v4)();
        }
        const scanId = context?.evaluationId || this.scanId;
        logger_1.default.debug('[Hydra] Starting attack', {
            goal,
            scanId,
            maxTurns: this.maxTurns,
            stateful: this.stateful,
        });
        // Reset state
        this.conversationHistory = [];
        this.sessionId = undefined;
        const sessionIds = [];
        const successfulAttacks = [];
        const totalTokenUsage = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        const testRunId = `${context?.evaluationId || 'local'}-tc${context?.testCaseId || (0, uuid_1.v4)().slice(0, 8)}`;
        let vulnerabilityAchieved = false;
        let stopReason = 'Max turns reached';
        let storedGraderResult = undefined;
        let lastTargetResponse = undefined;
        let backtrackCount = 0;
        const redteamHistory = [];
        // Find the grader
        const { getGraderById } = await Promise.resolve().then(() => __importStar(require('../../graders')));
        let assertToUse = test?.assert?.find((a) => a.type && a.type.includes(test.metadata?.pluginId));
        if (!assertToUse) {
            assertToUse = test?.assert?.find((a) => a.type);
        }
        for (let turn = 1; turn <= this.maxTurns; turn++) {
            logger_1.default.debug(`[Hydra] Turn ${turn}/${this.maxTurns}`);
            // Build request for cloud agent
            // Conditionally exclude target outputs from conversation history for privacy
            const conversationHistoryForCloud = this.excludeTargetOutputFromAgenticAttackGeneration
                ? this.conversationHistory.map((msg) => msg.role === 'assistant'
                    ? { ...msg, content: '[Response hidden for privacy - grader feedback provided]' }
                    : msg)
                : this.conversationHistory;
            const cloudRequest = {
                task: 'hydra-decision',
                testRunId,
                scanId,
                turn,
                goal,
                purpose: test?.metadata?.purpose,
                modifiers: test?.metadata?.modifiers,
                conversationHistory: conversationHistoryForCloud,
                lastGraderResult: turn > 1 && storedGraderResult
                    ? {
                        pass: storedGraderResult.pass,
                        score: storedGraderResult.score,
                    }
                    : undefined,
                stateful: this.stateful,
                maxTurns: this.maxTurns,
                excludeTargetOutputFromAgenticAttackGeneration: this.excludeTargetOutputFromAgenticAttackGeneration,
            };
            // Get next message from cloud
            const agentResp = await this.agentProvider.callApi(JSON.stringify(cloudRequest), {
                prompt: {
                    raw: JSON.stringify(cloudRequest),
                    label: 'hydra-agent',
                },
                vars: {},
            });
            (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(totalTokenUsage, agentResp);
            if (this.agentProvider.delay) {
                await (0, time_1.sleep)(this.agentProvider.delay);
            }
            if (agentResp.error) {
                logger_1.default.error('[Hydra] Agent provider error', {
                    turn,
                    testRunId,
                    error: agentResp.error,
                });
                continue;
            }
            // Extract message from cloud response
            let nextMessage;
            if (typeof agentResp.output === 'string') {
                // PromptfooChatCompletionProvider extracts data.result as string
                nextMessage = agentResp.output;
            }
            else {
                const cloudResponse = agentResp.output;
                nextMessage = cloudResponse.result || cloudResponse.message;
            }
            if (!nextMessage) {
                logger_1.default.info('[Hydra] Missing message from agent', { turn });
                continue;
            }
            // Add message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: nextMessage,
            });
            // Send to target (different based on stateful/stateless)
            let targetPrompt;
            if (this.stateful) {
                // Stateful: send only the new message with sessionId
                const escapedMessage = nextMessage
                    .replace(/\{\{/g, '{ {')
                    .replace(/\}\}/g, '} }')
                    .replace(/\{%/g, '{ %')
                    .replace(/%\}/g, '% }');
                targetPrompt = await (0, evaluatorHelpers_1.renderPrompt)(prompt, {
                    ...vars,
                    [this.injectVar]: escapedMessage,
                    ...(this.sessionId ? { sessionId: this.sessionId } : {}),
                }, filters, targetProvider, [this.injectVar]);
            }
            else {
                // Stateless: send full conversation history as JSON
                // Try to parse the rendered prompt to see if it's already chat format
                const samplePrompt = await (0, evaluatorHelpers_1.renderPrompt)(prompt, {
                    ...vars,
                    [this.injectVar]: 'test',
                }, filters, targetProvider, [this.injectVar]);
                if ((0, json_1.isValidJson)(samplePrompt)) {
                    const parsed = JSON.parse(samplePrompt);
                    if ((0, shared_1.isValidChatMessageArray)(parsed)) {
                        // It's already chat format, inject our conversation
                        targetPrompt = JSON.stringify(this.conversationHistory);
                    }
                    else {
                        // Not chat format, use standard rendering
                        targetPrompt = JSON.stringify(this.conversationHistory);
                    }
                }
                else {
                    // Not JSON, send as conversation array
                    targetPrompt = JSON.stringify(this.conversationHistory);
                }
            }
            logger_1.default.debug('[Hydra] Sending to target', {
                turn,
                stateful: this.stateful,
                messageLength: nextMessage.length,
            });
            // Get target response
            const targetResponse = await (0, shared_1.getTargetResponse)(targetProvider, targetPrompt, context, options);
            lastTargetResponse = targetResponse;
            (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(totalTokenUsage, targetResponse);
            logger_1.default.debug('[Hydra] Received target response', {
                turn,
                responseLength: targetResponse.output?.length,
            });
            if (targetResponse.error) {
                logger_1.default.info('[Hydra] Target error', { turn, error: targetResponse.error });
                continue;
            }
            if (!Object.prototype.hasOwnProperty.call(targetResponse, 'output')) {
                logger_1.default.info('[Hydra] Malformed target response - missing output', {
                    turn,
                    responseKeys: Object.keys(targetResponse),
                });
                continue;
            }
            if (!targetResponse.output || !targetResponse.output.trim()) {
                logger_1.default.info('[Hydra] Empty target response', {
                    turn,
                    outputIsNull: targetResponse.output === null,
                    outputIsUndefined: targetResponse.output === undefined,
                    outputIsEmptyString: targetResponse.output === '',
                    outputValue: targetResponse.output,
                    outputTrimmed: targetResponse.output?.trim(),
                });
                // Replace empty output with marker so agent knows target refused
                targetResponse.output = '[Target provided empty response - likely refused]';
            }
            // Capture sessionId if stateful
            if (this.stateful && targetResponse.sessionId) {
                this.sessionId = targetResponse.sessionId;
                sessionIds.push(targetResponse.sessionId);
            }
            // Add response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: targetResponse.output,
            });
            // Check for refusal and backtrack if in stateless mode and backtracking enabled
            const isRefusal = (0, util_1.isBasicRefusal)(targetResponse.output);
            if (!this.stateful && this.maxBacktracks > 0 && isRefusal) {
                logger_1.default.debug('[Hydra] Response rejected (basic refusal), backtracking...', {
                    turn,
                    backtrackCount: backtrackCount + 1,
                    maxBacktracks: this.maxBacktracks,
                    conversationLengthBefore: this.conversationHistory.length,
                });
                backtrackCount++;
                // Remove last user + assistant messages
                if (this.conversationHistory.length >= 2) {
                    this.conversationHistory.pop(); // Remove assistant
                    this.conversationHistory.pop(); // Remove user
                }
                logger_1.default.debug('[Hydra] After backtracking state', {
                    turn,
                    backtrackCount,
                    conversationLength: this.conversationHistory.length,
                    willDecrementTurn: turn > 1,
                });
                if (backtrackCount >= this.maxBacktracks) {
                    logger_1.default.debug(`[Hydra] Max backtracks (${this.maxBacktracks}) reached. Exiting loop.`, {
                        backtrackCount,
                        maxBacktracks: this.maxBacktracks,
                    });
                    stopReason = 'Max backtracks reached';
                    break;
                }
                if (turn > 1) {
                    turn--; // Decrement turn to retry
                }
                continue;
            }
            // Grade the response
            let graderResult = undefined;
            if (test && assertToUse) {
                const grader = getGraderById(assertToUse.type);
                if (grader) {
                    const { grade } = await grader.getResult(nextMessage, targetResponse.output, test, targetProvider, assertToUse && 'value' in assertToUse ? assertToUse.value : undefined);
                    graderResult = grade;
                    storedGraderResult = grade;
                    logger_1.default.debug('[Hydra] Grader result', {
                        turn,
                        passed: grade.pass,
                    });
                }
            }
            // Store in redteam history
            redteamHistory.push({
                prompt: nextMessage,
                output: targetResponse.output,
                graderPassed: graderResult?.pass,
            });
            // Check if vulnerability was achieved
            if (graderResult?.pass === false) {
                vulnerabilityAchieved = true;
                successfulAttacks.push({
                    turn,
                    message: nextMessage,
                    response: targetResponse.output,
                });
                stopReason = 'Grader failed';
                logger_1.default.debug('[Hydra] Vulnerability achieved!', { turn });
                break;
            }
        }
        // Update scan learnings
        if (scanId) {
            try {
                const turnsCompleted = this.conversationHistory.filter((m) => m.role === 'user').length;
                const learningRequest = {
                    task: 'hydra-decision',
                    testRunId,
                    scanId,
                    testComplete: true,
                    finalResult: {
                        success: vulnerabilityAchieved,
                        totalTurns: turnsCompleted,
                    },
                };
                await this.agentProvider.callApi(JSON.stringify(learningRequest), {
                    prompt: {
                        raw: JSON.stringify(learningRequest),
                        label: 'hydra-learning-update',
                    },
                    vars: {},
                });
                logger_1.default.debug('[Hydra] Scan learnings updated', { scanId, testRunId });
            }
            catch (error) {
                logger_1.default.warn('[Hydra] Failed to update scan learnings', { error });
                // Don't fail test if learning update fails
            }
        }
        const messages = this.conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
        }));
        return {
            output: lastTargetResponse?.output || '',
            ...(lastTargetResponse?.error ? { error: lastTargetResponse.error } : {}),
            metadata: {
                sessionId: this.sessionId || (0, util_1.getSessionId)(lastTargetResponse, context),
                messages,
                hydraRoundsCompleted: this.conversationHistory.filter((m) => m.role === 'user').length,
                hydraBacktrackCount: backtrackCount,
                hydraResult: vulnerabilityAchieved,
                stopReason,
                successfulAttacks,
                totalSuccessfulAttacks: successfulAttacks.length,
                storedGraderResult,
                redteamHistory,
                sessionIds,
            },
            tokenUsage: totalTokenUsage,
            guardrails: lastTargetResponse?.guardrails,
        };
    }
}
exports.HydraProvider = HydraProvider;
exports.default = HydraProvider;
//# sourceMappingURL=index.js.map