"use strict";
/**
 * Collector traverses the AST and collects information about imports and
 * all usages of WYW-processors.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collector = exports.filename = void 0;
const shared_1 = require("@wyw-in-js/shared");
const EventEmitter_1 = require("../utils/EventEmitter");
const getTagProcessor_1 = require("../utils/getTagProcessor");
const scopeHelpers_1 = require("../utils/scopeHelpers");
const traversalCache_1 = require("../utils/traversalCache");
exports.filename = __filename;
function collector(file, options, values) {
    console.log("collector - collector");
    const eventEmitter = options.eventEmitter ?? EventEmitter_1.EventEmitter.dummy;
    const processors = [];
    eventEmitter.perf('transform:collector:processTemplate', () => {
        (0, getTagProcessor_1.applyProcessors)(file.path, file.opts, options, (processor) => {
            processor.build(values);
            processor.doRuntimeReplacement();
            processors.push(processor);
        });
    });
    if (processors.length === 0) {
        // We didn't find any processors.
        return processors;
    }
    // We can remove __wywPreval export and all related code
    const prevalExport = file.path.scope.getData('__wywPreval')?.findParent((p) => p.isExpressionStatement());
    if (prevalExport) {
        (0, scopeHelpers_1.removeWithRelated)([prevalExport]);
    }
    return processors;
}
exports.collector = collector;
function collectorPlugin(babel, options) {
    console.log("collector - collectorPlugin");
    const values = options.values ?? new Map();
    const debug = shared_1.logger.extend('collector');
    return {
        name: '@wyw-in-js/transform/collector',
        pre(file) {
            debug('start %s', file.opts.filename);
            const processors = collector(file, options, values);
            if (processors.length === 0) {
                // We didn't find any wyw-in-js template literals.
                return;
            }
            this.file.metadata.wywInJS = {
                processors,
                replacements: [],
                rules: {},
                dependencies: [],
            };
            debug('end %s', file.opts.filename);
        },
        visitor: {},
        post(file) {
            (0, traversalCache_1.invalidateTraversalCache)(file.path);
        },
    };
}
exports.default = collectorPlugin;
