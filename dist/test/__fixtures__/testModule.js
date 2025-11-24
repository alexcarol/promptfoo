"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.namedExport = exports.testFunction = void 0;
// TypeScript test module (ESM format)
const testFunction = () => 'ts test result';
exports.testFunction = testFunction;
exports.namedExport = 'ts named export';
const defaultExport = {
    testFunction: () => 'ts default test result',
    defaultProp: 'ts default property',
};
exports.default = defaultExport;
//# sourceMappingURL=testModule.js.map