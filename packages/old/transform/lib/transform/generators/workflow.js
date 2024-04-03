"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.workflow = workflow;
var _AbortError = require("../actions/AbortError");
/**
 * The entry point for file processing. Sequentially calls `processEntrypoint`,
 * `evalFile`, `collect`, and `extract`. Returns the result of transforming
 * the source code as well as all artifacts obtained from code execution.
 */
function* workflow() {
  var _entrypoint$loadedAnd2, _collectStageResult$c;
  console.log("transform - workflow");
  const {
    cache,
    options
  } = this.services;
  const {
    entrypoint
  } = this;
  if (entrypoint.ignored) {
    var _entrypoint$loadedAnd;
    return {
      code: (_entrypoint$loadedAnd = entrypoint.loadedAndParsed.code) !== null && _entrypoint$loadedAnd !== void 0 ? _entrypoint$loadedAnd : '',
      sourceMap: options.inputSourceMap
    };
  }
  try {
    yield* this.getNext('processEntrypoint', entrypoint, undefined, null);
    entrypoint.assertNotSuperseded();
  } catch (e) {
    if ((0, _AbortError.isAborted)(e) && entrypoint.supersededWith) {
      entrypoint.log('workflow aborted, schedule the next attempt');
      return yield* this.getNext('workflow', entrypoint.supersededWith, undefined, null);
    }
    throw e;
  }
  const originalCode = (_entrypoint$loadedAnd2 = entrypoint.loadedAndParsed.code) !== null && _entrypoint$loadedAnd2 !== void 0 ? _entrypoint$loadedAnd2 : '';

  // File is ignored or does not contain any tags. Return original code.
  if (!entrypoint.hasWywMetadata()) {
    if (entrypoint.generation === 1) {
      // 1st generation here means that it's __wywPreval entrypoint
      // without __wywPreval, so we don't need it cached
      cache.delete('entrypoints', entrypoint.name);
    }
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap
    };
  }

  // *** 2nd stage ***

  const evalStageResult = yield* this.getNext('evalFile', entrypoint, undefined, null);
  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap
    };
  }
  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  const collectStageResult = yield* this.getNext('collect', entrypoint, {
    valueCache
  }, null);
  if (!collectStageResult.metadata) {
    return {
      code: collectStageResult.code,
      sourceMap: collectStageResult.map
    };
  }

  // *** 4th stage

  const extractStageResult = yield* this.getNext('extract', entrypoint, {
    processors: collectStageResult.metadata.processors
  }, null);
  return {
    ...extractStageResult,
    code: (_collectStageResult$c = collectStageResult.code) !== null && _collectStageResult$c !== void 0 ? _collectStageResult$c : '',
    dependencies,
    replacements: [...extractStageResult.replacements, ...collectStageResult.metadata.replacements],
    sourceMap: collectStageResult.map
  };
}
//# sourceMappingURL=workflow.js.map