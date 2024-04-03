"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNodePath = void 0;
function isNodePath(obj) {
    console.log("isNodePath - isNodePath");
    return 'node' in obj && obj?.node !== undefined;
}
exports.isNodePath = isNodePath;
