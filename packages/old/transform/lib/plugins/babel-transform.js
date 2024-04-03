"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = babelTransform;
var _shared = require("@wyw-in-js/shared");
var _loadWywOptions = require("../transform/helpers/loadWywOptions");
var _cache = require("../cache");
var _transform = require("../transform");
var _collector = require("./collector");
function babelTransform(babel, options) {
  console.log("babel-transform - bableTransform");
  const cache = new _cache.TransformCacheCollection();
  const debug = _shared.logger.extend('babel-transform');
  return {
    name: '@wyw-in-js/transform/babel-transform',
    pre(file) {
      var _file$opts$root, _file$opts$inputSourc;
      // eslint-disable-next-line require-yield
      function* collect() {
        const {
          valueCache
        } = this.data;
        const {
          loadedAndParsed
        } = this.entrypoint;
        const {
          pluginOptions
        } = this.services.options;
        if (loadedAndParsed.evaluator === 'ignored') {
          throw new Error('entrypoint was ignored');
        }
        (0, _collector.collector)(file, pluginOptions, valueCache);
        return {
          ast: loadedAndParsed.ast,
          code: loadedAndParsed.code
        };
      }
      debug('start %s', file.opts.filename);
      const pluginOptions = (0, _loadWywOptions.loadWywOptions)(options);
      (0, _transform.transformSync)({
        babel,
        cache,
        options: {
          filename: file.opts.filename,
          root: (_file$opts$root = file.opts.root) !== null && _file$opts$root !== void 0 ? _file$opts$root : undefined,
          inputSourceMap: (_file$opts$inputSourc = file.opts.inputSourceMap) !== null && _file$opts$inputSourc !== void 0 ? _file$opts$inputSourc : undefined,
          pluginOptions
        }
      }, file.code, _shared.syncResolve, {
        collect
      });
    },
    visitor: {},
    post(file) {
      debug('end %s', file.opts.filename);
    }
  };
}
//# sourceMappingURL=babel-transform.js.map