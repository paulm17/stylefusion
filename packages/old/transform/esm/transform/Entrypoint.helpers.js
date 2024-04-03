import { readFileSync } from 'fs';
import { dirname, extname, isAbsolute } from 'path';
import { logger, isFeatureEnabled } from '@wyw-in-js/shared';
import { buildOptions } from '../options/buildOptions';
import { loadBabelOptions } from '../options/loadBabelOptions';
import { getFileIdx } from '../utils/getFileIdx';
import { getPluginKey } from '../utils/getPluginKey';
export function getMatchedRule(rules, filename, code) {
  console.log("entrypoint.helpers - getMatchedRule");
  for (let i = rules.length - 1; i >= 0; i--) {
    const rule = rules[i];
    if (!rule.test) {
      return rule;
    }
    if (typeof rule.test === 'function' && rule.test(filename, code)) {
      return rule;
    }
    if (rule.test instanceof RegExp && rule.test.test(filename)) {
      return rule;
    }
  }
  return {
    action: 'ignore'
  };
}
export function parseFile(babel, filename, originalCode, parseConfig) {
  console.log("entrypoint.helpers - parseFile");
  const log = logger.extend('transform:parse').extend(getFileIdx(filename));
  const parseResult = babel.parseSync(originalCode, parseConfig);
  if (!parseResult) {
    throw new Error(`Failed to parse ${filename}`);
  }
  log('stage-1', `${filename} has been parsed`);
  return parseResult;
}
const isModuleResolver = plugin => {
  console.log("entrypoint.helpers - isModuleResolver");
  const key = getPluginKey(plugin);
  if (!key) return false;
  if (['module-resolver', 'babel-plugin-module-resolver'].includes(key)) {
    return true;
  }
  return /([\\/])babel-plugin-module-resolver\1/.test(key);
};
let moduleResolverWarned = false;
function buildConfigs(services, name, pluginOptions, babelOptions) {
  console.log("entrypoint.helpers - buildConfigs");
  const {
    babel,
    options
  } = services;
  const commonOptions = {
    ast: true,
    filename: name,
    inputSourceMap: options.inputSourceMap,
    root: options.root,
    sourceFileName: name,
    sourceMaps: true
  };
  const rawConfig = buildOptions(pluginOptions?.babelOptions, babelOptions, commonOptions);
  const useBabelConfigs = isFeatureEnabled(pluginOptions.features, 'useBabelConfigs', name);
  if (!useBabelConfigs) {
    rawConfig.configFile = false;
  }
  const parseConfig = loadBabelOptions(babel, name, {
    babelrc: useBabelConfigs,
    ...rawConfig
  });
  const parseHasModuleResolver = parseConfig.plugins?.some(isModuleResolver);
  const rawHasModuleResolver = rawConfig.plugins?.some(isModuleResolver);
  if (parseHasModuleResolver && !rawHasModuleResolver) {
    if (!moduleResolverWarned) {
      // eslint-disable-next-line no-console
      console.warn(`[wyw-in-js] ${name} has a module-resolver plugin in its babelrc, but it is not present ` + `in the babelOptions for the wyw-in-js plugin. This works for now but will be an error in the future. ` + `Please add the module-resolver plugin to the babelOptions for the wyw-in-js plugin.`);
      moduleResolverWarned = true;
    }
    rawConfig.plugins = [...(parseConfig.plugins?.filter(plugin => isModuleResolver(plugin)) ?? []), ...(rawConfig.plugins ?? [])];
  }
  const evalConfig = loadBabelOptions(babel, name, {
    babelrc: false,
    ...rawConfig
  });
  return {
    evalConfig,
    parseConfig
  };
}
export function loadAndParse(services, name, loadedCode, log) {
  console.log("entrypoint.helpers - loadAndParse");
  const {
    babel,
    eventEmitter,
    options: {
      pluginOptions
    }
  } = services;
  const extension = extname(name);
  if (!pluginOptions.extensions.includes(extension)) {
    log('[createEntrypoint] %s is ignored. If you want it to be processed, you should add \'%s\' to the "extensions" option.', name, extension);
    return {
      get code() {
        if (isAbsolute(name)) {
          return loadedCode ?? readFileSync(name, 'utf-8');
        }
        return ''; // it is a built-in module
      },
      evaluator: 'ignored',
      reason: 'extension'
    };
  }
  const code = loadedCode ?? readFileSync(name, 'utf-8');
  const {
    action,
    babelOptions
  } = getMatchedRule(pluginOptions.rules, name, code);
  let ast;
  const {
    evalConfig,
    parseConfig
  } = buildConfigs(services, name, pluginOptions, babelOptions);
  const getOrParse = () => {
    if (ast) return ast;
    ast = eventEmitter.perf('parseFile', () => parseFile(babel, name, code, parseConfig));
    return ast;
  };
  if (action === 'ignore') {
    log('[createEntrypoint] %s is ignored by rule', name);
    return {
      get ast() {
        return getOrParse();
      },
      code,
      evaluator: 'ignored',
      reason: 'rule'
    };
  }
  const evaluator = typeof action === 'function' ? action : require(require.resolve(action, {
    paths: [dirname(name)]
  })).default;
  return {
    get ast() {
      return getOrParse();
    },
    code,
    evaluator,
    evalConfig
  };
}
export function getStack(entrypoint) {
  console.log("entrypoint.helpers - getStack");
  if (!entrypoint) return [];
  const stack = [entrypoint.name];
  let {
    parents
  } = entrypoint;
  while (parents.length) {
    stack.push(parents[0].name);
    parents = parents[0].parents;
  }
  return stack;
}
export function mergeOnly(a, b) {
  console.log("entrypoint.helpers - mergeOnly");
  const result = new Set(a);
  b.forEach(item => result.add(item));
  return [...result].filter(i => i).sort();
}
export const isSuperSet = (a, b) => {
  console.log("entrypoint.helpers - isSuperSet");
  if (a.includes('*')) return true;
  if (b.length === 0) return true;
  const aSet = new Set(a);
  return b.every(item => aSet.has(item));
};
//# sourceMappingURL=Entrypoint.helpers.js.map