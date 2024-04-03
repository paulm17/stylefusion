"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.transform = transform;
exports.transformSync = transformSync;
var _shared = require("@wyw-in-js/shared");
var _loadWywOptions = require("./transform/helpers/loadWywOptions");
var _cache = require("./cache");
var _Entrypoint = require("./transform/Entrypoint");
var _actionRunner = require("./transform/actions/actionRunner");
var _generators = require("./transform/generators");
var _resolveImports = require("./transform/generators/resolveImports");
var _withDefaultServices = require("./transform/helpers/withDefaultServices");
/**
 * This file exposes sync and async transform functions that:
 * - parse the passed code to AST
 * - builds a dependency graph for the file
 * - shakes each dependency and removes unused code
 * - runs generated code in a sandbox
 * - collects artifacts
 * - returns transformed code (without WYW template literals), generated CSS, source maps and babel metadata from transform step.
 */

function transformSync(partialServices, originalCode, syncResolve, customHandlers = {}) {
  console.log("transform - transformSync");
  const {
    options
  } = partialServices;
  const pluginOptions = (0, _loadWywOptions.loadWywOptions)(options.pluginOptions);
  const services = (0, _withDefaultServices.withDefaultServices)({
    ...partialServices,
    options: {
      ...options,
      pluginOptions
    }
  });
  if (!(0, _shared.isFeatureEnabled)(pluginOptions.features, 'globalCache', options.filename)) {
    // If global cache is disabled, we need to create a new cache for each file
    services.cache = new _cache.TransformCacheCollection();
  }
  const entrypoint = _Entrypoint.Entrypoint.createRoot(services, options.filename, ['__wywPreval'], originalCode);
  if (entrypoint.ignored) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap
    };
  }
  const workflowAction = entrypoint.createAction('workflow', undefined);
  try {
    const result = (0, _actionRunner.syncActionRunner)(workflowAction, {
      ..._generators.baseHandlers,
      ...customHandlers,
      resolveImports() {
        return _resolveImports.syncResolveImports.call(this, syncResolve);
      }
    });
    entrypoint.log('%s is ready', entrypoint.name);
    return result;
  } catch (err) {
    entrypoint.log('Unhandled error %O', err);
    if ((0, _shared.isFeatureEnabled)(pluginOptions.features, 'softErrors', options.filename)) {
      // eslint-disable-next-line no-console
      console.error(`Error during transform of ${entrypoint.name}:`, err);
      return {
        code: originalCode,
        sourceMap: options.inputSourceMap
      };
    }
    throw err;
  }
}
async function transform(partialServices, originalCode, asyncResolve, customHandlers = {}) {
  console.log("transform - transform");
  const {
    options
  } = partialServices;
  const pluginOptions = (0, _loadWywOptions.loadWywOptions)(options.pluginOptions);
  const services = (0, _withDefaultServices.withDefaultServices)({
    ...partialServices,
    options: {
      ...options,
      pluginOptions
    }
  });
  if (!(0, _shared.isFeatureEnabled)(pluginOptions.features, 'globalCache', options.filename)) {
    // If global cache is disabled, we need to create a new cache for each file
    services.cache = new _cache.TransformCacheCollection();
  }

  /*
   * This method can be run simultaneously for multiple files.
   * A shared cache is accessible for all runs, but each run has its own queue
   * to maintain the correct processing order. The cache stores the outcome
   * of tree-shaking, and if the result is already stored in the cache
   * but the "only" option has changed, the file will be re-processed using
   * the combined "only" option.
   */
  const entrypoint = _Entrypoint.Entrypoint.createRoot(services, options.filename, ['__wywPreval'], originalCode);
  if (entrypoint.ignored) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap
    };
  }
  const workflowAction = entrypoint.createAction('workflow', undefined);
  try {
    const result = await (0, _actionRunner.asyncActionRunner)(workflowAction, {
      ..._generators.baseHandlers,
      ...customHandlers,
      resolveImports() {
        return _resolveImports.asyncResolveImports.call(this, asyncResolve);
      }
    });
    console.log(`${entrypoint.name} is ready`);
    // console.log("result", result);

    entrypoint.log('%s is ready', entrypoint.name);
    return result;
  } catch (err) {
    entrypoint.log('Unhandled error %O', err);
    if ((0, _shared.isFeatureEnabled)(pluginOptions.features, 'softErrors', options.filename)) {
      // eslint-disable-next-line no-console
      console.error(`Error during transform of ${entrypoint.name}:`, err);
      return {
        code: originalCode,
        sourceMap: options.inputSourceMap
      };
    }
    throw err;
  }
}
//# sourceMappingURL=transform.js.map