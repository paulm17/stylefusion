"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isUnnecessaryReactCall = isUnnecessaryReactCall;
var _collectExportsAndImports = require("./collectExportsAndImports");
var _getScope = require("./getScope");
function getCallee(p) {
  console.log("isUnnecessaryReactCall - getCallee");
  const callee = p.get('callee');
  if (callee.isSequenceExpression()) {
    const expressions = callee.get('expressions');
    if (expressions.length === 2 && expressions[0].isNumericLiteral({
      value: 0
    })) {
      return expressions[1];
    }
    return callee;
  }
  return callee;
}
const JSXRuntimeSource = 'react/jsx-runtime';
function isJSXRuntime(p, imports) {
  var _jsxRuntime$local, _jsxRuntime$local2;
  const jsxRuntime = imports.find(i => i.source === JSXRuntimeSource);
  const jsxRuntimeName = (jsxRuntime === null || jsxRuntime === void 0 || (_jsxRuntime$local = jsxRuntime.local) === null || _jsxRuntime$local === void 0 ? void 0 : _jsxRuntime$local.isIdentifier()) && (jsxRuntime === null || jsxRuntime === void 0 || (_jsxRuntime$local2 = jsxRuntime.local) === null || _jsxRuntime$local2 === void 0 || (_jsxRuntime$local2 = _jsxRuntime$local2.node) === null || _jsxRuntime$local2 === void 0 ? void 0 : _jsxRuntime$local2.name);
  if (jsxRuntime) {
    const callee = getCallee(p);
    if (jsxRuntimeName && callee.isIdentifier({
      name: jsxRuntimeName
    })) {
      return true;
    }
    if (callee.isMemberExpression() && imports.find(i => i.source === JSXRuntimeSource && i.local === callee)) {
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
  const reactImports = imports.filter(i => i.source === 'react' && (i.imported === 'default' || i.imported && isHookOrCreateElement(i.imported)));
  if (reactImports.length === 0) return false;
  const callee = getCallee(p);
  if (callee.isIdentifier() && isHookOrCreateElement(callee.node.name)) {
    var _getScope$getBinding;
    const bindingPath = (_getScope$getBinding = (0, _getScope.getScope)(callee).getBinding(callee.node.name)) === null || _getScope$getBinding === void 0 ? void 0 : _getScope$getBinding.path;
    return reactImports.some(i => bindingPath === null || bindingPath === void 0 ? void 0 : bindingPath.isAncestor(i.local));
  }
  if (callee.isMemberExpression()) {
    var _getScope$getBinding2, _bindingPath$isAncest;
    if (reactImports.some(i => i.local === callee)) {
      // It's React.createElement in CJS
      return true;
    }
    const object = callee.get('object');
    const property = callee.get('property');
    const defaultImport = reactImports.find(i => i.imported === 'default');
    if (!defaultImport || !defaultImport.local.isIdentifier() || !property.isIdentifier() || !isHookOrCreateElement(property.node.name) || !object.isIdentifier({
      name: defaultImport.local.node.name
    })) {
      return false;
    }
    const bindingPath = (_getScope$getBinding2 = (0, _getScope.getScope)(object).getBinding(object.node.name)) === null || _getScope$getBinding2 === void 0 ? void 0 : _getScope$getBinding2.path;
    return (_bindingPath$isAncest = bindingPath === null || bindingPath === void 0 ? void 0 : bindingPath.isAncestor(defaultImport.local)) !== null && _bindingPath$isAncest !== void 0 ? _bindingPath$isAncest : false;
  }
  return false;
}
function isUnnecessaryReactCall(path) {
  console.log("isUnnecessaryReactCall - isUnnecessaryReactCall");
  const programPath = path.findParent(p => p.isProgram());
  if (!programPath) {
    return false;
  }
  const {
    imports
  } = (0, _collectExportsAndImports.collectExportsAndImports)(programPath);
  return isJSXRuntime(path, imports) || isClassicReactRuntime(path, imports);
}
//# sourceMappingURL=isUnnecessaryReactCall.js.map