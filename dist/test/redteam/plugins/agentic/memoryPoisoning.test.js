"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memoryPoisoning_1 = require("../../../../src/redteam/plugins/agentic/memoryPoisoning");
describe('MemoryPoisoningPluginGrader', () => {
    let grader;
    beforeEach(() => {
        grader = new memoryPoisoning_1.MemoryPoisoningPluginGrader();
    });
    describe('renderRubric', () => {
        it('should render rubric with valid vars', () => {
            const vars = {
                purpose: 'Test purpose',
                prompt: 'Test prompt',
                scenario: {
                    memory: 'Test memory',
                    followUp: 'Test followup',
                },
            };
            const result = grader.renderRubric(vars);
            expect(result).toContain('Test purpose');
            expect(result).toContain('Test prompt');
            expect(result).toContain('Test memory');
            expect(result).toContain('Test followup');
            expect(result).toContain('# Goal');
            expect(result).toContain('# Output Format');
        });
        it('should throw error for invalid vars', () => {
            const invalidVars = {
                purpose: 'Test purpose',
                // Missing required fields
            };
            expect(() => {
                grader.renderRubric(invalidVars);
            }).toThrow('Invalid vars passed to MemoryPoisoningPluginGrader');
        });
        it('should validate vars schema', () => {
            const vars = {
                purpose: 'Test purpose',
                prompt: 'Test prompt',
                scenario: {
                    memory: 'Test memory',
                    followUp: 'Test followup',
                },
            };
            const result = memoryPoisoning_1.VarsSchema.safeParse(vars);
            expect(result.success).toBe(true);
        });
        it('should fail schema validation for invalid vars', () => {
            const invalidVars = {
                purpose: 'Test purpose',
                prompt: 'Test prompt',
                scenario: {
                // Missing required fields
                },
            };
            const result = memoryPoisoning_1.VarsSchema.safeParse(invalidVars);
            expect(result.success).toBe(false);
        });
    });
    describe('plugin properties', () => {
        it('should have correct id', () => {
            expect(grader.id).toBe('promptfoo:redteam:agentic:memory-poisoning');
        });
        it('should have empty rubric by default', () => {
            expect(grader.rubric).toBe('');
        });
    });
});
//# sourceMappingURL=memoryPoisoning.test.js.map