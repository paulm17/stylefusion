"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.collect = void 0;
const buildOptions_1 = require("../../options/buildOptions");
const collector_1 = require("../../plugins/collector");
const TransformMetadata_1 = require("../../utils/TransformMetadata");
/**
 * Parses the specified file, finds tags, applies run-time replacements,
 * removes dead code.
 */
// eslint-disable-next-line require-yield
function* collect() {
    console.log("transform - collect");
    const { babel, options } = this.services;
    const { valueCache } = this.data;
    const { entrypoint } = this;
    const { loadedAndParsed, name } = entrypoint;
    if (loadedAndParsed.evaluator === 'ignored') {
        throw new Error('entrypoint was ignored');
    }
    const transformPlugins = [
        [
            collector_1.filename,
            {
                ...options.pluginOptions,
                values: valueCache,
            },
        ],
    ];
    const transformConfig = (0, buildOptions_1.buildOptions)({
        envName: 'wyw-in-js',
        plugins: transformPlugins,
        sourceMaps: true,
        sourceFileName: name,
        inputSourceMap: options.inputSourceMap,
        root: options.root,
        ast: true,
        babelrc: false,
        configFile: false,
        sourceType: 'unambiguous',
    });
    const result = babel.transformFromAstSync(loadedAndParsed.ast, loadedAndParsed.code, {
        ...transformConfig,
        cwd: options.root,
        filename: name,
    });
    if (!result || !result.ast?.program) {
        throw new Error('Babel transform failed');
    }
    const transformMetadata = (0, TransformMetadata_1.getTransformMetadata)(result.metadata);
    return {
        ast: result.ast,
        code: result.code,
        map: result.map,
        metadata: transformMetadata ?? null,
    };
}
exports.collect = collect;
