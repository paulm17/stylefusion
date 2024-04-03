import type { NodePath } from '@babel/traverse';
import type { Expression, V8IntrinsicIdentifier } from '@babel/types';

/**
 * If expression is a sequence like `(a, b, c)`, returns `c`
 * otherwise returns an original expression
 * @param path
 */
export function unwrapSequence(
  path: NodePath<Expression | V8IntrinsicIdentifier>
): NodePath<Expression | V8IntrinsicIdentifier> | undefined {
  console.log("unwrapSequence - unwrapSequence");
  if (path.isSequenceExpression()) {
    const [...expressions] = path.get('expressions');
    const lastExpression = expressions.pop();
    return lastExpression ? unwrapSequence(lastExpression) : undefined;
  }

  return path;
}
