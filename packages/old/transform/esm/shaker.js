import { hasShakerMetadata } from './utils/ShakerMetadata';
import { getPluginKey } from './utils/getPluginKey';
const hasKeyInList = (plugin, list) => {
  console.log("shaker.ts - hasKeyInList");
  const pluginKey = getPluginKey(plugin);
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
export const shaker = (evalConfig, ast, code, {
  highPriorityPlugins,
  ...config
}, babel) => {
  console.log("shaker.ts - shaker");
  const preShakePlugins = evalConfig.plugins?.filter(i => hasKeyInList(i, highPriorityPlugins)) ?? [];
  const plugins = [...preShakePlugins, [require.resolve('./plugins/shaker'), config], ...(evalConfig.plugins ?? []).filter(i => !hasKeyInList(i, highPriorityPlugins))];
  const hasCommonjsPlugin = evalConfig.plugins?.some(i => getPluginKey(i) === 'transform-modules-commonjs');
  if (!hasCommonjsPlugin) {
    plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
  }
  if (evalConfig.filename?.endsWith('.ts') || evalConfig.filename?.endsWith('.tsx')) {
    const hasTypescriptPlugin = evalConfig.plugins?.some(i => getPluginKey(i) === 'transform-typescript');
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
  if (!transformed || !hasShakerMetadata(transformed.metadata)) {
    throw new Error(`${evalConfig.filename} has no shaker metadata`);
  }
  return [transformed.ast, transformed.code ?? '', transformed.metadata.wywEvaluator.imports];
};
export default shaker;
//# sourceMappingURL=shaker.js.map