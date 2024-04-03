"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createVmContext = void 0;
const vm = __importStar(require("vm"));
const shared_1 = require("@wyw-in-js/shared");
const process = __importStar(require("./process"));
const NOOP = () => { };
function createWindow() {
    console.log("createVmContext - createWindow");
    const { Window, GlobalWindow } = require('happy-dom');
    const HappyWindow = GlobalWindow || Window;
    const win = new HappyWindow();
    // TODO: browser doesn't expose Buffer, but a lot of dependencies use it
    win.Buffer = Buffer;
    win.Uint8Array = Uint8Array;
    return win;
}
function createBaseContext(win, additionalContext) {
    console.log("createVmContext - createBaseContext");
    const baseContext = win ?? {};
    baseContext.document = win?.document;
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
        window: win,
    };
}
function createNothing() {
    console.log("createVmContext - createNothing");
    return {
        teardown: () => { },
        window: undefined,
    };
}
function createVmContext(filename, features, additionalContext, overrideContext = (i) => i) {
    console.log("createVmContext - createVmContext");
    const isHappyDOMEnabled = (0, shared_1.isFeatureEnabled)(features, 'happyDOM', filename);
    const { teardown, window } = isHappyDOMEnabled
        ? createHappyDOMWindow()
        : createNothing();
    const baseContext = createBaseContext(window, overrideContext({
        __filename: filename,
        ...additionalContext,
    }, filename));
    const context = vm.createContext(baseContext);
    return {
        context,
        teardown,
    };
}
exports.createVmContext = createVmContext;
