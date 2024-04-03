// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="./babel-merge.d.ts" />

import babelMerge from 'babel-merge';
import { isNotNull } from '../utils/isNotNull';
const cache = new WeakMap();
const merge = (a, b) => {
  console.log("buildOptions - merge");
  if (!cache.has(a)) {
    cache.set(a, new WeakMap());
  }
  const cacheForA = cache.get(a);
  if (cacheForA.has(b)) {
    return cacheForA.get(b);
  }
  const result = babelMerge(a, b);
  cacheForA.set(b, result);
  return result;
};

/**
 * Merges babel configs together. If a pair of configs were merged before,
 * it will return the cached result.
 */
export function buildOptions(...configs) {
  console.log("buildOptions - buildOptions");
  // Merge all configs together
  return configs.map(i => i ?? null).filter(isNotNull).reduce(merge);
}
//# sourceMappingURL=buildOptions.js.map