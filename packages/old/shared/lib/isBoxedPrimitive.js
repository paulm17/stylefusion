"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isBoxedPrimitive = isBoxedPrimitive;
// There is a problem with using boxed numbers and strings in TS,
// so we cannot just use `instanceof` here

const constructors = ['Number', 'String'];
function isBoxedPrimitive(o) {
  console.log("isBoxedPrimitive.ts - isBoxedPrimitive");
  if (typeof o !== 'object' || o === null) return false;
  return constructors.includes(o.constructor.name) && typeof (o === null || o === void 0 ? void 0 : o.valueOf()) !== 'object';
}
//# sourceMappingURL=isBoxedPrimitive.js.map