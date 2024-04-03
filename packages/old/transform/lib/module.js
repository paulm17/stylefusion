"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Module = exports.DefaultModuleImplementation = void 0;
var _fs = _interopRequireDefault(require("fs"));
var _module = _interopRequireDefault(require("module"));
var _path = _interopRequireDefault(require("path"));
var _vm = _interopRequireDefault(require("vm"));
var _tsInvariant = require("ts-invariant");
require("./utils/dispose-polyfill");
var _Entrypoint = require("./transform/Entrypoint");
var _Entrypoint2 = require("./transform/Entrypoint.helpers");
var _UnprocessedEntrypointError = require("./transform/actions/UnprocessedEntrypointError");
var _createVmContext = require("./vm/createVmContext");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * This is a custom implementation for the module system for evaluating code,
 * used for resolving values for dependencies interpolated in `css` or `styled`.
 *
 * This serves 2 purposes:
 * - Avoid leakage from evaluated code to module cache in current context, e.g. `babel-register`
 * - Allow us to invalidate the module cache without affecting other stuff, necessary for rebuilds
 *
 * We also use it to transpile the code with Babel by default.
 * We also store source maps for it to provide correct error stacktraces.
 *
 */

const DefaultModuleImplementation = exports.DefaultModuleImplementation = _module.default;

