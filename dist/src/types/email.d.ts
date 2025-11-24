export declare const EMAIL_OK_STATUS = "ok";
export type EmailOkStatus = typeof EMAIL_OK_STATUS;
export declare const BAD_EMAIL_RESULT = "bad_email";
export type BadEmailResult = typeof BAD_EMAIL_RESULT;
export declare enum EmailValidationStatus {
    OK = "ok",
    EXCEEDED_LIMIT = "exceeded_limit",
    SHOW_USAGE_WARNING = "show_usage_warning",
    RISKY_EMAIL = "risky_email",
    DISPOSABLE_EMAIL = "disposable_email"
}
export declare const NO_EMAIL_STATUS = "no_email";
export type NoEmailStatus = typeof NO_EMAIL_STATUS;
export type UserEmailStatus = EmailValidationStatus | NoEmailStatus;
//# sourceMappingURL=email.d.ts.map