"use strict";
// This file provides build-time constants with fallbacks for development
// In production builds, these values come from src/generated/constants.ts
// In development, they fall back to environment variables
Object.defineProperty(exports, "__esModule", { value: true });
exports.POSTHOG_KEY = void 0;
const envars_1 = require("../envars");
let POSTHOG_KEY;
try {
    // Try to import from generated constants (created during build)
    const generated = require('../generated/constants');
    exports.POSTHOG_KEY = POSTHOG_KEY = generated.POSTHOG_KEY;
}
catch {
    // Fallback to environment variables for development
    exports.POSTHOG_KEY = POSTHOG_KEY = (0, envars_1.getEnvString)('PROMPTFOO_POSTHOG_KEY', '');
}
//# sourceMappingURL=build.js.map