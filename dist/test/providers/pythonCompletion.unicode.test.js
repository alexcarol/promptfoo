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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const globals_1 = require("@jest/globals");
const pythonCompletion_1 = require("../../src/providers/pythonCompletion");
const pythonUtils = __importStar(require("../../src/python/pythonUtils"));
// Windows CI has severe filesystem delays (antivirus, etc.) - allow up to 90s
// (60s for file retry + 30s for Python startup and test overhead)
const TEST_TIMEOUT = process.platform === 'win32' ? 90000 : 15000;
// Skip on Windows CI due to aggressive file security policies blocking temp file IPC
// Works fine on local Windows and all other platforms
const describeOrSkip = process.platform === 'win32' && process.env.CI ? globals_1.describe.skip : globals_1.describe;
describeOrSkip('PythonProvider Unicode handling', () => {
    let tempDir;
    const providers = [];
    (0, globals_1.beforeAll)(() => {
        // Disable caching for tests to ensure fresh runs
        process.env.PROMPTFOO_CACHE_ENABLED = 'false';
    });
    (0, globals_1.beforeEach)(() => {
        // Reset Python state to avoid test interference
        pythonUtils.state.cachedPythonPath = null;
        pythonUtils.state.validationPromise = null;
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-unicode-test-'));
    });
    (0, globals_1.afterEach)(async () => {
        // Cleanup providers
        await Promise.all(providers.map((p) => p.shutdown().catch(() => { })));
        providers.length = 0;
        if (fs.existsSync(tempDir)) {
            fs.rmSync(tempDir, { recursive: true });
        }
    });
    (0, globals_1.afterAll)(async () => {
        // Final cleanup
        await Promise.all(providers.map((p) => p.shutdown().catch(() => { })));
    });
    // Helper to create a provider with less overhead
    const createProvider = (scriptName, scriptContent) => {
        const scriptPath = path.join(tempDir, scriptName);
        fs.writeFileSync(scriptPath, scriptContent);
        const provider = new pythonCompletion_1.PythonProvider(scriptPath, {
            id: `python:${scriptName}`,
            config: { basePath: tempDir },
        });
        providers.push(provider);
        return provider;
    };
    (0, globals_1.it)('should correctly handle Unicode characters in prompt', async () => {
        const provider = createProvider('unicode_test.py', `
def call_api(prompt, options, context):
    return {
        "output": f"Received: {prompt}",
        "metadata": {
            "prompt_length": len(prompt),
            "prompt_bytes": len(prompt.encode('utf-8'))
        }
    }
`);
        const result = await provider.callApi('Product® Plus');
        // Verify the result structure and Unicode preservation
        (0, globals_1.expect)(result.output).toBe('Received: Product® Plus');
        (0, globals_1.expect)(result.metadata?.prompt_length).toBe(13);
        (0, globals_1.expect)(result.metadata?.prompt_bytes).toBe(14);
        (0, globals_1.expect)(result.error).toBeUndefined();
        // Ensure no null bytes in JSON serialization
        const jsonStr = JSON.stringify(result);
        (0, globals_1.expect)(jsonStr).not.toContain('\u0000');
        (0, globals_1.expect)(jsonStr).not.toContain('\\u0000');
        (0, globals_1.expect)(jsonStr).toContain('Product® Plus');
    }, TEST_TIMEOUT);
    (0, globals_1.it)('should handle Unicode in context vars', async () => {
        const provider = createProvider('context_unicode_test.py', `
def call_api(prompt, options, context):
    vars = context.get('vars', {})
    product_name = vars.get('product', 'Unknown')
    return {
        "output": f"{prompt} - Product: {product_name}",
        "metadata": {
            "product_name": product_name,
            "product_bytes": len(product_name.encode('utf-8'))
        }
    }
`);
        const context = {
            prompt: { raw: 'Test prompt', label: 'test' },
            vars: {
                product: 'Product® Plus™',
                company: '© 2025 Company',
                price: '€100',
            },
        };
        const result = await provider.callApi('Test prompt', context);
        // Verify Unicode handling in response
        (0, globals_1.expect)(result.output).toBe('Test prompt - Product: Product® Plus™');
        (0, globals_1.expect)(result.metadata?.product_name).toBe('Product® Plus™');
        // Note: ® is 2 bytes, ™ is 3 bytes in UTF-8, so total is 17 bytes
        (0, globals_1.expect)(result.metadata?.product_bytes).toBe(17);
    }, TEST_TIMEOUT);
    (0, globals_1.it)('should handle complex nested Unicode data', async () => {
        const provider = createProvider('nested_unicode_test.py', `
def call_api(prompt, options, context):
    return {
        "output": "Complex Unicode test",
        "nested": {
            "products": [
                {"name": "Product®", "price": "€100"},
                {"name": "Brand™", "price": "€200"},
                {"name": "Item© 2025", "price": "€300"}
            ],
            "metadata": {
                "temperature": "25°C",
                "description": "Advanced Product® with Brand™ technology ©2025"
            }
        }
    }
`);
        const result = await provider.callApi('Test');
        // Verify complex nested Unicode structures are preserved
        const resultAny = result;
        (0, globals_1.expect)(resultAny.nested.products[0].name).toBe('Product®');
        (0, globals_1.expect)(resultAny.nested.products[1].name).toBe('Brand™');
        (0, globals_1.expect)(resultAny.nested.products[2].name).toBe('Item© 2025');
        (0, globals_1.expect)(resultAny.nested.metadata.temperature).toBe('25°C');
        (0, globals_1.expect)(resultAny.nested.metadata.description).toBe('Advanced Product® with Brand™ technology ©2025');
        // Ensure nested Unicode data serializes properly
        const jsonStr = JSON.stringify(result);
        (0, globals_1.expect)(jsonStr).toContain('Product®');
        (0, globals_1.expect)(jsonStr).toContain('Brand™');
        (0, globals_1.expect)(jsonStr).toContain('€100');
        (0, globals_1.expect)(jsonStr).toContain('25°C');
        (0, globals_1.expect)(jsonStr).not.toContain('\u0000');
    }, TEST_TIMEOUT);
});
//# sourceMappingURL=pythonCompletion.unicode.test.js.map