"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPackageJSON = findPackageJSON;
var _path = require("path");
var process = _interopRequireWildcard(require("process"));
var _findUp = _interopRequireDefault(require("find-up"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const cache = new Map();
function findPackageJSON(pkgName, filename) {
  console.log("findPackageJSON.ts - findPackageJSON");
  // Jest's resolver does not work properly with `moduleNameMapper` when `paths` are defined
  const isJest = Boolean(process.env.JEST_WORKER_ID);
  const skipPathsOptions = isJest && !pkgName.startsWith('.');
  try {
    const pkgPath = pkgName === '.' && filename && (0, _path.isAbsolute)(filename) ? filename : require.resolve(pkgName, filename ? {
      paths: [(0, _path.dirname)(filename)]
    } : {});
    if (!cache.has(pkgPath)) {
      cache.set(pkgPath, _findUp.default.sync('package.json', {
        cwd: pkgPath
      }));
    }
    return cache.get(pkgPath);
  } catch (er) {
    const code = typeof er === 'object' && er !== null && 'code' in er ? er.code : undefined;
    if (code === 'MODULE_NOT_FOUND') {
      if (skipPathsOptions && filename) {
        return findPackageJSON(pkgName, null);
      }
      return undefined;
    }
    if (code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
      // See https://github.com/Anber/wyw-in-js/issues/43
      // `require` can't resolve ESM-only packages. We can use the `resolve`
      // package here, but it does not solve all cases because `pkgName`
      // can be an alias and should be resolved by a bundler. However, we can't use
      // `resolve` from a bundler because it is async. The good news is that in that
      // specific case, we can just ignore those packages. For now.
      return undefined;
    }
    throw er;
  }
}
//# sourceMappingURL=findPackageJSON.js.map