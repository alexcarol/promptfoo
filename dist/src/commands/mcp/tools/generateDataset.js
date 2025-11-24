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
exports.registerGenerateDatasetTool = registerGenerateDatasetTool;
const dedent_1 = __importDefault(require("dedent"));
const zod_1 = require("zod");
const synthesis_1 = require("../../../testCase/synthesis");
const utils_1 = require("../lib/utils");
const security_1 = require("../lib/security");
/**
 * Tool to generate test datasets using AI
 */
function registerGenerateDatasetTool(server) {
    server.tool('generate_dataset', {
        prompt: zod_1.z
            .string()
            .min(1, 'Prompt cannot be empty')
            .describe('The prompt or description of what kind of test cases to generate'),
        instructions: zod_1.z
            .string()
            .optional()
            .describe((0, dedent_1.default) `
            Additional instructions for dataset generation.
            Examples: "Include edge cases", "Focus on error scenarios", 
            "Generate diverse international examples"
          `),
        numSamples: zod_1.z
            .number()
            .int()
            .min(1)
            .max(100)
            .default(10)
            .describe('Number of test samples to generate (1-100)'),
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
            .describe('Path to save the generated dataset (e.g., "datasets/test-cases.yaml")'),
    }, async (args) => {
        const { prompt, instructions, numSamples = 10, provider, outputPath } = args;
        try {
            // Validate security constraints
            if (outputPath) {
                (0, security_1.validateFilePath)(outputPath);
            }
            if (provider) {
                (0, security_1.validateProviderId)(provider);
            }
            // Create a minimal test suite for dataset generation
            const testSuite = {
                prompts: [{ label: 'dataset-generation', raw: prompt }],
                providers: [],
                tests: [],
            };
            // Generate the dataset
            const results = await (0, synthesis_1.synthesizeFromTestSuite)(testSuite, {
                instructions,
                numPersonas: 1,
                numTestCasesPerPersona: numSamples,
                provider,
            });
            if (!results || results.length === 0) {
                return (0, utils_1.createToolResponse)('generate_dataset', false, undefined, 'Failed to generate dataset. No data returned.');
            }
            // Format results as test cases
            const dataset = results.map((vars) => ({ vars }));
            // Save to file if outputPath is provided
            if (outputPath) {
                const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                const yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
                const yamlContent = yaml.dump({ tests: dataset });
                fs.writeFileSync(outputPath, yamlContent);
            }
            // Extract useful information from the result
            const summary = {
                totalGenerated: dataset.length,
                outputPath: outputPath || 'Not saved to file',
                provider: provider || 'default',
                prompt: prompt,
            };
            // Sample the first few items for preview
            const preview = dataset.slice(0, 3).map((item) => ({
                vars: item.vars,
            }));
            return (0, utils_1.createToolResponse)('generate_dataset', true, {
                dataset,
                summary,
                preview,
                message: `Successfully generated ${dataset.length} test cases`,
            });
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            // Provide specific error guidance
            if (errorMessage.includes('provider')) {
                return (0, utils_1.createToolResponse)('generate_dataset', false, {
                    originalError: errorMessage,
                    suggestion: 'Check that the provider is properly configured with valid credentials',
                }, 'Failed to load AI provider for dataset generation');
            }
            if (errorMessage.includes('rate limit')) {
                return (0, utils_1.createToolResponse)('generate_dataset', false, {
                    originalError: errorMessage,
                    suggestion: 'Try reducing numSamples or wait before retrying',
                }, 'Rate limit exceeded while generating dataset');
            }
            return (0, utils_1.createToolResponse)('generate_dataset', false, undefined, `Failed to generate dataset: ${errorMessage}`);
        }
    });
}
//# sourceMappingURL=generateDataset.js.map