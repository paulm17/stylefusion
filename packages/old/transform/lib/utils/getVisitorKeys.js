"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getVisitorKeys = getVisitorKeys;
var _core = require("@babel/core");
function getVisitorKeys(node) {
  console.log("getVisitorKeys - getVisitorKeys");
  return _core.types.VISITOR_KEYS[node.type];
}
//# sourceMappingURL=getVisitorKeys.js.map