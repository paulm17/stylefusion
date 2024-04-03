"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collect = collect;
var _buildOptions = require("../../options/buildOptions");
var _collector = require("../../plugins/collector");
var _TransformMetadata = require("../../utils/TransformMetadata");
/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
// eslint-disable-next-line require-yield
function* collect() {
  var _result$ast;
  console.log("transform - collect");
  const {
    babel,
    options
  } = this.services;
  const {
    valueCache
  } = this.data;
  const {
    entrypoint
  } = this;
  const {
    loadedAndParsed,
    name
  } = entrypoint;
  if (loadedAndParsed.evaluator === 'ignored') {
    throw new Error('entrypoint was ignored');
  }
  const transformPlugins = [[_collector.filename, {
    ...options.pluginOptions,
    values: valueCache
  }]];
  const transformConfig = (0, _buildOptions.buildOptions)({
    envName: 'wyw-in-js',
    plugins: transformPlugins,
    sourceMaps: true,
    sourceFileName: name,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    ast: true,
    babelrc: false,
    configFile: false,
    sourceType: 'unambiguous'
  });
  const result = babel.transformFromAstSync(loadedAndParsed.ast, loadedAndParsed.code, {
    ...transformConfig,
    cwd: options.root,
    filename: name
  });
  if (!result || !((_result$ast = result.ast) !== null && _result$ast !== void 0 && _result$ast.program)) {
    throw new Error('Babel transform failed');
  }
  const transformMetadata = (0, _TransformMetadata.getTransformMetadata)(result.metadata);
  return {
    ast: result.ast,
    code: result.code,
    map: result.map,
    metadata: transformMetadata !== null && transformMetadata !== void 0 ? transformMetadata : null
  };
}
//# sourceMappingURL=collect.js.map