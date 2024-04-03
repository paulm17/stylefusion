import { types as t } from '@babel/core';
export function getVisitorKeys(node) {
  console.log("getVisitorKeys - getVisitorKeys");
  return t.VISITOR_KEYS[node.type];
}
//# sourceMappingURL=getVisitorKeys.js.map