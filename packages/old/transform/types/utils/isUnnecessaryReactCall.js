"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUnnecessaryReactCall = void 0;
const collectExportsAndImports_1 = require("./collectExportsAndImports");
const getScope_1 = require("./getScope");
function getCallee(p) {
    console.log("isUnnecessaryReactCall - getCallee");
    const callee = p.get('callee');
    if (callee.isSequenceExpression()) {
        const expressions = callee.get('expressions');
        if (expressions.length === 2 &&
            expressions[0].isNumericLiteral({ value: 0 })) {
            return expressions[1];
        }
        return callee;
    }
    return callee;
}
const JSXRuntimeSource = 'react/jsx-runtime';
function isJSXRuntime(p, imports) {
    const jsxRuntime = imports.find((i) => i.source === JSXRuntimeSource);
    const jsxRuntimeName = jsxRuntime?.local?.isIdentifier() && jsxRuntime?.local?.node?.name;
    if (jsxRuntime) {
        const callee = getCallee(p);
        if (jsxRuntimeName && callee.isIdentifier({ name: jsxRuntimeName })) {
            return true;
        }
        if (callee.isMemberExpression() &&
            imports.find((i) => i.source === JSXRuntimeSource && i.local === callee)) {
            return true;
        }
    }
    return false;
}
function isHookOrCreateElement(name) {
    console.log("isUnnecessaryReactCall - isHookOrCreateElement");
    return name === 'createElement' || /use[A-Z]/.test(name);
}
function isClassicReactRuntime(p, imports) {
    console.log("isUnnecessaryReactCall - isClassicReactRuntime");
    const reactImports = imports.filter((i) => i.source === 'react' &&
        (i.imported === 'default' ||
            (i.imported && isHookOrCreateElement(i.imported))));
    if (reactImports.length === 0)
        return false;
    const callee = getCallee(p);
    if (callee.isIdentifier() && isHookOrCreateElement(callee.node.name)) {
        const bindingPath = (0, getScope_1.getScope)(callee).getBinding(callee.node.name)?.path;
        return reactImports.some((i) => bindingPath?.isAncestor(i.local));
    }
    if (callee.isMemberExpression()) {
        if (reactImports.some((i) => i.local === callee)) {
            // It's React.createElement in CJS
            return true;
        }
        const object = callee.get('object');
        const property = callee.get('property');
        const defaultImport = reactImports.find((i) => i.imported === 'default');
        if (!defaultImport ||
            !defaultImport.local.isIdentifier() ||
            !property.isIdentifier() ||
            !isHookOrCreateElement(property.node.name) ||
            !object.isIdentifier({ name: defaultImport.local.node.name })) {
            return false;
        }
        const bindingPath = (0, getScope_1.getScope)(object).getBinding(object.node.name)?.path;
        return bindingPath?.isAncestor(defaultImport.local) ?? false;
    }
    return false;
}
function isUnnecessaryReactCall(path) {
    console.log("isUnnecessaryReactCall - isUnnecessaryReactCall");
    const programPath = path.findParent((p) => p.isProgram());
    if (!programPath) {
        return false;
    }
    const { imports } = (0, collectExportsAndImports_1.collectExportsAndImports)(programPath);
    return isJSXRuntime(path, imports) || isClassicReactRuntime(path, imports);
}
exports.isUnnecessaryReactCall = isUnnecessaryReactCall;
