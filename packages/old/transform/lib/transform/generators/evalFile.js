"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.evalFile = evalFile;
var _evaluators = _interopRequireDefault(require("../../evaluators"));
var _hasWywPreval = _interopRequireDefault(require("../../utils/hasWywPreval"));
var _UnprocessedEntrypointError = require("../actions/UnprocessedEntrypointError");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const wrap = fn => {
  try {
    return fn();
  } catch (e) {
    return e;
  }
};

/**
 * Executes the code prepared in previous steps within the current `Entrypoint`.
 * Returns all exports that were requested in `only`.
 */
// eslint-disable-next-line require-yield
function* evalFile() {
  console.log("transform - evalFile");
  const {
    entrypoint
  } = this;
  const {
    log
  } = entrypoint;
  log(`>> evaluate __wywPreval`);
  let evaluated;
  while (evaluated === undefined) {
    try {
      evaluated = (0, _evaluators.default)(this.services, entrypoint);
    } catch (e) {
      if ((0, _UnprocessedEntrypointError.isUnprocessedEntrypointError)(e)) {
        entrypoint.log('Evaluation has been aborted because one if the required files is not processed. Schedule reprocessing and repeat evaluation.');
        yield ['processEntrypoint', e.entrypoint, undefined];
      } else {
        throw e;
      }
    }
  }
  const wywPreval = (0, _hasWywPreval.default)(evaluated.value) ? evaluated.value.__wywPreval : undefined;
  if (!wywPreval) {
    return null;
  }
  const valueCache = new Map();
  Object.entries(wywPreval).forEach(([key, lazyValue]) => {
    const value = wrap(lazyValue);
    valueCache.set(key, value);
  });
  log(`<< evaluated __wywPreval %O`, valueCache);
  return [valueCache, evaluated.dependencies];
}
//# sourceMappingURL=evalFile.js.map