"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGlobal = void 0;
const getScope_1 = require("./getScope");
const isGlobal = (node, name) => {
    console.log("isGlobal - isGlobal");
    const scope = (0, getScope_1.getScope)(node);
    return scope.getBinding(name) === undefined && scope.hasGlobal(name);
};
exports.isGlobal = isGlobal;
