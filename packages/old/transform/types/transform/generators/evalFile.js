"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalFile = void 0;
const evaluators_1 = __importDefault(require("../../evaluators"));
const hasWywPreval_1 = __importDefault(require("../../utils/hasWywPreval"));
const UnprocessedEntrypointError_1 = require("../actions/UnprocessedEntrypointError");
const wrap = (fn) => {
    try {
        return fn();
    }
    catch (e) {
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
    const { entrypoint } = this;
    const { log } = entrypoint;
    log(`>> evaluate __wywPreval`);
    let evaluated;
    while (evaluated === undefined) {
        try {
            evaluated = (0, evaluators_1.default)(this.services, entrypoint);
        }
        catch (e) {
            if ((0, UnprocessedEntrypointError_1.isUnprocessedEntrypointError)(e)) {
                entrypoint.log('Evaluation has been aborted because one if the required files is not processed. Schedule reprocessing and repeat evaluation.');
                yield ['processEntrypoint', e.entrypoint, undefined];
            }
            else {
                throw e;
            }
        }
    }
    const wywPreval = (0, hasWywPreval_1.default)(evaluated.value)
        ? evaluated.value.__wywPreval
        : undefined;
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
exports.evalFile = evalFile;
