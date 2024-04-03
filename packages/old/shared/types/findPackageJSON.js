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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findPackageJSON = void 0;
const path_1 = require("path");
const process = __importStar(require("process"));
const find_up_1 = __importDefault(require("find-up"));
const cache = new Map();
function findPackageJSON(pkgName, filename) {
    console.log("findPackageJSON.ts - findPackageJSON");
    // Jest's resolver does not work properly with `moduleNameMapper` when `paths` are defined
    const isJest = Boolean(process.env.JEST_WORKER_ID);
    const skipPathsOptions = isJest && !pkgName.startsWith('.');
    try {
        const pkgPath = pkgName === '.' && filename && (0, path_1.isAbsolute)(filename)
            ? filename
            : require.resolve(pkgName, filename ? { paths: [(0, path_1.dirname)(filename)] } : {});
        if (!cache.has(pkgPath)) {
            cache.set(pkgPath, find_up_1.default.sync('package.json', { cwd: pkgPath }));
        }
        return cache.get(pkgPath);
    }
    catch (er) {
        const code = typeof er === 'object' && er !== null && 'code' in er
            ? er.code
            : undefined;
        if (code === 'MODULE_NOT_FOUND') {
            if (skipPathsOptions && filename) {
                return findPackageJSON(pkgName, null);
            }
            return undefined;
        }
        if (code === 'ERR_PACKAGE_PATH_NOT_EXPORTED') {
            // See https://github.com/Anber/wyw-in-js/issues/43
            // `require` can't resolve ESM-only packages. We can use the `resolve`
            // package here, but it does not solve all cases because `pkgName`
            // can be an alias and should be resolved by a bundler. However, we can't use
            // `resolve` from a bundler because it is async. The good news is that in that
            // specific case, we can just ignore those packages. For now.
            return undefined;
        }
        throw er;
    }
}
exports.findPackageJSON = findPackageJSON;
