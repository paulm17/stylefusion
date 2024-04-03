"use strict";
// There is a problem with using boxed numbers and strings in TS,
// so we cannot just use `instanceof` here
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBoxedPrimitive = void 0;
const constructors = ['Number', 'String'];
function isBoxedPrimitive(o) {
    console.log("isBoxedPrimitive.ts - isBoxedPrimitive");
    if (typeof o !== 'object' || o === null)
        return false;
    return (constructors.includes(o.constructor.name) &&
        typeof o?.valueOf() !== 'object');
}
exports.isBoxedPrimitive = isBoxedPrimitive;