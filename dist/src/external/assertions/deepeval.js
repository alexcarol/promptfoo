"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleConversationRelevance = void 0;
const invariant_1 = __importDefault(require("../../util/invariant"));
const deepeval_1 = require("../matchers/deepeval");
const conversationRelevancyTemplate_1 = require("../matchers/conversationRelevancyTemplate");
const matchers_1 = require("../../matchers");
const defaults_1 = require("../../providers/defaults");
const json_1 = require("../../util/json");
const tokenUsageUtils_1 = require("../../util/tokenUsageUtils");
const DEFAULT_WINDOW_SIZE = 5;
const handleConversationRelevance = async ({ assertion, outputString, prompt, test, }) => {
    let messages = [];
    if (test.vars?._conversation && test.vars._conversation.length > 0) {
        messages = test.vars?._conversation;
    }
    else {
        (0, invariant_1.default)(typeof outputString === 'string', 'conversational-relevance assertion type must have a string value');
        (0, invariant_1.default)(prompt, 'conversational-relevance assertion type must have a prompt');
        messages = [
            {
                input: prompt,
                output: outputString,
            },
        ];
    }
    const windowSize = assertion.config?.windowSize || DEFAULT_WINDOW_SIZE;
    const threshold = assertion.threshold || 0;
    let relevantCount = 0;
    let totalWindows = 0;
    const irrelevancies = [];
    const tokensUsed = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
    // Process each possible window using DeepEval's approach
    // DeepEval creates a window for each message position, with varying sizes
    for (let i = 0; i < messages.length; i++) {
        const windowMessages = messages.slice(Math.max(0, i - windowSize + 1), i + 1);
        const result = await (0, deepeval_1.matchesConversationRelevance)(windowMessages, 1.0, // Use 1.0 threshold for individual windows
        test.vars, test.options);
        if (result.pass) {
            relevantCount++;
        }
        else if (result.reason &&
            result.reason !== 'Response is not relevant to the conversation context') {
            irrelevancies.push(result.reason);
        }
        // Accumulate token usage
        if (result.tokensUsed) {
            (0, tokenUsageUtils_1.accumulateTokenUsage)(tokensUsed, result.tokensUsed);
        }
        totalWindows++;
    }
    const score = totalWindows > 0 ? relevantCount / totalWindows : 0;
    const pass = score >= threshold - Number.EPSILON;
    // Generate a comprehensive reason if there are irrelevancies
    let reason;
    if (irrelevancies.length > 0 && score < 1.0) {
        // Use the template to generate a reason
        const textProvider = await (0, matchers_1.getAndCheckProvider)('text', test.options?.provider, (await (0, defaults_1.getDefaultProviders)()).gradingProvider, 'conversation relevancy reason generation');
        const reasonPrompt = conversationRelevancyTemplate_1.ConversationRelevancyTemplate.generateReason(score, irrelevancies);
        const resp = await textProvider.callApi(reasonPrompt);
        if (resp.output && typeof resp.output === 'string') {
            try {
                const jsonObjects = (0, json_1.extractJsonObjects)(resp.output);
                if (jsonObjects.length > 0) {
                    const result = jsonObjects[0];
                    reason =
                        result.reason ||
                            `${relevantCount} out of ${totalWindows} conversation windows were relevant`;
                }
                else {
                    reason = `${relevantCount} out of ${totalWindows} conversation windows were relevant`;
                }
            }
            catch {
                reason = `${relevantCount} out of ${totalWindows} conversation windows were relevant`;
            }
            // Add token usage from reason generation
            if (resp.tokenUsage) {
                (0, tokenUsageUtils_1.accumulateTokenUsage)(tokensUsed, resp.tokenUsage);
            }
        }
        else {
            reason = `${relevantCount} out of ${totalWindows} conversation windows were relevant`;
        }
    }
    else {
        reason = `${relevantCount} out of ${totalWindows} conversation windows were relevant`;
    }
    return {
        assertion,
        pass,
        score,
        reason,
        tokensUsed: tokensUsed.total > 0 ? tokensUsed : undefined,
    };
};
exports.handleConversationRelevance = handleConversationRelevance;
//# sourceMappingURL=deepeval.js.map