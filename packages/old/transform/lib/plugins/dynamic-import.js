"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = dynamicImport;
/**
 * The plugin that replaces `import()` with `__wyw_dynamic_import` as Node VM does not support dynamic imports yet.
 */
function dynamicImport(babel) {
  console.log("dynamic-import - dynamicImport");
  const {
    types: t
  } = babel;
  return {
    name: '@wyw-in-js/transform/dynamic-import',
    visitor: {
      CallExpression(path) {
        if (path.get('callee').isImport()) {
          const moduleName = path.get('arguments.0');
          if (moduleName.isStringLiteral()) {
            path.replaceWith(t.callExpression(t.identifier('__wyw_dynamic_import'), [t.stringLiteral(moduleName.node.value)]));
            return;
          }
          if (moduleName.isTemplateLiteral()) {
            path.replaceWith(t.callExpression(t.identifier('__wyw_dynamic_import'), [t.cloneNode(moduleName.node, true, true)]));
            return;
          }
          throw new Error('Dynamic import argument must be a string or a template literal');
        }
      }
    }
  };
}
//# sourceMappingURL=dynamic-import.js.map