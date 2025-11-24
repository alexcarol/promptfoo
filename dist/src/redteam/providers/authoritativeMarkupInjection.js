"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const constants_1 = require("../../constants");
const evaluatorHelpers_1 = require("../../evaluatorHelpers");
const accounts_1 = require("../../globalConfig/accounts");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../util/fetch/index");
const invariant_1 = __importDefault(require("../../util/invariant"));
const json_1 = require("../../util/json");
const remoteGeneration_1 = require("../remoteGeneration");
class AuthoritativeMarkupInjectionProvider {
    id() {
        return 'promptfoo:redteam:authoritative-markup-injection';
    }
    constructor(options = {}) {
        if ((0, remoteGeneration_1.neverGenerateRemote)()) {
            throw new Error(`Authoritative Markup Injection strategy requires remote grading to be enabled`);
        }
        (0, invariant_1.default)(typeof options.injectVar === 'string', 'Expected injectVar to be set');
        this.config = {
            injectVar: options.injectVar,
        };
        logger_1.default.debug('[AuthoritativeMarkupInjection] Constructor options', {
            injectVar: options.injectVar,
        });
    }
    async callApi(_prompt, context, options) {
        logger_1.default.debug('[AuthoritativeMarkupInjection] callApi context', { context });
        (0, invariant_1.default)(context?.originalProvider, 'Expected originalProvider to be set');
        (0, invariant_1.default)(context?.vars, 'Expected vars to be set');
        const targetProvider = context.originalProvider;
        const originalText = context?.test?.metadata?.originalText || context?.vars[this.config.injectVar];
        // Generate attack with authoritative markup injection
        const body = JSON.stringify({
            originalText,
            i: 0,
            prompt: context?.prompt?.raw,
            task: 'authoritative-markup-injection',
            version: constants_1.VERSION,
            email: (0, accounts_1.getUserEmail)(),
            purpose: context?.test?.metadata?.purpose,
        });
        logger_1.default.debug(`[AuthoritativeMarkupInjection] Sending request to ${(0, remoteGeneration_1.getRemoteGenerationUrl)()}: ${body}`);
        const response = await (0, index_1.fetchWithProxy)((0, remoteGeneration_1.getRemoteGenerationUrl)(), {
            body,
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST',
        });
        const data = await response.json();
        if (typeof data?.message !== 'object' || !data.message?.content || !data.message?.role) {
            throw new Error(`[AuthoritativeMarkupInjection] Invalid response from server: ${(0, json_1.safeJsonStringify)(data)}`);
        }
        const attackerMessage = data.message;
        // Inject the attack into the target prompt
        const targetVars = {
            ...context.vars,
            [this.config.injectVar]: attackerMessage.content,
        };
        const renderedAttackerPrompt = await (0, evaluatorHelpers_1.renderPrompt)(context.prompt, targetVars, context.filters, targetProvider, [this.config.injectVar]);
        logger_1.default.debug(`[AuthoritativeMarkupInjection] Rendered attack prompt`, {
            prompt: renderedAttackerPrompt,
        });
        // Call the target provider with the injected attack
        const targetResponse = await targetProvider.callApi(renderedAttackerPrompt, context, options);
        logger_1.default.debug('[AuthoritativeMarkupInjection] Target response', {
            response: targetResponse,
        });
        if (targetResponse.error) {
            return targetResponse;
        }
        return {
            ...targetResponse,
            metadata: {
                ...targetResponse.metadata,
                redteamFinalPrompt: renderedAttackerPrompt,
            },
        };
    }
}
exports.default = AuthoritativeMarkupInjectionProvider;
//# sourceMappingURL=authoritativeMarkupInjection.js.map