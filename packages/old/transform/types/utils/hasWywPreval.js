"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function hasWywPreval(exports) {
    console.log("hasWywPreval - hasWywPreval");
    if (!exports || typeof exports !== 'object') {
        return false;
    }
    return '__wywPreval' in exports;
}
exports.default = hasWywPreval;
