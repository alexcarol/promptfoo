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
const xlsx_1 = require("../../src/util/xlsx");
jest.mock('xlsx', () => ({
    readFile: jest.fn(),
    utils: {
        sheet_to_json: jest.fn(),
    },
}));
jest.mock('fs', () => ({
    existsSync: jest.fn(() => true),
}));
describe('parseXlsxFile', () => {
    let xlsx;
    let fs;
    beforeEach(async () => {
        xlsx = await Promise.resolve().then(() => __importStar(require('xlsx')));
        fs = require('fs');
        jest.resetAllMocks();
        // Mock fs.existsSync to return true by default
        jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });
    it('should parse xlsx file successfully', async () => {
        const mockData = [
            { col1: 'value1', col2: 'value2' },
            { col1: 'value3', col2: 'value4' },
        ];
        xlsx.readFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {},
            },
        });
        xlsx.utils.sheet_to_json.mockReturnValue(mockData);
        const result = await (0, xlsx_1.parseXlsxFile)('test.xlsx');
        expect(result).toEqual(mockData);
        expect(xlsx.readFile).toHaveBeenCalledWith('test.xlsx');
        expect(xlsx.utils.sheet_to_json).toHaveBeenCalledWith({}, { defval: '' });
    });
    it('should throw error when xlsx module is not installed', async () => {
        xlsx.readFile.mockImplementation(() => {
            throw new Error("Cannot find module 'xlsx'");
        });
        await expect((0, xlsx_1.parseXlsxFile)('test.xlsx')).rejects.toThrow('xlsx is not installed. Please install it with: npm install xlsx');
    });
    it('should throw error when file parsing fails', async () => {
        xlsx.readFile.mockImplementation(() => {
            throw new Error('Failed to read file');
        });
        await expect((0, xlsx_1.parseXlsxFile)('test.xlsx')).rejects.toThrow('Failed to parse Excel file test.xlsx: Failed to read file');
    });
    it('should handle empty sheets', async () => {
        xlsx.readFile.mockReturnValue({
            SheetNames: ['Sheet1'],
            Sheets: {
                Sheet1: {},
            },
        });
        xlsx.utils.sheet_to_json.mockReturnValue([]);
        await expect((0, xlsx_1.parseXlsxFile)('test.xlsx')).rejects.toThrow('Sheet "Sheet1" is empty or contains no valid data rows');
    });
    it('should use first sheet by default', async () => {
        const mockData = [{ col1: 'value1', col2: 'value2' }];
        xlsx.readFile.mockReturnValue({
            SheetNames: ['Sheet1', 'Sheet2'],
            Sheets: {
                Sheet1: {},
                Sheet2: {},
            },
        });
        xlsx.utils.sheet_to_json.mockReturnValue(mockData);
        const result = await (0, xlsx_1.parseXlsxFile)('test.xlsx');
        expect(result).toEqual(mockData);
        expect(xlsx.utils.sheet_to_json).toHaveBeenCalledWith({}, { defval: '' });
    });
    it('should handle malformed Excel files gracefully', async () => {
        xlsx.readFile.mockImplementation(() => {
            throw new Error('Invalid file format or corrupted file');
        });
        await expect((0, xlsx_1.parseXlsxFile)('corrupted.xlsx')).rejects.toThrow('Failed to parse Excel file corrupted.xlsx: Invalid file format or corrupted file');
    });
    it('should throw specific error when file does not exist', async () => {
        // Override the default mock for this test
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        await expect((0, xlsx_1.parseXlsxFile)('nonexistent.xlsx')).rejects.toThrow('File not found: nonexistent.xlsx');
    });
    describe('sheet selection syntax', () => {
        it('should select sheet by name using # syntax', async () => {
            const mockData = [{ col1: 'sheet2data', col2: 'value2' }];
            xlsx.readFile.mockReturnValue({
                SheetNames: ['Sheet1', 'DataSheet', 'Sheet3'],
                Sheets: {
                    Sheet1: { data: 'sheet1' },
                    DataSheet: { data: 'datasheet' },
                    Sheet3: { data: 'sheet3' },
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue(mockData);
            const result = await (0, xlsx_1.parseXlsxFile)('test.xlsx#DataSheet');
            expect(result).toEqual(mockData);
            expect(xlsx.utils.sheet_to_json).toHaveBeenCalledWith({ data: 'datasheet' }, { defval: '' });
        });
        it('should select sheet by 1-based index using # syntax', async () => {
            const mockData = [{ col1: 'sheet2data', col2: 'value2' }];
            xlsx.readFile.mockReturnValue({
                SheetNames: ['Sheet1', 'Sheet2', 'Sheet3'],
                Sheets: {
                    Sheet1: { data: 'sheet1' },
                    Sheet2: { data: 'sheet2' },
                    Sheet3: { data: 'sheet3' },
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue(mockData);
            const result = await (0, xlsx_1.parseXlsxFile)('test.xlsx#2');
            expect(result).toEqual(mockData);
            expect(xlsx.utils.sheet_to_json).toHaveBeenCalledWith({ data: 'sheet2' }, { defval: '' });
        });
        it('should throw error for non-existent sheet name', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['Sheet1', 'Sheet2'],
                Sheets: {
                    Sheet1: {},
                    Sheet2: {},
                },
            });
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#NonExistentSheet')).rejects.toThrow('Sheet "NonExistentSheet" not found. Available sheets: Sheet1, Sheet2');
        });
        it('should throw error for out-of-range sheet index', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['Sheet1', 'Sheet2'],
                Sheets: {
                    Sheet1: {},
                    Sheet2: {},
                },
            });
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#5')).rejects.toThrow('Sheet index 5 is out of range. Available sheets: 2 (1-2)');
        });
        it('should throw error for zero or negative sheet index', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['Sheet1', 'Sheet2'],
                Sheets: {
                    Sheet1: {},
                    Sheet2: {},
                },
            });
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#0')).rejects.toThrow('Sheet index 0 is out of range. Available sheets: 2 (1-2)');
        });
    });
    describe('data validation', () => {
        it('should throw error for empty sheet', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['EmptySheet'],
                Sheets: {
                    EmptySheet: {},
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue([]);
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#EmptySheet')).rejects.toThrow('Sheet "EmptySheet" is empty or contains no valid data rows');
        });
        it('should throw error for sheet with no headers', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['NoHeaders'],
                Sheets: {
                    NoHeaders: {},
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue([{}]);
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#NoHeaders')).rejects.toThrow('Sheet "NoHeaders" has no valid column headers');
        });
        it('should throw error for sheet with only empty data', async () => {
            xlsx.readFile.mockReturnValue({
                SheetNames: ['EmptyData'],
                Sheets: {
                    EmptyData: {},
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue([
                { col1: '', col2: '' },
                { col1: '   ', col2: '' },
                { col1: '', col2: '  ' },
            ]);
            await expect((0, xlsx_1.parseXlsxFile)('test.xlsx#EmptyData')).rejects.toThrow('Sheet "EmptyData" contains only empty data. Please ensure the sheet has both headers and data rows.');
        });
        it('should accept sheet with some valid data', async () => {
            const mockData = [
                { col1: '', col2: 'valid data' },
                { col1: '   ', col2: '' },
            ];
            xlsx.readFile.mockReturnValue({
                SheetNames: ['ValidData'],
                Sheets: {
                    ValidData: {},
                },
            });
            xlsx.utils.sheet_to_json.mockReturnValue(mockData);
            const result = await (0, xlsx_1.parseXlsxFile)('test.xlsx#ValidData');
            expect(result).toEqual(mockData);
        });
    });
});
//# sourceMappingURL=xlsx.test.js.map