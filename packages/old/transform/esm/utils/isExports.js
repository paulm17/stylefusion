import { isGlobal } from './isGlobal';

/**
 * Checks that specified Identifier is a global `exports` or `module.exports`
 * @param node
 */
export function isExports(node) {
  console.log("isExports - isExports");
  if (node?.isIdentifier({
    name: 'exports'
  })) {
    return isGlobal(node, 'exports');
  }
  if (node?.isMemberExpression() && node.get('object').isIdentifier({
    name: 'module'
  }) && node.get('property').isIdentifier({
    name: 'exports'
  })) {
    return isGlobal(node, 'module');
  }
  return false;
}
//# sourceMappingURL=isExports.js.map