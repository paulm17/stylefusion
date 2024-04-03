"use strict";
/* eslint @typescript-eslint/no-use-before-define: ["error", { "functions": false }] */
Object.defineProperty(exports, "__esModule", { value: true });
exports.collectTemplateDependencies = exports.extractExpression = void 0;
/**
 * This file is a visitor that checks TaggedTemplateExpressions and look for WYW template literals.
 * For each template it makes a list of dependencies, try to evaluate expressions, and if it is not possible, mark them as lazy dependencies.
 */
const template_1 = require("@babel/template");
const types_1 = require("@babel/types");
const shared_1 = require("@wyw-in-js/shared");
const createId_1 = require("./createId");
const findIdentifiers_1 = require("./findIdentifiers");
const getSource_1 = require("./getSource");
const scopeHelpers_1 = require("./scopeHelpers");
const valueToLiteral_1 = require("./valueToLiteral");
function staticEval(ex, evaluate = false) {
    console.log("collectTemplateDependencies - staticEval");
    if (!evaluate)
        return undefined;
    const result = ex.evaluate();
    if (result.confident && !(0, shared_1.hasEvalMeta)(result.value)) {
        return [result.value];
    }
    return undefined;
}
const expressionDeclarationTpl = (0, template_1.statement)('const %%expId%% = /*#__PURE__*/ () => %%expression%%', {
    preserveComments: true,
});
const unsupported = (ex, reason) => ex.buildCodeFrameError(`This ${ex.isIdentifier() ? 'identifier' : 'expression'} cannot be used in the template${reason ? `, because it ${reason}` : ''}.`);
function getUidInRootScope(path) {
    console.log("collectTemplateDependencies - getUidInRootScope");
    const { name } = path.node;
    const rootScope = path.scope.getProgramParent();
    if (rootScope.hasBinding(name)) {
        return rootScope.generateUid(name);
    }
    return name;
}
function hoistVariableDeclarator(ex) {
    console.log("collectTemplateDependencies - hoistVariableDeclarator");
    if (!ex.scope.parent) {
        // It is already in the root scope
        return;
    }
    const referencedIdentifiers = (0, findIdentifiers_1.findIdentifiers)([ex], 'reference');
    referencedIdentifiers.forEach((identifier) => {
        if (identifier.isIdentifier()) {
            hoistIdentifier(identifier);
        }
    });
    const bindingIdentifiers = (0, findIdentifiers_1.findIdentifiers)([ex], 'declaration');
    bindingIdentifiers.forEach((path) => {
        const newName = getUidInRootScope(path);
        if (newName !== path.node.name) {
            path.scope.rename(path.node.name, newName);
        }
    });
    const rootScope = ex.scope.getProgramParent();
    const statementInRoot = ex.findParent((p) => p.parentPath?.isProgram() === true);
    const declaration = {
        type: 'VariableDeclaration',
        kind: 'let',
        declarations: [(0, types_1.cloneNode)(ex.node)],
    };
    const [inserted] = statementInRoot.insertBefore(declaration);
    (0, scopeHelpers_1.referenceAll)(inserted);
    rootScope.registerDeclaration(inserted);
}
function hoistIdentifier(idPath) {
    console.log("collectTemplateDependencies - hoistIdentifier");
    if (!idPath.isReferenced()) {
        throw unsupported(idPath);
    }
    const binding = idPath.scope.getBinding(idPath.node.name);
    if (!binding) {
        // It's something strange
        throw unsupported(idPath, 'is undefined');
    }
    if (binding.kind === 'module') {
        // Modules are global by default
        return;
    }
    if (!['var', 'let', 'const', 'hoisted'].includes(binding.kind)) {
        // This is not a variable, we can't hoist it
        throw unsupported(binding.path, 'is a function parameter');
    }
    const { scope, path: bindingPath } = binding;
    // parent here can be null or undefined in different versions of babel
    if (!scope.parent) {
        // The variable is already in the root scope
        return;
    }
    if (bindingPath.isVariableDeclarator()) {
        hoistVariableDeclarator(bindingPath);
        return;
    }
    throw unsupported(idPath);
}
/**
 * Only an expression that can be evaluated in the root scope can be
 * used in a WYW template. This function tries to hoist the expression.
 * @param ex The expression to hoist.
 * @param evaluate If true, we try to statically evaluate the expression.
 * @param imports All the imports of the file.
 */
