"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Entrypoint = void 0;
const ts_invariant_1 = require("ts-invariant");
const BaseEntrypoint_1 = require("./BaseEntrypoint");
const Entrypoint_helpers_1 = require("./Entrypoint.helpers");
const EvaluatedEntrypoint_1 = require("./EvaluatedEntrypoint");
const AbortError_1 = require("./actions/AbortError");
const BaseAction_1 = require("./actions/BaseAction");
const UnprocessedEntrypointError_1 = require("./actions/UnprocessedEntrypointError");
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
class Entrypoint extends BaseEntrypoint_1.BaseEntrypoint {
    initialCode;
    resolveTasks;
    dependencies;
    evaluated = false;
    loadedAndParsed;
    onSupersedeHandlers = [];
    actionsCache = new Map();
    #hasWywMetadata = false;
    #supersededWith = null;
    #transformResultCode = null;
    constructor(services, parents, initialCode, name, only, exports, evaluatedOnly, loadedAndParsed, resolveTasks = new Map(), dependencies = new Map(), generation = 1) {
        console.log("entrypoint - constructor");
        super(services, evaluatedOnly, exports, generation, name, only, parents);
        this.initialCode = initialCode;
        this.resolveTasks = resolveTasks;
        this.dependencies = dependencies;
        this.loadedAndParsed =
            loadedAndParsed ??
                services.loadAndParseFn(services, name, initialCode, parents[0]?.log ?? services.log);
        if (this.loadedAndParsed.code !== undefined) {
            services.cache.invalidateIfChanged(name, this.loadedAndParsed.code);
        }
        const code = this.loadedAndParsed.evaluator === 'ignored'
            ? '[IGNORED]'
            : this.originalCode || EMPTY_FILE;
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
        console.log("Entrypoint - get supersededWith");
        return this.#supersededWith?.supersededWith ?? this.#supersededWith;
    }
    get transformedCode() {
        console.log("Entrypoint - get transformedCode");
        return (this.#transformResultCode ?? this.supersededWith?.transformedCode ?? null);
    }
    static createRoot(services, name, only, loadedCode) {
        console.log("Entrypoint - createRoot");
        const created = Entrypoint.create(services, null, name, only, loadedCode);
        (0, ts_invariant_1.invariant)(created !== 'loop', 'loop detected');
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
        const { cache, eventEmitter } = services;
        return eventEmitter.perf('createEntrypoint', () => {
            const [status, entrypoint] = Entrypoint.innerCreate(services, parent
                ? {
                    evaluated: parent.evaluated,
                    log: parent.log,
                    name: parent.name,
                    parents: parent.parents,
                    seqId: parent.seqId,
                }
                : null, name, only, loadedCode);
            if (status !== 'cached') {
                cache.add('entrypoints', name, entrypoint);
            }
            return status === 'loop' ? 'loop' : entrypoint;
        });
    }
    static innerCreate(services, parent, name, only, loadedCode) {
        console.log("Entrypoint - innerCreate");
        const { cache } = services;
        const cached = cache.get('entrypoints', name);
        const changed = loadedCode !== undefined
            ? cache.invalidateIfChanged(name, loadedCode)
            : false;
        if (!cached?.evaluated && cached?.ignored) {
            return ['cached', cached];
        }
        const exports = cached?.exports;
        const evaluatedOnly = cached?.evaluatedOnly ?? [];
        const mergedOnly = !changed && cached?.only
            ? (0, Entrypoint_helpers_1.mergeOnly)(cached.only, only).filter((i) => !evaluatedOnly.includes(i))
            : only;
        if (cached?.evaluated) {
            cached.log('is already evaluated with', cached.evaluatedOnly);
        }
        if (!changed && cached && !cached.evaluated) {
            const isLoop = parent && hasLoop(name, parent);
            if (isLoop) {
                parent.log('[createEntrypoint] %s is a loop', name);
            }
            if (parent && !cached.parents.map((p) => p.name).includes(parent.name)) {
                cached.parents.push(parent);
            }
            if ((0, Entrypoint_helpers_1.isSuperSet)(cached.only, mergedOnly)) {
                cached.log('is cached', name);
                return [isLoop ? 'loop' : 'cached', cached];
            }
            cached.log('is cached, but with different `only` %o (the cached one %o)', only, cached?.only);
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
            throw new AbortError_1.AbortError('superseded');
        }
    }
    assertTransformed() {
        console.log("Entrypoint - assertTransformed");
        if (this.transformedCode === null) {
            this.log('not transformed');
            throw new UnprocessedEntrypointError_1.UnprocessedEntrypointError(this.supersededWith ?? this);
        }
    }
    createAction(actionType, data, abortSignal = null) {
        console.log("Entrypoint - createAction");
        if (!this.actionsCache.has(actionType)) {
            this.actionsCache.set(actionType, new Map());
        }
        const cache = this.actionsCache.get(actionType);
        const cached = cache.get(data);
        if (cached && !cached.abortSignal?.aborted) {
            return cached;
        }
        const newAction = new BaseAction_1.BaseAction(actionType, this.services, this, data, abortSignal);
        cache.set(data, newAction);
        this.services.eventEmitter.entrypointEvent(this.seqId, {
            type: 'actionCreated',
            actionType,
            actionIdx: newAction.idx,
        });
        return newAction;
    }
    createChild(name, only, loadedCode) {
        console.log("Entrypoint - createChild");
        return Entrypoint.create(this.services, this, name, only, loadedCode);
    }
    createEvaluated() {
        console.log("Entrypoint - createEvaluated");
        const evaluatedOnly = (0, Entrypoint_helpers_1.mergeOnly)(this.evaluatedOnly, this.only);
        this.log('create EvaluatedEntrypoint for %o', evaluatedOnly);
        return new EvaluatedEntrypoint_1.EvaluatedEntrypoint(this.services, evaluatedOnly, this.exportsProxy, this.generation + 1, this.name, this.only, this.parents);
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
            return () => { };
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
        console.log("Entrypoint - setTransformResult");
        this.#hasWywMetadata = Boolean(res?.metadata);
        this.#transformResultCode = res?.code ?? null;
        this.services.eventEmitter.entrypointEvent(this.seqId, {
            isNull: res === null,
            type: 'setTransformResult',
        });
    }
    supersede(newOnlyOrEntrypoint) {
        console.log("Entrypoint - supersede");
        const newEntrypoint = newOnlyOrEntrypoint instanceof Entrypoint
            ? newOnlyOrEntrypoint
            : new Entrypoint(this.services, this.parents, this.initialCode, this.name, newOnlyOrEntrypoint, this.exports, this.evaluatedOnly, this.loadedAndParsed, this.resolveTasks, this.dependencies, this.generation + 1);
        this.services.eventEmitter.entrypointEvent(this.seqId, {
            type: 'superseded',
            with: newEntrypoint.seqId,
        });
        this.log('superseded by %s (%o -> %o)', newEntrypoint.name, this.only, newEntrypoint.only);
        this.#supersededWith = newEntrypoint;
        this.onSupersedeHandlers.forEach((handler) => handler(newEntrypoint));
        return newEntrypoint;
    }
}
exports.Entrypoint = Entrypoint;
