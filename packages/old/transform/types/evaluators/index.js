"use strict";
/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const module_1 = require("../module");
function evaluate(services, entrypoint) {
    console.log("evaluators - evaluate");
    const m = new module_1.Module(services, entrypoint);
    m.evaluate();
    return {
        value: entrypoint.exports,
        dependencies: m.dependencies,
    };
}
exports.default = evaluate;
