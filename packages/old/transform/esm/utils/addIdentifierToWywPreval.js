import { createId } from './createId';
import { reference } from './scopeHelpers';
export function getOrAddWywPreval(scope) {
  console.log("addIdentifierToWywPreval - getOrAddWywPreval");
  const rootScope = scope.getProgramParent();
  const programPath = rootScope.path;
  let object = programPath.getData('__wywPreval');
  if (object) {
    return object;
  }
  if (programPath.node.sourceType === 'script') {
    // CJS exports.__wywPreval = {};
    const prevalExport = {
      expression: {
        type: 'AssignmentExpression',
        operator: '=',
        left: {
          computed: false,
          object: createId('exports'),
          property: createId('__wywPreval'),
          type: 'MemberExpression'
        },
        right: {
          properties: [],
          type: 'ObjectExpression'
        }
      },
      type: 'ExpressionStatement'
    };
    const [inserted] = programPath.pushContainer('body', [prevalExport]);
    object = inserted.get('expression.right');
  } else {
    // ESM export const __wywPreval = {};
    const prevalExport = {
      declaration: {
        declarations: [{
          id: createId('__wywPreval'),
          init: {
            properties: [],
            type: 'ObjectExpression'
          },
          type: 'VariableDeclarator'
        }],
        kind: 'const',
        type: 'VariableDeclaration'
      },
      specifiers: [],
      type: 'ExportNamedDeclaration'
    };
    const [inserted] = programPath.pushContainer('body', [prevalExport]);
    object = inserted.get('declaration.declarations.0.init');
  }
  programPath.setData('__wywPreval', object);
  return object;
}
export function addIdentifierToWywPreval(scope, name) {
  console.log("addIdentifierToWywPreval - addIdentifierToWywPreval");
  const rootScope = scope.getProgramParent();
  const object = getOrAddWywPreval(rootScope);
  const newProperty = {
    type: 'ObjectProperty',
    key: createId(name),
    value: createId(name),
    computed: false,
    shorthand: false
  };
  const [inserted] = object.pushContainer('properties', [newProperty]);
  reference(inserted.get('value'));
}
//# sourceMappingURL=addIdentifierToWywPreval.js.map