import type { NodePath } from '@babel/traverse';
import type {
  Node,
  Identifier,
  JSXIdentifier,
  UnaryExpression,
} from '@babel/types';

import { getScope } from './getScope';

type FindType = 'any' | 'binding' | 'declaration' | 'reference';

function isInUnary<T extends NodePath>(
  path: T
): path is T & { parentPath: NodePath<UnaryExpression> } {
  console.log("findIdentifiers - isInUnary");
  return path.parentPath?.isUnaryExpression() ?? false;
}

// It's possible for non-strict mode code to have variable deletions.
function isInDelete(path: { parentPath: NodePath<UnaryExpression> }): boolean {
  console.log("findIdentifiers - isInDelete");
  return path.parentPath.node.operator === 'delete';
}

function isBindingIdentifier(path: NodePath): path is NodePath<Identifier> {
  console.log("findIdentifiers - isBindingIdentifier");
  return path.isBindingIdentifier() && (!isInUnary(path) || isInDelete(path));
}

function isReferencedIdentifier(
  path: NodePath
): path is NodePath<Identifier | JSXIdentifier> {
  console.log("findIdentifiers - isReferencedIdentifier");
  return (
    path.isReferencedIdentifier() || (isInUnary(path) && !isInDelete(path))
  );
}

// For some reasons, `isBindingIdentifier` returns true for identifiers inside unary expressions.
const checkers: Record<
  FindType,
  (ex: NodePath<Identifier | JSXIdentifier>) => boolean
> = {
  any: (ex) => isBindingIdentifier(ex) || isReferencedIdentifier(ex),
  binding: (ex) => isBindingIdentifier(ex),
  declaration: (ex) =>
    isBindingIdentifier(ex) &&
    ex.scope.getBinding(ex.node.name)?.identifier === ex.node,
  reference: (ex) => isReferencedIdentifier(ex),
};

export function nonType(path: NodePath): boolean {
  console.log("findIdentifiers - nonType");
  return !path.find(
    (p) =>
      p.isTSTypeReference() ||
      p.isTSTypeQuery() ||
      p.isFlowType() ||
      p.isFlowDeclaration() ||
      p.isTSInterfaceDeclaration()
  );
}

export function findIdentifiers(
  expressions: NodePath<Node | null | undefined>[],
  type: FindType = 'reference'
): NodePath<Identifier | JSXIdentifier>[] {
  console.log("findIdentifiers - findIdentifiers");
  const identifiers: NodePath<Identifier | JSXIdentifier>[] = [];

  expressions.forEach((ex) => {
    const emit = (path: NodePath<Identifier | JSXIdentifier>) => {
      if (!path.node || path.removed || !checkers[type](path)) {
        return;
      }

      // TODO: Is there a better way to check that it's a local variable?

      const binding = getScope(path).getBinding(path.node.name);
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
        Identifier(path: NodePath<Identifier>) {
          emit(path);
        },
        JSXIdentifier(path: NodePath<JSXIdentifier>) {
          emit(path);
        },
      });
    }
  });

  return identifiers;
}
