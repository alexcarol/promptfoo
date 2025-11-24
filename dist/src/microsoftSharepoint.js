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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchCsvFromSharepoint = fetchCsvFromSharepoint;
exports.getSharePointAccessToken = getSharePointAccessToken;
const index_1 = require("./util/fetch/index");
const envars_1 = require("./envars");
const logger_1 = __importDefault(require("./logger"));
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
let cca = null;
/**
 * Fetches CSV data from a SharePoint file using certificate-based authentication.
 * Requires environment variables: SHAREPOINT_CLIENT_ID, SHAREPOINT_TENANT_ID,
 * SHAREPOINT_CERT_PATH, and SHAREPOINT_BASE_URL.
 *
 * @param url - Full SharePoint URL to the CSV file
 * @returns Array of CSV rows as objects
 */
async function fetchCsvFromSharepoint(url) {
    const sharepointBaseUrl = (0, envars_1.getEnvString)('SHAREPOINT_BASE_URL');
    if (!sharepointBaseUrl) {
        throw new Error('SHAREPOINT_BASE_URL environment variable is required. Please set it to your SharePoint base URL (e.g., https://yourcompany.sharepoint.com).');
    }
    const accessToken = await getSharePointAccessToken();
    const normalizedBaseUrl = sharepointBaseUrl.replace(/\/+$/, '');
    const fileRelativeUrl = url.startsWith(normalizedBaseUrl)
        ? url.slice(normalizedBaseUrl.length)
        : url;
    const serverRelativeUrl = fileRelativeUrl.startsWith('/')
        ? fileRelativeUrl
        : `/${fileRelativeUrl}`;
    const apiUrl = `${normalizedBaseUrl}/_api/web/GetFileByServerRelativeUrl('${encodeURI(serverRelativeUrl)}')/$value`;
    logger_1.default.debug(`Fetching CSV from SharePoint: ${apiUrl}`);
    const response = await (0, index_1.fetchWithProxy)(apiUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'text/csv',
        },
    });
    if (!response.ok) {
        const statusText = response.statusText || 'Unknown error';
        throw new Error(`Failed to fetch CSV from SharePoint URL: ${url}. Status: ${response.status} ${statusText}`);
    }
    const csvData = await response.text();
    const { parse: parseCsv } = await Promise.resolve().then(() => __importStar(require('csv-parse/sync')));
    try {
        return parseCsv(csvData, { columns: true });
    }
    catch (error) {
        throw new Error(`Failed to parse CSV data from SharePoint: ${error}`);
    }
}
async function getConfidentialClient() {
    if (!cca) {
        const { ConfidentialClientApplication: MsalClient } = await Promise.resolve().then(() => __importStar(require('@azure/msal-node')));
        const clientId = (0, envars_1.getEnvString)('SHAREPOINT_CLIENT_ID');
        const tenantId = (0, envars_1.getEnvString)('SHAREPOINT_TENANT_ID');
        const certPath = (0, envars_1.getEnvString)('SHAREPOINT_CERT_PATH');
        if (!clientId) {
            throw new Error('SHAREPOINT_CLIENT_ID environment variable is required. Please set it to your Azure AD application client ID.');
        }
        if (!tenantId) {
            throw new Error('SHAREPOINT_TENANT_ID environment variable is required. Please set it to your Azure AD tenant ID.');
        }
        if (!certPath) {
            throw new Error('SHAREPOINT_CERT_PATH environment variable is required. Please set it to the path of your certificate PEM file.');
        }
        let pemContent;
        try {
            pemContent = fs_1.default.readFileSync(certPath, 'utf8');
        }
        catch (error) {
            throw new Error(`Failed to read certificate from path: ${certPath}. Error: ${error}`);
        }
        // Extract private key
        const privateKeyMatch = pemContent.match(/-----BEGIN PRIVATE KEY-----[\s\S]+?-----END PRIVATE KEY-----/);
        const privateKey = privateKeyMatch ? privateKeyMatch[0] : pemContent;
        // Extract certificate for thumbprint calculation
        const certMatch = pemContent.match(/-----BEGIN CERTIFICATE-----\n([\s\S]+?)\n-----END CERTIFICATE-----/);
        if (!certMatch) {
            throw new Error(`Certificate not found in PEM file at ${certPath}. The PEM file must contain both private key and certificate.`);
        }
        // Calculate SHA-256 thumbprint from the certificate
        const certDer = Buffer.from(certMatch[1].replace(/\s/g, ''), 'base64');
        const thumbprintSha256 = crypto_1.default
            .createHash('sha256')
            .update(certDer)
            .digest('hex')
            .toUpperCase();
        const msalConfig = {
            auth: {
                clientId,
                authority: `https://login.microsoftonline.com/${tenantId}`,
                clientCertificate: {
                    thumbprintSha256,
                    privateKey,
                },
            },
        };
        cca = new MsalClient(msalConfig);
    }
    return cca;
}
async function getSharePointAccessToken() {
    const client = await getConfidentialClient();
    const baseUrl = (0, envars_1.getEnvString)('SHAREPOINT_BASE_URL');
    if (!baseUrl) {
        throw new Error('SHAREPOINT_BASE_URL environment variable is required. Please set it to your SharePoint base URL (e.g., https://yourcompany.sharepoint.com).');
    }
    const tokenResult = await client.acquireTokenByClientCredential({
        scopes: [`${baseUrl}/.default`],
    });
    if (!tokenResult?.accessToken) {
        throw new Error('Failed to acquire SharePoint access token. Please check your authentication configuration.');
    }
    return tokenResult.accessToken;
}
//# sourceMappingURL=microsoftSharepoint.js.map