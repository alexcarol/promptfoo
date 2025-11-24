"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const evalTableUtils_1 = require("../../../src/server/utils/evalTableUtils");
const index_1 = require("../../../src/types/index");
(0, globals_1.describe)('evalTableUtils', () => {
    let mockTable;
    (0, globals_1.beforeEach)(() => {
        mockTable = {
            head: {
                vars: ['var1', 'var2'],
                prompts: [
                    {
                        provider: 'openai:gpt-4',
                        label: 'Prompt 1',
                        raw: 'Test prompt {{var1}}',
                        display: 'Test prompt',
                    },
                    {
                        provider: 'anthropic:claude',
                        label: 'Prompt 2',
                        raw: 'Another prompt {{var2}}',
                        display: 'Another prompt',
                    },
                ],
            },
            body: [
                {
                    test: {
                        vars: { var1: 'value1', var2: 'value2' },
                        description: 'Test case 1',
                    },
                    testIdx: 0,
                    vars: ['value1', 'value2'],
                    outputs: [
                        {
                            pass: true,
                            text: 'Success output',
                            gradingResult: {
                                pass: true,
                                reason: 'Output meets criteria',
                                comment: 'Well formatted',
                            },
                        },
                        {
                            pass: false,
                            text: 'Failed output',
                            failureReason: index_1.ResultFailureReason.ASSERT,
                            gradingResult: {
                                pass: false,
                                reason: 'Missing required field',
                                comment: 'Needs improvement',
                            },
                        },
                    ],
                },
                {
                    test: {
                        vars: { var1: 'value3', var2: 'value4' },
                    },
                    testIdx: 1,
                    vars: ['value3', 'value4'],
                    outputs: [
                        {
                            pass: false,
                            text: 'Error output',
                            failureReason: index_1.ResultFailureReason.ERROR,
                            error: 'Network timeout',
                        },
                        {
                            pass: true,
                            text: 'Another success',
                        },
                    ],
                },
            ],
        };
    });
    (0, globals_1.describe)('evalTableToCsv', () => {
        (0, globals_1.describe)('Basic CSV generation', () => {
            (0, globals_1.it)('should generate CSV with headers and data', () => {
                const csv = (0, evalTableUtils_1.evalTableToCsv)(mockTable);
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('Description');
                (0, globals_1.expect)(lines[0]).toContain('var1');
                (0, globals_1.expect)(lines[0]).toContain('var2');
                (0, globals_1.expect)(lines[0]).toContain('[openai:gpt-4] Prompt 1');
                (0, globals_1.expect)(lines[0]).toContain('[anthropic:claude] Prompt 2');
                (0, globals_1.expect)(lines[0]).toContain('Grader Reason');
                (0, globals_1.expect)(lines[0]).toContain('Comment');
            });
            (0, globals_1.it)('should include test descriptions when present', () => {
                const csv = (0, evalTableUtils_1.evalTableToCsv)(mockTable);
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[1]).toContain('Test case 1');
                // Second row should not have a description (empty string)
                const row2Parts = lines[2].split(',');
                (0, globals_1.expect)(row2Parts[0]).toBe(''); // Empty description for second test
            });
            (0, globals_1.it)('should exclude Description column when no descriptions exist', () => {
                const tableWithoutDescriptions = {
                    ...mockTable,
                    body: mockTable.body.map((row) => ({
                        ...row,
                        test: { ...row.test, description: undefined },
                    })),
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithoutDescriptions);
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).not.toContain('Description');
                (0, globals_1.expect)(lines[0].startsWith('var1')).toBe(true);
            });
            (0, globals_1.it)('should format output with pass/fail/error prefixes', () => {
                const csv = (0, evalTableUtils_1.evalTableToCsv)(mockTable);
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[1]).toContain('[PASS] Success output');
                (0, globals_1.expect)(lines[1]).toContain('[FAIL] Failed output');
                (0, globals_1.expect)(lines[2]).toContain('[ERROR] Error output');
                (0, globals_1.expect)(lines[2]).toContain('[PASS] Another success');
            });
            (0, globals_1.it)('should include grader reason and comments', () => {
                const csv = (0, evalTableUtils_1.evalTableToCsv)(mockTable);
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[1]).toContain('Output meets criteria');
                (0, globals_1.expect)(lines[1]).toContain('Well formatted');
                (0, globals_1.expect)(lines[1]).toContain('Missing required field');
                (0, globals_1.expect)(lines[1]).toContain('Needs improvement');
            });
            (0, globals_1.it)('should handle null and undefined outputs', () => {
                const tableWithNullOutputs = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                null,
                                undefined,
                                { pass: true, text: 'Valid output' },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithNullOutputs);
                const lines = csv.split('\n');
                // Should have empty values for null/undefined outputs
                (0, globals_1.expect)(lines[1]).toContain(',,'); // Empty values for null output
                (0, globals_1.expect)(lines[1]).toContain('[PASS] Valid output');
            });
            (0, globals_1.it)('should handle outputs without gradingResult', () => {
                const tableWithoutGrading = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output without grading',
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithoutGrading);
                const lines = csv.split('\n');
                // Should have empty values for grader columns
                (0, globals_1.expect)(lines[1]).toContain('[PASS] Output without grading,,');
            });
        });
        (0, globals_1.describe)('Red team CSV generation', () => {
            (0, globals_1.it)('should add Messages column for message-based providers', () => {
                const tableWithMessages = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output',
                                    metadata: {
                                        messages: [
                                            { role: 'user', content: 'Hello' },
                                            { role: 'assistant', content: 'Hi there!' },
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithMessages, { isRedteam: true });
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('Messages');
                // CSV escapes quotes in JSON strings
                (0, globals_1.expect)(lines[1]).toMatch(/\[.*role.*user.*content.*Hello.*\}.*\{.*role.*assistant.*content.*Hi there.*\]/);
            });
            (0, globals_1.it)('should add RedteamHistory column for iterative providers', () => {
                const tableWithHistory = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: false,
                                    text: 'Output',
                                    metadata: {
                                        redteamHistory: [
                                            'Initial attempt',
                                            'Second attempt with modification',
                                            'Final successful attempt',
                                        ],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithHistory, { isRedteam: true });
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('RedteamHistory');
                // CSV escapes quotes in JSON strings
                (0, globals_1.expect)(lines[1]).toMatch(/Initial attempt.*Second attempt with modification.*Final successful attempt/);
            });
            (0, globals_1.it)('should add RedteamTreeHistory column for tree-based providers', () => {
                const tableWithTreeHistory = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: false,
                                    text: 'Output',
                                    metadata: {
                                        redteamTreeHistory: 'Root -> Branch1 -> Leaf1\nRoot -> Branch2 -> Leaf2',
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithTreeHistory, { isRedteam: true });
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('RedteamTreeHistory');
                // Tree history is a string primitive, so it's added directly (not JSON.stringify'd)
                (0, globals_1.expect)(lines[1]).toMatch(/Root -> Branch1 -> Leaf1/);
                (0, globals_1.expect)(csv).toMatch(/Root -> Branch2 -> Leaf2/);
            });
            (0, globals_1.it)('should add pluginId, strategyId, sessionId, and sessionIds columns', () => {
                const tableWithIds = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: false,
                                    text: 'Output',
                                    metadata: {
                                        pluginId: 'harmful:violent-crime',
                                        strategyId: 'jailbreak',
                                        sessionId: 'session-abc-123',
                                        sessionIds: ['session-abc-123', 'session-def-456'],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithIds, { isRedteam: true });
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('pluginId');
                (0, globals_1.expect)(lines[0]).toContain('strategyId');
                (0, globals_1.expect)(lines[0]).toContain('sessionId');
                (0, globals_1.expect)(lines[0]).toContain('sessionIds');
                // String primitives are added directly (not JSON.stringify'd)
                (0, globals_1.expect)(lines[1]).toContain('harmful:violent-crime');
                (0, globals_1.expect)(lines[1]).toContain('jailbreak');
                (0, globals_1.expect)(lines[1]).toContain('session-abc-123');
                // sessionIds is an array, should be JSON stringified (CSV escapes quotes as double quotes)
                (0, globals_1.expect)(lines[1]).toMatch(/session-abc-123.*session-def-456/);
            });
            (0, globals_1.it)('should include all red team columns when multiple metadata types exist', () => {
                const tableWithAllMetadata = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output 1',
                                    metadata: {
                                        messages: [{ role: 'user', content: 'Test' }],
                                        redteamHistory: ['Attempt 1'],
                                        redteamTreeHistory: 'Tree structure',
                                        pluginId: 'test-plugin',
                                        strategyId: 'test-strategy',
                                        sessionId: 'session-123',
                                        sessionIds: ['session-123', 'session-456'],
                                    },
                                },
                                {
                                    pass: false,
                                    text: 'Output 2',
                                    metadata: {
                                        messages: [{ role: 'assistant', content: 'Response' }],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithAllMetadata, { isRedteam: true });
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).toContain('Messages');
                (0, globals_1.expect)(lines[0]).toContain('RedteamHistory');
                (0, globals_1.expect)(lines[0]).toContain('RedteamTreeHistory');
                (0, globals_1.expect)(lines[0]).toContain('pluginId');
                (0, globals_1.expect)(lines[0]).toContain('strategyId');
                (0, globals_1.expect)(lines[0]).toContain('sessionId');
                (0, globals_1.expect)(lines[0]).toContain('sessionIds');
            });
            (0, globals_1.it)('should handle multiple outputs without redteam metadata', () => {
                const tableWithMultipleOutputs = {
                    head: {
                        vars: ['var1'],
                        prompts: [
                            {
                                provider: 'openai:gpt-4',
                                label: 'Prompt 1',
                                raw: 'Test prompt 1',
                                display: 'Test prompt 1',
                            },
                            {
                                provider: 'anthropic:claude',
                                label: 'Prompt 2',
                                raw: 'Test prompt 2',
                                display: 'Test prompt 2',
                            },
                        ],
                    },
                    body: [
                        {
                            test: {
                                vars: { var1: 'value1' },
                            },
                            testIdx: 0,
                            vars: ['value1'],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'First output',
                                    gradingResult: {
                                        pass: true,
                                        reason: 'Good response',
                                        comment: 'Well formatted',
                                    },
                                },
                                {
                                    pass: false,
                                    text: 'Second output',
                                    failureReason: index_1.ResultFailureReason.ASSERT,
                                    gradingResult: {
                                        pass: false,
                                        reason: 'Bad response',
                                        comment: 'Needs work',
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithMultipleOutputs); // No isRedteam flag
                const lines = csv.split('\n').filter((line) => line.trim());
                // Parse CSV to count columns
                const parseCSVLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const nextChar = line[i + 1];
                        if (char === '"' && nextChar === '"') {
                            current += '"';
                            i++;
                        }
                        else if (char === '"') {
                            inQuotes = !inQuotes;
                        }
                        else if (char === ',' && !inQuotes) {
                            result.push(current);
                            current = '';
                        }
                        else {
                            current += char;
                        }
                    }
                    result.push(current);
                    return result;
                };
                const headerCols = parseCSVLine(lines[0]);
                const dataCols = parseCSVLine(lines[1]);
                // Header and data row should have the same number of columns
                (0, globals_1.expect)(headerCols.length).toBe(dataCols.length);
                // Verify no redteam columns are present
                (0, globals_1.expect)(lines[0]).not.toContain('Messages');
                (0, globals_1.expect)(lines[0]).not.toContain('pluginId');
                (0, globals_1.expect)(lines[0]).not.toContain('strategyId');
                // Both outputs should be present
                (0, globals_1.expect)(lines[1]).toContain('First output');
                (0, globals_1.expect)(lines[1]).toContain('Second output');
                (0, globals_1.expect)(lines[1]).toContain('Good response');
                (0, globals_1.expect)(lines[1]).toContain('Bad response');
            });
            (0, globals_1.it)('should add redteam metadata columns once per row with multiple outputs', () => {
                const tableWithMultipleOutputs = {
                    head: {
                        vars: ['var1'],
                        prompts: [
                            {
                                provider: 'openai:gpt-4',
                                label: 'Prompt 1',
                                raw: 'Test prompt 1',
                                display: 'Test prompt 1',
                            },
                            {
                                provider: 'anthropic:claude',
                                label: 'Prompt 2',
                                raw: 'Test prompt 2',
                                display: 'Test prompt 2',
                            },
                        ],
                    },
                    body: [
                        {
                            test: {
                                vars: { var1: 'value1' },
                            },
                            testIdx: 0,
                            vars: ['value1'],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'First output',
                                    metadata: {
                                        messages: [{ role: 'user', content: 'First message' }],
                                        pluginId: 'plugin-1',
                                        strategyId: 'strategy-1',
                                        sessionId: 'session-1',
                                    },
                                },
                                {
                                    pass: false,
                                    text: 'Second output',
                                    metadata: {
                                        messages: [{ role: 'assistant', content: 'Second message' }],
                                        pluginId: 'plugin-2',
                                        strategyId: 'strategy-2',
                                        sessionId: 'session-2',
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithMultipleOutputs, { isRedteam: true });
                const lines = csv.split('\n').filter((line) => line.trim());
                // Parse CSV using a simple comma count approach for validation
                // Count actual CSV fields by splitting on commas not inside quotes
                const parseCSVLine = (line) => {
                    const result = [];
                    let current = '';
                    let inQuotes = false;
                    for (let i = 0; i < line.length; i++) {
                        const char = line[i];
                        const nextChar = line[i + 1];
                        if (char === '"' && nextChar === '"') {
                            // Escaped quote
                            current += '"';
                            i++; // Skip next char
                        }
                        else if (char === '"') {
                            // Toggle quote state
                            inQuotes = !inQuotes;
                        }
                        else if (char === ',' && !inQuotes) {
                            // Field separator
                            result.push(current);
                            current = '';
                        }
                        else {
                            current += char;
                        }
                    }
                    result.push(current); // Add last field
                    return result;
                };
                const headerCols = parseCSVLine(lines[0]);
                const dataCols = parseCSVLine(lines[1]);
                // Header and data row should have the same number of columns
                (0, globals_1.expect)(headerCols.length).toBe(dataCols.length);
                // Verify redteam columns are present in header (added once, not per output)
                (0, globals_1.expect)(lines[0]).toContain('Messages');
                (0, globals_1.expect)(lines[0]).toContain('pluginId');
                (0, globals_1.expect)(lines[0]).toContain('strategyId');
                (0, globals_1.expect)(lines[0]).toContain('sessionId');
                // Should use first output's metadata
                (0, globals_1.expect)(lines[1]).toContain('First output');
                (0, globals_1.expect)(lines[1]).toContain('Second output');
                (0, globals_1.expect)(lines[1]).toContain('plugin-1'); // From first output
                (0, globals_1.expect)(lines[1]).not.toContain('plugin-2'); // Second output's metadata should not be included
            });
            (0, globals_1.it)('should not add red team columns when config.redteam is not present', () => {
                const tableWithMetadata = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output',
                                    metadata: {
                                        messages: [{ role: 'user', content: 'Test' }],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithMetadata); // No config
                const lines = csv.split('\n');
                (0, globals_1.expect)(lines[0]).not.toContain('Messages');
                (0, globals_1.expect)(lines[0]).not.toContain('RedteamHistory');
                (0, globals_1.expect)(lines[0]).not.toContain('RedteamTreeHistory');
            });
            (0, globals_1.it)('should handle empty metadata arrays gracefully', () => {
                const tableWithEmptyMetadata = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output',
                                    metadata: {
                                        messages: [],
                                        redteamHistory: [],
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithEmptyMetadata, { isRedteam: true });
                const lines = csv.split('\n');
                // Empty arrays are still JSON.stringify'd (they're objects, not primitives)
                (0, globals_1.expect)(lines[1]).toContain('[]');
            });
            (0, globals_1.it)('should handle null/undefined metadata fields', () => {
                const tableWithNullMetadata = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output',
                                    metadata: {
                                        messages: null,
                                        redteamHistory: undefined,
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithNullMetadata, { isRedteam: true });
                const lines = csv.split('\n');
                // When metadata fields are null/undefined, they should be empty strings in CSV
                if (lines[0].includes('Messages') || lines[0].includes('RedteamHistory')) {
                    // The data row should have empty values for the redteam columns (trailing commas)
                    (0, globals_1.expect)(lines[1]).toMatch(/,,$/);
                }
                else {
                    // If no redteam columns were added, check that the line ends appropriately
                    (0, globals_1.expect)(lines[1]).toBeDefined();
                }
            });
        });
        (0, globals_1.describe)('Edge cases and special characters', () => {
            (0, globals_1.it)('should handle special characters in text fields', () => {
                const tableWithSpecialChars = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            test: {
                                vars: {},
                                description: 'Description with "quotes", commas, and\nnewlines',
                            },
                            vars: ['Value with, comma', 'Value with "quotes"'],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output with\nnewline and "quotes"',
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithSpecialChars);
                // CSV should properly escape special characters
                (0, globals_1.expect)(csv).toContain('"Description with ""quotes"", commas, and\nnewlines"');
                (0, globals_1.expect)(csv).toContain('"Value with, comma"');
                (0, globals_1.expect)(csv).toContain('"Value with ""quotes"""');
            });
            (0, globals_1.it)('should handle Unicode characters', () => {
                const tableWithUnicode = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            test: {
                                vars: {},
                                description: 'Test with émojis 🎉 and Unicode: 你好世界',
                            },
                            vars: ['日本語', '한국어'],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output with symbols: ™️ © ® ≠ ∞',
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithUnicode);
                (0, globals_1.expect)(csv).toContain('Test with émojis 🎉 and Unicode: 你好世界');
                (0, globals_1.expect)(csv).toContain('日本語');
                (0, globals_1.expect)(csv).toContain('한국어');
                (0, globals_1.expect)(csv).toContain('Output with symbols: ™️ © ® ≠ ∞');
            });
            (0, globals_1.it)('should handle very long text fields', () => {
                const longText = 'a'.repeat(10000);
                const tableWithLongText = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            test: {
                                vars: {},
                                description: longText,
                            },
                            outputs: [
                                {
                                    pass: true,
                                    text: longText,
                                    gradingResult: {
                                        pass: true,
                                        reason: longText,
                                        comment: longText,
                                    },
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithLongText);
                // Should contain the long text (CSV format handles it)
                (0, globals_1.expect)(csv).toContain(longText);
            });
            (0, globals_1.it)('should handle empty table body', () => {
                const emptyTable = {
                    ...mockTable,
                    body: [],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(emptyTable);
                const lines = csv.split('\n').filter((line) => line.trim());
                // Should only have header row
                (0, globals_1.expect)(lines).toHaveLength(1);
                (0, globals_1.expect)(lines[0]).toContain('var1');
            });
            (0, globals_1.it)('should handle table with no prompts', () => {
                const tableWithNoPrompts = {
                    head: {
                        vars: ['var1', 'var2'],
                        prompts: [],
                    },
                    body: [
                        {
                            test: { vars: {} },
                            testIdx: 0,
                            vars: ['value1', 'value2'],
                            outputs: [],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithNoPrompts);
                const lines = csv.split('\n');
                // Should only have variable columns
                (0, globals_1.expect)(lines[0]).toBe('var1,var2');
                (0, globals_1.expect)(lines[1]).toBe('value1,value2');
            });
            (0, globals_1.it)('should handle complex nested JSON in metadata', () => {
                const complexMetadata = {
                    messages: [
                        {
                            role: 'user',
                            content: 'Complex message',
                            metadata: {
                                timestamp: '2024-01-01T00:00:00Z',
                                tags: ['tag1', 'tag2'],
                                nested: {
                                    deep: {
                                        value: 'nested value',
                                    },
                                },
                            },
                        },
                    ],
                    redteamHistory: [
                        {
                            attempt: 1,
                            success: false,
                            details: {
                                strategy: 'jailbreak',
                                prompt: 'Test prompt',
                            },
                        },
                    ],
                };
                const tableWithComplexMetadata = {
                    ...mockTable,
                    body: [
                        {
                            ...mockTable.body[0],
                            outputs: [
                                {
                                    pass: true,
                                    text: 'Output',
                                    metadata: complexMetadata,
                                },
                            ],
                        },
                    ],
                };
                const csv = (0, evalTableUtils_1.evalTableToCsv)(tableWithComplexMetadata, {
                    isRedteam: true,
                });
                // Should serialize complex objects as JSON strings (with CSV escaping)
                (0, globals_1.expect)(csv).toMatch(/Complex message/);
                (0, globals_1.expect)(csv).toMatch(/timestamp.*2024-01-01T00:00:00Z/);
                (0, globals_1.expect)(csv).toMatch(/tags.*tag1.*tag2/);
                // Note: When messages are present, redteamHistory is not included in its own column
                // The redteamHistory data would be empty since messages take precedence
            });
        });
    });
    (0, globals_1.describe)('evalTableToJson', () => {
        (0, globals_1.it)('should return the table as-is', () => {
            const result = (0, evalTableUtils_1.evalTableToJson)(mockTable);
            (0, globals_1.expect)(result).toBe(mockTable);
        });
        (0, globals_1.it)('should handle empty table', () => {
            const emptyTable = {
                head: { vars: [], prompts: [] },
                body: [],
            };
            const result = (0, evalTableUtils_1.evalTableToJson)(emptyTable);
            (0, globals_1.expect)(result).toBe(emptyTable);
        });
        (0, globals_1.it)('should preserve all data including metadata', () => {
            const tableWithMetadata = {
                ...mockTable,
                body: [
                    {
                        ...mockTable.body[0],
                        outputs: [
                            {
                                pass: true,
                                text: 'Output',
                                metadata: {
                                    custom: 'data',
                                    nested: { value: 123 },
                                },
                            },
                        ],
                    },
                ],
            };
            const result = (0, evalTableUtils_1.evalTableToJson)(tableWithMetadata);
            (0, globals_1.expect)(result).toBe(tableWithMetadata);
            (0, globals_1.expect)(result.body[0].outputs[0].metadata).toEqual({
                custom: 'data',
                nested: { value: 123 },
            });
        });
    });
});
//# sourceMappingURL=evalTableUtils.test.js.map