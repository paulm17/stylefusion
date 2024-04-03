"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isNodePath = isNodePath;
function isNodePath(obj) {
  console.log("isNodePath - isNodePath");
  return 'node' in obj && (obj === null || obj === void 0 ? void 0 : obj.node) !== undefined;
}
//# sourceMappingURL=isNodePath.js.map