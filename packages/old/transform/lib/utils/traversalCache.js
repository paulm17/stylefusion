"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.invalidateTraversalCache = exports.getTraversalCache = exports.clearBabelTraversalCache = void 0;
var _traverse = _interopRequireDefault(require("@babel/traverse"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const caches = new WeakMap();
const getTraversalCache = (path, name) => {
  console.log("traversalCache - getTraversalCache");
  const programPath = path.find(p => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }
  if (!caches.has(programPath)) {
    caches.set(programPath, new Map());
  }
  const cache = caches.get(programPath);
  if (!cache.has(name)) {
    cache.set(name, new WeakMap());
  }
  return cache.get(name);
};
exports.getTraversalCache = getTraversalCache;
const traverseCache = _traverse.default.cache;
const clearBabelTraversalCache = () => {
  console.log("traversalCache - clearBabelTraversalCache");
  traverseCache.clear();
};
exports.clearBabelTraversalCache = clearBabelTraversalCache;
const invalidateTraversalCache = path => {
  console.log("traversalCache - invalidateTraversalCache");
  const programPath = path.find(p => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }
  caches.delete(programPath);
};
exports.invalidateTraversalCache = invalidateTraversalCache;
//# sourceMappingURL=traversalCache.js.map