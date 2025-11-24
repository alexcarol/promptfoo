"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleModelGradedClosedQa = void 0;
const matchers_1 = require("../matchers");
const invariant_1 = __importDefault(require("../util/invariant"));
const handleModelGradedClosedQa = async ({ assertion, renderedValue, outputString, test, prompt, providerCallContext, }) => {
    (0, invariant_1.default)(typeof renderedValue === 'string', 'model-graded-closedqa assertion type must have a string value');
    (0, invariant_1.default)(prompt, 'model-graded-closedqa assertion type must have a prompt');
    // Note: rubricPrompt will be rendered later in matchesClosedQa with proper variables
    // (input, criteria, completion) available at that point
    return {
        assertion,
        ...(await (0, matchers_1.matchesClosedQa)(prompt, renderedValue, outputString, test.options, test.vars, providerCallContext)),
    };
};
exports.handleModelGradedClosedQa = handleModelGradedClosedQa;
//# sourceMappingURL=modelGradedClosedQa.js.map