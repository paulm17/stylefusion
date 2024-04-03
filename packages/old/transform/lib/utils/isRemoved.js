"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isRemoved = isRemoved;
/**
 * Checks if a given path has been removed from the AST.
 */
function isRemoved(path) {
  console.log("isRemoved - isRemoved");
  // Check if the input path has already been removed
  if (path.removed) {
    return true;
  }

  // Check if any of the parent paths have been removed
  let currentPath = path;
  while (currentPath) {
    const parent = currentPath.parentPath;
    if (parent) {
      // If the parent path has been removed, return true
      if (parent.removed || parent.node === null) {
        return true;
      }
      const {
        listKey,
        key,
        node
      } = currentPath;
      if (listKey) {
        // If the current path is part of a list and the current node
        // is not presented in this list, return true
        const found = parent.get(listKey).find(p => p.node === node);
        if (!found) {
          return true;
        }
      }
      // If the current path is not part of a list and its node is not the same
      // as the node in the parent object at the same key, return true
      else if (parent.get(key).node !== node) {
        return true;
      }
    }

    // Set the current path to its parent path and continue the loop
    currentPath = parent;
  }

  // If the function has not returned true by this point, return false
  return false;
}
//# sourceMappingURL=isRemoved.js.map