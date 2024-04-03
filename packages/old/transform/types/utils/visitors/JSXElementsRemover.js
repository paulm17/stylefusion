"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JSXElementsRemover = void 0;
const core_1 = require("@babel/core");
const getScope_1 = require("../getScope");
const scopeHelpers_1 = require("../scopeHelpers");
function getFunctionName(path) {
    console.log("JSXElementsRemover - getFunctionName");
    if (path.isClassMethod() && core_1.types.isIdentifier(path.node.key)) {
        return path.node.key.name;
    }
    return null;
}
function JSXElementsRemover(path) {
    console.log("JSXElementsRemover - JSXElementsRemover");
    // JSX can be safely replaced with null because it is unnecessary for styles
    const nullLiteral = core_1.types.nullLiteral();
    // We can do even more
    // If that JSX is a result of a function, we can replace the function body.
    const functionScope = (0, getScope_1.getScope)(path).getFunctionParent();
    const scopePath = functionScope?.path;
    if (scopePath?.isFunction()) {
        const emptyBody = core_1.types.blockStatement([core_1.types.returnStatement(nullLiteral)]);
        // Is it not just a function, but a method `render`?
        if (getFunctionName(scopePath) === 'render') {
            const decl = scopePath.findParent((p) => p.isClassDeclaration());
            // Replace the whole component
            if (decl?.isClassDeclaration()) {
                (0, scopeHelpers_1.mutate)(decl, (p) => {
                    p.replaceWith(core_1.types.functionDeclaration(decl.node.id, [], emptyBody));
                });
                return;
            }
        }
        const body = scopePath.get('body');
        if (Array.isArray(body)) {
            throw new Error("A body of a function is expected to be a single element but an array was returned. It's possible if JS syntax has been changed since that code was written.");
        }
        const node = {
            ...scopePath.node,
            body: emptyBody,
            params: [],
        };
        (0, scopeHelpers_1.mutate)(scopePath, (p) => {
            p.replaceWith(node);
        });
    }
    else {
        (0, scopeHelpers_1.mutate)(path, (p) => {
            p.replaceWith(nullLiteral);
        });
    }
}
exports.JSXElementsRemover = JSXElementsRemover;
