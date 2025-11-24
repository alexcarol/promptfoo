"use strict";
/**
 * CodeScan Types Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const codeScan_1 = require("../../src/types/codeScan");
const zod_1 = require("zod");
describe('validateSeverity', () => {
    describe('valid severity values', () => {
        it('should validate lowercase severity values', () => {
            expect((0, codeScan_1.validateSeverity)('critical')).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect((0, codeScan_1.validateSeverity)('high')).toBe(codeScan_1.CodeScanSeverity.HIGH);
            expect((0, codeScan_1.validateSeverity)('medium')).toBe(codeScan_1.CodeScanSeverity.MEDIUM);
            expect((0, codeScan_1.validateSeverity)('low')).toBe(codeScan_1.CodeScanSeverity.LOW);
            expect((0, codeScan_1.validateSeverity)('none')).toBe(codeScan_1.CodeScanSeverity.NONE);
        });
        it('should normalize uppercase severity values', () => {
            expect((0, codeScan_1.validateSeverity)('CRITICAL')).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect((0, codeScan_1.validateSeverity)('HIGH')).toBe(codeScan_1.CodeScanSeverity.HIGH);
            expect((0, codeScan_1.validateSeverity)('MEDIUM')).toBe(codeScan_1.CodeScanSeverity.MEDIUM);
            expect((0, codeScan_1.validateSeverity)('LOW')).toBe(codeScan_1.CodeScanSeverity.LOW);
            expect((0, codeScan_1.validateSeverity)('NONE')).toBe(codeScan_1.CodeScanSeverity.NONE);
        });
        it('should normalize mixed case severity values', () => {
            expect((0, codeScan_1.validateSeverity)('CriTicAL')).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect((0, codeScan_1.validateSeverity)('HiGh')).toBe(codeScan_1.CodeScanSeverity.HIGH);
            expect((0, codeScan_1.validateSeverity)('MeDiUm')).toBe(codeScan_1.CodeScanSeverity.MEDIUM);
            expect((0, codeScan_1.validateSeverity)('LoW')).toBe(codeScan_1.CodeScanSeverity.LOW);
            expect((0, codeScan_1.validateSeverity)('NoNe')).toBe(codeScan_1.CodeScanSeverity.NONE);
        });
        it('should trim whitespace from severity values', () => {
            expect((0, codeScan_1.validateSeverity)('  critical  ')).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect((0, codeScan_1.validateSeverity)('\thigh\t')).toBe(codeScan_1.CodeScanSeverity.HIGH);
            expect((0, codeScan_1.validateSeverity)('\nmedium\n')).toBe(codeScan_1.CodeScanSeverity.MEDIUM);
            expect((0, codeScan_1.validateSeverity)(' low ')).toBe(codeScan_1.CodeScanSeverity.LOW);
        });
        it('should handle combination of whitespace and case normalization', () => {
            expect((0, codeScan_1.validateSeverity)('  CRITICAL  ')).toBe(codeScan_1.CodeScanSeverity.CRITICAL);
            expect((0, codeScan_1.validateSeverity)('\t HiGh \n')).toBe(codeScan_1.CodeScanSeverity.HIGH);
        });
    });
    describe('invalid severity values', () => {
        it('should throw ZodError for invalid severity level', () => {
            expect(() => (0, codeScan_1.validateSeverity)('invalid')).toThrow(zod_1.ZodError);
        });
        it('should throw ZodError for empty string', () => {
            expect(() => (0, codeScan_1.validateSeverity)('')).toThrow(zod_1.ZodError);
        });
        it('should throw ZodError for numeric values', () => {
            expect(() => (0, codeScan_1.validateSeverity)('1')).toThrow(zod_1.ZodError);
            expect(() => (0, codeScan_1.validateSeverity)('123')).toThrow(zod_1.ZodError);
        });
        it('should throw ZodError for severity with special characters', () => {
            expect(() => (0, codeScan_1.validateSeverity)('high!')).toThrow(zod_1.ZodError);
            expect(() => (0, codeScan_1.validateSeverity)('medium@')).toThrow(zod_1.ZodError);
            expect(() => (0, codeScan_1.validateSeverity)('low#')).toThrow(zod_1.ZodError);
        });
        it('should throw ZodError for partial matches', () => {
            expect(() => (0, codeScan_1.validateSeverity)('hig')).toThrow(zod_1.ZodError);
            expect(() => (0, codeScan_1.validateSeverity)('critic')).toThrow(zod_1.ZodError);
        });
        it('should throw ZodError for severity with extra characters', () => {
            expect(() => (0, codeScan_1.validateSeverity)('highh')).toThrow(zod_1.ZodError);
            expect(() => (0, codeScan_1.validateSeverity)('criticall')).toThrow(zod_1.ZodError);
        });
        it('should provide meaningful error message', () => {
            try {
                (0, codeScan_1.validateSeverity)('invalid');
                fail('Expected ZodError to be thrown');
            }
            catch (error) {
                expect(error).toBeInstanceOf(zod_1.ZodError);
                const zodError = error;
                expect(zodError.issues[0].message).toBeTruthy();
            }
        });
    });
});
//# sourceMappingURL=codeScan.test.js.map