import type { CsvRow } from './types/index';
/**
 * Fetches CSV data from a SharePoint file using certificate-based authentication.
 * Requires environment variables: SHAREPOINT_CLIENT_ID, SHAREPOINT_TENANT_ID,
 * SHAREPOINT_CERT_PATH, and SHAREPOINT_BASE_URL.
 *
 * @param url - Full SharePoint URL to the CSV file
 * @returns Array of CSV rows as objects
 */
export declare function fetchCsvFromSharepoint(url: string): Promise<CsvRow[]>;
export declare function getSharePointAccessToken(): Promise<string>;
//# sourceMappingURL=microsoftSharepoint.d.ts.map