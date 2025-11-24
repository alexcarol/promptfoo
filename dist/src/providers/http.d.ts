import { z } from 'zod';
import type { ApiProvider, CallApiContextParams, ProviderOptions, ProviderResponse } from '../types/index';
/**
 * Escapes string values in variables for safe JSON template substitution.
 * Converts { key: "value\nwith\nnewlines" } to { key: "value\\nwith\\nnewlines" }
 */
export declare function escapeJsonVariables(vars: Record<string, any>): Record<string, any>;
export declare function urlEncodeRawRequestPath(rawRequest: string): string;
/**
 * Generate signature using different certificate types
 */
export declare function generateSignature(signatureAuth: any, signatureTimestamp: number): Promise<string>;
export declare const HttpProviderConfigSchema: z.ZodObject<{
    body: z.ZodOptional<z.ZodUnion<[z.ZodRecord<z.ZodString, z.ZodAny>, z.ZodString, z.ZodArray<z.ZodAny, "many">]>>;
    headers: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    maxRetries: z.ZodOptional<z.ZodNumber>;
    method: z.ZodOptional<z.ZodString>;
    queryParams: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodString>>;
    request: z.ZodOptional<z.ZodString>;
    useHttps: z.ZodOptional<z.ZodBoolean>;
    sessionParser: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    sessionSource: z.ZodOptional<z.ZodEnum<["client", "server"]>>;
    stateful: z.ZodOptional<z.ZodBoolean>;
    transformRequest: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    transformResponse: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    url: z.ZodOptional<z.ZodString>;
    validateStatus: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[z.ZodNumber], z.ZodUnknown>, z.ZodBoolean>]>>;
    /**
     * @deprecated use transformResponse instead
     */
    responseParser: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>]>>;
    tokenEstimation: z.ZodOptional<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        multiplier: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        multiplier: number;
    }, {
        enabled?: boolean | undefined;
        multiplier?: number | undefined;
    }>>;
    signatureAuth: z.ZodEffects<z.ZodOptional<z.ZodUnion<[z.ZodObject<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        keyPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        keyPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        keyPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>, z.ZodEffects<z.ZodObject<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        type: z.ZodLiteral<"pem">;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "pem";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    }, {
        type: "pem";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    }>, {
        type: "pem";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    }, {
        type: "pem";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    }>, z.ZodEffects<z.ZodObject<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        type: z.ZodLiteral<"jks">;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "jks";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    }, {
        type: "jks";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    }>, {
        type: "jks";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    }, {
        type: "jks";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    }>, z.ZodEffects<z.ZodObject<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        type: z.ZodLiteral<"pfx">;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: "pfx";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    }, {
        type: "pfx";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    }>, {
        type: "pfx";
        signatureValidityMs: number;
        signatureDataTemplate: string;
        signatureAlgorithm: string;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    }, {
        type: "pfx";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    }>, z.ZodObject<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        certificateContent: z.ZodOptional<z.ZodString>;
        certificatePassword: z.ZodOptional<z.ZodString>;
        certificateFilename: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["pem", "jks", "pfx"]>>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        certificateContent: z.ZodOptional<z.ZodString>;
        certificatePassword: z.ZodOptional<z.ZodString>;
        certificateFilename: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["pem", "jks", "pfx"]>>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        certificateContent: z.ZodOptional<z.ZodString>;
        certificatePassword: z.ZodOptional<z.ZodString>;
        certificateFilename: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["pem", "jks", "pfx"]>>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough">>]>>, any, {
        type: "pem";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    } | {
        type: "jks";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    } | {
        type: "pfx";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    } | z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        keyPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        certificateContent: z.ZodOptional<z.ZodString>;
        certificatePassword: z.ZodOptional<z.ZodString>;
        certificateFilename: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["pem", "jks", "pfx"]>>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | undefined>;
    tls: z.ZodOptional<z.ZodEffects<z.ZodObject<{
        ca: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        caPath: z.ZodOptional<z.ZodString>;
        cert: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        certPath: z.ZodOptional<z.ZodString>;
        key: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>;
        keyPath: z.ZodOptional<z.ZodString>;
        pfx: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodType<Buffer<ArrayBufferLike>, z.ZodTypeDef, Buffer<ArrayBufferLike>>]>>;
        pfxPath: z.ZodOptional<z.ZodString>;
        passphrase: z.ZodOptional<z.ZodString>;
        rejectUnauthorized: z.ZodDefault<z.ZodBoolean>;
        servername: z.ZodOptional<z.ZodString>;
        ciphers: z.ZodOptional<z.ZodString>;
        secureProtocol: z.ZodOptional<z.ZodString>;
        minVersion: z.ZodOptional<z.ZodString>;
        maxVersion: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        rejectUnauthorized: boolean;
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    }, {
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        rejectUnauthorized?: boolean | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    }>, {
        rejectUnauthorized: boolean;
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    }, {
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        rejectUnauthorized?: boolean | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    maxRetries?: number | undefined;
    url?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: string | any[] | Record<string, any> | undefined;
    queryParams?: Record<string, string> | undefined;
    method?: string | undefined;
    stateful?: boolean | undefined;
    tls?: {
        rejectUnauthorized: boolean;
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    } | undefined;
    request?: string | undefined;
    useHttps?: boolean | undefined;
    sessionParser?: string | ((...args: unknown[]) => unknown) | undefined;
    sessionSource?: "client" | "server" | undefined;
    transformRequest?: string | ((...args: unknown[]) => unknown) | undefined;
    transformResponse?: string | ((...args: unknown[]) => unknown) | undefined;
    validateStatus?: string | ((args_0: number, ...args: unknown[]) => boolean) | undefined;
    responseParser?: string | ((...args: unknown[]) => unknown) | undefined;
    tokenEstimation?: {
        enabled: boolean;
        multiplier: number;
    } | undefined;
    signatureAuth?: any;
}, {
    maxRetries?: number | undefined;
    url?: string | undefined;
    headers?: Record<string, string> | undefined;
    body?: string | any[] | Record<string, any> | undefined;
    queryParams?: Record<string, string> | undefined;
    method?: string | undefined;
    stateful?: boolean | undefined;
    tls?: {
        key?: string | string[] | undefined;
        passphrase?: string | undefined;
        pfx?: string | Buffer<ArrayBufferLike> | undefined;
        servername?: string | undefined;
        ca?: string | string[] | undefined;
        cert?: string | string[] | undefined;
        ciphers?: string | undefined;
        maxVersion?: string | undefined;
        minVersion?: string | undefined;
        secureProtocol?: string | undefined;
        rejectUnauthorized?: boolean | undefined;
        pfxPath?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        caPath?: string | undefined;
    } | undefined;
    request?: string | undefined;
    useHttps?: boolean | undefined;
    sessionParser?: string | ((...args: unknown[]) => unknown) | undefined;
    sessionSource?: "client" | "server" | undefined;
    transformRequest?: string | ((...args: unknown[]) => unknown) | undefined;
    transformResponse?: string | ((...args: unknown[]) => unknown) | undefined;
    validateStatus?: string | ((args_0: number, ...args: unknown[]) => boolean) | undefined;
    responseParser?: string | ((...args: unknown[]) => unknown) | undefined;
    tokenEstimation?: {
        enabled?: boolean | undefined;
        multiplier?: number | undefined;
    } | undefined;
    signatureAuth?: {
        type: "pem";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        privateKeyPath?: string | undefined;
        privateKey?: string | undefined;
    } | {
        type: "jks";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        keystorePath?: string | undefined;
        keystoreContent?: string | undefined;
        keystorePassword?: string | undefined;
        keyAlias?: string | undefined;
    } | {
        type: "pfx";
        signatureValidityMs?: number | undefined;
        signatureDataTemplate?: string | undefined;
        signatureAlgorithm?: string | undefined;
        signatureRefreshBufferMs?: number | undefined;
        pfxPath?: string | undefined;
        pfxContent?: string | undefined;
        pfxPassword?: string | undefined;
        certPath?: string | undefined;
        keyPath?: string | undefined;
        certContent?: string | undefined;
        keyContent?: string | undefined;
    } | z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        privateKeyPath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        keyPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | z.objectInputType<{
        signatureValidityMs: z.ZodDefault<z.ZodNumber>;
        signatureDataTemplate: z.ZodDefault<z.ZodString>;
        signatureAlgorithm: z.ZodDefault<z.ZodString>;
        signatureRefreshBufferMs: z.ZodOptional<z.ZodNumber>;
    } & {
        certificateContent: z.ZodOptional<z.ZodString>;
        certificatePassword: z.ZodOptional<z.ZodString>;
        certificateFilename: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodEnum<["pem", "jks", "pfx"]>>;
        pfxContent: z.ZodOptional<z.ZodString>;
        pfxPassword: z.ZodOptional<z.ZodString>;
        pfxPath: z.ZodOptional<z.ZodString>;
        keystoreContent: z.ZodOptional<z.ZodString>;
        keystorePassword: z.ZodOptional<z.ZodString>;
        keystorePath: z.ZodOptional<z.ZodString>;
        privateKey: z.ZodOptional<z.ZodString>;
        privateKeyPath: z.ZodOptional<z.ZodString>;
        keyAlias: z.ZodOptional<z.ZodString>;
        certPath: z.ZodOptional<z.ZodString>;
        keyPath: z.ZodOptional<z.ZodString>;
        certContent: z.ZodOptional<z.ZodString>;
        keyContent: z.ZodOptional<z.ZodString>;
    }, z.ZodTypeAny, "passthrough"> | undefined;
}>;
type HttpProviderConfig = z.infer<typeof HttpProviderConfigSchema>;
interface SessionParserData {
    headers?: Record<string, string> | null;
    body?: Record<string, any> | string | null;
}
/**
 * Loads a module from a file:// reference if needed
 * This function should be called before passing transforms to createTransformResponse/createTransformRequest
 *
 * @param transform - The transform config (string or function)
 * @returns The loaded function, or the original value if not a file:// reference
 */
