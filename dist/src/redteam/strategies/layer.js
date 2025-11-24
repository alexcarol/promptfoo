"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addLayerTestCases = addLayerTestCases;
const logger_1 = __importDefault(require("../../logger"));
const util_1 = require("./util");
async function addLayerTestCases(testCases, injectVar, config, strategies, loadStrategy) {
    // Compose strategies in-order. Config example:
    // { steps: [ 'base64', { id: 'rot13' } ] }
    const steps = Array.isArray(config?.steps)
        ? config.steps
        : [];
    if (steps.length === 0) {
        logger_1.default.warn('layer strategy: no steps provided; returning empty');
        return [];
    }
    let current = testCases;
    for (const step of steps) {
        const stepObj = typeof step === 'string' ? { id: step } : step;
        let stepAction;
        try {
            if (stepObj.id.startsWith('file://')) {
                const loaded = await loadStrategy(stepObj.id);
                stepAction = loaded.action;
            }
            else {
                // Try exact match first, then base id before ':'
                let builtin = strategies.find((s) => s.id === stepObj.id);
                if (!builtin && stepObj.id.includes(':')) {
                    const baseId = stepObj.id.split(':')[0];
                    builtin = strategies.find((s) => s.id === baseId);
                }
                stepAction = builtin?.action;
            }
        }
        catch (e) {
            logger_1.default.error(`layer strategy: error loading step ${stepObj.id}: ${e}`);
            stepAction = undefined;
        }
        if (!stepAction) {
            logger_1.default.warn(`layer strategy: step ${stepObj.id} not registered, skipping`);
            continue;
        }
        // Determine applicable test cases for this step using the same targeting rules
        const stepTargets = stepObj.config?.plugins ?? config?.plugins;
        const applicable = current.filter((t) => (0, util_1.pluginMatchesStrategyTargets)(t, stepObj.id, stepTargets));
        const next = await stepAction(applicable, injectVar, {
            ...(stepObj.config || {}),
            ...(config || {}),
        });
        // Feed output to next step. If a step yields nothing, subsequent steps operate on empty set.
        current = next;
    }
    return current;
}
//# sourceMappingURL=layer.js.map