"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isExports = void 0;
const isGlobal_1 = require("./isGlobal");
/**
 * Checks that specified Identifier is a global `exports` or `module.exports`
 * @param node
 */
function isExports(node) {
    console.log("isExports - isExports");
    if (node?.isIdentifier({ name: 'exports' })) {
        return (0, isGlobal_1.isGlobal)(node, 'exports');
    }
    if (node?.isMemberExpression() &&
        node.get('object').isIdentifier({ name: 'module' }) &&
        node.get('property').isIdentifier({ name: 'exports' })) {
        return (0, isGlobal_1.isGlobal)(node, 'module');
    }
    return false;
}
exports.isExports = isExports;
