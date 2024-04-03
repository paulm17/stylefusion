"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isRequire = void 0;
const isGlobal_1 = require("./isGlobal");
/**
 * Checks that specified Identifier is a global `require`
 * @param id
 */
function isRequire(id) {
    console.log("isRequire - isRequire");
    if (!id?.isIdentifier() || id.node.name !== 'require') {
        return false;
    }
    return (0, isGlobal_1.isGlobal)(id, 'require');
}
exports.isRequire = isRequire;
