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
exports.doGenerateAssertions = doGenerateAssertions;
exports.generateAssertionsCommand = generateAssertionsCommand;
const fs = __importStar(require("fs"));
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const js_yaml_1 = __importDefault(require("js-yaml"));
const synthesis_1 = require("../../assertions/synthesis");
const cache_1 = require("../../cache");
const logger_1 = __importDefault(require("../../logger"));
const telemetry_1 = __importDefault(require("../../telemetry"));
const index_1 = require("../../util/index");
const promptfooCommand_1 = require("../../util/promptfooCommand");
const load_1 = require("../../util/config/load");
async function doGenerateAssertions(options) {
    (0, index_1.setupEnv)(options.envFile);
    if (!options.cache) {
        logger_1.default.info('Cache is disabled.');
        (0, cache_1.disableCache)();
    }
    let testSuite;
    const configPath = options.config || options.defaultConfigPath;
    if (configPath) {
        const resolved = await (0, load_1.resolveConfigs)({
            config: [configPath],
        }, options.defaultConfig, 'AssertionGeneration');
        testSuite = resolved.testSuite;
    }
    else {
        throw new Error('Could not find config file. Please use `--config`');
    }
    const startTime = Date.now();
    telemetry_1.default.record('command_used', {
        name: 'generate_assertions - started',
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
    });
    const results = await (0, synthesis_1.synthesizeFromTestSuite)(testSuite, {
        instructions: options.instructions,
        numQuestions: Number.parseInt(options.numAssertions || '5', 10),
        provider: options.provider,
        type: options.type,
    });
    const configAddition = {
        assert: results,
    };
    const yamlString = js_yaml_1.default.dump(configAddition);
    if (options.output) {
        // Should the output be written as a YAML or CSV?
        if (options.output.endsWith('.yaml')) {
            fs.writeFileSync(options.output, yamlString);
        }
        else {
            throw new Error(`Unsupported output file type: ${options.output}`);
        }
        (0, index_1.printBorder)();
        logger_1.default.info(`Wrote ${results.length} new assertions to ${options.output}`);
        (0, index_1.printBorder)();
    }
    else {
        (0, index_1.printBorder)();
        logger_1.default.info('New test Cases');
        (0, index_1.printBorder)();
        logger_1.default.info(yamlString);
    }
    (0, index_1.printBorder)();
    if (options.write && configPath) {
        const existingConfig = js_yaml_1.default.load(fs.readFileSync(configPath, 'utf8'));
        // Handle the union type for tests (string | TestGeneratorConfig | Array<...>)
        const existingDefaultTest = typeof existingConfig.defaultTest === 'object' ? existingConfig.defaultTest : {};
        existingConfig.defaultTest = {
            ...existingDefaultTest,
            assert: [...(existingDefaultTest?.assert || []), ...configAddition.assert],
        };
        fs.writeFileSync(configPath, js_yaml_1.default.dump(existingConfig));
        logger_1.default.info(`Wrote ${results.length} new test cases to ${configPath}`);
        const runCommand = (0, promptfooCommand_1.promptfooCommand)('eval');
        logger_1.default.info(chalk_1.default.green(`Run ${chalk_1.default.bold(runCommand)} to run the generated assertions`));
    }
    else {
        logger_1.default.info(`Copy the above test cases or run ${chalk_1.default.greenBright('promptfoo generate assertions --write')} to write directly to the config`);
    }
    telemetry_1.default.record('command_used', {
        duration: Math.round((Date.now() - startTime) / 1000),
        name: 'generate_assertions',
        numPrompts: testSuite.prompts.length,
        numTestsExisting: (testSuite.tests || []).length,
        numAssertionsGenerated: results.length,
        provider: options.provider || 'default',
    });
}
function validateAssertionType(value, _previous) {
    const allowedStrings = ['pi', 'g-eval', 'llm-rubric'];
    if (!allowedStrings.includes(value)) {
        throw new commander_1.InvalidArgumentError(`Option --type must be one of: ${allowedStrings.join(', ')}.`);
    }
    return value;
}
function generateAssertionsCommand(program, defaultConfig, defaultConfigPath) {
    program
        .command('assertions')
        .description('Generate additional subjective/objective assertions')
        .option('-t, --type [type]', 'The type of natural language assertion to generate (pi, g-eval, or llm-rubric)', validateAssertionType, 'pi')
        .option('-c, --config [path]', 'Path to configuration file. Defaults to promptfooconfig.yaml. Requires at least 1 prompt to be defined.')
        .option('-o, --output [path]', 'Path to output file. Supports YAML output')
        .option('-w, --write', 'Write results to promptfoo configuration file')
        .option('--numAssertions <amount>', 'Number of assertions to generate')
        .option('--provider <provider>', `Provider to use for generating assertions. Defaults to the default grading provider.`)
        .option('-i, --instructions [instructions]', 'Additional instructions to follow while generating assertions')
        .option('--no-cache', 'Do not read or write results to disk cache', false)
        .action((opts) => doGenerateAssertions({ ...opts, defaultConfig, defaultConfigPath }));
}
//# sourceMappingURL=assertions.js.map