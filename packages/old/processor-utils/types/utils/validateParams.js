"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateParams = exports.isValidParams = void 0;
function isValidParams(params, constraints) {
    console.log("validateParams.ts - isValidParams");
    const length = Math.max(params.length, constraints.length);
    for (let i = 0; i < length; i++) {
        if (params[i] === undefined || constraints[i] === undefined) {
            return false;
        }
        const constraint = constraints[i];
        if (constraint === '...') {
            return true;
        }
        if (constraint === '*') {
            if (params[i] === undefined) {
                return false;
            }
        }
        else if (Array.isArray(constraint)) {
            if (constraint.every((c) => c !== params[i]?.[0])) {
                return false;
            }
        }
        else if (constraint !== params[i]?.[0]) {
            return false;
        }
    }
    return true;
}
exports.isValidParams = isValidParams;
function validateParams(params, constraints, messageOrError) {
    if (!isValidParams(params, constraints)) {
        if (typeof messageOrError === 'string') {
            throw new Error(messageOrError);
        }
        throw messageOrError;
    }
}
exports.validateParams = validateParams;
