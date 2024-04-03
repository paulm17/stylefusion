import { getScope } from './getScope';
export const isGlobal = (node, name) => {
  console.log("isGlobal - isGlobal");
  const scope = getScope(node);
  return scope.getBinding(name) === undefined && scope.hasGlobal(name);
};
//# sourceMappingURL=isGlobal.js.map