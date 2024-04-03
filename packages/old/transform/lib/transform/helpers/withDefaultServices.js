"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.withDefaultServices = void 0;
var babelCore = _interopRequireWildcard(require("@babel/core"));
var _cache = require("../../cache");
var _EventEmitter = require("../../utils/EventEmitter");
var _Entrypoint = require("../Entrypoint.helpers");
var _rootLog = require("../rootLog");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const withDefaultServices = ({
  babel = babelCore,
  cache = new _cache.TransformCacheCollection(),
  eventEmitter = _EventEmitter.EventEmitter.dummy,
  loadAndParseFn = _Entrypoint.loadAndParse,
  log = _rootLog.rootLog,
  options
}) => ({
  babel,
  cache,
  eventEmitter,
  loadAndParseFn,
  log,
  options
});
exports.withDefaultServices = withDefaultServices;
//# sourceMappingURL=withDefaultServices.js.map