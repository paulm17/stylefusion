"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.preeval = preeval;
var _shared = require("@wyw-in-js/shared");
var _getTagProcessor = require("../utils/getTagProcessor");
var _EventEmitter = require("../utils/EventEmitter");
var _addIdentifierToWywPreval = require("../utils/addIdentifierToWywPreval");
var _getFileIdx = require("../utils/getFileIdx");
var _removeDangerousCode = require("../utils/removeDangerousCode");
var _traversalCache = require("../utils/traversalCache");
/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */

function preeval(babel, options) {
  var _options$eventEmitter;
  console.log("preeval - preeval");
  const {
    types: t
  } = babel;
  const eventEmitter = (_options$eventEmitter = options.eventEmitter) !== null && _options$eventEmitter !== void 0 ? _options$eventEmitter : _EventEmitter.EventEmitter.dummy;
  return {
    name: '@wyw-in-js/transform/preeval',
    pre(file) {
      const filename = file.opts.filename;
      const log = _shared.logger.extend('preeval').extend((0, _getFileIdx.getFileIdx)(filename));
      log('start', 'Looking for template literals…');
      const rootScope = file.scope;
      this.processors = [];
      eventEmitter.perf('transform:preeval:processTemplate', () => {
        (0, _getTagProcessor.applyProcessors)(file.path, file.opts, options, processor => {
          processor.dependencies.forEach(dependency => {
            if (dependency.ex.type === 'Identifier') {
              (0, _addIdentifierToWywPreval.addIdentifierToWywPreval)(rootScope, dependency.ex.name);
            }
          });
          processor.doEvaltimeReplacement();
          this.processors.push(processor);
        });
      });
      if ((0, _shared.isFeatureEnabled)(options.features, 'dangerousCodeRemover', filename)) {
        log('start', 'Strip all JSX and browser related stuff');
        eventEmitter.perf('transform:preeval:removeDangerousCode', () => (0, _removeDangerousCode.removeDangerousCode)(file.path));
      }
    },
    visitor: {},
    post(file) {
      const log = _shared.logger.extend('preeval').extend((0, _getFileIdx.getFileIdx)(file.opts.filename));
      (0, _traversalCache.invalidateTraversalCache)(file.path);
      if (this.processors.length === 0) {
        log('end', "We didn't find any wyw-in-js template literals");

        // We didn't find any wyw-in-js template literals.
        return;
      }
      this.file.metadata.wywInJS = {
        processors: this.processors,
        replacements: [],
        rules: {},
        dependencies: []
      };
      const wywPreval = file.path.getData('__wywPreval');
      if (!wywPreval) {
        // Event if there is no dependencies, we still need to add __wywPreval
        const wywExport = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), t.identifier('__wywPreval')), t.objectExpression([])));
        file.path.pushContainer('body', wywExport);
      }
      log('end', '__wywPreval has been added');
    }
  };
}
var _default = exports.default = preeval;
//# sourceMappingURL=preeval.js.map