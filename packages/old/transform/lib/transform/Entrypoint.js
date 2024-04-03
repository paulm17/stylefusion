"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Entrypoint = void 0;
var _tsInvariant = require("ts-invariant");
var _BaseEntrypoint = require("./BaseEntrypoint");
var _Entrypoint = require("./Entrypoint.helpers");
var _EvaluatedEntrypoint = require("./EvaluatedEntrypoint");
var _AbortError = require("./actions/AbortError");
var _BaseAction = require("./actions/BaseAction");
var _UnprocessedEntrypointError = require("./actions/UnprocessedEntrypointError");
const EMPTY_FILE = '=== empty file ===';
function hasLoop(name, parent, processed = []) {
  console.log("Entrypoint - hasLoop");
  if (parent.name === name || processed.includes(parent.name)) {
    return true;
  }
  for (const p of parent.parents) {
    const found = hasLoop(name, p, [...processed, parent.name]);
    if (found) {
      return found;
    }
  }
  return false;
}
class Entrypoint extends _BaseEntrypoint.BaseEntrypoint {
  evaluated = false;
  onSupersedeHandlers = [];
  actionsCache = new Map();
  #hasWywMetadata = false;
  #supersededWith = null;
  #transformResultCode = null;
  constructor(services, parents, initialCode, name, only, exports, evaluatedOnly, loadedAndParsed, resolveTasks = new Map(), dependencies = new Map(), generation = 1) {
    var _parents$0$log, _parents$;
    console.log("entrypoint - constructor");
    super(services, evaluatedOnly, exports, generation, name, only, parents);
    this.initialCode = initialCode;
    this.resolveTasks = resolveTasks;
    this.dependencies = dependencies;
    this.loadedAndParsed = loadedAndParsed !== null && loadedAndParsed !== void 0 ? loadedAndParsed : services.loadAndParseFn(services, name, initialCode, (_parents$0$log = (_parents$ = parents[0]) === null || _parents$ === void 0 ? void 0 : _parents$.log) !== null && _parents$0$log !== void 0 ? _parents$0$log : services.log);
    if (this.loadedAndParsed.code !== undefined) {
      services.cache.invalidateIfChanged(name, this.loadedAndParsed.code);
    }
    const code = this.loadedAndParsed.evaluator === 'ignored' ? '[IGNORED]' : this.originalCode || EMPTY_FILE;
    this.log.extend('source')('created %s (%o)\n%s', name, only, code);
  }
  get ignored() {
    console.log("Entrypoint - get ignored");
    return this.loadedAndParsed.evaluator === 'ignored';
  }
  get originalCode() {
    console.log("Entrypoint - get originalCode");
    return this.loadedAndParsed.code;
  }
  get supersededWith() {
    var _this$supersededWith$, _this$supersededWith;
    console.log("Entrypoint - get supersededWith");
    return (_this$supersededWith$ = (_this$supersededWith = this.#supersededWith) === null || _this$supersededWith === void 0 ? void 0 : _this$supersededWith.supersededWith) !== null && _this$supersededWith$ !== void 0 ? _this$supersededWith$ : this.#supersededWith;
  }
  get transformedCode() {
    var _ref, _this$transformResult, _this$supersededWith2;
    console.log("Entrypoint - get transformedCode");
    return (_ref = (_this$transformResult = this.#transformResultCode) !== null && _this$transformResult !== void 0 ? _this$transformResult : (_this$supersededWith2 = this.supersededWith) === null || _this$supersededWith2 === void 0 ? void 0 : _this$supersededWith2.transformedCode) !== null && _ref !== void 0 ? _ref : null;
  }
  static createRoot(services, name, only, loadedCode) {
    console.log("Entrypoint - createRoot");
    const created = Entrypoint.create(services, null, name, only, loadedCode);
    (0, _tsInvariant.invariant)(created !== 'loop', 'loop detected');
    return created;
  }

  /**
   * Creates an entrypoint for the specified file.
   * If there is already an entrypoint for this file, there will be four possible outcomes:
   * 1. If `loadedCode` is specified and is different from the one that was used to create the existing entrypoint,
   *   the existing entrypoint will be superseded by a new one and all cached results for it will be invalidated.
   *   It can happen if the file was changed and the watcher notified us about it, or we received a new version
   *   of the file from a loader whereas the previous one was loaded from the filesystem.
   *   The new entrypoint will be returned.
   * 2. If `only` is subset of the existing entrypoint's `only`, the existing entrypoint will be returned.
   * 3. If `only` is superset of the existing entrypoint's `only`, the existing entrypoint will be superseded and the new one will be returned.
   * 4. If a loop is detected, 'ignored' will be returned, the existing entrypoint will be superseded or not depending on the `only` value.
   */
  static create(services, parent, name, only, loadedCode) {
    console.log("Entrypoint - create");
    const {
      cache,
      eventEmitter
    } = services;
    return eventEmitter.perf('createEntrypoint', () => {
      const [status, entrypoint] = Entrypoint.innerCreate(services, parent ? {
        evaluated: parent.evaluated,
        log: parent.log,
        name: parent.name,
        parents: parent.parents,
        seqId: parent.seqId
      } : null, name, only, loadedCode);
      if (status !== 'cached') {
        cache.add('entrypoints', name, entrypoint);
      }
      return status === 'loop' ? 'loop' : entrypoint;
    });
  }
  static innerCreate(services, parent, name, only, loadedCode) {
    var _cached$evaluatedOnly;
    console.log("Entrypoint - innerCreate");
    const {
      cache
    } = services;
    const cached = cache.get('entrypoints', name);
    const changed = loadedCode !== undefined ? cache.invalidateIfChanged(name, loadedCode) : false;
    if (!(cached !== null && cached !== void 0 && cached.evaluated) && cached !== null && cached !== void 0 && cached.ignored) {
      return ['cached', cached];
    }
    const exports = cached === null || cached === void 0 ? void 0 : cached.exports;
    const evaluatedOnly = (_cached$evaluatedOnly = cached === null || cached === void 0 ? void 0 : cached.evaluatedOnly) !== null && _cached$evaluatedOnly !== void 0 ? _cached$evaluatedOnly : [];
    const mergedOnly = !changed && cached !== null && cached !== void 0 && cached.only ? (0, _Entrypoint.mergeOnly)(cached.only, only).filter(i => !evaluatedOnly.includes(i)) : only;
    if (cached !== null && cached !== void 0 && cached.evaluated) {
      cached.log('is already evaluated with', cached.evaluatedOnly);
    }
    if (!changed && cached && !cached.evaluated) {
      const isLoop = parent && hasLoop(name, parent);
      if (isLoop) {
        parent.log('[createEntrypoint] %s is a loop', name);
      }
      if (parent && !cached.parents.map(p => p.name).includes(parent.name)) {
        cached.parents.push(parent);
      }
      if ((0, _Entrypoint.isSuperSet)(cached.only, mergedOnly)) {
        cached.log('is cached', name);
        return [isLoop ? 'loop' : 'cached', cached];
      }
      cached.log('is cached, but with different `only` %o (the cached one %o)', only, cached === null || cached === void 0 ? void 0 : cached.only);
      return [isLoop ? 'loop' : 'created', cached.supersede(mergedOnly)];
    }
    const newEntrypoint = new Entrypoint(services, parent ? [parent] : [], loadedCode, name, mergedOnly, exports, evaluatedOnly, undefined, cached && 'resolveTasks' in cached ? cached.resolveTasks : undefined, cached && 'dependencies' in cached ? cached.dependencies : undefined, cached ? cached.generation + 1 : 1);
    if (cached && !cached.evaluated) {
      cached.log('is cached, but with different code');
      cached.supersede(newEntrypoint);
    }
    return ['created', newEntrypoint];
  }
  addDependency(dependency) {
    console.log("Entrypoint - addDependency");
    this.resolveTasks.delete(dependency.source);
    this.dependencies.set(dependency.source, dependency);
  }
  addResolveTask(name, dependency) {
    console.log("Entrypoint - addResolveTask");
    this.resolveTasks.set(name, dependency);
  }
  assertNotSuperseded() {
    console.log("Entrypoint - assertNotSuperseded");
    if (this.supersededWith) {
      this.log('superseded');
      throw new _AbortError.AbortError('superseded');
    }
  }
  assertTransformed() {
    console.log("Entrypoint - assertTransformed");
    if (this.transformedCode === null) {
      var _this$supersededWith3;
      this.log('not transformed');
      throw new _UnprocessedEntrypointError.UnprocessedEntrypointError((_this$supersededWith3 = this.supersededWith) !== null && _this$supersededWith3 !== void 0 ? _this$supersededWith3 : this);
    }
  }
  createAction(actionType, data, abortSignal = null) {
    var _cached$abortSignal;
    console.log("Entrypoint - createAction");
    if (!this.actionsCache.has(actionType)) {
      this.actionsCache.set(actionType, new Map());
    }
    const cache = this.actionsCache.get(actionType);
    const cached = cache.get(data);
    if (cached && !((_cached$abortSignal = cached.abortSignal) !== null && _cached$abortSignal !== void 0 && _cached$abortSignal.aborted)) {
      return cached;
    }
    const newAction = new _BaseAction.BaseAction(actionType, this.services, this, data, abortSignal);
    cache.set(data, newAction);
    this.services.eventEmitter.entrypointEvent(this.seqId, {
      type: 'actionCreated',
      actionType,
      actionIdx: newAction.idx
    });
    return newAction;
  }
  createChild(name, only, loadedCode) {
    console.log("Entrypoint - createChild");
    return Entrypoint.create(this.services, this, name, only, loadedCode);
  }
  createEvaluated() {
    console.log("Entrypoint - createEvaluated");
    const evaluatedOnly = (0, _Entrypoint.mergeOnly)(this.evaluatedOnly, this.only);
    this.log('create EvaluatedEntrypoint for %o', evaluatedOnly);
    return new _EvaluatedEntrypoint.EvaluatedEntrypoint(this.services, evaluatedOnly, this.exportsProxy, this.generation + 1, this.name, this.only, this.parents);
  }
  getDependency(name) {
    console.log("Entrypoint - getDependency");
    return this.dependencies.get(name);
  }
  getResolveTask(name) {
    console.log("Entrypoint - getResolveTask");
    return this.resolveTasks.get(name);
  }
  hasWywMetadata() {
    console.log("Entrypoint - hasWywMetadata");
    return this.#hasWywMetadata;
  }
  onSupersede(callback) {
    console.log("Entrypoint - onSupersede");
    if (this.#supersededWith) {
      callback(this.#supersededWith);
      return () => {};
    }
    this.onSupersedeHandlers.push(callback);
    return () => {
      const index = this.onSupersedeHandlers.indexOf(callback);
      if (index >= 0) {
        this.onSupersedeHandlers.splice(index, 1);
      }
    };
  }
  setTransformResult(res) {
    var _res$code;
    console.log("Entrypoint - setTransformResult");
    this.#hasWywMetadata = Boolean(res === null || res === void 0 ? void 0 : res.metadata);
    this.#transformResultCode = (_res$code = res === null || res === void 0 ? void 0 : res.code) !== null && _res$code !== void 0 ? _res$code : null;
    this.services.eventEmitter.entrypointEvent(this.seqId, {
      isNull: res === null,
      type: 'setTransformResult'
    });
  }
  supersede(newOnlyOrEntrypoint) {
    console.log("Entrypoint - supersede");
    const newEntrypoint = newOnlyOrEntrypoint instanceof Entrypoint ? newOnlyOrEntrypoint : new Entrypoint(this.services, this.parents, this.initialCode, this.name, newOnlyOrEntrypoint, this.exports, this.evaluatedOnly, this.loadedAndParsed, this.resolveTasks, this.dependencies, this.generation + 1);
    this.services.eventEmitter.entrypointEvent(this.seqId, {
      type: 'superseded',
      with: newEntrypoint.seqId
    });
    this.log('superseded by %s (%o -> %o)', newEntrypoint.name, this.only, newEntrypoint.only);
    this.#supersededWith = newEntrypoint;
    this.onSupersedeHandlers.forEach(handler => handler(newEntrypoint));
    return newEntrypoint;
  }
}
exports.Entrypoint = Entrypoint;
//# sourceMappingURL=Entrypoint.js.map