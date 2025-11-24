"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const crypto_1 = __importDefault(require("crypto"));
const http_1 = require("../../src/providers/http");
jest.mock('fs');
describe('PFX signature paths (generateSignature)', () => {
    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        // Ensure fs.promises exists when fs is mocked
        fs_1.default.promises = fs_1.default.promises || {};
    });
    it('throws when PFX password is missing', async () => {
        const signatureAuth = {
            type: 'pfx',
            pfxContent: 'BASE64',
            signatureDataTemplate: '{{signatureTimestamp}}',
            signatureAlgorithm: 'SHA256',
            signatureValidityMs: 300000,
        };
        await expect((0, http_1.generateSignature)(signatureAuth, Date.now())).rejects.toThrow(/PFX certificate password is required/);
    });
    it('throws when PFX file path does not exist', async () => {
        fs_1.default.promises.stat = jest.fn().mockRejectedValue(new Error('ENOENT'));
        jest.doMock('pem', () => ({
            __esModule: true,
            default: {
                readPkcs12: (_path, _opts, cb) => cb(new Error('ENOENT'), null),
            },
        }));
        const signatureAuth = {
            type: 'pfx',
            pfxPath: '/missing/cert.p12',
            pfxPassword: 'secret',
            signatureDataTemplate: '{{signatureTimestamp}}',
            signatureAlgorithm: 'SHA256',
            signatureValidityMs: 300000,
        };
        await expect((0, http_1.generateSignature)(signatureAuth, Date.now())).rejects.toThrow(/PFX file not found/);
    });
    it('throws when PFX content has wrong password', async () => {
        jest.doMock('pem', () => ({
            __esModule: true,
            default: {
                readPkcs12: (_buf, _opts, cb) => cb(new Error('invalid password'), null),
            },
        }));
        const signatureAuth = {
            type: 'pfx',
            pfxContent: Buffer.from('dummy').toString('base64'),
            pfxPassword: 'wrong',
            signatureDataTemplate: '{{signatureTimestamp}}',
            signatureAlgorithm: 'SHA256',
            signatureValidityMs: 300000,
        };
        await expect((0, http_1.generateSignature)(signatureAuth, Date.now())).rejects.toThrow(/Invalid PFX file format or wrong password/);
    });
    it('succeeds when PFX content yields a key', async () => {
        jest.doMock('pem', () => ({
            __esModule: true,
            default: {
                readPkcs12: (_buf, _opts, cb) => cb(null, {
                    key: '-----BEGIN PRIVATE KEY-----\nMOCK\n-----END PRIVATE KEY-----',
                    cert: 'CERT',
                }),
            },
        }));
        // Mock crypto signing
        const update = jest.fn();
        const end = jest.fn();
        const sign = jest.fn().mockReturnValue(Buffer.from('sig'));
        jest.spyOn(crypto_1.default, 'createSign').mockReturnValue({ update, end, sign });
        const signatureAuth = {
            type: 'pfx',
            pfxContent: Buffer.from('dummy').toString('base64'),
            pfxPassword: 'ok',
            signatureDataTemplate: '{{signatureTimestamp}}',
            signatureAlgorithm: 'SHA256',
            signatureValidityMs: 300000,
        };
        const result = await (0, http_1.generateSignature)(signatureAuth, Date.now());
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=http-pfx-signature.test.js.map