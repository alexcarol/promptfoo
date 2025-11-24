import { z } from 'zod';
export declare const TelemetryEventSchema: z.ZodObject<{
    event: z.ZodEnum<["assertion_used", "command_used", "eval_ran", "feature_used", "funnel", "redteam discover", "redteam generate", "redteam init", "redteam poison", "redteam report", "redteam run", "redteam setup", "webui_action", "webui_api", "webui_page_view"]>;
    packageVersion: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    properties: z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean, z.ZodArray<z.ZodString, "many">]>>;
}, "strip", z.ZodTypeAny, {
    properties: Record<string, string | number | boolean | string[]>;
    event: "assertion_used" | "command_used" | "eval_ran" | "feature_used" | "funnel" | "redteam discover" | "redteam generate" | "redteam init" | "redteam poison" | "redteam report" | "redteam run" | "redteam setup" | "webui_action" | "webui_api" | "webui_page_view";
    packageVersion: string;
}, {
    properties: Record<string, string | number | boolean | string[]>;
    event: "assertion_used" | "command_used" | "eval_ran" | "feature_used" | "funnel" | "redteam discover" | "redteam generate" | "redteam init" | "redteam poison" | "redteam report" | "redteam run" | "redteam setup" | "webui_action" | "webui_api" | "webui_page_view";
    packageVersion?: string | undefined;
}>;
type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type TelemetryEventTypes = TelemetryEvent['event'];
export type EventProperties = TelemetryEvent['properties'];
export declare class Telemetry {
    private telemetryDisabledRecorded;
    private id;
    private email;
    constructor();
    identify(): Promise<void>;
    get disabled(): boolean;
    private recordTelemetryDisabled;
    record(eventName: TelemetryEventTypes, properties: EventProperties): void;
    private sendEvent;
    shutdown(): Promise<void>;
    /**
     * This is a separate endpoint to save consent used only for redteam data synthesis for "harmful" plugins.
     */
    saveConsent(email: string, metadata?: Record<string, string>): Promise<void>;
}
declare const telemetry: Telemetry;
export default telemetry;
//# sourceMappingURL=telemetry.d.ts.map