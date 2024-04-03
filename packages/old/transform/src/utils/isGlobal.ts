import type { NodePath } from '@babel/traverse';

import { getScope } from './getScope';

export const isGlobal = (node: NodePath, name: string) => {
  console.log("isGlobal - isGlobal");
  const scope = getScope(node);

  return scope.getBinding(name) === undefined && scope.hasGlobal(name);
};
