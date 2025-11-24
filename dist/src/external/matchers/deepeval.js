"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchesConversationRelevance = matchesConversationRelevance;
// These metrics are ported from DeepEval.
// https://docs.confident-ai.com/docs/metrics-conversation-relevancy. See APACHE_LICENSE for license.
const matchers_1 = require("../../matchers");
const defaults_1 = require("../../providers/defaults");
const invariant_1 = __importDefault(require("../../util/invariant"));
const json_1 = require("../../util/json");
const templates_1 = require("../../util/templates");
const conversationRelevancyTemplate_1 = require("./conversationRelevancyTemplate");
const nunjucks = (0, templates_1.getNunjucksEngine)(undefined, false, true);
async function matchesConversationRelevance(messages, threshold, vars, grading) {
    const textProvider = await (0, matchers_1.getAndCheckProvider)('text', grading?.provider, (await (0, defaults_1.getDefaultProviders)()).gradingProvider, 'conversation relevancy check');
    // First, render any variables within the messages themselves
    const renderedMessages = messages.map((msg) => ({
        input: typeof msg.input === 'string' && vars ? nunjucks.renderString(msg.input, vars) : msg.input,
        output: typeof msg.output === 'string' && vars ? nunjucks.renderString(msg.output, vars) : msg.output,
    }));
    // Convert messages to the format expected by ConversationRelevancyTemplate
    const messageRoles = [];
    for (const msg of renderedMessages) {
        messageRoles.push({
            role: 'user',
            content: typeof msg.input === 'string' ? msg.input : JSON.stringify(msg.input),
        });
        messageRoles.push({
            role: 'assistant',
            content: typeof msg.output === 'string' ? msg.output : JSON.stringify(msg.output),
        });
    }
    // Generate verdict using the template
    const rubricPrompt = grading?.rubricPrompt;
    let promptText;
    if (rubricPrompt) {
        // Use custom rubric prompt with nunjucks rendering
        (0, invariant_1.default)(typeof rubricPrompt === 'string', 'rubricPrompt must be a string');
        promptText = nunjucks.renderString(rubricPrompt, {
            messages: renderedMessages,
            ...(vars || {}),
        });
    }
    else {
        // Use the template which already includes the messages
        promptText = conversationRelevancyTemplate_1.ConversationRelevancyTemplate.generateVerdicts(messageRoles);
    }
    const resp = await textProvider.callApi(promptText);
    if (resp.error || !resp.output) {
        return (0, matchers_1.fail)(resp.error || 'No output', resp.tokenUsage);
    }
    (0, invariant_1.default)(typeof resp.output === 'string', 'conversation relevancy check produced malformed response');
    try {
        const jsonObjects = (0, json_1.extractJsonObjects)(resp.output);
        if (jsonObjects.length === 0) {
            throw new Error('No JSON object found in response');
        }
        const result = jsonObjects[0];
        const pass = result.verdict === 'yes';
        const score = pass ? 1 : 0;
        return {
            pass: score >= threshold - Number.EPSILON,
            score,
            reason: result.reason || `Response ${pass ? 'is' : 'is not'} relevant to the conversation context`,
            tokensUsed: resp.tokenUsage,
        };
    }
    catch (err) {
        return (0, matchers_1.fail)(`Error parsing output: ${err.message}`, resp.tokenUsage);
    }
}
//# sourceMappingURL=deepeval.js.map