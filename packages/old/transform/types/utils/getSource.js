"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSource = void 0;
const generator_1 = __importDefault(require("@babel/generator"));
const getSource = (path, force = false) => {
    console.log("getSource - getSource");
    if (path.isIdentifier()) {
        // Fast-lane for identifiers
        return path.node.name;
    }
    let source;
    try {
        source = force ? undefined : path.getSource();
        // eslint-disable-next-line no-empty
    }
    catch { }
    source = source || (0, generator_1.default)(path.node).code;
    return path.node.extra?.parenthesized ? `(${source})` : source;
};
exports.getSource = getSource;
