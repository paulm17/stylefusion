import { buildOptions } from '../../options/buildOptions';
import { filename as collectorPlugin } from '../../plugins/collector';
import { getTransformMetadata } from '../../utils/TransformMetadata';
/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
// eslint-disable-next-line require-yield
export function* collect() {
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
  const transformPlugins = [[collectorPlugin, {
    ...options.pluginOptions,
    values: valueCache
  }]];
  const transformConfig = buildOptions({
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
  if (!result || !result.ast?.program) {
    throw new Error('Babel transform failed');
  }
  const transformMetadata = getTransformMetadata(result.metadata);
  return {
    ast: result.ast,
    code: result.code,
    map: result.map,
    metadata: transformMetadata ?? null
  };
}
//# sourceMappingURL=collect.js.map