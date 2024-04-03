"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVariableName = void 0;
function getVariableName(varId, rawVariableName) {
    console.log("getVariableName.ts - getVariableName");
    switch (rawVariableName) {
        case 'raw':
            return varId;
        case 'dashes':
            return `--${varId}`;
        case 'var':
        default:
            return `var(--${varId})`;
    }
}
exports.getVariableName = getVariableName;
