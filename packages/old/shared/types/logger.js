"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableDebug = exports.logger = void 0;
const debug_1 = __importDefault(require("debug"));
const BASE_NAMESPACE = 'wyw-in-js';
exports.logger = (0, debug_1.default)(BASE_NAMESPACE);
const loggers = new Map();
function gerOrCreate(namespace) {
    console.log("logger.ts - gerOrCreate");
    if (!namespace)
        return exports.logger;
    const lastIndexOf = namespace.lastIndexOf(':');
    if (!loggers.has(namespace)) {
        loggers.set(namespace, gerOrCreate(namespace.substring(0, lastIndexOf)).extend(namespace.substring(lastIndexOf + 1)));
    }
    return loggers.get(namespace);
}
debug_1.default.formatters.r = (ref) => {
    console.log("logger.ts - genericDebug.formatters.r");
    const namespace = typeof ref === 'string' ? ref : ref.namespace;
    const text = typeof ref === 'string' ? namespace : ref.text ?? namespace;
    const color = parseInt(gerOrCreate(namespace).color, 10);
    const colorCode = `\u001B[3${color < 8 ? color : `8;5;${color}`}`;
    return `${colorCode};1m${text}\u001B[0m`;
};
debug_1.default.formatters.f = function f(fn) {
    console.log("logger.ts - genericDebug.formatters.f");
    return JSON.stringify(fn());
};
function enableDebug(namespace = `${BASE_NAMESPACE}:*`) {
    console.log("logger.ts - enableDebug");
    debug_1.default.enable(namespace);
}
exports.enableDebug = enableDebug;
