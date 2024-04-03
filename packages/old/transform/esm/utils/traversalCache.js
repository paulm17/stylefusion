import traverse from '@babel/traverse';
const caches = new WeakMap();
export const getTraversalCache = (path, name) => {
  console.log("traversalCache - getTraversalCache");
  const programPath = path.find(p => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }
  if (!caches.has(programPath)) {
    caches.set(programPath, new Map());
  }
  const cache = caches.get(programPath);
  if (!cache.has(name)) {
    cache.set(name, new WeakMap());
  }
  return cache.get(name);
};
const traverseCache = traverse.cache;
export const clearBabelTraversalCache = () => {
  console.log("traversalCache - clearBabelTraversalCache");
  traverseCache.clear();
};
export const invalidateTraversalCache = path => {
  console.log("traversalCache - invalidateTraversalCache");
  const programPath = path.find(p => p.isProgram());
  if (!programPath) {
    throw new Error(`Could not find program for ${path.node.type}`);
  }
  caches.delete(programPath);
};
//# sourceMappingURL=traversalCache.js.map