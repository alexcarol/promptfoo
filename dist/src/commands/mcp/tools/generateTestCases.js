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
exports.registerGenerateTestCasesTool = registerGenerateTestCasesTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const synthesis_1 = require("../../../testCase/synthesis");
const utils_1 = require("../lib/utils");
/**
 * Tool to generate test cases with assertions for existing prompts
 */
function registerGenerateTestCasesTool(server) {
    server.tool('generate_test_cases', {
        prompt: zod_1.z
            .string()
            .min(1, 'Prompt cannot be empty')
            .describe('The prompt template to generate test cases for. Use {{variable}} syntax for variables.'),
        instructions: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Additional instructions for test case generation.
            Examples: "Focus on edge cases", "Include multilingual examples",
            "Test error handling scenarios"
          `),
        numTestCases: zod_1.z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(5)
            .describe('Number of test cases to generate (1-50)'),
        assertionTypes: zod_1.z
            .array(zod_1.z.enum(['equals', 'contains', 'icontains', 'regex', 'javascript', 'llm-rubric']))
            .optional()
            .describe((0, dedent_1.default) `
            Types of assertions to generate.
            Defaults to appropriate types based on the prompt.
          `),
        provider: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            AI provider to use for generation.
            Examples: "openai:gpt-4o", "anthropic:claude-3-sonnet"
            Defaults to configured default provider.
          `),
        outputPath: zod_1.z
            .string()
            .optional()
            .describe('Path to save the generated test cases (e.g., "tests/generated-cases.yaml")'),
    }, async (args) => {
        const { prompt, instructions, numTestCases = 5, assertionTypes, provider, outputPath } = args;
        try {
            // Extract variables from the prompt
            const variableMatches = prompt.match(/\{\{(\w+)\}\}/g);
            const variables = variableMatches
                ? [...new Set(variableMatches.map((v) => v.slice(2, -2)))]
                : [];
            if (variables.length === 0) {
                return (0, utils_1.createToolResponse)('generate_test_cases', false, { prompt, example: 'Translate to French: {{text}}' }, 'No variables found in prompt. Use {{variable}} syntax to define variables.');
            }
            // Create a test suite for generation
            const testSuite = {
                prompts: [{ label: 'test-case-generation', raw: prompt }],
                providers: [],
                tests: [], // Will be generated
            };
            // Generate test cases with variables
            const results = await (0, synthesis_1.synthesizeFromTestSuite)(testSuite, {
                instructions,
                numPersonas: 1,
                numTestCasesPerPersona: numTestCases,
                provider,
            });
            if (!results || results.length === 0) {
                return (0, utils_1.createToolResponse)('generate_test_cases', false, undefined, 'Failed to generate test cases. No data returned.');
            }
            // Format results as test cases with basic assertions
            const tests = results.map((vars) => {
                const testCase = { vars };
                // Add basic assertions based on the prompt type
                if (assertionTypes && assertionTypes.length > 0) {
                    testCase.assert = assertionTypes.map((type) => ({ type }));
                }
                else {
                    // Default assertions
                    testCase.assert = [{ type: 'is-json' }, { type: 'not-empty' }];
                }
                return testCase;
            });
            // Save to file if outputPath is provided
            if (outputPath) {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
                const yamlContent = yaml.dump({ tests });
                fs.writeFileSync(outputPath, yamlContent);
            }
            // Analyze the generated test cases
            const analysis = analyzeTestCases(tests, variables);
            return (0, utils_1.createToolResponse)('generate_test_cases', true, {
                testCases: tests,
                analysis,
                summary: {
                    totalGenerated: tests.length,
                    prompt,
                    variables,
                    outputPath: outputPath || 'Not saved to file',
                    provider: provider || 'default',
                },
                message: `Successfully generated ${tests.length} test cases with assertions`,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            // Provide specific error guidance
            if (errorMessage.includes('provider')) {
                return (0, utils_1.createToolResponse)('generate_test_cases', false, {
                    originalError: errorMessage,
                    suggestion: 'Check that the provider is properly configured with valid credentials',
                }, 'Failed to load AI provider for test case generation');
            }
            if (errorMessage.includes('rate limit')) {
                return (0, utils_1.createToolResponse)('generate_test_cases', false, {
                    originalError: errorMessage,
                    suggestion: 'Try reducing numTestCases or wait before retrying',
                }, 'Rate limit exceeded while generating test cases');
            }
            return (0, utils_1.createToolResponse)('generate_test_cases', false, undefined, `Failed to generate test cases: ${errorMessage}`);
        }
    });
}
function analyzeTestCases(testCases, variables) {
    const analysis = {
        totalCases: testCases.length,
        casesWithAssertions: 0,
        assertionTypes: {},
        variableCoverage: {},
        insights: [],
    };
    // Analyze each test case
    testCases.forEach((testCase) => {
        // Count assertions
        if (testCase.assert && testCase.assert.length > 0) {
            analysis.casesWithAssertions++;
            // Count assertion types
            testCase.assert.forEach((assertion) => {
                const type = assertion.type || 'unknown';
                analysis.assertionTypes[type] = (analysis.assertionTypes[type] || 0) + 1;
            });
        }
        // Check variable coverage
        if (testCase.vars) {
            Object.keys(testCase.vars).forEach((varName) => {
                if (variables.includes(varName)) {
                    analysis.variableCoverage[varName] = (analysis.variableCoverage[varName] || 0) + 1;
                }
            });
        }
    });
    // Generate insights
    if (analysis.casesWithAssertions === analysis.totalCases) {
        analysis.insights.push('All test cases have assertions ✓');
    }
    else {
        analysis.insights.push(`${analysis.totalCases - analysis.casesWithAssertions} test cases missing assertions`);
    }
    // Check variable coverage
    const uncoveredVars = variables.filter((v) => !analysis.variableCoverage[v]);
    if (uncoveredVars.length > 0) {
        analysis.insights.push(`Variables not covered: ${uncoveredVars.join(', ')}`);
    }
    else {
        analysis.insights.push('All variables have test coverage ✓');
    }
    // Most common assertion type
    const assertionEntries = Object.entries(analysis.assertionTypes);
    if (assertionEntries.length > 0) {
        const mostCommon = assertionEntries.reduce((a, b) => (a[1] > b[1] ? a : b));
        analysis.insights.push(`Most common assertion type: ${mostCommon[0]} (${mostCommon[1]} uses)`);
    }
    return analysis;
}
//# sourceMappingURL=generateTestCases.js.map