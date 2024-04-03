"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addIdentifierToWywPreval = exports.getOrAddWywPreval = void 0;
const createId_1 = require("./createId");
const scopeHelpers_1 = require("./scopeHelpers");
function getOrAddWywPreval(scope) {
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
                    object: (0, createId_1.createId)('exports'),
                    property: (0, createId_1.createId)('__wywPreval'),
                    type: 'MemberExpression',
                },
                right: {
                    properties: [],
                    type: 'ObjectExpression',
                },
            },
            type: 'ExpressionStatement',
        };
        const [inserted] = programPath.pushContainer('body', [prevalExport]);
        object = inserted.get('expression.right');
    }
    else {
        // ESM export const __wywPreval = {};
        const prevalExport = {
            declaration: {
                declarations: [
                    {
                        id: (0, createId_1.createId)('__wywPreval'),
                        init: {
                            properties: [],
                            type: 'ObjectExpression',
                        },
                        type: 'VariableDeclarator',
                    },
                ],
                kind: 'const',
                type: 'VariableDeclaration',
            },
            specifiers: [],
            type: 'ExportNamedDeclaration',
        };
        const [inserted] = programPath.pushContainer('body', [prevalExport]);
        object = inserted.get('declaration.declarations.0.init');
    }
    programPath.setData('__wywPreval', object);
    return object;
}
exports.getOrAddWywPreval = getOrAddWywPreval;
function addIdentifierToWywPreval(scope, name) {
    console.log("addIdentifierToWywPreval - addIdentifierToWywPreval");
    const rootScope = scope.getProgramParent();
    const object = getOrAddWywPreval(rootScope);
    const newProperty = {
        type: 'ObjectProperty',
        key: (0, createId_1.createId)(name),
        value: (0, createId_1.createId)(name),
        computed: false,
        shorthand: false,
    };
    const [inserted] = object.pushContainer('properties', [newProperty]);
    (0, scopeHelpers_1.reference)(inserted.get('value'));
}
exports.addIdentifierToWywPreval = addIdentifierToWywPreval;
