"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadBabelOptions = loadBabelOptions;
const cache = new WeakMap();
const empty = {};
function loadBabelOptions(babel, filename, overrides = empty) {
  var _cache$get, _babel$loadOptions;
  console.log("loadBabelOptions - loadBabelOptions");
  const fileCache = (_cache$get = cache.get(overrides)) !== null && _cache$get !== void 0 ? _cache$get : new Map();
  if (fileCache.has(filename)) {
    return fileCache.get(filename);
  }
  const babelOptions = (_babel$loadOptions = babel.loadOptions({
    ...overrides,
    filename,
    caller: {
      name: 'wyw-in-js',
      // Indicates for @babel/preset-env to support all ESM syntax and avoid transforms before it's needed
      supportsStaticESM: true,
      supportsDynamicImport: true,
      supportsTopLevelAwait: true,
      supportsExportNamespaceFrom: true
    }
  })) !== null && _babel$loadOptions !== void 0 ? _babel$loadOptions : {};
  fileCache.set(filename, babelOptions);
  cache.set(overrides, fileCache);
  return babelOptions;
}
//# sourceMappingURL=loadBabelOptions.js.map