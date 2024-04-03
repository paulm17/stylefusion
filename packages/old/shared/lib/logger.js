"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.enableDebug = enableDebug;
exports.logger = void 0;
var _debug = _interopRequireDefault(require("debug"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const BASE_NAMESPACE = 'wyw-in-js';
const logger = exports.logger = (0, _debug.default)(BASE_NAMESPACE);
const loggers = new Map();
function gerOrCreate(namespace) {
  console.log("logger.ts - gerOrCreate");
  if (!namespace) return logger;
  const lastIndexOf = namespace.lastIndexOf(':');
  if (!loggers.has(namespace)) {
    loggers.set(namespace, gerOrCreate(namespace.substring(0, lastIndexOf)).extend(namespace.substring(lastIndexOf + 1)));
  }
  return loggers.get(namespace);
}
_debug.default.formatters.r = ref => {
  var _ref$text;
  console.log("logger.ts - genericDebug.formatters.r");
  const namespace = typeof ref === 'string' ? ref : ref.namespace;
  const text = typeof ref === 'string' ? namespace : (_ref$text = ref.text) !== null && _ref$text !== void 0 ? _ref$text : namespace;
  const color = parseInt(gerOrCreate(namespace).color, 10);
  const colorCode = `\u001B[3${color < 8 ? color : `8;5;${color}`}`;
  return `${colorCode};1m${text}\u001B[0m`;
};
_debug.default.formatters.f = function f(fn) {
  console.log("logger.ts - genericDebug.formatters.f");
  return JSON.stringify(fn());
};
function enableDebug(namespace = `${BASE_NAMESPACE}:*`) {
  console.log("logger.ts - enableDebug");
  _debug.default.enable(namespace);
}
//# sourceMappingURL=logger.js.map