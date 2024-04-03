"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isSerializable = isSerializable;
var _shared = require("@wyw-in-js/shared");
function isSerializable(o) {
  console.log("isSerializable - isSerializable");
  if (Array.isArray(o)) {
    return o.every(isSerializable);
  }
  if (o === null) return true;
  if ((0, _shared.isBoxedPrimitive)(o)) return true;
  if (typeof o === 'object') {
    return Object.values(o).every(isSerializable);
  }
  return typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean';
}
//# sourceMappingURL=isSerializable.js.map