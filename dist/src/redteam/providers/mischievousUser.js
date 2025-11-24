"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promptfoo_1 = require("../../providers/promptfoo");
const simulatedUser_1 = require("../../providers/simulatedUser");
const invariant_1 = __importDefault(require("../../util/invariant"));
const shared_1 = require("./shared");
const PROVIDER_ID = 'promptfoo:redteam:mischievous-user';
class RedteamMischievousUserProvider extends simulatedUser_1.SimulatedUser {
    constructor(config) {
        (0, invariant_1.default)(config.injectVar, 'Expected injectVar to be set');
        super({
            id: PROVIDER_ID,
            config: {
                instructions: `{{${config.injectVar}}}`,
                maxTurns: config.maxTurns ?? 5,
                stateful: config.stateful ?? false,
            },
        });
        // Cloud task:
        this.taskId = promptfoo_1.REDTEAM_SIMULATED_USER_TASK_ID;
    }
    id() {
        return PROVIDER_ID;
    }
    serializeOutput(messages, tokenUsage, finalTargetResponse, sessionId) {
        return {
            output: (0, shared_1.getLastMessageContent)(messages, 'assistant') || '',
            tokenUsage,
            metadata: {
                redteamFinalPrompt: (0, shared_1.getLastMessageContent)(messages, 'user') || '',
                messages,
                redteamHistory: (0, shared_1.messagesToRedteamHistory)(messages),
                sessionId,
            },
            guardrails: finalTargetResponse.guardrails,
            sessionId,
        };
    }
}
exports.default = RedteamMischievousUserProvider;
//# sourceMappingURL=mischievousUser.js.map