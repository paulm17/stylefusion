import { isGlobal } from './isGlobal';

/**
 * Checks that specified Identifier is a global `require`
 * @param id
 */
export function isRequire(id) {
  console.log("isRequire - isRequire");
  if (!id?.isIdentifier() || id.node.name !== 'require') {
    return false;
  }
  return isGlobal(id, 'require');
}
//# sourceMappingURL=isRequire.js.map