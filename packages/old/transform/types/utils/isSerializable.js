"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSerializable = void 0;
const shared_1 = require("@wyw-in-js/shared");
function isSerializable(o) {
    console.log("isSerializable - isSerializable");
    if (Array.isArray(o)) {
        return o.every(isSerializable);
    }
    if (o === null)
        return true;
    if ((0, shared_1.isBoxedPrimitive)(o))
        return true;
    if (typeof o === 'object') {
        return Object.values(o).every(isSerializable);
    }
    return (typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean');
}
exports.isSerializable = isSerializable;
