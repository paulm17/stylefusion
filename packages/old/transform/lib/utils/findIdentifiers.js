"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findIdentifiers = findIdentifiers;
exports.nonType = nonType;
var _getScope = require("./getScope");
function isInUnary(path) {
  var _path$parentPath$isUn, _path$parentPath;
  console.log("findIdentifiers - isInUnary");
  return (_path$parentPath$isUn = (_path$parentPath = path.parentPath) === null || _path$parentPath === void 0 ? void 0 : _path$parentPath.isUnaryExpression()) !== null && _path$parentPath$isUn !== void 0 ? _path$parentPath$isUn : false;
}

// It's possible for non-strict mode code to have variable deletions.
function isInDelete(path) {
  console.log("findIdentifiers - isInDelete");
  return path.parentPath.node.operator === 'delete';
}
function isBindingIdentifier(path) {
  console.log("findIdentifiers - isBindingIdentifier");
  return path.isBindingIdentifier() && (!isInUnary(path) || isInDelete(path));
}
function isReferencedIdentifier(path) {
  console.log("findIdentifiers - isReferencedIdentifier");
  return path.isReferencedIdentifier() || isInUnary(path) && !isInDelete(path);
}

// For some reasons, `isBindingIdentifier` returns true for identifiers inside unary expressions.
const checkers = {
  any: ex => isBindingIdentifier(ex) || isReferencedIdentifier(ex),
  binding: ex => isBindingIdentifier(ex),
  declaration: ex => {
    var _ex$scope$getBinding;
    return isBindingIdentifier(ex) && ((_ex$scope$getBinding = ex.scope.getBinding(ex.node.name)) === null || _ex$scope$getBinding === void 0 ? void 0 : _ex$scope$getBinding.identifier) === ex.node;
  },
  reference: ex => isReferencedIdentifier(ex)
};
function nonType(path) {
  console.log("findIdentifiers - nonType");
  return !path.find(p => p.isTSTypeReference() || p.isTSTypeQuery() || p.isFlowType() || p.isFlowDeclaration() || p.isTSInterfaceDeclaration());
}
function findIdentifiers(expressions, type = 'reference') {
  console.log("findIdentifiers - findIdentifiers");
  const identifiers = [];
  expressions.forEach(ex => {
    const emit = path => {
      if (!path.node || path.removed || !checkers[type](path)) {
        return;
      }

      // TODO: Is there a better way to check that it's a local variable?

      const binding = (0, _getScope.getScope)(path).getBinding(path.node.name);
      if (!binding) {
        return;
      }
      if (type === 'reference' && ex.isAncestor(binding.path)) {
        // This identifier is declared inside the expression. We don't need it.
        return;
      }
      identifiers.push(path);
    };
    if (ex.isIdentifier() || ex.isJSXIdentifier()) {
      emit(ex);
    } else {
      ex.traverse({
        Identifier(path) {
          emit(path);
        },
        JSXIdentifier(path) {
          emit(path);
        }
      });
    }
  });
  return identifiers;
}
//# sourceMappingURL=findIdentifiers.js.map