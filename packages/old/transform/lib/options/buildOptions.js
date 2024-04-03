"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.buildOptions = buildOptions;
var _babelMerge = _interopRequireDefault(require("babel-merge"));
var _isNotNull = require("../utils/isNotNull");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./babel-merge.d.ts" />

const cache = new WeakMap();
const merge = (a, b) => {
  console.log("buildOptions - merge");
  if (!cache.has(a)) {
    cache.set(a, new WeakMap());
  }
  const cacheForA = cache.get(a);
  if (cacheForA.has(b)) {
    return cacheForA.get(b);
  }
  const result = (0, _babelMerge.default)(a, b);
  cacheForA.set(b, result);
  return result;
};

/**
 * Merges babel configs together. If a pair of configs were merged before,
 * it will return the cached result.
 */
function buildOptions(...configs) {
  console.log("buildOptions - buildOptions");
  // Merge all configs together
  return configs.map(i => i !== null && i !== void 0 ? i : null).filter(_isNotNull.isNotNull).reduce(merge);
}
//# sourceMappingURL=buildOptions.js.map