"use strict";
// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./babel-merge.d.ts" />
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildOptions = void 0;
const babel_merge_1 = __importDefault(require("babel-merge"));
const isNotNull_1 = require("../utils/isNotNull");
const cache = new WeakMap();
const merge = (a, b) => {
    console.log("buildOptions - merge");
    if (!cache.has(a)) {
        cache.set(a, new WeakMap());
    }
    const cacheForA = cache.get(a);
    if (cacheForA.has(b)) {
        return cacheForA.get(b);
    }
    const result = (0, babel_merge_1.default)(a, b);
    cacheForA.set(b, result);
    return result;
};
/**
 * Merges babel configs together. If a pair of configs were merged before,
 * it will return the cached result.
 */
function buildOptions(...configs) {
    console.log("buildOptions - buildOptions");
    // Merge all configs together
    return configs
        .map((i) => i ?? null)
        .filter(isNotNull_1.isNotNull)
        .reduce(merge);
}
exports.buildOptions = buildOptions;
