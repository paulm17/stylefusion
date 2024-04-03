"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = evaluate;
var _module = require("../module");
/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

function evaluate(services, entrypoint) {
  console.log("evaluators - evaluate");
  const m = new _module.Module(services, entrypoint);
  m.evaluate();
  return {
    value: entrypoint.exports,
    dependencies: m.dependencies
  };
}
//# sourceMappingURL=index.js.map