"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shaker = void 0;
const ShakerMetadata_1 = require("./utils/ShakerMetadata");
const getPluginKey_1 = require("./utils/getPluginKey");
const hasKeyInList = (plugin, list) => {
    console.log("shaker.ts - hasKeyInList");
    const pluginKey = (0, getPluginKey_1.getPluginKey)(plugin);
    return pluginKey ? list.some((i) => pluginKey.includes(i)) : false;
};
const safeResolve = (id, paths) => {
    console.log("shaker.ts - safeResolve");
    try {
        return require.resolve(id, {
            paths: paths.filter((i) => i !== null),
        });
    }
    catch {
        return null;
    }
};
const shaker = (evalConfig, ast, code, { highPriorityPlugins, ...config }, babel) => {
    console.log("shaker.ts - shaker");
    const preShakePlugins = evalConfig.plugins?.filter((i) => hasKeyInList(i, highPriorityPlugins)) ??
        [];
    const plugins = [
        ...preShakePlugins,
        [require.resolve('./plugins/shaker'), config],
        ...(evalConfig.plugins ?? []).filter((i) => !hasKeyInList(i, highPriorityPlugins)),
    ];
    const hasCommonjsPlugin = evalConfig.plugins?.some((i) => (0, getPluginKey_1.getPluginKey)(i) === 'transform-modules-commonjs');
    if (!hasCommonjsPlugin) {
        plugins.push(require.resolve('@babel/plugin-transform-modules-commonjs'));
    }
    if (evalConfig.filename?.endsWith('.ts') ||
        evalConfig.filename?.endsWith('.tsx')) {
        const hasTypescriptPlugin = evalConfig.plugins?.some((i) => (0, getPluginKey_1.getPluginKey)(i) === 'transform-typescript');
        if (!hasTypescriptPlugin) {
            const preset = safeResolve('@babel/preset-typescript', [
                evalConfig.filename,
            ]);
            const plugin = safeResolve('@babel/plugin-transform-typescript', [
                evalConfig.filename,
                preset,
            ]);
            if (plugin) {
                plugins.push(plugin);
            }
        }
    }
    const transformOptions = {
        ...evalConfig,
        caller: {
            name: 'wyw-in-js',
        },
        plugins,
    };
    const transformed = babel.transformFromAstSync(ast, code, transformOptions);
    if (!transformed || !(0, ShakerMetadata_1.hasShakerMetadata)(transformed.metadata)) {
        throw new Error(`${evalConfig.filename} has no shaker metadata`);
    }
    return [
        transformed.ast,
        transformed.code ?? '',
        transformed.metadata.wywEvaluator.imports,
    ];
};
exports.shaker = shaker;
exports.default = exports.shaker;
