"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const input_1 = __importDefault(require("@inquirer/input"));
const chalk_1 = __importDefault(require("chalk"));
const envars_1 = require("../../src/envars");
const accounts_1 = require("../../src/globalConfig/accounts");
const globalConfig_1 = require("../../src/globalConfig/globalConfig");
const logger_1 = __importDefault(require("../../src/logger"));
const telemetry_1 = __importDefault(require("../../src/telemetry"));
const index_1 = require("../../src/util/fetch/index");
// Mock fetchWithTimeout before any imports that might use telemetry
jest.mock('../../src/util/fetch', () => ({
    fetchWithTimeout: jest.fn().mockResolvedValue({ ok: true }),
}));
jest.mock('@inquirer/input');
jest.mock('../../src/envars');
jest.mock('../../src/telemetry', () => {
    const mockTelemetry = {
        record: jest.fn().mockResolvedValue(undefined),
        identify: jest.fn(),
        saveConsent: jest.fn().mockResolvedValue(undefined),
        disabled: false,
    };
    return {
        __esModule: true,
        default: mockTelemetry,
        Telemetry: jest.fn().mockImplementation(() => mockTelemetry),
    };
});
jest.mock('../../src/util/fetch/index.ts');
jest.mock('../../src/telemetry');
jest.mock('../../src/util');
describe('accounts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('getUserId', () => {
        it('should return existing ID from global config', () => {
            const existingId = 'existing-test-id';
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: existingId,
                account: { email: 'test@example.com' },
            });
            const result = (0, accounts_1.getUserId)();
            expect(result).toBe(existingId);
            expect(globalConfig_1.writeGlobalConfig).not.toHaveBeenCalled();
        });
        it('should generate new ID and save to config when no ID exists', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
            });
            const result = (0, accounts_1.getUserId)();
            // Should return a UUID-like string
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            // Should have saved the config with the new ID
            expect(globalConfig_1.writeGlobalConfig).toHaveBeenCalledWith({
                account: { email: 'test@example.com' },
                id: result,
            });
        });
        it('should generate new ID when global config is null', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue(null);
            const result = (0, accounts_1.getUserId)();
            // Should return a UUID-like string
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            // Should have saved the config with the new ID
            expect(globalConfig_1.writeGlobalConfig).toHaveBeenCalledWith({
                id: result,
            });
        });
        it('should generate new ID when global config is undefined', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue(undefined);
            const result = (0, accounts_1.getUserId)();
            // Should return a UUID-like string
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            // Should have saved the config with the new ID
            expect(globalConfig_1.writeGlobalConfig).toHaveBeenCalledWith({
                id: result,
            });
        });
        it('should generate new ID when config exists but has no id property', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
            });
            const result = (0, accounts_1.getUserId)();
            // Should return a UUID-like string
            expect(typeof result).toBe('string');
            expect(result).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
            // Should have saved the config with the new ID
            expect(globalConfig_1.writeGlobalConfig).toHaveBeenCalledWith({
                account: { email: 'test@example.com' },
                id: result,
            });
        });
    });
    describe('getUserEmail', () => {
        it('should return email from global config', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            expect((0, accounts_1.getUserEmail)()).toBe('test@example.com');
        });
        it('should return null if no email in config', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
            });
            expect((0, accounts_1.getUserEmail)()).toBeNull();
        });
    });
    describe('setUserEmail', () => {
        it('should write email to global config', () => {
            const email = 'test@example.com';
            (0, accounts_1.setUserEmail)(email);
            expect(globalConfig_1.writeGlobalConfigPartial).toHaveBeenCalledWith({
                account: { email },
            });
        });
    });
    describe('clearUserEmail', () => {
        it('should remove email from global config when email exists', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            (0, accounts_1.clearUserEmail)();
            expect(globalConfig_1.writeGlobalConfigPartial).toHaveBeenCalledWith({
                account: {},
            });
        });
        it('should handle clearing when no account exists', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
            });
            (0, accounts_1.clearUserEmail)();
            expect(globalConfig_1.writeGlobalConfigPartial).toHaveBeenCalledWith({
                account: {},
            });
        });
        it('should handle clearing when global config is empty', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({});
            (0, accounts_1.clearUserEmail)();
            expect(globalConfig_1.writeGlobalConfigPartial).toHaveBeenCalledWith({
                account: {},
            });
        });
    });
    describe('getAuthor', () => {
        it('should return env var if set', () => {
            jest.mocked(envars_1.getEnvString).mockReturnValue('author@env.com');
            expect((0, accounts_1.getAuthor)()).toBe('author@env.com');
        });
        it('should fall back to user email if no env var', () => {
            jest.mocked(envars_1.getEnvString).mockReturnValue('');
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            expect((0, accounts_1.getAuthor)()).toBe('test@example.com');
        });
        it('should return null if no author found', () => {
            jest.mocked(envars_1.getEnvString).mockReturnValue('');
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
            });
            expect((0, accounts_1.getAuthor)()).toBeNull();
        });
    });
    describe('promptForEmailUnverified', () => {
        beforeEach(() => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
            });
        });
        it('should use CI email if in CI environment', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(true);
            await (0, accounts_1.promptForEmailUnverified)();
            expect(telemetry_1.default.saveConsent).not.toHaveBeenCalled();
        });
        it('should not prompt for email if already set', async () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'existing@example.com' },
            });
            await (0, accounts_1.promptForEmailUnverified)();
            expect(input_1.default).not.toHaveBeenCalled();
            // save consent is now called after validation, not in promptForEmailUnverified
            expect(telemetry_1.default.saveConsent).not.toHaveBeenCalled();
        });
        it('should prompt for email and save valid input', async () => {
            jest.mocked(input_1.default).mockResolvedValue('new@example.com');
            await (0, accounts_1.promptForEmailUnverified)();
            expect(globalConfig_1.writeGlobalConfigPartial).toHaveBeenCalledWith({
                account: { email: 'new@example.com' },
            });
            // save consent is now called after validation, not in promptForEmailUnverified
            expect(telemetry_1.default.saveConsent).not.toHaveBeenCalled();
        });
        describe('email validation', () => {
            let validateFn;
            beforeEach(async () => {
                await (0, accounts_1.promptForEmailUnverified)();
                validateFn = jest.mocked(input_1.default).mock.calls[0][0].validate;
            });
            it('should reject invalid email formats with error message', async () => {
                const invalidEmails = [
                    '',
                    'invalid',
                    '@example.com',
                    'user@',
                    'user@.',
                    'user.com',
                    'user@.com',
                    '@.',
                    'user@example.',
                    'user.@example.com',
                    'us..er@example.com',
                ];
                for (const email of invalidEmails) {
                    const result = await validateFn(email);
                    expect(typeof result).toBe('string');
                    expect(result).toBe('Please enter a valid email address');
                }
            });
            it('should accept valid email formats with true', async () => {
                const validEmails = [
                    'valid@example.com',
                    'user.name@example.com',
                    'user+tag@example.com',
                    'user@subdomain.example.com',
                    'user@example.co.uk',
                    '123@example.com',
                    'user-name@example.com',
                    'user_name@example.com',
                ];
                for (const email of validEmails) {
                    await expect(validateFn(email)).toBe(true);
                }
            });
        });
    });
    describe('checkEmailStatusAndMaybeExit', () => {
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined);
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should use CI email when in CI environment', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(true);
            const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(index_1.fetchWithTimeout).toHaveBeenCalledWith(expect.stringContaining('/api/users/status?email=ci-placeholder%40promptfoo.dev'), undefined, 500);
        });
        it('should use user email when not in CI environment', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(index_1.fetchWithTimeout).toHaveBeenCalledWith(expect.stringContaining('/api/users/status?email=test%40example.com'), undefined, 500);
        });
        it('should exit if limit exceeded', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            const mockResponse = new Response(JSON.stringify({ status: 'exceeded_limit' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(mockExit).toHaveBeenCalledWith(1);
            expect(logger_1.default.error).toHaveBeenCalledWith('You have exceeded the maximum cloud inference limit. Please contact inquiries@promptfoo.dev to upgrade your account.');
        });
        it('should display warning message when status is show_usage_warning', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            const warningMessage = 'You are approaching your usage limit';
            const mockResponse = new Response(JSON.stringify({ status: 'show_usage_warning', message: warningMessage }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(logger_1.default.info).toHaveBeenCalledTimes(2);
            expect(logger_1.default.warn).toHaveBeenCalledWith(chalk_1.default.yellow(warningMessage));
            expect(mockExit).not.toHaveBeenCalled();
        });
        it('should return bad_email and not exit when status is risky_email or disposable_email', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            const mockResponse = new Response(JSON.stringify({ status: 'risky_email' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            const result = await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(result).toBe('bad_email');
            expect(logger_1.default.error).toHaveBeenCalledWith('Please use a valid work email.');
            expect(mockExit).not.toHaveBeenCalled();
        });
        it('should handle fetch errors', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                id: 'test-id',
                account: { email: 'test@example.com' },
            });
            jest.mocked(index_1.fetchWithTimeout).mockRejectedValue(new Error('Network error'));
            await (0, accounts_1.checkEmailStatusAndMaybeExit)();
            expect(logger_1.default.debug).toHaveBeenCalledWith('Failed to check user status: Error: Network error');
            expect(mockExit).not.toHaveBeenCalled();
        });
    });
    describe('checkEmailStatus', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should return no_email status when no email is provided', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({});
            const result = await (0, accounts_1.checkEmailStatus)();
            expect(result).toEqual({
                status: 'no_email',
                hasEmail: false,
                message: 'Redteam evals require email verification. Please enter your work email:',
            });
        });
        it('should use CI email when in CI environment', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(true);
            const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            const result = await (0, accounts_1.checkEmailStatus)();
            expect(index_1.fetchWithTimeout).toHaveBeenCalledWith(expect.stringContaining('/api/users/status?email=ci-placeholder%40promptfoo.dev'), undefined, 500);
            expect(result).toEqual({
                status: 'ok',
                hasEmail: true,
                email: 'ci-placeholder@promptfoo.dev',
                message: undefined,
            });
        });
        it('should return exceeded_limit status', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
            });
            const mockResponse = new Response(JSON.stringify({ status: 'exceeded_limit' }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            const result = await (0, accounts_1.checkEmailStatus)();
            expect(result).toEqual({
                status: 'exceeded_limit',
                hasEmail: true,
                email: 'test@example.com',
                message: undefined,
            });
        });
        it('should return show_usage_warning status with message', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
            });
            const warningMessage = 'You are approaching your usage limit';
            const mockResponse = new Response(JSON.stringify({ status: 'show_usage_warning', message: warningMessage }), {
                status: 200,
                statusText: 'OK',
            });
            jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
            const result = await (0, accounts_1.checkEmailStatus)();
            expect(result).toEqual({
                status: 'show_usage_warning',
                hasEmail: true,
                email: 'test@example.com',
                message: warningMessage,
            });
        });
        it('should handle fetch errors gracefully', async () => {
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
            });
            jest.mocked(index_1.fetchWithTimeout).mockRejectedValue(new Error('Network error'));
            const result = await (0, accounts_1.checkEmailStatus)();
            expect(logger_1.default.debug).toHaveBeenCalledWith('Failed to check user status: Error: Network error');
            expect(result).toEqual({
                status: 'ok',
                hasEmail: true,
                email: 'test@example.com',
                message: 'Unable to verify email status, but proceeding',
            });
        });
        describe('with validate option', () => {
            beforeEach(() => {
                jest.mocked(envars_1.isCI).mockReturnValue(false);
                jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                    account: { email: 'test@example.com' },
                });
            });
            it('should call saveConsent for valid email when validate is true', async () => {
                const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
                    status: 200,
                    statusText: 'OK',
                });
                jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
                await (0, accounts_1.checkEmailStatus)({ validate: true });
                expect(telemetry_1.default.saveConsent).toHaveBeenCalledWith('test@example.com', {
                    source: 'promptForEmailValidated',
                });
            });
            it('should call saveConsent for invalid email when validate is true', async () => {
                const mockResponse = new Response(JSON.stringify({ status: 'risky_email' }), {
                    status: 200,
                    statusText: 'OK',
                });
                jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
                await (0, accounts_1.checkEmailStatus)({ validate: true });
                expect(telemetry_1.default.saveConsent).toHaveBeenCalledWith('test@example.com', {
                    source: 'filteredInvalidEmail',
                });
            });
            it('should not call saveConsent when validate is not provided', async () => {
                const mockResponse = new Response(JSON.stringify({ status: 'ok' }), {
                    status: 200,
                    statusText: 'OK',
                });
                jest.mocked(index_1.fetchWithTimeout).mockResolvedValue(mockResponse);
                await (0, accounts_1.checkEmailStatus)();
                expect(telemetry_1.default.saveConsent).not.toHaveBeenCalled();
            });
        });
    });
    describe('isLoggedIntoCloud', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should return true when API key is present (not in CI)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: { apiKey: 'test-api-key' },
            });
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(true);
        });
        it('should return true when API key is present (in CI)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: { apiKey: 'test-api-key' },
            });
            jest.mocked(envars_1.isCI).mockReturnValue(true);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(true);
        });
        it('should return false when no API key is present (not in CI)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: {},
            });
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(false);
        });
        it('should return false when no API key is present (in CI)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: {},
            });
            jest.mocked(envars_1.isCI).mockReturnValue(true);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(false);
        });
        it('should return false when cloud config is missing', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({});
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(false);
        });
        it('should return true with email and API key (backwards compatibility)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
                cloud: { apiKey: 'test-api-key' },
            });
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(true);
        });
        it('should return false with email but no API key', () => {
            // Having email alone is not sufficient for cloud authentication
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
                cloud: {},
            });
            jest.mocked(envars_1.isCI).mockReturnValue(false);
            expect((0, accounts_1.isLoggedIntoCloud)()).toBe(false);
        });
    });
    describe('getAuthMethod', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });
        it('should return "api-key" when API key is present', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: { apiKey: 'test-api-key' },
            });
            expect((0, accounts_1.getAuthMethod)()).toBe('api-key');
        });
        it('should return "api-key" when both API key and email are present', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
                cloud: { apiKey: 'test-api-key' },
            });
            expect((0, accounts_1.getAuthMethod)()).toBe('api-key');
        });
        it('should return "email" when only email is present (no API key)', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                account: { email: 'test@example.com' },
                cloud: {},
            });
            expect((0, accounts_1.getAuthMethod)()).toBe('email');
        });
        it('should return "none" when neither API key nor email is present', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({
                cloud: {},
            });
            expect((0, accounts_1.getAuthMethod)()).toBe('none');
        });
        it('should return "none" when cloud config is missing', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue({});
            expect((0, accounts_1.getAuthMethod)()).toBe('none');
        });
        it('should return "none" when global config is null', () => {
            jest.mocked(globalConfig_1.readGlobalConfig).mockReturnValue(null);
            expect((0, accounts_1.getAuthMethod)()).toBe('none');
        });
    });
});
//# sourceMappingURL=accounts.test.js.map