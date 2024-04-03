"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@wyw-in-js/shared");
const loadWywOptions_1 = require("../transform/helpers/loadWywOptions");
const cache_1 = require("../cache");
const transform_1 = require("../transform");
const collector_1 = require("./collector");
function babelTransform(babel, options) {
    console.log("babel-transform - bableTransform");
    const cache = new cache_1.TransformCacheCollection();
    const debug = shared_1.logger.extend('babel-transform');
    return {
        name: '@wyw-in-js/transform/babel-transform',
        pre(file) {
            // eslint-disable-next-line require-yield
            function* collect() {
                const { valueCache } = this.data;
                const { loadedAndParsed } = this.entrypoint;
                const { pluginOptions } = this.services.options;
                if (loadedAndParsed.evaluator === 'ignored') {
                    throw new Error('entrypoint was ignored');
                }
                (0, collector_1.collector)(file, pluginOptions, valueCache);
                return {
                    ast: loadedAndParsed.ast,
                    code: loadedAndParsed.code,
                };
            }
            debug('start %s', file.opts.filename);
            const pluginOptions = (0, loadWywOptions_1.loadWywOptions)(options);
            (0, transform_1.transformSync)({
                babel,
                cache,
                options: {
                    filename: file.opts.filename,
                    root: file.opts.root ?? undefined,
                    inputSourceMap: file.opts.inputSourceMap ?? undefined,
                    pluginOptions,
                },
            }, file.code, shared_1.syncResolve, {
                collect,
            });
        },
        visitor: {},
        post(file) {
            debug('end %s', file.opts.filename);
        },
    };
}
exports.default = babelTransform;
