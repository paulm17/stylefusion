"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.collector = collector;
exports.default = collectorPlugin;
exports.filename = void 0;
var _shared = require("@wyw-in-js/shared");
var _EventEmitter = require("../utils/EventEmitter");
var _getTagProcessor = require("../utils/getTagProcessor");
var _scopeHelpers = require("../utils/scopeHelpers");
var _traversalCache = require("../utils/traversalCache");
/**
 * Collector traverses the AST and collects information about imports and
 * all usages of WYW-processors.
 */

const filename = exports.filename = __filename;
function collector(file, options, values) {
  var _options$eventEmitter, _file$path$scope$getD;
  console.log("collector - collector");
  const eventEmitter = (_options$eventEmitter = options.eventEmitter) !== null && _options$eventEmitter !== void 0 ? _options$eventEmitter : _EventEmitter.EventEmitter.dummy;
  const processors = [];
  eventEmitter.perf('transform:collector:processTemplate', () => {
    (0, _getTagProcessor.applyProcessors)(file.path, file.opts, options, processor => {
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
  const prevalExport = (_file$path$scope$getD = file.path.scope.getData('__wywPreval')) === null || _file$path$scope$getD === void 0 ? void 0 : _file$path$scope$getD.findParent(p => p.isExpressionStatement());
  if (prevalExport) {
    (0, _scopeHelpers.removeWithRelated)([prevalExport]);
  }
  return processors;
}
function collectorPlugin(babel, options) {
  var _options$values;
  console.log("collector - collectorPlugin");
  const values = (_options$values = options.values) !== null && _options$values !== void 0 ? _options$values : new Map();
  const debug = _shared.logger.extend('collector');
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
        dependencies: []
      };
      debug('end %s', file.opts.filename);
    },
    visitor: {},
    post(file) {
      (0, _traversalCache.invalidateTraversalCache)(file.path);
    }
  };
}
//# sourceMappingURL=collector.js.map