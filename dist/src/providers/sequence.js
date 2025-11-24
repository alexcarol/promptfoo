"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SequenceProvider = void 0;
const logger_1 = __importDefault(require("../logger"));
const invariant_1 = __importDefault(require("../util/invariant"));
const templates_1 = require("../util/templates");
const tokenUsageUtils_1 = require("../util/tokenUsageUtils");
class SequenceProvider {
    constructor({ id, config }) {
        (0, invariant_1.default)(config && Array.isArray(config.inputs), 'Expected sequence provider config to contain an array of inputs');
        const typedConfig = config;
        this.inputs = typedConfig.inputs;
        this.separator = typedConfig.separator || '\n---\n';
        this.identifier = id || 'sequence-provider';
    }
    id() {
        return this.identifier;
    }
    async callApi(prompt, context, options) {
        (0, invariant_1.default)(context?.originalProvider, 'Expected originalProvider to be set');
        const nunjucks = (0, templates_1.getNunjucksEngine)();
        const responses = [];
        const accumulatedTokenUsage = (0, tokenUsageUtils_1.createEmptyTokenUsage)();
        // Send each input to the original provider
        for (const input of this.inputs) {
            const renderedInput = nunjucks.renderString(input, {
                ...context?.vars,
                prompt,
            });
            logger_1.default.debug(`Sequence provider sending input: ${renderedInput}`);
            const response = await context.originalProvider.callApi(renderedInput, context, options);
            if (response.error) {
                return response;
            }
            responses.push(response.output);
            (0, tokenUsageUtils_1.accumulateResponseTokenUsage)(accumulatedTokenUsage, response);
        }
        return {
            output: responses.join(this.separator),
            tokenUsage: accumulatedTokenUsage,
        };
    }
    toString() {
        return `[Sequence Provider]`;
    }
}
exports.SequenceProvider = SequenceProvider;
//# sourceMappingURL=sequence.js.map