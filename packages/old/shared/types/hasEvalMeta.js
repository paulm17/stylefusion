"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasEvalMeta = void 0;
function hasEvalMeta(value) {
    console.log("hasEvalMeta.ts - hasEvalMeta");
    return typeof value === 'object' && value !== null && '__wyw_meta' in value;
}
exports.hasEvalMeta = hasEvalMeta;