// Supported node builtins based on the modules polyfilled by webpack
// `true` means module is polyfilled, `false` means module is empty
const builtins = {
  assert: true,
  buffer: true,
  child_process: false,
  cluster: false,
  console: true,
  constants: true,
  crypto: true,
  dgram: false,
  dns: false,
  domain: true,
  events: true,
  fs: false,
  http: true,
  https: true,
  module: false,
  net: false,
  os: true,
  path: true,
  punycode: true,
  process: true,
  querystring: true,
  readline: false,
  repl: false,
  stream: true,
  string_decoder: true,
  sys: true,
  timers: true,
  tls: false,
  tty: true,
  url: true,
  util: true,
  vm: true,
  zlib: true
};
const NOOP = () => {};
function getUncached(cached, test) {
  console.log("module.ts - getUncached");
  const cachedSet = new Set(typeof cached === 'string' ? cached.split(',') : cached);
  if (cachedSet.has('*')) {
    return [];
  }
  return test.filter(t => !cachedSet.has(t));
}
function resolve(id) {
  console.log("module.ts - resolve");
  const {
    resolved
  } = this.resolveDependency(id);
  (0, _tsInvariant.invariant)(resolved, `Unable to resolve "${id}"`);
  return resolved;
}
class Module {
  callstack = [];
  isEvaluated = false;
  require = Object.assign(id => {
    if (id in builtins) {
      // The module is in the allowed list of builtin node modules
      // Ideally we should prevent importing them, but webpack polyfills some
      // So we check for the list of polyfills to determine which ones to support
      if (builtins[id]) {
        this.debug('require', `builtin '${id}'`);
        return require(id);
      }
      return null;
    }

    // Resolve module id (and filename) relatively to parent module
    const dependency = this.resolveDependency(id);
    if (dependency.resolved === id && !_path.default.isAbsolute(id)) {
      // The module is a builtin node modules, but not in the allowed list
      throw new Error(`Unable to import "${id}". Importing Node builtins is not supported in the sandbox.`);
    }
    (0, _tsInvariant.invariant)(dependency.resolved, `Dependency ${dependency.source} cannot be resolved`);
    this.dependencies.push(id);
    this.debug('require', `${id} -> ${dependency.resolved}`);
    const entrypoint = this.getEntrypoint(dependency.resolved, dependency.only, this.debug);
    if (entrypoint === null) {
      return dependency.resolved;
    }
    if (entrypoint.evaluated || (0, _Entrypoint2.isSuperSet)(entrypoint.evaluatedOnly, dependency.only)) {
      return entrypoint.exports;
    }
    const m = this.createChild(entrypoint);
    m.evaluate();
    return entrypoint.exports;
  }, {
    ensure: NOOP,
    resolve: resolve.bind(this)
  });
  resolve = resolve.bind(this);
  #entrypointRef;
  constructor(services, entrypoint, parentModule, moduleImpl = DefaultModuleImplementation) {
    var _parentModule$ignored, _entrypoint$ignored;
    this.services = services;
    this.moduleImpl = moduleImpl;
    console.log("module.ts - constructor");
    this.cache = services.cache;
    this.#entrypointRef = new WeakRef(entrypoint);
    this.idx = entrypoint.idx;
    this.id = entrypoint.name;
    this.filename = entrypoint.name;
    this.dependencies = [];
    this.debug = entrypoint.log.extend('module');
    this.parentIsIgnored = (_parentModule$ignored = parentModule === null || parentModule === void 0 ? void 0 : parentModule.ignored) !== null && _parentModule$ignored !== void 0 ? _parentModule$ignored : false;
    this.ignored = (_entrypoint$ignored = entrypoint.ignored) !== null && _entrypoint$ignored !== void 0 ? _entrypoint$ignored : this.parentIsIgnored;
    if (parentModule) {
      this.callstack = [entrypoint.name, ...parentModule.callstack];
    } else {
      this.callstack = [entrypoint.name];
    }
    this.extensions = services.options.pluginOptions.extensions;
    this.debug('init', entrypoint.name);
  }
  get exports() {
    console.log("module.ts - get exports");
    return this.entrypoint.exports;
  }
  set exports(value) {
    console.log("module.ts - set exports");
    this.entrypoint.exports = value;
    this.debug('the whole exports was overridden with %O', value);
  }
  get entrypoint() {
    console.log("module.ts - get entrypoint");
    const entrypoint = this.#entrypointRef.deref();
    (0, _tsInvariant.invariant)(entrypoint, `Module ${this.idx} is disposed`);
    return entrypoint;
  }
  evaluate() {
    console.log("module.ts - evaluate");
    const {
      entrypoint
    } = this;
    entrypoint.assertTransformed();
    const cached = this.cache.get('entrypoints', entrypoint.name);
    let evaluatedCreated = false;
    if (!entrypoint.supersededWith) {
      this.cache.add('entrypoints', entrypoint.name, entrypoint.createEvaluated());
      evaluatedCreated = true;
    }
    const {
      transformedCode: source
    } = entrypoint;
    const {
      pluginOptions
    } = this.services.options;
    if (!source) {
      this.debug(`evaluate`, 'there is nothing to evaluate');
      return;
    }
    if (this.isEvaluated) {
      this.debug('evaluate', `is already evaluated`);
      return;
    }
    this.debug('evaluate');
    this.debug.extend('source')('%s', source);
    this.isEvaluated = true;
    const {
      filename
    } = this;
    if (/\.json$/.test(filename)) {
      // For JSON files, parse it to a JS object similar to Node
      this.exports = JSON.parse(source);
      return;
    }
    const {
      context,
      teardown
    } = (0, _createVmContext.createVmContext)(filename, pluginOptions.features, {
      module: this,
      exports: entrypoint.exports,
      require: this.require,
      __wyw_dynamic_import: async id => this.require(id),
      __dirname: _path.default.dirname(filename)
    }, pluginOptions.overrideContext);
    try {
      const script = new _vm.default.Script(`(function (exports) { ${source}\n})(exports);`, {
        filename
      });
      script.runInContext(context);
    } catch (e) {
      this.isEvaluated = false;
      if (evaluatedCreated) {
        this.cache.add('entrypoints', entrypoint.name, cached);
      }
      if ((0, _UnprocessedEntrypointError.isUnprocessedEntrypointError)(e)) {
        // It will be handled by evalFile scenario
        throw e;
      }
      if (e instanceof EvalError) {
        this.debug('%O', e);
        throw e;
      }
      this.debug('%O\n%O', e, this.callstack);
      throw new EvalError(`${e.message} in${this.callstack.join('\n| ')}\n`);
    } finally {
      teardown();
    }
  }
  getEntrypoint(filename, only, log) {
    var _entrypoint$evaluated;
    console.log("module.ts - getEntrypoint");
    const extension = _path.default.extname(filename);
    if (extension !== '.json' && !this.extensions.includes(extension)) {
      return null;
    }
    const entrypoint = this.cache.get('entrypoints', filename);
    if (entrypoint && (0, _Entrypoint2.isSuperSet)((_entrypoint$evaluated = entrypoint.evaluatedOnly) !== null && _entrypoint$evaluated !== void 0 ? _entrypoint$evaluated : [], only)) {
      log('✅ file has been already evaluated');
      return entrypoint;
    }
    if (entrypoint !== null && entrypoint !== void 0 && entrypoint.ignored) {
      log('✅ file has been ignored during prepare stage. Original code will be used');
      return entrypoint;
    }
    if (this.ignored) {
      log('✅ one of the parent files has been ignored during prepare stage. Original code will be used');
      const newEntrypoint = this.entrypoint.createChild(filename, ['*'], _fs.default.readFileSync(filename, 'utf-8'));
      if (newEntrypoint === 'loop') {
        const stack = (0, _Entrypoint2.getStack)(this.entrypoint);
        throw new Error(`Circular dependency detected: ${stack.join(' -> ')} -> ${filename}`);
      }
      return newEntrypoint;
    }

    // Requested file can be already prepared for evaluation on the stage 1
    if (only && entrypoint) {
      var _entrypoint$only;
      const uncachedExports = getUncached((_entrypoint$only = entrypoint.only) !== null && _entrypoint$only !== void 0 ? _entrypoint$only : [], only);
      if (uncachedExports.length === 0) {
        log('✅ ready for evaluation');
        return entrypoint;
      }
      log('❌ file has been processed during prepare stage but %o is not evaluated yet (evaluated: %o)', uncachedExports, entrypoint.only);
    } else {
      log('❌ file has not been processed during prepare stage');
    }

    // If code wasn't extracted from cache, it indicates that we were unable
    // to process some of the imports on stage1. Let's try to reprocess.
    const code = _fs.default.readFileSync(filename, 'utf-8');
    const newEntrypoint = _Entrypoint.Entrypoint.createRoot(this.services, filename, only, code);
    if (newEntrypoint.evaluated) {
      log('✅ file has been already evaluated');
      return newEntrypoint;
    }
    if (newEntrypoint.ignored) {
      log('✅ file has been ignored during prepare stage. Original code will be used');
      return newEntrypoint;
    }
    return newEntrypoint;
  }
  resolveDependency = id => {
    console.log("module.ts - resolveDependency");
    const cached = this.entrypoint.getDependency(id);
    (0, _tsInvariant.invariant)(!(cached instanceof Promise), 'Dependency is not resolved yet');
    if (cached) {
      return cached;
    }
    if (!this.ignored) {
      this.debug('❌ import has not been resolved during prepare stage. Fallback to Node.js resolver');
    }
    const extensions = this.moduleImpl._extensions;
    const added = [];
    try {
      // Check for supported extensions
      this.extensions.forEach(ext => {
        if (ext in extensions) {
          return;
        }

        // When an extension is not supported, add it
        // And keep track of it to clean it up after resolving
        // Use noop for the transform function since we handle it
        extensions[ext] = NOOP;
        added.push(ext);
      });
      const {
        filename
      } = this;
      const resolved = this.moduleImpl._resolveFilename(id, {
        id: filename,
        filename,
        paths: this.moduleImpl._nodeModulePaths(_path.default.dirname(filename))
      });
      return {
        source: id,
        only: ['*'],
        resolved
      };
    } finally {
      // Cleanup the extensions we added to restore previous behaviour
      added.forEach(ext => delete extensions[ext]);
    }
  };
  createChild(entrypoint) {
    console.log("module.ts - createChild");
    return new Module(this.services, entrypoint, this, this.moduleImpl);
  }
}
exports.Module = Module;
//# sourceMappingURL=module.js.map