"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simbaCommand = simbaCommand;
const chalk_1 = __importDefault(require("chalk"));
const zod_1 = require("zod");
const zod_validation_error_1 = require("zod-validation-error");
const constants_1 = require("../../constants");
const logger_1 = __importDefault(require("../../logger"));
const providers_1 = require("../../types/providers");
const load_1 = require("../../util/config/load");
const index_1 = require("../../util/index");
const constants_2 = require("../constants");
const simba_1 = __importDefault(require("../providers/simba"));
const SimbaCommandSchema = zod_1.z.object({
    config: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
    goals: zod_1.z.array(zod_1.z.string()),
    purpose: zod_1.z.string().optional(),
    maxRounds: zod_1.z.number().optional(),
    maxVectors: zod_1.z.number().optional(),
    email: zod_1.z.string().email().optional(),
    additionalInstructions: zod_1.z.string().optional(),
    sessionId: zod_1.z.string().optional(),
    concurrency: zod_1.z.number().min(1).max(100).optional(),
    injectVar: zod_1.z.string().min(1).optional(),
});
function normalizeGoals(goals) {
    if (Array.isArray(goals)) {
        return goals;
    }
    return [goals];
}
function inferInjectVar(testSuite) {
    const candidateVars = new Set();
    const tests = testSuite.tests ?? [];
    for (const test of tests) {
        if (test?.vars) {
            for (const key of Object.keys(test.vars)) {
                candidateVars.add(key);
            }
        }
    }
    if (candidateVars.has('prompt')) {
        return 'prompt';
    }
    const firstCandidate = candidateVars.values().next().value;
    if (firstCandidate) {
        logger_1.default.debug(`Inferring ${constants_2.strategyDisplayNames.simba} injectVar as '${firstCandidate}' from test cases`);
        return firstCandidate;
    }
    logger_1.default.debug(`Falling back to default ${constants_2.strategyDisplayNames.simba} injectVar "prompt"`);
    return 'prompt';
}
function getTargetProvider(testSuite) {
    for (const provider of testSuite.providers ?? []) {
        if (!(0, providers_1.isApiProvider)(provider)) {
            continue;
        }
        return provider;
    }
    throw new Error('No valid target provider found. Ensure your configuration includes at least one provider.');
}
async function runSimbaWithProvider(options, testSuite) {
    if (!testSuite.providers || testSuite.providers.length === 0) {
        throw new Error('No providers found in configuration. Please add at least one provider.');
    }
    const targetProvider = getTargetProvider(testSuite);
    const goals = normalizeGoals(options.goals);
    const injectVar = options.injectVar ?? inferInjectVar(testSuite);
    const concurrency = options.concurrency ?? 1;
    logger_1.default.info(chalk_1.default.blue(`Using target provider: ${targetProvider.id()}`));
    logger_1.default.info(chalk_1.default.blue(`Concurrency: ${concurrency}`));
    logger_1.default.info(chalk_1.default.blue(`Inject var: ${injectVar}`));
    const simbaProvider = new simba_1.default({
        injectVar,
        goals,
        purpose: options.purpose ?? 'Red team testing',
        additionalAttackInstructions: options.additionalInstructions,
        maxConversationRounds: options.maxRounds ?? 10,
        maxAttacksPerGoal: options.maxVectors ?? 5,
        sessionId: options.sessionId,
        concurrency: concurrency,
    });
    const context = {
        prompt: { raw: '', label: constants_2.strategyDisplayNames.simba },
        vars: {},
        originalProvider: targetProvider,
        test: {
            metadata: {
                purpose: options.purpose ?? 'Red team testing',
            },
            vars: {},
            assert: [],
        },
    };
    logger_1.default.info(chalk_1.default.cyan(`Starting ${constants_2.strategyDisplayNames.simba} session...`));
    const results = await simbaProvider.runSimba({
        prompt: goals.join('; '),
        context,
        options: undefined,
        concurrency,
    });
    if (!results.length) {
        logger_1.default.warn(`${constants_2.strategyDisplayNames.simba} did not return any results.`);
        return;
    }
    let successCount = 0;
    let errorCount = 0;
    logger_1.default.info(chalk_1.default.bold(`\n=== ${constants_2.strategyDisplayNames.simba} Results ===`));
    for (const result of results) {
        const planName = String(result.metadata?.attackPlan?.planName ?? result.promptId ?? 'Unknown');
        if (result.error) {
            errorCount += 1;
            logger_1.default.error(chalk_1.default.red(`[${planName}] ${constants_2.strategyDisplayNames.simba} error: ${result.error}`));
            continue;
        }
        const attackSucceeded = Boolean(result.success);
        if (attackSucceeded) {
            successCount += 1;
        }
        const statusLabel = attackSucceeded
            ? chalk_1.default.red.bold('ATTACK SUCCEEDED')
            : chalk_1.default.green.bold('ATTACK BLOCKED');
        const summary = result.metadata?.result?.summary;
        logger_1.default.info(`${statusLabel} - ${planName}`);
        if (summary) {
            logger_1.default.info(`  Summary: ${summary}`);
        }
        const dataExtracted = result.metadata?.dataExtracted;
        if (dataExtracted) {
            logger_1.default.info(`  Data Extracted:\n${dataExtracted}`);
        }
        const jailbreaks = result.metadata?.successfulJailbreaks;
        if (jailbreaks) {
            logger_1.default.info(`  Successful Jailbreaks:\n${jailbreaks}`);
        }
    }
    logger_1.default.info(chalk_1.default.bold('\n=== Session Summary ==='));
    logger_1.default.info(`Attack plans evaluated: ${results.length}`);
    logger_1.default.info(`Successful attacks: ${successCount}`);
    logger_1.default.info(`Errors: ${errorCount}`);
    logger_1.default.info(`Concurrency used: ${concurrency}`);
    if (options.sessionId) {
        logger_1.default.info(`Session ID: ${options.sessionId}`);
    }
}
function simbaCommand(program, defaultConfig) {
    program
        .command('simba', { hidden: true })
        .description('This feature is under development and not ready for use.')
        .option('-c, --config <paths...>', 'Path to configuration file (defaults to promptfooconfig.yaml)')
        .requiredOption('-g, --goals <goals...>', 'The goals/objectives for the red team test')
        .option('-e, --email <email>', 'Email address for analytics')
        .option('--purpose <purpose>', 'Purpose of the target system', 'Red team testing')
        .option('--max-conversation-rounds <number>', 'Maximum conversation rounds', (val) => Number.parseInt(val, 10))
        .option('--max-attacks-per-goal <number>', 'Maximum attack vectors to try', (val) => Number.parseInt(val, 10))
        .option('--additional-instructions <text>', 'Additional attack instructions')
        .option('-s, --session-id <id>', 'Session ID to continue')
        .option('-j, --concurrency <number>', 'Number of concurrent conversations (1-100)', (val) => Number.parseInt(val, 10), constants_1.DEFAULT_MAX_CONCURRENCY)
        .option('--inject-var <name>', `Variable name to inject ${constants_2.strategyDisplayNames.simba} prompts into`)
        .action(async (opts) => {
        (0, index_1.setupEnv)(opts.envPath);
        try {
            const validationResult = SimbaCommandSchema.safeParse(opts);
            if (!validationResult.success) {
                const validationError = (0, zod_validation_error_1.fromZodError)(validationResult.error);
                logger_1.default.error(`Invalid options:\n${validationError.message}`);
                process.exitCode = 1;
                return;
            }
            const { testSuite } = await (0, load_1.resolveConfigs)(opts, defaultConfig);
            await runSimbaWithProvider(validationResult.data, testSuite);
        }
        catch (error) {
            logger_1.default.error(`${constants_2.strategyDisplayNames.simba} command failed: ${error}`);
            process.exit(1);
        }
    });
}
//# sourceMappingURL=simba.js.map