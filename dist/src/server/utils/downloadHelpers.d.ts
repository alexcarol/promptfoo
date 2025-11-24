import type { Response } from 'express';
/**
 * Set appropriate headers for file downloads
 * @param res Express response object
 * @param fileName Name of the file being downloaded
 * @param contentType MIME type of the file
 * @param contentLength Optional content length for download progress
 */
export declare function setDownloadHeaders(res: Response, fileName: string, contentType: string): void;
//# sourceMappingURL=downloadHelpers.d.ts.map