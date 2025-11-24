"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDownloadHeaders = setDownloadHeaders;
/**
 * Set appropriate headers for file downloads
 * @param res Express response object
 * @param fileName Name of the file being downloaded
 * @param contentType MIME type of the file
 * @param contentLength Optional content length for download progress
 */
function setDownloadHeaders(res, fileName, contentType) {
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
}
//# sourceMappingURL=downloadHelpers.js.map