"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.toValidCSSIdentifier = toValidCSSIdentifier;
function toValidCSSIdentifier(s) {
  console.log("toValidCSSIdentifier.ts - toValidCSSIdentifier");
  return s.replace(/[^-_a-z0-9\u00A0-\uFFFF]/gi, '_').replace(/^\d/, '_');
}
//# sourceMappingURL=toValidCSSIdentifier.js.map