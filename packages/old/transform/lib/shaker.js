"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.shaker = exports.default = void 0;
var _ShakerMetadata = require("./utils/ShakerMetadata");
var _getPluginKey = require("./utils/getPluginKey");
const hasKeyInList = (plugin, list) => {
  console.log("shaker.ts - hasKeyInList");
  const pluginKey = (0, _getPluginKey.getPluginKey)(plugin);
  return pluginKey ? list.some(i => pluginKey.includes(i)) : false;
};
const safeResolve = (id, paths) => {
  console.log("shaker.ts - safeResolve");
  try {
    return require.resolve(id, {
      paths: paths.filter(i => i !== null)
    });
  } catch {
    return null;
  }
};
const shaker = (evalConfig, ast, code, {
  highPriorityPlugins,
  ...config
}, babel) => {
  var _evalConfig$plugins$f, _evalConfig$plugins, _evalConfig$plugins2, _evalConfig$plugins3, _evalConfig$filename, _evalConfig$filename2, _transformed$code;
  console.log("shaker.ts - shaker");
  const preShakePlugins = (_evalConfig$plugins$f = (_evalConfig$plugins = evalConfig.plugins) === null || _evalConfig$plugins === void 0 ? void 0 : _evalConfig$plugins.filter(i => hasKeyInList(i, highPriorityPlugins))) !== null && _evalConfig$plugins$f !== void 0 ? _evalConfig$plugins$f : [];
  const plugins = [...preShakePlugins, [require.resolve('./plugins/shaker'), config], ...((_evalConfig$plugins2 = evalConfig.plugins) !== null && _evalConfig$plugins2 !== void 0 ? _evalConfig$plugins2 : []).filter(i => !hasKeyInList(i, highPriorityPlugins))];
  const hasCommonjsPlugin = (_evalConfig$plugins3 = evalConfig.plugins) === null || _evalConfig$plugins3 === void 0 ? void 0 : _evalConfig$plugins3.some(i => (0, _getPluginKey.getPluginKey)(i) === 'transform-modules-commonjs');
  if (!hasCommonjsPlugin) {
    plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
  }
  if ((_evalConfig$filename = evalConfig.filename) !== null && _evalConfig$filename !== void 0 && _evalConfig$filename.endsWith('.ts') || (_evalConfig$filename2 = evalConfig.filename) !== null && _evalConfig$filename2 !== void 0 && _evalConfig$filename2.endsWith('.tsx')) {
    var _evalConfig$plugins4;
    const hasTypescriptPlugin = (_evalConfig$plugins4 = evalConfig.plugins) === null || _evalConfig$plugins4 === void 0 ? void 0 : _evalConfig$plugins4.some(i => (0, _getPluginKey.getPluginKey)(i) === 'transform-typescript');
    if (!hasTypescriptPlugin) {
      const preset = safeResolve('@babel/preset-typescript', [evalConfig.filename]);
      const plugin = safeResolve('@babel/plugin-transform-typescript', [evalConfig.filename, preset]);
      if (plugin) {
        plugins.push(plugin);
      }
    }
  }
  const transformOptions = {
    ...evalConfig,
    caller: {
      name: 'wyw-in-js'
    },
    plugins
  };
  const transformed = babel.transformFromAstSync(ast, code, transformOptions);
  if (!transformed || !(0, _ShakerMetadata.hasShakerMetadata)(transformed.metadata)) {
    throw new Error(`${evalConfig.filename} has no shaker metadata`);
  }
  return [transformed.ast, (_transformed$code = transformed.code) !== null && _transformed$code !== void 0 ? _transformed$code : '', transformed.metadata.wywEvaluator.imports];
};
exports.shaker = shaker;
var _default = exports.default = shaker;
//# sourceMappingURL=shaker.js.map