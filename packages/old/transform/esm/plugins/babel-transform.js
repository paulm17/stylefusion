import { logger, syncResolve } from '@wyw-in-js/shared';
import { loadWywOptions } from '../transform/helpers/loadWywOptions';
import { TransformCacheCollection } from '../cache';
import { transformSync } from '../transform';
import { collector } from './collector';
export default function babelTransform(babel, options) {
  console.log("babel-transform - bableTransform");
  const cache = new TransformCacheCollection();
  const debug = logger.extend('babel-transform');
  return {
    name: '@wyw-in-js/transform/babel-transform',
    pre(file) {
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
        collector(file, pluginOptions, valueCache);
        return {
          ast: loadedAndParsed.ast,
          code: loadedAndParsed.code
        };
      }
      debug('start %s', file.opts.filename);
      const pluginOptions = loadWywOptions(options);
      transformSync({
        babel,
        cache,
        options: {
          filename: file.opts.filename,
          root: file.opts.root ?? undefined,
          inputSourceMap: file.opts.inputSourceMap ?? undefined,
          pluginOptions
        }
      }, file.code, syncResolve, {
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