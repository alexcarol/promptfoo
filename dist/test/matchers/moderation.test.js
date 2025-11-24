"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const matchers_1 = require("../../src/matchers");
const moderation_1 = require("../../src/providers/openai/moderation");
const replicate_1 = require("../../src/providers/replicate");
const constants_1 = require("../../src/redteam/constants");
describe('matchesModeration', () => {
    const mockModerationResponse = {
        flags: [],
        tokenUsage: { total: 5, prompt: 2, completion: 3 },
    };
    beforeEach(() => {
        // Clear all environment variables
        delete process.env.OPENAI_API_KEY;
        delete process.env.REPLICATE_API_KEY;
        delete process.env.REPLICATE_API_TOKEN;
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should skip moderation when assistant response is empty', async () => {
        const openAiSpy = jest
            .spyOn(moderation_1.OpenAiModerationProvider.prototype, 'callModerationApi')
            .mockResolvedValue(mockModerationResponse);
        const result = await (0, matchers_1.matchesModeration)({
            userPrompt: 'test prompt',
            assistantResponse: '',
        });
        expect(result).toEqual({
            pass: true,
            score: 1,
            reason: expect.any(String),
        });
        expect(openAiSpy).not.toHaveBeenCalled();
    });
    it('should use OpenAI when OPENAI_API_KEY is present', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        const openAiSpy = jest
            .spyOn(moderation_1.OpenAiModerationProvider.prototype, 'callModerationApi')
            .mockResolvedValue(mockModerationResponse);
        await (0, matchers_1.matchesModeration)({
            userPrompt: 'test prompt',
            assistantResponse: 'test response',
        });
        expect(openAiSpy).toHaveBeenCalledWith('test prompt', 'test response');
    });
    it('should fallback to Replicate when only REPLICATE_API_KEY is present', async () => {
        process.env.REPLICATE_API_KEY = 'test-key';
        const replicateSpy = jest
            .spyOn(replicate_1.ReplicateModerationProvider.prototype, 'callModerationApi')
            .mockResolvedValue(mockModerationResponse);
        await (0, matchers_1.matchesModeration)({
            userPrompt: 'test prompt',
            assistantResponse: 'test response',
        });
        expect(replicateSpy).toHaveBeenCalledWith('test prompt', 'test response');
    });
    it('should respect provider override in grading config', async () => {
        process.env.OPENAI_API_KEY = 'test-key';
        const replicateSpy = jest
            .spyOn(replicate_1.ReplicateModerationProvider.prototype, 'callModerationApi')
            .mockResolvedValue(mockModerationResponse);
        await (0, matchers_1.matchesModeration)({
            userPrompt: 'test prompt',
            assistantResponse: 'test response',
        }, {
            provider: constants_1.LLAMA_GUARD_REPLICATE_PROVIDER,
        });
        expect(replicateSpy).toHaveBeenCalledWith('test prompt', 'test response');
    });
});
//# sourceMappingURL=moderation.test.js.map