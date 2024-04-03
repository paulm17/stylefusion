"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getScope = void 0;
function getScope(path) {
    console.log("getScope - getScope");
    // In some nodes (like FunctionDeclaration) `scope` for `id` returns
    // local function scope instead of a scope where function is declared.
    return path.key === 'id' && path.parent === path.scope.block
        ? path.scope.parent
        : path.scope;
}
exports.getScope = getScope;
