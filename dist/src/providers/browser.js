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
exports.BrowserProvider = void 0;
exports.createTransformResponse = createTransformResponse;
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const logger_1 = __importDefault(require("../logger"));
const index_1 = require("../util/fetch/index");
const file_1 = require("../util/file");
const invariant_1 = __importDefault(require("../util/invariant"));
const json_1 = require("../util/json");
const templates_1 = require("../util/templates");
const nunjucks = (0, templates_1.getNunjucksEngine)();
// Constants for connection configuration
const DEFAULT_DEBUGGING_PORT = 9222;
const DEFAULT_FETCH_TIMEOUT_MS = 5000;
function createTransformResponse(parser) {
    if (typeof parser === 'function') {
        return parser;
    }
    if (typeof parser === 'string') {
        return new Function('extracted', 'finalHtml', `return ${parser}`);
    }
    return (_extracted, finalHtml) => ({ output: finalHtml });
}
class BrowserProvider {
    constructor(_, options) {
        this.config = options.config;
        this.transformResponse = createTransformResponse(this.config.transformResponse || this.config.responseParser);
        (0, invariant_1.default)(Array.isArray(this.config.steps), `Expected Headless provider to have a config containing {steps}, but got ${(0, json_1.safeJsonStringify)(this.config)}`);
        this.defaultTimeout = this.config.timeoutMs || 30000; // Default 30 seconds timeout
        this.headless = this.config.headless ?? true;
    }
    id() {
        return 'browser-provider';
    }
    toString() {
        return '[Browser Provider]';
    }
    async callApi(prompt, context) {
        const vars = {
            ...(context?.vars || {}),
            prompt,
        };
        let chromium, stealth;
        try {
            ({ chromium } = await Promise.resolve().then(() => __importStar(require('playwright-extra'))));
            ({ default: stealth } = await Promise.resolve().then(() => __importStar(require('puppeteer-extra-plugin-stealth'))));
        }
        catch (error) {
            return {
                error: `Failed to import required modules. Please ensure the following packages are installed:\n\tplaywright @playwright/browser-chromium playwright-extra puppeteer-extra-plugin-stealth\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`,
            };
        }
        chromium.use(stealth());
        let browser;
        let shouldCloseBrowser = true;
        let browserContext;
        try {
            // Connect to existing browser or launch new one
            if (this.config.connectOptions) {
                const connectionResult = await this.connectToExistingBrowser(chromium);
                browser = connectionResult.browser;
                shouldCloseBrowser = connectionResult.shouldClose;
            }
            else {
                browser = await chromium.launch({
                    headless: this.headless,
                    args: ['--ignore-certificate-errors'],
                });
            }
            // Get or create browser context
            const contexts = browser.contexts();
            if (contexts.length > 0 && this.config.connectOptions) {
                // Use existing context when connecting to existing browser
                browserContext = contexts[0];
                logger_1.default.debug('Using existing browser context');
            }
            else {
                // Create new context
                browserContext = await browser.newContext({
                    ignoreHTTPSErrors: true,
                });
            }
            if (this.config.cookies) {
                await this.setCookies(browserContext);
            }
            const page = await browserContext.newPage();
            const extracted = {};
            try {
                // Execute all actions
                for (const step of this.config.steps) {
                    await this.executeAction(page, step, vars, extracted);
                }
                const finalHtml = await page.content();
                // Clean up
                if (this.config.connectOptions && !shouldCloseBrowser) {
                    // Only close the page when connected to existing browser
                    await page.close();
                }
                logger_1.default.debug(`Browser results: ${(0, json_1.safeJsonStringify)(extracted)}`);
                const ret = this.transformResponse(extracted, finalHtml);
                logger_1.default.debug(`Browser response transform output: ${(0, json_1.safeJsonStringify)(ret)}`);
                // Check if ret is already a ProviderResponse object (has error or output property)
                // or if it's a raw value that needs to be wrapped
                if (typeof ret === 'object' && ret !== null && ('output' in ret || 'error' in ret)) {
                    // Already a ProviderResponse, return as-is
                    return ret;
                }
                else {
                    // Raw value, wrap it
                    return { output: ret };
                }
            }
            catch (error) {
                // Clean up on error
                if (this.config.connectOptions && !shouldCloseBrowser) {
                    await page.close();
                }
                throw error;
            }
        }
        catch (error) {
            return { error: `Browser execution error: ${error}` };
        }
        finally {
            if (shouldCloseBrowser && browser) {
                await browser.close();
            }
        }
    }
    async setCookies(browserContext) {
        if (typeof this.config.cookies === 'string') {
            // Handle big blob string of cookies
            const cookieString = (0, file_1.maybeLoadFromExternalFile)(this.config.cookies);
            const cookiePairs = cookieString.split(';').map((pair) => pair.trim());
            const cookies = cookiePairs.map((pair) => {
                const [name, value] = pair.split('=');
                return { name, value };
            });
            await browserContext.addCookies(cookies);
        }
        else if (Array.isArray(this.config.cookies)) {
            // Handle array of cookie objects
            await browserContext.addCookies(this.config.cookies);
        }
    }
    async connectToExistingBrowser(chromium) {
        const connectOptions = this.config.connectOptions;
        try {
            let browser;
            if (connectOptions.mode === 'websocket' && connectOptions.wsEndpoint) {
                logger_1.default.debug(`Connecting via WebSocket: ${connectOptions.wsEndpoint}`);
                browser = await chromium.connect({
                    wsEndpoint: connectOptions.wsEndpoint,
                });
            }
            else {
                // Default to CDP connection
                const port = connectOptions.debuggingPort || DEFAULT_DEBUGGING_PORT;
                const cdpUrl = `http://localhost:${port}`;
                logger_1.default.debug(`Connecting via Chrome DevTools Protocol at ${cdpUrl}`);
                // Check if Chrome is accessible
                try {
                    const response = await (0, index_1.fetchWithTimeout)(`${cdpUrl}/json/version`, {}, DEFAULT_FETCH_TIMEOUT_MS);
                    const version = await response.json();
                    logger_1.default.debug(`Connected to browser: ${version.Browser}`);
                }
                catch {
                    throw new Error(`Cannot connect to Chrome at ${cdpUrl}. ` +
                        `Make sure Chrome is running with debugging enabled:\n` +
                        `  chrome --remote-debugging-port=${port}\n` +
                        `  or\n` +
                        `  chrome --remote-debugging-port=${port} --user-data-dir=${path_1.default.join(os_1.default.tmpdir(), 'chrome-debug')}`);
                }
                browser = await chromium.connectOverCDP(cdpUrl);
            }
            return { browser, shouldClose: false };
        }
        catch (error) {
            logger_1.default.error(`Failed to connect to existing browser: ${error}`);
            throw error;
        }
    }
    async executeAction(page, action, vars, extracted) {
        const { action: actionType, args = {}, name } = action;
        const renderedArgs = this.renderArgs(args, vars);
        logger_1.default.debug(`Executing headless action: ${actionType}`);
        switch (actionType) {
            case 'navigate':
                (0, invariant_1.default)(renderedArgs.url, `Browser action 'navigate' requires a 'url' parameter. ` +
                    `Please provide the URL to navigate to.\n\n` +
                    `Example:\n` +
                    `- action: navigate\n` +
                    `  args:\n` +
                    `    url: 'https://example.com'\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                logger_1.default.debug(`Navigating to ${renderedArgs.url}`);
                await page.goto(renderedArgs.url);
                break;
            case 'click':
                (0, invariant_1.default)(renderedArgs.selector, `Browser action 'click' requires a 'selector' parameter. ` +
                    `Please provide a CSS selector to identify the element to click.\n\n` +
                    `Example:\n` +
                    `- action: click\n` +
                    `  args:\n` +
                    `    selector: '#submit-button'\n` +
                    `    optional: true  # optional: won't fail if element doesn't exist\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                logger_1.default.debug(`Waiting for and clicking on ${renderedArgs.selector}`);
                const element = await this.waitForSelector(page, renderedArgs.selector);
                if (element) {
                    await page.click(renderedArgs.selector);
                }
                else if (renderedArgs.optional) {
                    logger_1.default.debug(`Optional element ${renderedArgs.selector} not found, continuing`);
                }
                else {
                    throw new Error(`Element not found: ${renderedArgs.selector}`);
                }
                break;
            case 'type':
                (0, invariant_1.default)(renderedArgs.text, `Browser action 'type' requires a 'text' parameter. ` +
                    `Please provide the text to type into the selected element.\n\n` +
                    `Example:\n` +
                    `- action: type\n` +
                    `  args:\n` +
                    `    selector: '#input-field'\n` +
                    `    text: 'Hello world'\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                (0, invariant_1.default)(renderedArgs.selector, `Browser action 'type' requires a 'selector' parameter. ` +
                    `Please provide a CSS selector to identify the input element.\n\n` +
                    `Example:\n` +
                    `- action: type\n` +
                    `  args:\n` +
                    `    selector: '#input-field'\n` +
                    `    text: 'Hello world'\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                logger_1.default.debug(`Waiting for and typing into ${renderedArgs.selector}: ${renderedArgs.text}`);
                await this.waitForSelector(page, renderedArgs.selector);
                if (typeof renderedArgs.text === 'string') {
                    // Handle special characters
                    const specialKeys = {
                        '<enter>': 'Enter',
                        '<tab>': 'Tab',
                        '<escape>': 'Escape',
                    };
                    for (const [placeholder, key] of Object.entries(specialKeys)) {
                        const lowerText = renderedArgs.text.toLowerCase();
                        if (lowerText.includes(placeholder)) {
                            // Use case-insensitive regex to split while preserving original case
                            const regex = new RegExp(placeholder.replace(/[<>]/g, '\\$&'), 'gi');
                            const parts = renderedArgs.text.split(regex);
                            for (let i = 0; i < parts.length; i++) {
                                if (parts[i]) {
                                    await page.fill(renderedArgs.selector, parts[i]);
                                }
                                if (i < parts.length - 1) {
                                    await page.press(renderedArgs.selector, key);
                                }
                            }
                            return;
                        }
                    }
                }
                // If no special characters, use the original fill method
                await page.fill(renderedArgs.selector, renderedArgs.text);
                break;
            case 'screenshot':
                (0, invariant_1.default)(renderedArgs.path, `Browser action 'screenshot' requires a 'path' parameter. ` +
                    `Please provide the file path where the screenshot should be saved.\n\n` +
                    `Example:\n` +
                    `- action: screenshot\n` +
                    `  args:\n` +
                    `    path: 'screenshots/page.png'\n` +
                    `    fullPage: true  # optional: capture entire page\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                logger_1.default.debug(`Taking screenshot of ${renderedArgs.selector} and saving to ${renderedArgs.path}`);
                await page.screenshot({
                    fullPage: renderedArgs.fullPage,
                    path: renderedArgs.path,
                });
                break;
            case 'extract':
                (0, invariant_1.default)(renderedArgs.selector, `Browser action 'extract' requires a 'selector' parameter. ` +
                    `Please provide a CSS selector to identify the element to extract text from.\n\n` +
                    `Example:\n` +
                    `- action: extract\n` +
                    `  args:\n` +
                    `    selector: '.result-title'\n` +
                    `  name: title\n\n` +
                    `Current action args: ${(0, json_1.safeJsonStringify)(args)}`);
                (0, invariant_1.default)(name, `Browser action 'extract' requires a 'name' parameter. ` +
                    `Please provide a name to store the extracted content.\n\n` +
                    `Example:\n` +
                    `- action: extract\n` +
                    `  args:\n` +
                    `    selector: '.result-title'\n` +
                    `  name: title\n\n` +
                    `The extracted content will be available as extracted.title in transformResponse.\n\n` +
                    `Current action: ${(0, json_1.safeJsonStringify)(action)}`);
                logger_1.default.debug(`Waiting for and extracting content from ${renderedArgs.selector}`);
                await this.waitForSelector(page, renderedArgs.selector);
                const extractedContent = await page.$eval(renderedArgs.selector, (el) => el.textContent);
                logger_1.default.debug(`Extracted content from ${renderedArgs.selector}: ${extractedContent}`);
                if (name) {
                    extracted[name] = extractedContent;
                }
                else {
                    throw new Error(`Browser action 'extract' requires a 'name' parameter. ` +
                        `Please provide a name to store the extracted content.\n\n` +
                        `Example:\n` +
                        `- action: extract\n` +
                        `  args:\n` +
                        `    selector: '.result-title'\n` +
                        `  name: title\n\n` +
                        `The extracted content will be available as extracted.title in transformResponse.`);
                }
                break;
            case 'wait':
                logger_1.default.debug(`Waiting for ${renderedArgs.ms}ms`);
                await page.waitForTimeout(renderedArgs.ms);
                break;
            case 'waitForNewChildren':
                logger_1.default.debug(`Waiting for new element in ${renderedArgs.parentSelector}`);
                await this.waitForNewChildren(page, renderedArgs.parentSelector, renderedArgs.delay, renderedArgs.timeout);
                break;
            default:
                throw new Error(`Unknown action type: ${actionType}`);
        }
    }
    async waitForSelector(page, selector) {
        try {
            return await page.waitForSelector(selector, { timeout: this.defaultTimeout });
        }
        catch {
            logger_1.default.warn(`Timeout waiting for selector: ${selector}`);
            return null;
        }
    }
    async waitForNewChildren(page, parentSelector, delay = 1000, timeout = this.defaultTimeout) {
        await page.waitForTimeout(delay);
        const initialChildCount = await page.$$eval(`${parentSelector} > *`, (elements) => elements.length);
        await page.waitForFunction(({ parentSelector, initialChildCount, }) => {
            const currentCount = document.querySelectorAll(`${parentSelector} > *`).length;
            return currentCount > initialChildCount;
        }, { parentSelector, initialChildCount }, { timeout, polling: 'raf' });
    }
    renderArgs(args, vars) {
        const renderedArgs = {};
        for (const [key, value] of Object.entries(args)) {
            if (typeof value === 'string') {
                renderedArgs[key] = nunjucks.renderString(value, vars);
            }
            else {
                renderedArgs[key] = value;
            }
        }
        return renderedArgs;
    }
}
exports.BrowserProvider = BrowserProvider;
//# sourceMappingURL=browser.js.map