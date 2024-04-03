"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadBabelOptions = void 0;
const cache = new WeakMap();
const empty = {};
function loadBabelOptions(babel, filename, overrides = empty) {
    console.log("loadBabelOptions - loadBabelOptions");
    const fileCache = cache.get(overrides) ?? new Map();
    if (fileCache.has(filename)) {
        return fileCache.get(filename);
    }
    const babelOptions = babel.loadOptions({
        ...overrides,
        filename,
        caller: {
            name: 'wyw-in-js',
            // Indicates for @babel/preset-env to support all ESM syntax and avoid transforms before it's needed
            supportsStaticESM: true,
            supportsDynamicImport: true,
            supportsTopLevelAwait: true,
            supportsExportNamespaceFrom: true,
        },
    }) ?? {};
    fileCache.set(filename, babelOptions);
    cache.set(overrides, fileCache);
    return babelOptions;
}
exports.loadBabelOptions = loadBabelOptions;