function extractExpression(ex, evaluate = false, imports = []) {
    console.log("collectTemplateDependencies - extractExpression");
    if (ex.isLiteral() &&
        ('value' in ex.node || ex.node.type === 'NullLiteral')) {
        return {
            ex: ex.node,
            kind: shared_1.ValueType.CONST,
            value: ex.node.type === 'NullLiteral' ? null : ex.node.value,
        };
    }
    const { loc } = ex.node;
    const rootScope = ex.scope.getProgramParent();
    const statementInRoot = ex.findParent((p) => p.parentPath?.isProgram() === true);
    const isFunction = ex.isFunctionExpression() || ex.isArrowFunctionExpression();
    // Generate next _expN name
    const expUid = rootScope.generateUid('exp');
    const evaluated = staticEval(ex, evaluate);
    if (!evaluated) {
        // If expression is not statically evaluable,
        // we need to hoist all its referenced identifiers
        // Collect all referenced identifiers
        (0, findIdentifiers_1.findIdentifiers)([ex], 'reference').forEach((id) => {
            if (!id.isIdentifier())
                return;
            // Try to evaluate and inline them…
            const evaluatedId = staticEval(id, evaluate);
            if (evaluatedId) {
                (0, scopeHelpers_1.mutate)(id, (p) => {
                    p.replaceWith((0, valueToLiteral_1.valueToLiteral)(evaluatedId[0], ex));
                });
            }
            else {
                // … or hoist them to the root scope
                hoistIdentifier(id);
            }
        });
    }
    const kind = isFunction ? shared_1.ValueType.FUNCTION : shared_1.ValueType.LAZY;
    // Declare _expN const with the lazy expression
    const declaration = expressionDeclarationTpl({
        expId: (0, createId_1.createId)(expUid),
        expression: evaluated
            ? (0, valueToLiteral_1.valueToLiteral)(evaluated[0], ex)
            : (0, types_1.cloneNode)(ex.node),
    });
    // Insert the declaration as close as possible to the original expression
    const [inserted] = statementInRoot.insertBefore(declaration);
    (0, scopeHelpers_1.referenceAll)(inserted);
    rootScope.registerDeclaration(inserted);
    const importedFrom = [];
    function findImportSourceOfIdentifier(idPath) {
        console.log("collectTemplateDependencies - findImportSourceOfIdentifier");
        const exBindingIdentifier = idPath.scope.getBinding(idPath.node.name)
            ?.identifier;
        const exImport = imports.find((i) => i.local.node === exBindingIdentifier) ?? null;
        if (exImport) {
            importedFrom.push(exImport.source);
        }
    }
    if (ex.isIdentifier()) {
        findImportSourceOfIdentifier(ex);
    }
    else {
        ex.traverse({
            Identifier: findImportSourceOfIdentifier,
        });
    }
    // Replace the expression with the _expN() call
    (0, scopeHelpers_1.mutate)(ex, (p) => {
        p.replaceWith({
            type: 'CallExpression',
            callee: (0, createId_1.createId)(expUid),
            arguments: [],
        });
    });
    // eslint-disable-next-line no-param-reassign
    ex.node.loc = loc;
    // noinspection UnnecessaryLocalVariableJS
    const result = {
        kind,
        ex: (0, createId_1.createId)(expUid, loc),
        importedFrom,
    };
    return result;
}
exports.extractExpression = extractExpression;
const debug = shared_1.logger.extend('template-parse:identify-expressions');
/**
 * Collects, hoists, and makes lazy all expressions in the given template
 * If evaluate is true, it will try to evaluate the expressions
 */
function collectTemplateDependencies(path, evaluate = false) {
    console.log("collectTemplateDependencies - collectTemplateDependencies");
    const quasi = path.get('quasi');
    const quasis = quasi.get('quasis');
    const expressions = quasi.get('expressions');
    debug('Found: %s', expressions.length);
    const expressionValues = expressions.map((ex) => {
        const buildCodeFrameError = ex.buildCodeFrameError.bind(ex);
        const source = (0, getSource_1.getSource)(ex);
        if (!ex.isExpression()) {
            throw buildCodeFrameError(`The expression '${source}' is not supported.`);
        }
        const extracted = extractExpression(ex, evaluate);
        return {
            ...extracted,
            source,
            buildCodeFrameError,
        };
    });
    return [quasis.map((p) => p.node), expressionValues];
}
exports.collectTemplateDependencies = collectTemplateDependencies;
