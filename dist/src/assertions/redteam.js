"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRedteam = void 0;
const graders_1 = require("../redteam/graders");
const invariant_1 = __importDefault(require("../util/invariant"));
/**
 * As the name implies, this function "handles" redteam assertions by either calling the
 * grader or preferably returning a `storedGraderResult` if it exists on the provider response.
 */
const handleRedteam = async ({ assertion, baseType, test, prompt, outputString, provider, renderedValue, providerResponse, }) => {
    // Skip grading if stored result exists from strategy execution for this specific assertion
    if (providerResponse.metadata?.storedGraderResult &&
        test.metadata?.pluginId &&
        assertion.type.includes(test.metadata.pluginId)) {
        const storedResult = providerResponse.metadata.storedGraderResult;
        return {
            ...storedResult,
            assertion: {
                ...(storedResult.assertion ?? assertion),
                value: storedResult.assertion?.value || assertion.value,
            },
            metadata: {
                ...test.metadata,
                ...storedResult.metadata,
            },
        };
    }
    const grader = (0, graders_1.getGraderById)(assertion.type);
    (0, invariant_1.default)(grader, `Unknown grader: ${baseType}`);
    (0, invariant_1.default)(prompt, `Grader ${baseType} must have a prompt`);
    const { grade, rubric, suggestions } = await grader.getResult(prompt, outputString, test, provider, renderedValue);
    return {
        ...grade,
        ...(grade.assertion || assertion
            ? {
                assertion: {
                    ...(grade.assertion ?? assertion),
                    value: rubric,
                },
            }
            : {}),
        suggestions,
        metadata: {
            // Pass through all test metadata for redteam
            ...test.metadata,
            ...grade.metadata,
        },
    };
};
exports.handleRedteam = handleRedteam;
//# sourceMappingURL=redteam.js.map