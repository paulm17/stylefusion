"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createExports = exports.BaseEntrypoint = void 0;
var _getFileIdx = require("../utils/getFileIdx");
/* eslint-disable no-param-reassign */

const hasKey = (obj, key) => (typeof obj === 'object' || typeof obj === 'function') && obj !== null && key in obj;
const VALUES = Symbol('values');
const isProxy = obj => typeof obj === 'object' && obj !== null && VALUES in obj;
const createExports = log => {
  console.log("BaseEntryPoint - createExports");
  let exports = {};
  const lazyFields = new Set();
  return new Proxy(exports, {
    get: (_target, key) => {
      if (key === VALUES) {
        return exports;
      }
      let value;
      if (key in exports) {
        value = exports[key];
      } else {
        // Support Object.prototype methods on `exports`
        // e.g `exports.hasOwnProperty`
        value = Reflect.get(exports, key);
      }
      if (value === undefined && 'default' in exports) {
        const defaultValue = exports.default;
        if (hasKey(defaultValue, key)) {
          log('⚠️  %s has been found in `default`. It indicates that ESM to CJS conversion went wrong.', key);
          value = defaultValue[key];
        }
      }
      if (value !== undefined && lazyFields.has(key)) {
        value = value();
      }
      log('get %s: %o', key, value);
      return value;
    },
    has: (_target, key) => {
      if (key === VALUES) return true;
      return key in exports;
    },
    ownKeys: () => {
      return Object.keys(exports);
    },
    set: (_target, key, value) => {
      if (key === VALUES) {
        exports = value;
        return true;
      }
      if (key !== '__esModule') {
        log('set %s: %o', key, value);
      }
      if (value !== undefined) {
        exports[key] = value;
        lazyFields.delete(key);
      }
      return true;
    },
    defineProperty: (_target, key, descriptor) => {
      const {
        value
      } = descriptor;
      if (value !== undefined) {
        if (key !== '__esModule') {
          log('defineProperty %s with value %o', key, value);
        }
        exports[key] = value;
        lazyFields.delete(key);
        return true;
      }
      if ('get' in descriptor) {
        if (lazyFields.has(key)) {
          const prev = exports[key];
          exports[key] = () => {
            var _descriptor$get;
            const v = (_descriptor$get = descriptor.get) === null || _descriptor$get === void 0 ? void 0 : _descriptor$get.call(descriptor);
            if (v !== undefined) {
              return v;
            }
            return prev();
          };
        } else {
          const prev = exports[key];
          exports[key] = () => {
            var _descriptor$get2;
            const v = (_descriptor$get2 = descriptor.get) === null || _descriptor$get2 === void 0 ? void 0 : _descriptor$get2.call(descriptor);
            if (v !== undefined) {
              return v;
            }
            return prev;
          };
        }
        lazyFields.add(key);
        log('defineProperty %s with getter', key);
      }
      return true;
    },
    getOwnPropertyDescriptor: (_target, key) => {
      if (key in exports) return {
        enumerable: true,
        configurable: true
      };
      return undefined;
    }
  });
};
exports.createExports = createExports;
const EXPORTS = Symbol('exports');
let entrypointSeqId = 0;
class BaseEntrypoint {
  static createExports = createExports;
  // eslint-disable-next-line no-plusplus
  seqId = entrypointSeqId++;
  #exports;
  constructor(services, evaluatedOnly, exports, generation, name, only, parents) {
    var _parents$0$log$extend, _parents$, _parents$0$seqId, _parents$2;
    this.services = services;
    this.evaluatedOnly = evaluatedOnly;
    this.generation = generation;
    this.name = name;
    this.only = only;
    this.parents = parents;
    console.log("BaseEntryPoint - constructor");
    this.idx = (0, _getFileIdx.getFileIdx)(name);
    this.log = (_parents$0$log$extend = (_parents$ = parents[0]) === null || _parents$ === void 0 ? void 0 : _parents$.log.extend(this.ref, '->')) !== null && _parents$0$log$extend !== void 0 ? _parents$0$log$extend : services.log.extend(this.ref);
    let isExportsInherited = false;
    if (exports) {
      if (isProxy(exports)) {
        this.#exports = exports;
        isExportsInherited = true;
      } else {
        this.#exports = createExports(this.log);
        this.#exports[EXPORTS] = exports;
      }
      this.exports = exports;
    } else {
      this.#exports = BaseEntrypoint.createExports(this.log);
    }
    services.eventEmitter.entrypointEvent(this.seqId, {
      class: this.constructor.name,
      evaluatedOnly: this.evaluatedOnly,
      filename: name,
      generation,
      idx: this.idx,
      isExportsInherited,
      only,
      parentId: (_parents$0$seqId = (_parents$2 = parents[0]) === null || _parents$2 === void 0 ? void 0 : _parents$2.seqId) !== null && _parents$0$seqId !== void 0 ? _parents$0$seqId : null,
      type: 'created'
    });
  }
  get exports() {
    console.log("BaseEntryPoint - get exports");
    if (EXPORTS in this.#exports) {
      return this.#exports[EXPORTS];
    }
    return this.#exports;
  }
  set exports(value) {
    console.log("BaseEntryPoint - set exports");
    if (isProxy(value)) {
      this.#exports[VALUES] = value[VALUES];
    } else {
      this.#exports[EXPORTS] = value;
    }
  }
  get ref() {
    console.log("BaseEntryPoint - get ref");
    return `${this.idx}#${this.generation}`;
  }
  get exportsProxy() {
    console.log("BaseEntryPoint - get exportsProxy");
    return this.#exports;
  }
}
exports.BaseEntrypoint = BaseEntrypoint;
//# sourceMappingURL=BaseEntrypoint.js.map