export declare function loadTransformModule(transform: string | Function | undefined): Promise<string | Function | undefined>;
export declare function createSessionParser(parser: string | Function | undefined): Promise<(data: SessionParserData) => string>;
/**
 * Substitutes template variables in a JSON object or array.
 *
 * This function walks through all properties of the provided JSON structure
 * and replaces template expressions (like {{varName}}) with their actual values.
 * If a substituted string is valid JSON, it will be parsed into an object or array.
 *
 * Example:
 * Input: {"greeting": "Hello {{name}}!", "data": {"id": "{{userId}}"}}
 * Vars: {name: "World", userId: 123}
 * Output: {"greeting": "Hello World!", "data": {"id": 123}}
 *
 * @param body The JSON object or array containing template expressions
 * @param vars Dictionary of variable names and their values for substitution
 * @returns A new object or array with all template expressions replaced
 */
export declare function processJsonBody(body: Record<string, any> | any[] | string, vars: Record<string, any>): Record<string, any> | any[] | string;
/**
 * Substitutes template variables in a text string.
 *
 * Replaces template expressions (like {{varName}}) in the string with their
 * actual values from the provided variables dictionary.
 *
 * Example:
 * Input: "Hello {{name}}! Your user ID is {{userId}}."
 * Vars: {name: "World", userId: 123}
 * Output: "Hello World! Your user ID is 123."
 *
 * @param body The string containing template expressions to substitute
 * @param vars Dictionary of variable names and their values for substitution
 * @returns A new string with all template expressions replaced
 * @throws Error if body is an object instead of a string
 */
