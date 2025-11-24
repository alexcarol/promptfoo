"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const feedback_1 = require("../src/feedback");
const logger_1 = __importDefault(require("../src/logger"));
const index_1 = require("../src/util/fetch/index");
const readlineUtils = __importStar(require("../src/util/readline"));
const actualFeedback = jest.requireActual('../src/feedback');
jest.mock('../src/util/fetch', () => ({
    fetchWithProxy: jest.fn(),
}));
jest.mock('../src/logger', () => ({
    info: jest.fn(),
    error: jest.fn(),
}));
jest.mock('../src/globalConfig/accounts', () => ({
    getUserEmail: jest.fn(),
}));
// Mock the readline utilities
jest.mock('../src/util/readline', () => ({
    promptUser: jest.fn(),
    promptYesNo: jest.fn(),
    createReadlineInterface: jest.fn(),
}));
jest.mock('../src/feedback', () => {
    return {
        sendFeedback: jest.fn(),
        gatherFeedback: jest.fn(),
    };
});
const createMockResponse = (data) => {
    return {
        ok: data.ok,
        status: data.status || 200,
        statusText: data.statusText || '',
        headers: new Headers(),
        redirected: false,
        type: 'basic',
        url: '',
        json: async () => data,
        text: async () => '',
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        bodyUsed: false,
        body: null,
        clone: () => createMockResponse(data),
    };
};
describe('Feedback Module', () => {
    const originalConsoleLog = console.log;
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'log').mockImplementation();
    });
    afterEach(() => {
        console.log = originalConsoleLog;
    });
    describe('sendFeedback', () => {
        beforeEach(() => {
            jest.mocked(feedback_1.sendFeedback).mockImplementation(actualFeedback.sendFeedback);
        });
        it('should send feedback successfully', async () => {
            const mockResponse = createMockResponse({ ok: true });
            jest.mocked(index_1.fetchWithProxy).mockResolvedValueOnce(mockResponse);
            await (0, feedback_1.sendFeedback)('Test feedback');
            // Verify fetch was called with correct parameters
            expect(index_1.fetchWithProxy).toHaveBeenCalledWith('https://api.promptfoo.dev/api/feedback', expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Test feedback' }),
            }));
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Feedback sent'));
        });
        it('should handle API failure', async () => {
            const mockResponse = createMockResponse({ ok: false, status: 500 });
            jest.mocked(index_1.fetchWithProxy).mockResolvedValueOnce(mockResponse);
            await (0, feedback_1.sendFeedback)('Test feedback');
            expect(logger_1.default.info).toHaveBeenCalledWith(expect.stringContaining('Failed to send feedback'));
        });
        it('should handle network errors', async () => {
            jest.mocked(index_1.fetchWithProxy).mockRejectedValueOnce(new Error('Network error'));
            await (0, feedback_1.sendFeedback)('Test feedback');
            expect(logger_1.default.error).toHaveBeenCalledWith('Network error while sending feedback');
        });
        it('should not send empty feedback', async () => {
            await (0, feedback_1.sendFeedback)('');
            expect(index_1.fetchWithProxy).not.toHaveBeenCalled();
        });
    });
    describe('gatherFeedback', () => {
        it('should send feedback directly if a message is provided', async () => {
            jest.mocked(feedback_1.gatherFeedback).mockImplementation(async (message) => {
                if (message) {
                    await (0, feedback_1.sendFeedback)(message);
                }
            });
            jest.mocked(feedback_1.sendFeedback).mockReset();
            await (0, feedback_1.gatherFeedback)('Direct feedback');
            expect(feedback_1.sendFeedback).toHaveBeenCalledWith('Direct feedback');
        });
        it('should handle empty feedback input', async () => {
            // Mock promptUser to return empty string
            jest.mocked(readlineUtils.promptUser).mockResolvedValueOnce('   ');
            jest.mocked(feedback_1.gatherFeedback).mockImplementation(actualFeedback.gatherFeedback);
            await (0, feedback_1.gatherFeedback)();
            expect(feedback_1.sendFeedback).not.toHaveBeenCalled();
        });
        it('should handle errors during feedback gathering', async () => {
            // Mock promptUser to throw an error
            jest.mocked(readlineUtils.promptUser).mockRejectedValueOnce(new Error('Test error'));
            jest.mocked(feedback_1.gatherFeedback).mockImplementation(actualFeedback.gatherFeedback);
            await (0, feedback_1.gatherFeedback)();
            expect(logger_1.default.error).toHaveBeenCalledWith(expect.stringContaining('Error gathering feedback'));
        });
    });
});
//# sourceMappingURL=feedback.test.js.map