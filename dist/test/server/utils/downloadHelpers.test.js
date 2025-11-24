"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const downloadHelpers_1 = require("../../../src/server/utils/downloadHelpers");
(0, globals_1.describe)('downloadHelpers', () => {
    (0, globals_1.describe)('setDownloadHeaders', () => {
        let mockRes;
        let setHeaderMock;
        (0, globals_1.beforeEach)(() => {
            setHeaderMock = globals_1.jest.fn().mockReturnThis();
            mockRes = {
                setHeader: setHeaderMock,
            };
        });
        (0, globals_1.it)('should set correct headers for CSV download', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test-file.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="test-file.csv"');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Cache-Control', 'no-cache, no-store, must-revalidate');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Pragma', 'no-cache');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Expires', '0');
        });
        (0, globals_1.it)('should set correct headers for JSON download', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'data.json', 'application/json');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Type', 'application/json');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="data.json"');
        });
        (0, globals_1.it)('should handle special characters in filename', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'file with spaces & special.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="file with spaces & special.csv"');
        });
        (0, globals_1.it)('should handle very long filenames', () => {
            const longFileName = 'a'.repeat(255) + '.csv';
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, longFileName, 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${longFileName}"`);
        });
        (0, globals_1.it)('should handle Unicode characters in filename', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, '测试文件.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="测试文件.csv"');
        });
        (0, globals_1.it)('should handle different content types', () => {
            const testCases = [
                { fileName: 'file.pdf', contentType: 'application/pdf' },
                { fileName: 'file.xml', contentType: 'application/xml' },
                { fileName: 'file.txt', contentType: 'text/plain' },
                { fileName: 'file.yaml', contentType: 'application/x-yaml' },
            ];
            testCases.forEach(({ fileName, contentType }) => {
                setHeaderMock.mockClear();
                (0, downloadHelpers_1.setDownloadHeaders)(mockRes, fileName, contentType);
                (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Type', contentType);
                (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${fileName}"`);
            });
        });
        (0, globals_1.it)('should set all cache control headers', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test.csv', 'text/csv');
            // Verify all cache-preventing headers are set
            const calls = setHeaderMock.mock.calls;
            const headerMap = new Map(calls.map((call) => [call[0], call[1]]));
            (0, globals_1.expect)(headerMap.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate');
            (0, globals_1.expect)(headerMap.get('Pragma')).toBe('no-cache');
            (0, globals_1.expect)(headerMap.get('Expires')).toBe('0');
        });
        (0, globals_1.it)('should be called exactly 5 times for all headers', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'test.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledTimes(5);
        });
        (0, globals_1.it)('should handle empty filename', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, '', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename=""');
        });
        (0, globals_1.it)('should handle filename with quotes', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'file"with"quotes.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="file"with"quotes.csv"');
        });
        (0, globals_1.it)('should handle filename with path separators', () => {
            (0, downloadHelpers_1.setDownloadHeaders)(mockRes, 'path/to/file.csv', 'text/csv');
            (0, globals_1.expect)(setHeaderMock).toHaveBeenCalledWith('Content-Disposition', 'attachment; filename="path/to/file.csv"');
        });
    });
});
//# sourceMappingURL=downloadHelpers.test.js.map