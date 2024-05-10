export interface ICache {
  has: (key: string) => boolean;  
  get: (key: string) => string;  
  set: (key: string, value: string) => void;
  values: () => IterableIterator<string>;
}

// memory cache, which is the default cache implementation in WYW-in-JS

class MemoryCache implements ICache {
  private cache: Map<string, string> = new Map();

  public has(key: string): boolean {
    return this.cache.has(key) ?? false;
  }

  public get(key: string): string {
    return this.cache.get(key) ?? '';
  }

  public values(): IterableIterator<string> {
    return this.cache.values() ?? '';
  }

  public set(key: string, value: string): void {
    this.cache.set(key, value);
  }
}

export const memoryCache = new MemoryCache();

/**
 * return cache instance from `options.cacheProvider`
 * @param cacheProvider string | ICache | undefined
 * @returns ICache instance
 */
export const getCacheInstance = (
  cacheProvider: string | ICache | undefined
): ICache => {
  if (!cacheProvider) {
    return memoryCache;
  }
  if (typeof cacheProvider === 'string') {
    return require(cacheProvider);
  }
  if (
    typeof cacheProvider === 'object' &&
    'get' in cacheProvider &&
    'set' in cacheProvider
  ) {
    return cacheProvider;
  }
  throw new Error(`Invalid cache provider: ${cacheProvider}`);
};