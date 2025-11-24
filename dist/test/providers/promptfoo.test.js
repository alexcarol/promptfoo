"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const envars_1 = require("../../src/envars");
const accounts_1 = require("../../src/globalConfig/accounts");
const promptfoo_1 = require("../../src/providers/promptfoo");
const index_1 = require("../../src/util/fetch/index");
jest.mock('../../src/cache');
jest.mock('../../src/envars');
jest.mock('../../src/util/fetch/index.ts');
jest.mock('../../src/globalConfig/accounts');
jest.mock('../../src/globalConfig/cloud', () => ({
    CloudConfig: class {
        isEnabled() {
            return false;
        }
        getApiHost() {
            return 'https://api.promptfoo.app';
        }
    },
}));
describe('PromptfooHarmfulCompletionProvider', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
        jest.mocked(envars_1.getEnvString).mockReturnValue('');
        jest.mocked(envars_1.getEnvBool).mockReturnValue(false);
    });
    const options = {
        harmCategory: 'test-category',
        n: 1,
        purpose: 'test-purpose',
    };
    const provider = new promptfoo_1.PromptfooHarmfulCompletionProvider(options);
    it('should initialize with correct options', () => {
        expect(provider.harmCategory).toBe(options.harmCategory);
        expect(provider.n).toBe(options.n);
        expect(provider.purpose).toBe(options.purpose);
    });
    it('should return correct id', () => {
        expect(provider.id()).toBe('promptfoo:redteam:test-category');
    });
    it('should return correct string representation', () => {
        expect(provider.toString()).toBe('[Promptfoo Harmful Completion Provider test-purpose - test-category]');
    });
    it('should handle successful API call', async () => {
        const mockResponse = new Response(JSON.stringify({ output: 'test output' }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result).toEqual({ output: ['test output'] });
    });
    it('should filter out null and undefined values from output array', async () => {
        const mockResponse = new Response(JSON.stringify({ output: ['value1', null, 'value2', undefined] }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result).toEqual({ output: ['value1', 'value2'] });
    });
    it('should handle null output by returning empty array', async () => {
        const mockResponse = new Response(JSON.stringify({ output: null }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result).toEqual({ output: [] });
    });
    it('should handle API error', async () => {
        const mockResponse = new Response('API Error', {
            status: 400,
            statusText: 'Bad Request',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result.error).toContain('[HarmfulCompletionProvider]');
    });
    it('should return error when PROMPTFOO_DISABLE_REMOTE_GENERATION is set', async () => {
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REMOTE_GENERATION');
        const result = await provider.callApi('test prompt');
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('Harmful content generation requires');
        expect(result.error).toContain('PROMPTFOO_DISABLE_REMOTE_GENERATION');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
    it('should return error when PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION is set', async () => {
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        const result = await provider.callApi('test prompt');
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('Harmful content generation requires');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
});
describe('PromptfooChatCompletionProvider', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
        jest.mocked(envars_1.getEnvString).mockReturnValue('');
        jest.mocked(envars_1.getEnvBool).mockReturnValue(false);
    });
    const options = {
        jsonOnly: true,
        preferSmallModel: false,
        task: 'crescendo',
    };
    const provider = new promptfoo_1.PromptfooChatCompletionProvider(options);
    it('should return correct id', () => {
        expect(provider.id()).toBe('promptfoo:chatcompletion');
    });
    it('should return correct string representation', () => {
        expect(provider.toString()).toBe('[Promptfoo Chat Completion Provider]');
    });
    it('should handle successful API call', async () => {
        const mockResponse = new Response(JSON.stringify({
            result: 'test result',
            tokenUsage: { total: 100 },
        }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result).toEqual({
            output: 'test result',
            tokenUsage: { total: 100 },
        });
    });
    it('should handle missing result', async () => {
        const mockResponse = new Response(JSON.stringify({
            result: null,
        }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi('test prompt');
        expect(result.error).toBe('LLM did not return a result, likely refusal');
    });
    it('should handle API error', async () => {
        jest.mocked(index_1.fetchWithRetries).mockRejectedValue(new Error('API Error'));
        const result = await provider.callApi('test prompt');
        expect(result.error).toBe('API call error: Error: API Error');
    });
    it('should return error when PROMPTFOO_DISABLE_REMOTE_GENERATION is set', async () => {
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REMOTE_GENERATION');
        const result = await provider.callApi('test prompt');
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('This red team strategy requires');
        expect(result.error).toContain('PROMPTFOO_DISABLE_REMOTE_GENERATION');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
    it('should return error when PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION is set', async () => {
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        const result = await provider.callApi('test prompt');
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('This red team strategy requires');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
});
describe('PromptfooSimulatedUserProvider', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.mocked(accounts_1.getUserEmail).mockReturnValue('test@example.com');
        jest.mocked(envars_1.getEnvBool).mockReturnValue(false);
    });
    const options = {
        id: 'test-agent',
        instructions: 'test instructions',
    };
    const provider = new promptfoo_1.PromptfooSimulatedUserProvider(options, 'test-id');
    it('should return correct id', () => {
        expect(provider.id()).toBe('test-agent');
    });
    it('should return default id if not provided', () => {
        const defaultProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, 'test-id');
        expect(defaultProvider.id()).toBe('promptfoo:agent');
    });
    it('should return correct string representation', () => {
        expect(provider.toString()).toBe('[Promptfoo Agent Provider]');
    });
    it('should handle successful API call', async () => {
        const mockResponse = new Response(JSON.stringify({
            result: 'test result',
            tokenUsage: { total: 100 },
        }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result).toEqual({
            output: 'test result',
            tokenUsage: { total: 100 },
        });
    });
    it('should handle API error response', async () => {
        const mockResponse = new Response('API Error', {
            status: 400,
            statusText: 'Bad Request',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await provider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toContain('API call error');
    });
    it('should handle API call exception', async () => {
        jest.mocked(index_1.fetchWithRetries).mockRejectedValue(new Error('Network Error'));
        const result = await provider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toBe('API call error: Error: Network Error');
    });
    it('should return error when PROMPTFOO_DISABLE_REMOTE_GENERATION is set for regular task', async () => {
        const regularProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, 'tau');
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REMOTE_GENERATION');
        const result = await regularProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('SimulatedUser requires');
        expect(result.error).toContain('PROMPTFOO_DISABLE_REMOTE_GENERATION');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
    it('should NOT be disabled when PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION is set for regular task', async () => {
        const regularProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, 'tau');
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        const mockResponse = new Response(JSON.stringify({
            result: 'test result',
            tokenUsage: { total: 100 },
        }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        const result = await regularProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toBeUndefined();
        expect(result.output).toBe('test result');
        expect(index_1.fetchWithRetries).toHaveBeenCalled();
    });
    it('should return error when PROMPTFOO_DISABLE_REMOTE_GENERATION is set for redteam task', async () => {
        const redteamProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, promptfoo_1.REDTEAM_SIMULATED_USER_TASK_ID);
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REMOTE_GENERATION');
        const result = await redteamProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('PROMPTFOO_DISABLE_REMOTE_GENERATION or PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
    it('should return error when PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION is set for redteam task', async () => {
        const redteamProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, promptfoo_1.REDTEAM_SIMULATED_USER_TASK_ID);
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        const result = await redteamProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(result.error).toContain('Remote generation is disabled');
        expect(result.error).toContain('PROMPTFOO_DISABLE_REMOTE_GENERATION or PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
    it('should show integration: regular SimulatedUser works while redteam is disabled', async () => {
        // This is the key feature: PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION should
        // NOT affect regular (non-redteam) SimulatedUser tasks
        const regularProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, 'tau');
        const redteamProvider = new promptfoo_1.PromptfooSimulatedUserProvider({}, promptfoo_1.REDTEAM_SIMULATED_USER_TASK_ID);
        // Set only the redteam-specific flag
        jest
            .mocked(envars_1.getEnvBool)
            .mockImplementation((key) => key === 'PROMPTFOO_DISABLE_REDTEAM_REMOTE_GENERATION');
        const mockResponse = new Response(JSON.stringify({
            result: 'regular user response',
            tokenUsage: { total: 50 },
        }), {
            status: 200,
            statusText: 'OK',
        });
        jest.mocked(index_1.fetchWithRetries).mockResolvedValue(mockResponse);
        // Regular task should work
        const regularResult = await regularProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(regularResult.error).toBeUndefined();
        expect(regularResult.output).toBe('regular user response');
        expect(index_1.fetchWithRetries).toHaveBeenCalled();
        // Reset fetch mock
        jest.mocked(index_1.fetchWithRetries).mockClear();
        // Redteam task should be blocked
        const redteamResult = await redteamProvider.callApi(JSON.stringify([{ role: 'user', content: 'hello' }]));
        expect(redteamResult.error).toContain('Remote generation is disabled');
        expect(index_1.fetchWithRetries).not.toHaveBeenCalled();
    });
});
//# sourceMappingURL=promptfoo.test.js.map