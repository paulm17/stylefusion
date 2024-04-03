/**
 * This file is an entry point for module evaluation for getting lazy dependencies.
 */

import { Module } from '../module';
export default function evaluate(services, entrypoint) {
  console.log("evaluators - evaluate");
  const m = new Module(services, entrypoint);
  m.evaluate();
  return {
    value: entrypoint.exports,
    dependencies: m.dependencies
  };
}
//# sourceMappingURL=index.js.map