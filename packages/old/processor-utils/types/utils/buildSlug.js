"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSlug = void 0;
const PLACEHOLDER = /\[(.*?)]/g;
const isValidArgName = (key, args) => key in args;
function buildSlug(pattern, args) {
    console.log("buildSlug.ts - buildSlug");
    return pattern.replace(PLACEHOLDER, (_, name) => isValidArgName(name, args) ? args[name].toString() : '');
}
exports.buildSlug = buildSlug;