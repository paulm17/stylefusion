import { createHash } from 'crypto';
import { logger } from '@wyw-in-js/shared';
import { getFileIdx } from './utils/getFileIdx';
function hashContent(content) {
  console.log("cache.ts - hashContent");
  return createHash('sha256').update(content).digest('hex');
}
const cacheLogger = logger.extend('cache');
const cacheNames = ['entrypoints', 'exports'];
const loggers = cacheNames.reduce((acc, key) => ({
  ...acc,
  [key]: cacheLogger.extend(key)
}), {});
export class TransformCacheCollection {
  contentHashes = new Map();
  constructor(caches = {}) {
    console.log("cache.ts - TransformCacheCollection - constructor");
    this.entrypoints = caches.entrypoints || new Map();
    this.exports = caches.exports || new Map();
  }
  add(cacheName, key, value) {
    console.log("cache.ts - add");
    const cache = this[cacheName];
    loggers[cacheName]('%s:add %s %f', getFileIdx(key), key, () => {
      if (!cache.has(key)) {
        return 'added';
      }
      return cache.get(key) === value ? 'unchanged' : 'updated';
    });
    cache.set(key, value);
  }
  clear(cacheName) {
    console.log("cache.ts - clear");
    if (cacheName === 'all') {
      cacheNames.forEach(name => {
        this.clear(name);
      });
      return;
    }
    loggers[cacheName]('clear');
    const cache = this[cacheName];
    cache.clear();
  }
  delete(cacheName, key) {
    console.log("cache.ts - delete");
    this.invalidate(cacheName, key);
  }
  get(cacheName, key) {
    console.log("cache.ts - get");
    const cache = this[cacheName];
    const res = cache.get(key);
    loggers[cacheName]('get', key, res === undefined ? 'miss' : 'hit');
    return res;
  }
  has(cacheName, key) {
    console.log("cache.ts - has");
    const cache = this[cacheName];
    const res = cache.has(key);
    loggers[cacheName]('has', key, res);
    return res;
  }
  invalidate(cacheName, key) {
    console.log("cache.ts - invalidate");
    const cache = this[cacheName];
    if (!cache.has(key)) {
      return;
    }
    loggers[cacheName]('invalidate', key);
    cache.delete(key);
  }
  invalidateForFile(filename) {
    console.log("cache.ts - invalidateForFile");
    cacheNames.forEach(cacheName => {
      this.invalidate(cacheName, filename);
    });
  }
  invalidateIfChanged(filename, content) {
    console.log("cache.ts - invalidateIfChanged");
    const hash = this.contentHashes.get(filename);
    const newHash = hashContent(content);
    if (hash !== newHash) {
      cacheLogger('content has changed, invalidate all for %s', filename);
      this.contentHashes.set(filename, newHash);
      this.invalidateForFile(filename);
      return true;
    }
    return false;
  }
}
//# sourceMappingURL=cache.js.map