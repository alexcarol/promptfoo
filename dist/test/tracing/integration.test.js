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
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Define the mock provider class
class MockTracedProviderInstance {
    id() {
        return 'mock-traced-provider';
    }
    async callApi(prompt, context) {
        if (context.traceparent) {
            return {
                output: `Traced response for: ${prompt}`,
                metadata: {
                    traceparent: context.traceparent,
                    evaluationId: context.evaluationId,
                    testCaseId: context.testCaseId,
                },
            };
        }
        return {
            output: `Untraced response for: ${prompt}`,
        };
    }
}
const mockProvider = new MockTracedProviderInstance();
// Mock providers using doMock
globals_1.jest.doMock('../../src/providers', () => {
    const actual = globals_1.jest.requireActual('../../src/providers');
    return {
        ...actual,
        loadApiProvider: globals_1.jest.fn(async (providerPath) => {
            if (providerPath === 'mock-traced-provider') {
                return mockProvider;
            }
            // Fall back to original for other providers
            return actual.loadApiProvider(providerPath);
        }),
        loadApiProviders: globals_1.jest.fn(async (providers) => {
            if (Array.isArray(providers) && providers.includes('mock-traced-provider')) {
                return [mockProvider];
            }
            if (providers === 'mock-traced-provider') {
                return [mockProvider];
            }
            return [mockProvider]; // Default to mock for tests
        }),
    };
});
// Dynamic import after mocking
let evaluate;
(0, globals_1.describe)('OpenTelemetry Tracing Integration', () => {
    (0, globals_1.beforeEach)(async () => {
        globals_1.jest.clearAllMocks();
        if (!evaluate) {
            const module = await Promise.resolve().then(() => __importStar(require('../../src/index')));
            evaluate = module.evaluate;
        }
    });
    (0, globals_1.afterEach)(() => {
        globals_1.jest.restoreAllMocks();
    });
    (0, globals_1.it)('should pass trace context to providers when tracing is enabled', async () => {
        const config = {
            providers: ['mock-traced-provider'],
            prompts: ['Test prompt'],
            tests: [
                {
                    vars: { topic: 'testing' },
                },
            ],
            tracing: {
                enabled: true,
                otlp: {
                    http: {
                        enabled: true,
                        port: 4318,
                        host: '0.0.0.0',
                        acceptFormats: ['json'],
                    },
                },
            },
        };
        // Run evaluation
        const results = await evaluate(config, {
            cache: false,
            maxConcurrency: 1,
        });
        // Check that results contain trace context
        (0, globals_1.expect)(results.results).toBeDefined();
        (0, globals_1.expect)(results.results.length).toBeGreaterThan(0);
        const firstResult = results.results[0];
        (0, globals_1.expect)(firstResult.response).toBeDefined();
        (0, globals_1.expect)(firstResult.response?.metadata).toBeDefined();
        (0, globals_1.expect)(firstResult.response?.metadata?.traceparent).toBeDefined();
        (0, globals_1.expect)(firstResult.response?.metadata?.traceparent).toMatch(/^00-[a-f0-9]{32}-[a-f0-9]{16}-01$/);
        (0, globals_1.expect)(firstResult.response?.metadata?.evaluationId).toBeDefined();
        (0, globals_1.expect)(firstResult.response?.metadata?.testCaseId).toBeDefined();
    });
    (0, globals_1.it)('should not pass trace context when tracing is disabled', async () => {
        const config = {
            providers: ['mock-traced-provider'],
            prompts: ['Test prompt'],
            tests: [
                {
                    vars: { topic: 'testing' },
                },
            ],
            tracing: {
                enabled: false,
            },
        };
        // Run evaluation
        const results = await evaluate(config, {
            cache: false,
            maxConcurrency: 1,
        });
        // Check that results do not contain trace context
        (0, globals_1.expect)(results.results).toBeDefined();
        (0, globals_1.expect)(results.results.length).toBeGreaterThan(0);
        const firstResult = results.results[0];
        (0, globals_1.expect)(firstResult.response).toBeDefined();
        (0, globals_1.expect)(firstResult.response?.metadata?.traceparent).toBeUndefined();
        (0, globals_1.expect)(firstResult.response?.output).toContain('Untraced response');
    });
    (0, globals_1.it)('should generate unique trace IDs for each test case', async () => {
        const config = {
            providers: ['mock-traced-provider'],
            prompts: ['Prompt 1', 'Prompt 2'],
            tests: [{ vars: { topic: 'test1' } }, { vars: { topic: 'test2' } }],
            tracing: {
                enabled: true,
            },
        };
        // Run evaluation
        const results = await evaluate(config, {
            cache: false,
            maxConcurrency: 1,
        });
        // Collect all trace IDs
        const traceIds = results.results
            .map((r) => r.response?.metadata?.traceparent)
            .filter(Boolean)
            .map((tp) => tp.split('-')[1]); // Extract trace ID from traceparent
        // All trace IDs should be unique
        const uniqueTraceIds = new Set(traceIds);
        (0, globals_1.expect)(uniqueTraceIds.size).toBe(traceIds.length);
    });
    (0, globals_1.it)('should respect environment variable for enabling tracing', async () => {
        // Set environment variable
        process.env.PROMPTFOO_TRACING_ENABLED = 'true';
        const config = {
            providers: ['mock-traced-provider'],
            prompts: ['Test prompt'],
            tests: [{ vars: { topic: 'testing' } }],
            // No tracing config in YAML
        };
        // Run evaluation
        const results = await evaluate(config, {
            cache: false,
            maxConcurrency: 1,
        });
        // Should have trace context from environment variable
        (0, globals_1.expect)(results.results[0].response).toBeDefined();
        (0, globals_1.expect)(results.results[0].response?.metadata?.traceparent).toBeDefined();
        // Clean up
        delete process.env.PROMPTFOO_TRACING_ENABLED;
    });
});
//# sourceMappingURL=integration.test.js.map