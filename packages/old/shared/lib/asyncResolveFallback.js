"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.syncResolve = exports.asyncResolveFallback = void 0;
var _path = _interopRequireDefault(require("path"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const safeResolve = (name, where) => {
  console.log("asyncResolveFallback.ts - safeResolve");
  try {
    return require.resolve(name, {
      paths: where
    });
  } catch (e) {
    return e;
  }
};
const suffixes = ['.js', '.ts', '.jsx', '.tsx'].reduce((acc, ext) => {
  console.log("asyncResolveFallback.ts - suffixes");
  acc.push(`/index${ext}`);
  acc.push(ext);
  return acc;
}, []);
const syncResolve = (what, importer, stack) => {
  console.log("asyncResolveFallback.ts - syncResolve");
  const where = [importer, ...stack].map(p => _path.default.dirname(p));
  const resolved = safeResolve(what, where);
  if (!(resolved instanceof Error)) {
    return resolved;
  }

  // eslint-disable-next-line no-restricted-syntax
  for (const suffix of suffixes) {
    const resolvedWithSuffix = safeResolve(what + suffix, where);
    if (resolvedWithSuffix instanceof Error) {
      // eslint-disable-next-line no-continue
      continue;
    }
    return resolvedWithSuffix;
  }
  throw resolved;
};
exports.syncResolve = syncResolve;
const asyncResolveFallback = (what, importer, stack) => {
  console.log("asyncResolveFallback.ts - asyncResolveFallback");
  const resolved = syncResolve(what, importer, stack);
  return Promise.resolve(resolved);
};
exports.asyncResolveFallback = asyncResolveFallback;
//# sourceMappingURL=asyncResolveFallback.js.map