"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NO_EMAIL_STATUS = exports.EmailValidationStatus = exports.BAD_EMAIL_RESULT = exports.EMAIL_OK_STATUS = void 0;
exports.EMAIL_OK_STATUS = 'ok';
exports.BAD_EMAIL_RESULT = 'bad_email';
var EmailValidationStatus;
(function (EmailValidationStatus) {
    EmailValidationStatus["OK"] = "ok";
    EmailValidationStatus["EXCEEDED_LIMIT"] = "exceeded_limit";
    EmailValidationStatus["SHOW_USAGE_WARNING"] = "show_usage_warning";
    EmailValidationStatus["RISKY_EMAIL"] = "risky_email";
    EmailValidationStatus["DISPOSABLE_EMAIL"] = "disposable_email";
})(EmailValidationStatus || (exports.EmailValidationStatus = EmailValidationStatus = {}));
exports.NO_EMAIL_STATUS = 'no_email';
//# sourceMappingURL=email.js.map