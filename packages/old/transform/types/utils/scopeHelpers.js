"use strict";
/* eslint-disable no-restricted-syntax */
/* eslint @typescript-eslint/no-use-before-define: ["error", { "functions": false }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeWithRelated = exports.mutate = exports.applyAction = exports.findActionForNode = exports.referenceAll = exports.dereference = exports.reference = void 0;
const types_1 = require("@babel/types");
const findIdentifiers_1 = require("./findIdentifiers");
const getScope_1 = require("./getScope");
const isNotNull_1 = require("./isNotNull");
const isRemoved_1 = require("./isRemoved");
function validateField(node, key, val, field) {
    console.log("scopeHelpers - validateField");
    if (!(field != null && field.validate))
        return true;
    if (field.optional && val == null)
        return true;
    try {
        field.validate(node, key, val);
        return true;
    }
    catch {
        return false;
    }
}
function getBinding(path) {
    console.log("scopeHelpers - getBinding");
    const binding = (0, getScope_1.getScope)(path).getBinding(path.node.name);
    if (!binding) {
        return undefined;
    }
    return binding;
}
function reference(path, referencePath = path, force = false) {
    console.log("scopeHelpers - reference");
    if (!force && !path.isReferencedIdentifier())
        return;
    const binding = getBinding(path);
    if (!binding)
        return;
    if (binding.referencePaths.includes(referencePath)) {
        return;
    }
    binding.referenced = true;
    binding.referencePaths.push(referencePath ?? path);
    binding.references = binding.referencePaths.length;
}
exports.reference = reference;
function isReferenced(binding) {
    console.log("scopeHelpers - isReferenced");
    const { kind, referenced, referencePaths, path } = binding;
    if (path.isFunctionExpression() &&
        path.key === 'init' &&
        path.parentPath.isVariableDeclarator()) {
        // It is a function expression in a variable declarator
        const id = path.parentPath.get('id');
        if (id.isIdentifier()) {
            const idBinding = getBinding(id);
            return idBinding ? isReferenced(idBinding) : true;
        }
        return true;
    }
    if (!referenced) {
        return false;
    }
    // If it's a param binding, we can't just remove it
    // because it brakes the function signature. Keep it alive for now.
    if (kind === 'param') {
        return true;
    }
    // If all remaining references are in TS/Flow types, binding is unreferenced
    return (referencePaths.length > 0 ||
        referencePaths.every((i) => i.find((ancestor) => ancestor.isTSType() || ancestor.isFlowType())));
}
function isReferencedConstantViolation(path, binding) {
    console.log("scopeHelpers - isReferencedConstantViolation");
    if (path.find((p) => p === binding.path)) {
        // function a(flag) { return (a = function(flag) { flag ? 1 : 2 }) }
        // ^ Looks crazy, yeh? Welcome to the wonderful world of transpilers!
        // `a = …` here isn't a reference.
        return false;
    }
    if (!path.isReferenced()) {
        return false;
    }
    if (path.isAssignmentExpression() &&
        path.parentPath.isExpressionStatement()) {
        // A root assignment without a parent expression statement is not a reference
        return false;
    }
    return true;
}
function dereference(path) {
    console.log("scopeHelpers - dereference");
    const binding = getBinding(path);
    if (!binding)
        return null;
    const isReference = binding.referencePaths.includes(path);
    let referencesInConstantViolations = binding.constantViolations.filter((i) => isReferencedConstantViolation(i, binding));
    const isConstantViolation = referencesInConstantViolations.includes(path);
    if (!isReference && !isConstantViolation) {
        return null;
    }
    if (isReference) {
        binding.referencePaths = binding.referencePaths.filter((i) => i !== path);
        binding.references -= 1;
    }
    else {
        referencesInConstantViolations = referencesInConstantViolations.filter((i) => i !== path);
    }
    const nonTypeReferences = binding.referencePaths.filter(findIdentifiers_1.nonType);
    binding.referenced =
        nonTypeReferences.length + referencesInConstantViolations.length > 0;
    return binding;
}
exports.dereference = dereference;
function dereferenceAll(path) {
    console.log("scopeHelpers - dereferenceAll");
    return (0, findIdentifiers_1.findIdentifiers)([path])
        .map((identifierPath) => dereference(identifierPath))
        .filter(isNotNull_1.isNotNull);
}
function referenceAll(path) {
    console.log("scopeHelpers - referenceAll");
    (0, findIdentifiers_1.findIdentifiers)([path]).forEach((identifierPath) => reference(identifierPath));
}
exports.referenceAll = referenceAll;
const deletingNodes = new WeakSet();
const isEmptyList = (list) => list.length === 0 || list.every((i) => deletingNodes.has(i));
const getPathFromAction = (action) => {
    console.log("scopeHelpers - getPathFromAction");
    if (!Array.isArray(action)) {
        return action;
    }
    if (action[0] === 'replace' || action[0] === 'remove') {
        return action[1];
    }
    throw new Error(`Unknown action type: ${action[0]}`);
};
function isPrototypeAssignment(path) {
    console.log("scopeHelpers - isPrototypeAssignment");
    if (!path.isAssignmentExpression()) {
        return false;
    }
    const { left } = path.node;
    if (!left) {
        return false;
    }
    if (left.type !== 'MemberExpression') {
        return false;
    }
    const { object, property } = left;
    if (!object || !property) {
        return false;
    }
    return (object.type === 'MemberExpression' &&
        object.property.type === 'Identifier' &&
        object.property.name === 'prototype');
}
function canFunctionBeDelete(fnPath) {
    console.log("scopeHelpers - canFunctionBeDelete");
    if (isPrototypeAssignment(fnPath.parentPath)) {
        // It is a prototype assignment, we can't delete it since we can't find all usages
        return false;
    }
    const fnScope = fnPath.scope;
    const parentScope = fnScope.parent;
    if (parentScope.parent) {
        // It isn't a top-level function, so we can't delete it
        return true;
    }
    if (fnPath.listKey === 'arguments') {
        // It is passed as an argument to another function, we can't delete it
        return true;
    }
    return false;
}
function findActionForNode(path) {
    console.log("scopeHelpers - findActionForNode");
    if ((0, isRemoved_1.isRemoved)(path))
        return null;
    deletingNodes.add(path);
    const parent = path.parentPath;
    if (!parent)
        return ['remove', path];
    if (parent.isProgram()) {
        // Do not delete Program node
        return ['remove', path];
    }
    if (parent.isClassDeclaration() || parent.isClassExpression()) {
        if (path.key === 'body') {
            return ['replace', path, { type: 'ClassBody', body: [] }];
        }
    }
    if (parent.isFunction()) {
        if (path.listKey === 'params') {
            // Do not remove params of functions
            return null;
        }
        if ((path.isBlockStatement() && isEmptyList(path.get('body'))) ||
            path === parent.get('body')) {
            if (!canFunctionBeDelete(parent)) {
                return [
                    'replace',
                    parent,
                    {
                        ...parent.node,
                        async: false,
                        body: {
                            type: 'BlockStatement',
                            body: [],
                            directives: [],
                        },
                        generator: false,
                        params: [],
                    },
                ];
            }
        }
    }
    if (parent.isConditionalExpression()) {
        if (path.key === 'test') {
            return ['replace', parent, parent.node.alternate];
        }
        if (path.key === 'consequent') {
            return ['replace', path, { type: 'Identifier', name: 'undefined' }];
        }
        if (path.key === 'alternate') {
            return ['replace', path, { type: 'Identifier', name: 'undefined' }];
        }
    }
    if (parent.isLogicalExpression({ operator: '&&' })) {
        return [
            'replace',
            parent,
            {
                type: 'BooleanLiteral',
                value: false,
            },
        ];
    }
    if (parent.isLogicalExpression({ operator: '||' })) {
        return [
            'replace',
            parent,
            path.key === 'left' ? parent.node.right : parent.node.left,
        ];
    }
    if (parent.isObjectProperty()) {
        // let's check if it is a special case with Object.defineProperty
        const key = parent.get('key');
        if (key.isIdentifier({ name: 'get' })) {
            const maybeDefineProperty = parent.parentPath.parentPath;
            if (maybeDefineProperty?.isCallExpression() &&
                maybeDefineProperty
                    .get('callee')
                    .matchesPattern('Object.defineProperty')) {
                return findActionForNode(maybeDefineProperty);
            }
        }
        return findActionForNode(parent);
    }
    if (parent.isTemplateLiteral()) {
        return [
            'replace',
            path,
            {
                type: 'StringLiteral',
                value: '',
            },
        ];
    }
    if (parent.isAssignmentExpression()) {
        if (path.isAssignmentExpression()) {
            // `foo = bar = 42` should be replaced with `foo = 42`
            return ['replace', path, path.node.right];
        }
        return findActionForNode(parent);
    }
    if (parent.isCallExpression()) {
        return findActionForNode(parent);
    }
    if (parent.isForInStatement({ left: path.node })) {
        return findActionForNode(parent);
    }
    if (parent.isFunctionExpression({ body: path.node }) ||
        parent.isFunctionDeclaration() ||
        parent.isObjectMethod() ||
        parent.isClassMethod()) {
        return findActionForNode(parent);
    }
    if (parent.isBlockStatement()) {
        const body = parent.get('body');
        if (isEmptyList(body)) {
            return findActionForNode(parent);
        }
        if (path.listKey === 'body' && typeof path.key === 'number') {
            if (path.key > 0) {
                // We can check whether the previous one can be removed
                const prevStatement = body[path.key - 1];
                if (prevStatement.isIfStatement() &&
                    prevStatement.get('consequent').isReturnStatement()) {
                    // It's `if (…) return …`, we can remove it.
                    return findActionForNode(prevStatement);
                }
            }
            else if (body.slice(1).every((statement) => deletingNodes.has(statement))) {
                // If it is the first statement and all other statements
                // are marked for deletion, we can remove the whole block.
                return findActionForNode(parent);
            }
        }
    }
    if (parent.isVariableDeclarator()) {
        if (path.key === 'init' && path.isAssignmentExpression()) {
            // We are removing `bar` in `var foo = bar = 42`. Path should be replaced with `var foo = 42`
            return ['replace', path, path.node.right];
        }
        const init = parent.get('init');
        if (path.key === 'id' && init.isAssignmentExpression()) {
            // We are removing `foo` in `var foo = bar = 42`. Ignore it.
            return null;
        }
        return findActionForNode(parent);
    }
    if (parent.isExportNamedDeclaration() &&
        ((path.key === 'specifiers' && isEmptyList(parent.get('specifiers'))) ||
            (path.key === 'declaration' && parent.node.declaration === path.node))) {
        return findActionForNode(parent);
    }
    for (const key of ['body', 'declarations', 'specifiers']) {
        if (path.listKey === key && typeof path.key === 'number') {
            const list = parent.get(key);
            if (isEmptyList(list)) {
                return findActionForNode(parent);
            }
        }
    }
    if (parent.isTryStatement()) {
        return findActionForNode(parent);
    }
    if (!path.listKey && path.key) {
        const field = types_1.NODE_FIELDS[parent.type][path.key];
        if (!validateField(parent.node, path.key, null, field)) {
            // The parent node isn't valid without this field, so we should remove it also.
            return findActionForNode(parent);
        }
    }
    for (const key of [
        'argument',
        'block',
        'body',
        'callee',
        'discriminant',
        'expression',
        'id',
        'left',
        'object',
        'property',
        'right',
        'test',
    ]) {
        if (path.key === key && parent.get(key) === path) {
            return findActionForNode(parent);
        }
    }
    return ['remove', path];
}
exports.findActionForNode = findActionForNode;
// @babel/preset-typescript transpiles enums, but doesn't reference used identifiers.
function referenceEnums(program) {
    console.log("scopeHelpers - referenceEnums");
    /*
     * We are looking for transpiled enums.
     *   (function (Colors) {
     *     Colors["BLUE"] = "#27509A";
     *   })(Colors || (Colors = {}));
     */
    program.traverse({
        ExpressionStatement(expressionStatement) {
            const expression = expressionStatement.get('expression');
            if (!expression.isCallExpression())
                return;
            const callee = expression.get('callee');
            const args = expression.get('arguments');
            if (!callee.isFunctionExpression() || args.length !== 1)
                return;
            const [arg] = args;
            if (arg.isLogicalExpression({ operator: '||' })) {
                referenceAll(arg);
            }
        },
    });
}
const fixed = new WeakSet();
function removeUnreferenced(items) {
    console.log("scopeHelpers - removeUnreferenced");
    const referenced = new Set();
    items.forEach((item) => {
        if (!item.node || (0, isRemoved_1.isRemoved)(item))
            return;
        const binding = (0, getScope_1.getScope)(item).getBinding(item.node.name);
        if (!binding)
            return;
        const hasReferences = binding.referencePaths.filter((i) => !(0, isRemoved_1.isRemoved)(i)).length > 0;
        if (hasReferences) {
            referenced.add(item);
            return;
        }
        const forDeleting = [binding.path, ...binding.constantViolations]
            .map(findActionForNode)
            .filter(isNotNull_1.isNotNull)
            .map(getPathFromAction);
        if (forDeleting.length === 0)
            return;
        (0, findIdentifiers_1.findIdentifiers)(forDeleting).forEach((identifier) => {
            referenced.add(identifier);
        });
        removeWithRelated(forDeleting);
    });
    const result = [...referenced];
    result.sort((a, b) => a.node?.name.localeCompare(b.node?.name));
    return result;
}
function getNodeForValue(value) {
    console.log("scopeHelpers - getNodeForValue");
    if (typeof value === 'string') {
        return {
            type: 'StringLiteral',
            value,
        };
    }
    if (typeof value === 'number') {
        return {
            type: 'NumericLiteral',
            value,
        };
    }
    if (typeof value === 'boolean') {
        return {
            type: 'BooleanLiteral',
            value,
        };
    }
    if (value === null) {
        return {
            type: 'NullLiteral',
        };
    }
    if (value === undefined) {
        return {
            type: 'Identifier',
            name: 'undefined',
        };
    }
    return undefined;
}
function staticEvaluate(path) {
    console.log("scopeHelpers - staticEvaluate");
    if (!path)
        return;
    const evaluated = path.evaluate();
    if (evaluated.confident) {
        const node = getNodeForValue(evaluated.value);
        if (node) {
            applyAction(['replace', path, node]);
            return;
        }
    }
    if (path.isIfStatement()) {
        const test = path.get('test');
        if (!test.isBooleanLiteral()) {
            return;
        }
        const { consequent, alternate } = path.node;
        if (test.node.value) {
            applyAction(['replace', path, consequent]);
        }
        else if (alternate) {
            applyAction(['replace', path, alternate]);
        }
        else {
            applyAction(['remove', path]);
        }
    }
}
function applyAction(action) {
    console.log("scopeHelpers - applyAction");
    mutate(action[1], (p) => {
        if ((0, isRemoved_1.isRemoved)(p))
            return;
        const parent = p.parentPath;
        if (action[0] === 'remove') {
            p.remove();
        }
        if (action[0] === 'replace') {
            p.replaceWith(action[2]);
        }
        staticEvaluate(parent);
    });
}
exports.applyAction = applyAction;
function removeWithRelated(paths) {
    console.log("scopeHelpers - removeWithRelated");
    if (paths.length === 0)
        return;
    const rootPath = (0, getScope_1.getScope)(paths[0]).getProgramParent()
        .path;
    if (!fixed.has(rootPath)) {
        // Some libraries don't care about bindings, references, and other staff
        // So we have to fix the scope before we can detect unused code
        referenceEnums(rootPath);
        fixed.add(rootPath);
    }
    const actions = paths
        .map(findActionForNode)
        .filter(isNotNull_1.isNotNull);
    const affectedPaths = actions.map(getPathFromAction);
    let referencedIdentifiers = (0, findIdentifiers_1.findIdentifiers)(affectedPaths, 'reference');
    referencedIdentifiers.sort((a, b) => a.node?.name.localeCompare(b.node?.name));
    const referencesOfBinding = (0, findIdentifiers_1.findIdentifiers)(affectedPaths, 'declaration')
        .map((i) => (i.node && (0, getScope_1.getScope)(i).getBinding(i.node.name)) ?? null)
        .filter(isNotNull_1.isNotNull)
        .reduce((acc, i) => [...acc, ...i.referencePaths.filter(findIdentifiers_1.nonType)], [])
        .filter((ref) => 
    // Do not remove `export default function`
    !ref.isExportDefaultDeclaration() ||
        !ref.get('declaration').isFunctionDeclaration());
    actions.forEach(applyAction);
    removeWithRelated(referencesOfBinding);
    let clean = false;
    while (!clean && referencedIdentifiers.length > 0) {
        const referenced = removeUnreferenced(referencedIdentifiers);
        clean =
            referenced.map((i) => i.node?.name).join('|') ===
                referencedIdentifiers.map((i) => i.node?.name).join('|');
        referencedIdentifiers = referenced;
    }
}
exports.removeWithRelated = removeWithRelated;
function mutate(path, fn) {
    console.log("scopeHelpers - mutate");
    const dereferenced = dereferenceAll(path);
    const mutated = fn(path);
    referenceAll(path);
    mutated?.forEach((p) => referenceAll(p));
    const dead = dereferenced.filter((p) => !isReferenced(p));
    const forDeleting = [];
    dead.forEach((binding) => {
        const assignments = [binding.path, ...binding.constantViolations];
        assignments.forEach((assignment) => {
            const { scope } = assignment;
            const declared = Object.values(assignment.getOuterBindingIdentifiers(false));
            if (declared.length === 1 &&
                'name' in declared[0] &&
                declared[0].name === binding.identifier.name) {
                const init = assignment.get('init');
                if (!Array.isArray(init) && init?.isAssignmentExpression()) {
                    // `const a = b = 1` → `b = 1`
                    assignment.parentPath?.replaceWith({
                        type: 'ExpressionStatement',
                        expression: init.node,
                    });
                    const left = init.get('left');
                    if (left.isIdentifier()) {
                        // If it was forcefully referenced in the shaker
                        dereference(left);
                    }
                    return;
                }
                // Only one identifier is declared, so we can remove the whole declaration
                forDeleting.push(assignment);
                return;
            }
            if (declared.every((identifier) => identifier.type === 'Identifier' &&
                !scope.getBinding(identifier.name)?.referenced)) {
                // No other identifier is referenced, so we can remove the whole declaration
                forDeleting.push(assignment);
                return;
            }
            // We can't remove the binding, but we can remove the part of it
            assignment.traverse({
                Identifier(identifier) {
                    if (identifier.node.name === binding.identifier.name) {
                        const parent = identifier.parentPath;
                        if (parent.isArrayPattern() &&
                            identifier.listKey === 'elements' &&
                            typeof identifier.key === 'number') {
                            parent.node.elements[identifier.key] = null;
                        }
                        else if (parent.isObjectProperty()) {
                            forDeleting.push(parent);
                        }
                    }
                },
            });
        });
    });
    removeWithRelated(forDeleting);
}
exports.mutate = mutate;