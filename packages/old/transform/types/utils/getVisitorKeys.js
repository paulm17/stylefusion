"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVisitorKeys = void 0;
const core_1 = require("@babel/core");
function getVisitorKeys(node) {
    console.log("getVisitorKeys - getVisitorKeys");
    return core_1.types.VISITOR_KEYS[node.type];
}
exports.getVisitorKeys = getVisitorKeys;
