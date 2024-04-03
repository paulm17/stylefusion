"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createVmContext = createVmContext;
var vm = _interopRequireWildcard(require("vm"));
var _shared = require("@wyw-in-js/shared");
var process = _interopRequireWildcard(require("./process"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const NOOP = () => {};
function createWindow() {
  console.log("createVmContext - createWindow");
  const {
    Window,
    GlobalWindow
  } = require('happy-dom');
  const HappyWindow = GlobalWindow || Window;
  const win = new HappyWindow();

  // TODO: browser doesn't expose Buffer, but a lot of dependencies use it
  win.Buffer = Buffer;
  win.Uint8Array = Uint8Array;
  return win;
}
function createBaseContext(win, additionalContext) {
  console.log("createVmContext - createBaseContext");
  const baseContext = win !== null && win !== void 0 ? win : {};
  baseContext.document = win === null || win === void 0 ? void 0 : win.document;
  baseContext.window = win;
  baseContext.self = win;
  baseContext.top = win;
  baseContext.parent = win;
  baseContext.global = win;
  baseContext.process = process;
  baseContext.clearImmediate = NOOP;
  baseContext.clearInterval = NOOP;
  baseContext.clearTimeout = NOOP;
  baseContext.setImmediate = NOOP;
  baseContext.requestAnimationFrame = NOOP;
  baseContext.setInterval = NOOP;
  baseContext.setTimeout = NOOP;

  // eslint-disable-next-line guard-for-in,no-restricted-syntax
  for (const key in additionalContext) {
    baseContext[key] = additionalContext[key];
  }
  return baseContext;
}
function createHappyDOMWindow() {
  console.log("createVmContext - createHappyDOMWindow");
  const win = createWindow();
  return {
    teardown: () => {
      win.happyDOM.cancelAsync();
    },
    window: win
  };
}
function createNothing() {
  console.log("createVmContext - createNothing");
  return {
    teardown: () => {},
    window: undefined
  };
}
function createVmContext(filename, features, additionalContext, overrideContext = i => i) {
  console.log("createVmContext - createVmContext");
  const isHappyDOMEnabled = (0, _shared.isFeatureEnabled)(features, 'happyDOM', filename);
  const {
    teardown,
    window
  } = isHappyDOMEnabled ? createHappyDOMWindow() : createNothing();
  const baseContext = createBaseContext(window, overrideContext({
    __filename: filename,
    ...additionalContext
  }, filename));
  const context = vm.createContext(baseContext);
  return {
    context,
    teardown
  };
}
//# sourceMappingURL=createVmContext.js.map