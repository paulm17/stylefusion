"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toValidCSSIdentifier = void 0;
function toValidCSSIdentifier(s) {
    console.log("toValidCSSIdentifier.ts - toValidCSSIdentifier");
    return s.replace(/[^-_a-z0-9\u00A0-\uFFFF]/gi, '_').replace(/^\d/, '_');
}
exports.toValidCSSIdentifier = toValidCSSIdentifier;
