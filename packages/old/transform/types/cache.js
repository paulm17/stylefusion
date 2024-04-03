"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransformCacheCollection = void 0;
const crypto_1 = require("crypto");
const shared_1 = require("@wyw-in-js/shared");
const getFileIdx_1 = require("./utils/getFileIdx");
function hashContent(content) {
    console.log("cache.ts - hashContent");
    return (0, crypto_1.createHash)('sha256').update(content).digest('hex');
}
const cacheLogger = shared_1.logger.extend('cache');
const cacheNames = ['entrypoints', 'exports'];
const loggers = cacheNames.reduce((acc, key) => ({
    ...acc,
    [key]: cacheLogger.extend(key),
}), {});
class TransformCacheCollection {
    entrypoints;
    exports;
    contentHashes = new Map();
    constructor(caches = {}) {
        console.log("cache.ts - TransformCacheCollection - constructor");
        this.entrypoints = caches.entrypoints || new Map();
        this.exports = caches.exports || new Map();
    }
    add(cacheName, key, value) {
        console.log("cache.ts - add");
        const cache = this[cacheName];
        loggers[cacheName]('%s:add %s %f', (0, getFileIdx_1.getFileIdx)(key), key, () => {
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
            cacheNames.forEach((name) => {
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
        cacheNames.forEach((cacheName) => {
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
exports.TransformCacheCollection = TransformCacheCollection;
