"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const async_1 = __importDefault(require("async"));
const chalk_1 = __importDefault(require("chalk"));
const dedent_1 = __importDefault(require("dedent"));
const constants_1 = require("../../constants");
const evaluatorHelpers_1 = require("../../evaluatorHelpers");
const accounts_1 = require("../../globalConfig/accounts");
const logger_1 = __importDefault(require("../../logger"));
const index_1 = require("../../util/fetch/index");
const invariant_1 = __importDefault(require("../../util/invariant"));
const tokenUsageUtils_1 = require("../../util/tokenUsageUtils");
const remoteGeneration_1 = require("../remoteGeneration");
const util_1 = require("../util");
class BestOfNProvider {
    id() {
        return 'promptfoo:redteam:best-of-n';
    }
    constructor(options = {}) {
        if ((0, remoteGeneration_1.neverGenerateRemote)()) {
            throw new Error(`Best-of-N strategy requires remote generation to be enabled`);
        }
        (0, invariant_1.default)(typeof options.injectVar === 'string', 'Expected injectVar to be set');
        this.injectVar = options.injectVar;
        this.maxConcurrency = options.maxConcurrency || 3;
        this.nSteps = options.nSteps;
        this.maxCandidatesPerStep = options.maxCandidatesPerStep;
    }
    async callApi(_prompt, context, options) {
        logger_1.default.debug('[Best-of-N] callApi context', { context });
        (0, invariant_1.default)(context?.originalProvider, 'Expected originalProvider to be set');
        (0, invariant_1.default)(context?.vars, 'Expected vars to be set');
        const targetProvider = context.originalProvider;
        const targetTokenUsage = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        const sessionIds = [];
        try {
            // Get candidate prompts from the server
            const response = await (0, index_1.fetchWithProxy)((0, remoteGeneration_1.getRemoteGenerationUrl)(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    task: 'jailbreak:best-of-n',
                    prompt: context.vars[this.injectVar],
                    nSteps: this.nSteps,
                    maxCandidatesPerStep: this.maxCandidatesPerStep,
                    version: constants_1.VERSION,
                    email: (0, accounts_1.getUserEmail)(),
                }),
            });
            const data = (await response.json());
            (0, invariant_1.default)(Array.isArray(data.modifiedPrompts), 'Expected modifiedPrompts array in response');
            logger_1.default.debug((0, dedent_1.default) `
          ${chalk_1.default.bold.green('Best-of-N candidates:')}
          ${chalk_1.default.cyan(JSON.stringify(data.modifiedPrompts, null, 2))}
        `);
            // Try candidates concurrently until one succeeds
            let successfulResponse = null;
            let lastResponse = null;
            let currentStep = 0;
            await async_1.default.eachLimit(data.modifiedPrompts, this.maxConcurrency, async (candidatePrompt) => {
                if (successfulResponse) {
                    return;
                }
                const targetVars = {
                    ...context.vars,
                    [this.injectVar]: candidatePrompt,
                };
                const renderedPrompt = await (0, evaluatorHelpers_1.renderPrompt)(context.prompt, targetVars, context.filters, targetProvider, [this.injectVar]);
                try {
                    const response = await targetProvider.callApi(renderedPrompt, context, options);
                    const sessionId = (0, util_1.getSessionId)(response, context);
                    if (sessionId) {
                        sessionIds.push(sessionId);
                    }
                    lastResponse = response;
                    (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(targetTokenUsage, response);
                    currentStep++;
                    if (!response.error) {
                        successfulResponse = response;
                        successfulResponse.metadata = {
                            ...successfulResponse.metadata,
                            redteamFinalPrompt: candidatePrompt,
                            step: currentStep,
                        };
                        return false; // Stop processing more candidates
                    }
                }
                catch (err) {
                    logger_1.default.debug(`[Best-of-N] Candidate failed: ${err}`);
                    currentStep++;
                }
            });
            if (successfulResponse) {
                successfulResponse.tokenUsage = targetTokenUsage;
                return successfulResponse;
            }
            if (lastResponse) {
                lastResponse.tokenUsage = targetTokenUsage;
                lastResponse.metadata = {
                    ...(lastResponse.metadata ?? {}),
                    sessionIds,
                };
            }
            return (lastResponse || {
                error: 'All candidates failed',
                metadata: {
                    sessionIds,
                },
            });
        }
        catch (err) {
            logger_1.default.error(`[Best-of-N] Error: ${err}`);
            return {
                error: String(err),
                metadata: {
                    sessionIds,
                },
            };
        }
    }
}
exports.default = BestOfNProvider;
//# sourceMappingURL=bestOfN.js.map