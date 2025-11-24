"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmptyCompletionDetails = createEmptyCompletionDetails;
exports.createEmptyAssertions = createEmptyAssertions;
exports.createEmptyTokenUsage = createEmptyTokenUsage;
exports.accumulateTokenUsage = accumulateTokenUsage;
exports.accumulateAssertionTokenUsage = accumulateAssertionTokenUsage;
exports.accumulateResponseTokenUsage = accumulateResponseTokenUsage;
/**
 * Helper to create empty completion details
 */
function createEmptyCompletionDetails() {
    return {
        reasoning: 0,
        acceptedPrediction: 0,
        rejectedPrediction: 0,
    };
}
/**
 * Create an empty assertions token usage object.
 */
function createEmptyAssertions() {
    return {
        total: 0,
        prompt: 0,
        completion: 0,
        cached: 0,
        numRequests: 0,
        completionDetails: createEmptyCompletionDetails(),
    };
}
/**
 * Create an empty token usage object with all fields initialized to zero.
 */
function createEmptyTokenUsage() {
    return {
        prompt: 0,
        completion: 0,
        cached: 0,
        total: 0,
        numRequests: 0,
        completionDetails: createEmptyCompletionDetails(),
        assertions: createEmptyAssertions(),
    };
}
/**
 * Helper to accumulate numeric values
 */
function addNumbers(a, b) {
    return (a ?? 0) + (b ?? 0);
}
/**
 * Helper to accumulate completion details
 */
function accumulateCompletionDetails(target, update) {
    if (!update) {
        return target;
    }
    return {
        reasoning: addNumbers(target?.reasoning, update.reasoning),
        acceptedPrediction: addNumbers(target?.acceptedPrediction, update.acceptedPrediction),
        rejectedPrediction: addNumbers(target?.rejectedPrediction, update.rejectedPrediction),
    };
}
/**
 * Accumulate token usage into a target object. Mutates {@code target}.
 * @param target Object to update
 * @param update Usage to add
 * @param incrementRequests Whether to increment numRequests when update is provided but doesn't specify numRequests
 */
function accumulateTokenUsage(target, update, incrementRequests = false) {
    if (!update) {
        return;
    }
    // Accumulate basic fields
    target.prompt = addNumbers(target.prompt, update.prompt);
    target.completion = addNumbers(target.completion, update.completion);
    target.cached = addNumbers(target.cached, update.cached);
    target.total = addNumbers(target.total, update.total);
    // Handle numRequests
    if (update.numRequests !== undefined) {
        target.numRequests = addNumbers(target.numRequests, update.numRequests);
    }
    else if (incrementRequests) {
        target.numRequests = (target.numRequests ?? 0) + 1;
    }
    // Handle completion details
    if (update.completionDetails) {
        target.completionDetails = accumulateCompletionDetails(target.completionDetails, update.completionDetails);
    }
    // Handle assertions
    if (update.assertions) {
        if (!target.assertions) {
            target.assertions = {
                total: 0,
                prompt: 0,
                completion: 0,
                cached: 0,
                numRequests: 0,
            };
        }
        target.assertions.total = addNumbers(target.assertions.total, update.assertions.total);
        target.assertions.prompt = addNumbers(target.assertions.prompt, update.assertions.prompt);
        target.assertions.completion = addNumbers(target.assertions.completion, update.assertions.completion);
        target.assertions.cached = addNumbers(target.assertions.cached, update.assertions.cached);
        target.assertions.numRequests = addNumbers(target.assertions.numRequests, update.assertions.numRequests);
        if (update.assertions.completionDetails) {
            target.assertions.completionDetails = accumulateCompletionDetails(target.assertions.completionDetails, update.assertions.completionDetails);
        }
    }
}
/**
 * Accumulate token usage specifically for assertions.
 * This function operates directly on an assertions object rather than a full TokenUsage object.
 * @param target Assertions object to update
 * @param update Partial token usage that may contain assertion-related fields
 */
function accumulateAssertionTokenUsage(target, update) {
    if (!update) {
        return;
    }
    // Accumulate basic token counts
    target.total = addNumbers(target.total, update.total);
    target.prompt = addNumbers(target.prompt, update.prompt);
    target.completion = addNumbers(target.completion, update.completion);
    target.cached = addNumbers(target.cached, update.cached);
    // Note: We don't accumulate numRequests from the update for assertions
    // to maintain separation between provider and assertion request counts
    // Handle completion details
    if (update.completionDetails) {
        target.completionDetails = accumulateCompletionDetails(target.completionDetails, update.completionDetails);
    }
}
/**
 * Accumulate token usage from a response, handling the common pattern of
 * incrementing numRequests when no token usage is provided.
 * @param target Object to update
 * @param response Response that may contain token usage
 */
function accumulateResponseTokenUsage(target, response) {
    if (response?.tokenUsage) {
        accumulateTokenUsage(target, response.tokenUsage);
        // Increment numRequests if not already present in tokenUsage
        if (response.tokenUsage.numRequests === undefined) {
            target.numRequests = (target.numRequests ?? 0) + 1;
        }
    }
    else if (response) {
        // Only increment numRequests if we got a response but no token usage
        target.numRequests = (target.numRequests ?? 0) + 1;
    }
}
//# sourceMappingURL=tokenUsageUtils.js.map