export declare function processTextBody(body: string, vars: Record<string, any>): string;
export declare function determineRequestBody(contentType: boolean, parsedPrompt: any, configBody: Record<string, any> | any[] | string | undefined, vars: Record<string, any>): Record<string, any> | any[] | string;
export declare function createValidateStatus(validator: string | ((status: number) => boolean) | undefined): Promise<(status: number) => boolean>;
/**
 * Estimates token count for a given text using word-based counting
 */
export declare function estimateTokenCount(text: string, multiplier?: number): number;
export declare class HttpProvider implements ApiProvider {
    url: string;
    config: HttpProviderConfig;
    private transformResponse;
    private sessionParser;
    private transformRequest;
    private validateStatus;
    private lastSignatureTimestamp?;
    private lastSignature?;
    private httpsAgent?;
    private httpsAgentPromise?;
    constructor(url: string, options: ProviderOptions);
    id(): string;
    toString(): string;
    /**
     * Estimates token usage for prompt and completion text
     */
    private estimateTokenUsage;
    private refreshSignatureIfNeeded;
    private getHttpsAgent;
    private getDefaultHeaders;
    private validateContentTypeAndBody;
    getHeaders(defaultHeaders: Record<string, string>, vars: Record<string, any>): Promise<Record<string, string>>;
    callApi(prompt: string, context?: CallApiContextParams): Promise<ProviderResponse>;
    private callApiWithRawRequest;
    /**
     * Extracts completion text from parsed output with fallback to raw text
     */
    private getCompletionText;
    /**
     * Processes response and adds token estimation if enabled
     */
    private processResponseWithTokenEstimation;
}
export {};
//# sourceMappingURL=http.d.ts.map