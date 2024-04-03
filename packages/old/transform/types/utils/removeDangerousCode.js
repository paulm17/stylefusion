"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDangerousCode = void 0;
const findIdentifiers_1 = require("./findIdentifiers");
const isUnnecessaryReactCall_1 = require("./isUnnecessaryReactCall");
const scopeHelpers_1 = require("./scopeHelpers");
const JSXElementsRemover_1 = require("./visitors/JSXElementsRemover");
const isGlobal = (id) => {
    console.log("removeDangerousCode - isGlobal");
    if (!(0, findIdentifiers_1.nonType)(id)) {
        return false;
    }
    const { scope } = id;
    const { name } = id.node;
    return !scope.hasBinding(name) && scope.hasGlobal(name);
};
const ssrCheckFields = new Set([
    'document',
    'location',
    'navigator',
    'sessionStorage',
    'localStorage',
    'window',
]);
const forbiddenGlobals = new Set([
    ...ssrCheckFields,
    '$RefreshReg$',
    'XMLHttpRequest',
    'clearImmediate',
    'clearInterval',
    'clearTimeout',
    'fetch',
    'navigator',
    'setImmediate',
    'setInterval',
    'setTimeout',
]);
const isBrowserGlobal = (id) => {
    return forbiddenGlobals.has(id.node.name) && isGlobal(id);
};
const isSSRCheckField = (id) => {
    return ssrCheckFields.has(id.node.name) && isGlobal(id);
};
const getPropertyName = (path) => {
    if (path.isIdentifier()) {
        return path.node.name;
    }
    if (path.isStringLiteral()) {
        return path.node.value;
    }
    return null;
};
const removeDangerousCode = (programPath) => {
    programPath.traverse({
        // JSX can be replaced with a dummy value,
        // but we have to do it after we processed template tags.
        CallExpression: {
            enter(p) {
                if ((0, isUnnecessaryReactCall_1.isUnnecessaryReactCall)(p)) {
                    (0, JSXElementsRemover_1.JSXElementsRemover)(p);
                }
            },
        },
        JSXElement: {
            enter: JSXElementsRemover_1.JSXElementsRemover,
        },
        JSXFragment: {
            enter: JSXElementsRemover_1.JSXElementsRemover,
        },
        MemberExpression(p, state) {
            const obj = p.get('object');
            const prop = p.get('property');
            if (!obj.isIdentifier({ name: 'window' })) {
                return;
            }
            const name = getPropertyName(prop);
            if (!name) {
                return;
            }
            state.windowScoped.add(name);
            // eslint-disable-next-line no-param-reassign
            state.globals = state.globals.filter((id) => {
                if (id.node.name === name) {
                    (0, scopeHelpers_1.removeWithRelated)([id]);
                    return false;
                }
                return true;
            });
        },
        MetaProperty(p) {
            // Remove all references to `import.meta`
            (0, scopeHelpers_1.removeWithRelated)([p]);
        },
        Identifier(p, state) {
            if (p.find((parent) => parent.isTSTypeReference())) {
                // don't mess with TS type references
                return;
            }
            if (isBrowserGlobal(p)) {
                if (p.find((parentPath) => parentPath.isUnaryExpression({ operator: 'typeof' }) ||
                    parentPath.isTSTypeQuery())) {
                    // Ignore `typeof window` expressions
                    return;
                }
                if (p.parentPath.isClassProperty()) {
                    // ignore class property decls
                    return;
                }
                if (p.parentPath.isMemberExpression() && p.key === 'property') {
                    // ignore e.g this.fetch()
                    // window.fetch will be handled by the windowScoped block below
                    return;
                }
                (0, scopeHelpers_1.removeWithRelated)([p]);
                return;
            }
            if (state.windowScoped.has(p.node.name)) {
                (0, scopeHelpers_1.removeWithRelated)([p]);
            }
            else if (isGlobal(p)) {
                state.globals.push(p);
            }
        },
        // Since we can use happy-dom, typical SSR checks may not work as expected.
        // We need to detect them and replace with an "undefined" literal.
        UnaryExpression(p) {
            if (p.node.operator !== 'typeof') {
                return;
            }
            const arg = p.get('argument');
            if (!arg.isIdentifier() || !isSSRCheckField(arg)) {
                return;
            }
            (0, scopeHelpers_1.applyAction)([
                'replace',
                p,
                { type: 'StringLiteral', value: 'undefined' },
            ]);
        },
    }, {
        globals: [],
        windowScoped: new Set(),
    });
};
exports.removeDangerousCode = removeDangerousCode;
