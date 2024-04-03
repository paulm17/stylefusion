"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.loadWywOptions = loadWywOptions;
var _cosmiconfig = require("cosmiconfig");
var _shaker = require("../../shaker");
const searchPlaces = [`.wyw-in-jsrc`, `.wyw-in-jsrc.json`, `.wyw-in-jsrc.yaml`, `.wyw-in-jsrc.yml`, `.wyw-in-jsrc.js`, `.wyw-in-jsrc.cjs`, `.config/wyw-in-jsrc`, `.config/wyw-in-jsrc.json`, `.config/wyw-in-jsrc.yaml`, `.config/wyw-in-jsrc.yml`, `.config/wyw-in-jsrc.js`, `.config/wyw-in-jsrc.cjs`, `wyw-in-js.config.js`, `wyw-in-js.config.cjs`];
const explorerSync = (0, _cosmiconfig.cosmiconfigSync)('wyw-in-js', {
  searchPlaces
});
const cache = new WeakMap();
const defaultOverrides = {};
const nodeModulesRegExp = /[\\/]node_modules[\\/]/;
function loadWywOptions(overrides = defaultOverrides) {
  if (cache.has(overrides)) {
    return cache.get(overrides);
  }
  const {
    configFile,
    ignore,
    rules,
    babelOptions = {},
    ...rest
  } = overrides;
  const result =
  // eslint-disable-next-line no-nested-ternary
  configFile === false ? undefined : configFile !== undefined ? explorerSync.load(configFile) : explorerSync.search();
  const defaultFeatures = {
    dangerousCodeRemover: true,
    globalCache: true,
    happyDOM: true,
    softErrors: false,
    useBabelConfigs: true
  };
  const options = {
    displayName: false,
    evaluate: true,
    extensions: ['.cjs', '.cts', '.js', '.jsx', '.mjs', '.mts', '.ts', '.tsx'],
    rules: rules !== null && rules !== void 0 ? rules : [{
      action: _shaker.shaker
    }, {
      // The old `ignore` option is used as a default value for `ignore` rule.
      test: ignore !== null && ignore !== void 0 ? ignore : nodeModulesRegExp,
      action: 'ignore'
    }, {
      // Do not ignore ES-modules
      test: (filename, code) => {
        if (!nodeModulesRegExp.test(filename)) {
          return false;
        }

        // If a file contains `export` or `import` keywords, we assume it's an ES-module
        return /(?:^|\*\/|;|})\s*(?:export|import)[\s{]/m.test(code);
      },
      action: _shaker.shaker
    }],
    babelOptions,
    highPriorityPlugins: ['module-resolver'],
    ...(result ? result.config : {}),
    ...rest,
    features: {
      ...defaultFeatures,
      ...(result ? result.config.features : {}),
      ...rest.features
    }
  };
  cache.set(overrides, options);
  return options;
}
//# sourceMappingURL=loadWywOptions.js.map