"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleFinishReason = handleFinishReason;
const invariant_1 = __importDefault(require("../util/invariant"));
function handleFinishReason({ assertion, renderedValue, providerResponse, }) {
    const value = renderedValue ?? assertion.value;
    (0, invariant_1.default)(typeof value === 'string', '"finish-reason" assertion type must have a string value');
    if (!providerResponse.finishReason) {
        return {
            pass: false,
            score: 0,
            reason: 'Provider did not supply stop/finish reason',
            assertion,
        };
    }
    // Case-insensitive comparison to be more user-friendly
    const normalizedValue = value.toLowerCase();
    const normalizedFinishReason = providerResponse.finishReason.toLowerCase();
    const pass = normalizedValue === normalizedFinishReason;
    return {
        pass,
        score: pass ? 1 : 0,
        reason: pass
            ? 'Assertion passed'
            : `Expected finish reason "${value}" but got "${providerResponse.finishReason}"`,
        assertion,
    };
}
//# sourceMappingURL=finishReason.js.map