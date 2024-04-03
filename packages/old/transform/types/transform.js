"use strict";
/**
 * This file exposes sync and async transform functions that:
 * - parse the passed code to AST
 * - builds a dependency graph for the file
 * - shakes each dependency and removes unused code
 * - runs generated code in a sandbox
 * - collects artifacts
 * - returns transformed code (without WYW template literals), generated CSS, source maps and babel metadata from transform step.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = exports.transformSync = void 0;
const shared_1 = require("@wyw-in-js/shared");
const loadWywOptions_1 = require("./transform/helpers/loadWywOptions");
const cache_1 = require("./cache");
const Entrypoint_1 = require("./transform/Entrypoint");
const actionRunner_1 = require("./transform/actions/actionRunner");
const generators_1 = require("./transform/generators");
const resolveImports_1 = require("./transform/generators/resolveImports");
const withDefaultServices_1 = require("./transform/helpers/withDefaultServices");
function transformSync(partialServices, originalCode, syncResolve, customHandlers = {}) {
    console.log("transform - transformSync");
    const { options } = partialServices;
    const pluginOptions = (0, loadWywOptions_1.loadWywOptions)(options.pluginOptions);
    const services = (0, withDefaultServices_1.withDefaultServices)({
        ...partialServices,
        options: {
            ...options,
            pluginOptions,
        },
    });
    if (!(0, shared_1.isFeatureEnabled)(pluginOptions.features, 'globalCache', options.filename)) {
        // If global cache is disabled, we need to create a new cache for each file
        services.cache = new cache_1.TransformCacheCollection();
    }
    const entrypoint = Entrypoint_1.Entrypoint.createRoot(services, options.filename, ['__wywPreval'], originalCode);
    if (entrypoint.ignored) {
        return {
            code: originalCode,
            sourceMap: options.inputSourceMap,
        };
    }
    const workflowAction = entrypoint.createAction('workflow', undefined);
    try {
        const result = (0, actionRunner_1.syncActionRunner)(workflowAction, {
            ...generators_1.baseHandlers,
            ...customHandlers,
            resolveImports() {
                return resolveImports_1.syncResolveImports.call(this, syncResolve);
            },
        });
        entrypoint.log('%s is ready', entrypoint.name);
        return result;
    }
    catch (err) {
        entrypoint.log('Unhandled error %O', err);
        if ((0, shared_1.isFeatureEnabled)(pluginOptions.features, 'softErrors', options.filename)) {
            // eslint-disable-next-line no-console
            console.error(`Error during transform of ${entrypoint.name}:`, err);
            return {
                code: originalCode,
                sourceMap: options.inputSourceMap,
            };
        }
        throw err;
    }
}
exports.transformSync = transformSync;
async function transform(partialServices, originalCode, asyncResolve, customHandlers = {}) {
    console.log("transform - transform");
    const { options } = partialServices;
    const pluginOptions = (0, loadWywOptions_1.loadWywOptions)(options.pluginOptions);
    const services = (0, withDefaultServices_1.withDefaultServices)({
        ...partialServices,
        options: {
            ...options,
            pluginOptions,
        },
    });
    if (!(0, shared_1.isFeatureEnabled)(pluginOptions.features, 'globalCache', options.filename)) {
        // If global cache is disabled, we need to create a new cache for each file
        services.cache = new cache_1.TransformCacheCollection();
    }
    /*
     * This method can be run simultaneously for multiple files.
     * A shared cache is accessible for all runs, but each run has its own queue
     * to maintain the correct processing order. The cache stores the outcome
     * of tree-shaking, and if the result is already stored in the cache
     * but the "only" option has changed, the file will be re-processed using
     * the combined "only" option.
     */
    const entrypoint = Entrypoint_1.Entrypoint.createRoot(services, options.filename, ['__wywPreval'], originalCode);
    if (entrypoint.ignored) {
        return {
            code: originalCode,
            sourceMap: options.inputSourceMap,
        };
    }
    const workflowAction = entrypoint.createAction('workflow', undefined);
    try {
        const result = await (0, actionRunner_1.asyncActionRunner)(workflowAction, {
            ...generators_1.baseHandlers,
            ...customHandlers,
            resolveImports() {
                return resolveImports_1.asyncResolveImports.call(this, asyncResolve);
            },
        });
        console.log(`${entrypoint.name} is ready`);
        // console.log("result", result);
        entrypoint.log('%s is ready', entrypoint.name);
        return result;
    }
    catch (err) {
        entrypoint.log('Unhandled error %O', err);
        if ((0, shared_1.isFeatureEnabled)(pluginOptions.features, 'softErrors', options.filename)) {
            // eslint-disable-next-line no-console
            console.error(`Error during transform of ${entrypoint.name}:`, err);
            return {
                code: originalCode,
                sourceMap: options.inputSourceMap,
            };
        }
        throw err;
    }
}
exports.transform = transform;
