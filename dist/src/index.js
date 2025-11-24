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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redteam = exports.loadApiProvider = exports.guardrails = exports.cache = exports.assertions = exports.generateTable = void 0;
exports.evaluate = evaluate;
const index_1 = __importDefault(require("./assertions/index"));
exports.assertions = index_1.default;
const cache = __importStar(require("./cache"));
exports.cache = cache;
const evaluator_1 = require("./evaluator");
const guardrails_1 = __importDefault(require("./guardrails"));
exports.guardrails = guardrails_1.default;
const migrate_1 = require("./migrate");
const eval_1 = __importDefault(require("./models/eval"));
const index_2 = require("./prompts/index");
const index_3 = require("./providers/index");
Object.defineProperty(exports, "loadApiProvider", { enumerable: true, get: function () { return index_3.loadApiProvider; } });
const generate_1 = require("./redteam/commands/generate");
const entities_1 = require("./redteam/extraction/entities");
const mcpTools_1 = require("./redteam/extraction/mcpTools");
const purpose_1 = require("./redteam/extraction/purpose");
const graders_1 = require("./redteam/graders");
const index_4 = require("./redteam/plugins/index");
const base_1 = require("./redteam/plugins/base");
const shared_1 = require("./redteam/shared");
const index_5 = require("./redteam/strategies/index");
const index_6 = require("./util/index");
const file_1 = require("./util/file");
const testCaseReader_1 = require("./util/testCaseReader");
const providers_1 = require("./types/providers");
var table_1 = require("./table");
Object.defineProperty(exports, "generateTable", { enumerable: true, get: function () { return table_1.generateTable; } });
__exportStar(require("./types/index"), exports);
async function evaluate(testSuite, options = {}) {
    if (testSuite.writeLatestResults) {
        await (0, migrate_1.runDbMigrations)();
    }
    const loadedProviders = await (0, index_3.loadApiProviders)(testSuite.providers, {
        env: testSuite.env,
    });
    const providerMap = {};
    for (const p of loadedProviders) {
        providerMap[p.id()] = p;
        if (p.label) {
            providerMap[p.label] = p;
        }
    }
    // Resolve defaultTest from file reference if needed
    let resolvedDefaultTest = testSuite.defaultTest;
    if (typeof testSuite.defaultTest === 'string' && testSuite.defaultTest.startsWith('file://')) {
        resolvedDefaultTest = await (0, file_1.maybeLoadFromExternalFile)(testSuite.defaultTest);
    }
    const constructedTestSuite = {
        ...testSuite,
        defaultTest: resolvedDefaultTest,
        scenarios: testSuite.scenarios,
        providers: loadedProviders,
        tests: await (0, testCaseReader_1.readTests)(testSuite.tests),
        nunjucksFilters: await (0, index_6.readFilters)(testSuite.nunjucksFilters || {}),
        // Full prompts expected (not filepaths)
        prompts: await (0, index_2.processPrompts)(testSuite.prompts),
    };
    // Resolve nested providers
    if (typeof constructedTestSuite.defaultTest === 'object') {
        // Resolve defaultTest.provider (only if it's not already an ApiProvider instance)
        if (constructedTestSuite.defaultTest?.provider &&
            !(0, providers_1.isApiProvider)(constructedTestSuite.defaultTest.provider)) {
            constructedTestSuite.defaultTest.provider = await (0, index_3.resolveProvider)(constructedTestSuite.defaultTest.provider, providerMap, { env: testSuite.env });
        }
        // Resolve defaultTest.options.provider (only if it's not already an ApiProvider instance)
        if (constructedTestSuite.defaultTest?.options?.provider &&
            !(0, providers_1.isApiProvider)(constructedTestSuite.defaultTest.options.provider)) {
            constructedTestSuite.defaultTest.options.provider = await (0, index_3.resolveProvider)(constructedTestSuite.defaultTest.options.provider, providerMap, { env: testSuite.env });
        }
    }
    for (const test of constructedTestSuite.tests || []) {
        if (test.options?.provider && !(0, providers_1.isApiProvider)(test.options.provider)) {
            test.options.provider = await (0, index_3.resolveProvider)(test.options.provider, providerMap, {
                env: testSuite.env,
            });
        }
        if (test.assert) {
            for (const assertion of test.assert) {
                if (assertion.type === 'assert-set' || typeof assertion.provider === 'function') {
                    continue;
                }
                if (assertion.provider && !(0, providers_1.isApiProvider)(assertion.provider)) {
                    assertion.provider = await (0, index_3.resolveProvider)(assertion.provider, providerMap, {
                        env: testSuite.env,
                    });
                }
            }
        }
    }
    // Other settings
    if (options.cache === false || (options.repeat && options.repeat > 1)) {
        cache.disableCache();
    }
    const parsedProviderPromptMap = (0, index_2.readProviderPromptMap)(testSuite, constructedTestSuite.prompts);
    const unifiedConfig = { ...testSuite, prompts: constructedTestSuite.prompts };
    const evalRecord = testSuite.writeLatestResults
        ? await eval_1.default.create(unifiedConfig, constructedTestSuite.prompts)
        : new eval_1.default(unifiedConfig);
    // Run the eval!
    const ret = await (0, evaluator_1.evaluate)({
        ...constructedTestSuite,
        providerPromptMap: parsedProviderPromptMap,
    }, evalRecord, {
        eventSource: 'library',
        isRedteam: Boolean(testSuite.redteam),
        ...options,
    });
    if (testSuite.outputPath) {
        if (typeof testSuite.outputPath === 'string') {
            await (0, index_6.writeOutput)(testSuite.outputPath, evalRecord, null);
        }
        else if (Array.isArray(testSuite.outputPath)) {
            await (0, index_6.writeMultipleOutputs)(testSuite.outputPath, evalRecord, null);
        }
    }
    return ret;
}
const redteam = {
    Extractors: {
        extractEntities: entities_1.extractEntities,
        extractMcpToolsInfo: mcpTools_1.extractMcpToolsInfo,
        extractSystemPurpose: purpose_1.extractSystemPurpose,
    },
    Graders: graders_1.GRADERS,
    Plugins: index_4.Plugins,
    Strategies: index_5.Strategies,
    Base: {
        Plugin: base_1.RedteamPluginBase,
        Grader: base_1.RedteamGraderBase,
    },
    generate: generate_1.doGenerateRedteam,
    run: shared_1.doRedteamRun,
};
exports.redteam = redteam;
exports.default = {
    assertions: index_1.default,
    cache,
    evaluate,
    guardrails: guardrails_1.default,
    loadApiProvider: index_3.loadApiProvider,
    redteam,
};
//# sourceMappingURL=index.js.map