"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@wyw-in-js/shared");
const collectExportsAndImports_1 = require("../utils/collectExportsAndImports");
const getFileIdx_1 = require("../utils/getFileIdx");
const isRemoved_1 = require("../utils/isRemoved");
const scopeHelpers_1 = require("../utils/scopeHelpers");
const traversalCache_1 = require("../utils/traversalCache");
const EXT_REGEX = /\.[0-9a-z]+$/;
const ALLOWED_EXTENSIONS = ['.js', '.cjs', '.mjs'];
function shouldKeepSideEffect(importPath) {
    const [ext] = importPath.match(EXT_REGEX) || [''];
    return ext === '' || ALLOWED_EXTENSIONS.includes(ext);
}
function getBindingForExport(exportPath) {
    console.log("shaker - getBindingForExport");
    if (exportPath.isIdentifier()) {
        return exportPath.scope.getBinding(exportPath.node.name);
    }
    const variableDeclarator = exportPath.findParent((p) => p.isVariableDeclarator());
    if (variableDeclarator) {
        const id = variableDeclarator.get('id');
        if (id.isIdentifier()) {
            return variableDeclarator.scope.getBinding(id.node.name);
        }
    }
    if (exportPath.isAssignmentExpression()) {
        const left = exportPath.get('left');
        if (left.isIdentifier()) {
            return exportPath.scope.getBinding(left.node.name);
        }
    }
    if (exportPath.isFunctionDeclaration() || exportPath.isClassDeclaration()) {
        return exportPath.scope.getBinding(exportPath.node.id.name);
    }
    return undefined;
}
const withoutRemoved = (items) => items.filter(({ local }) => !(0, isRemoved_1.isRemoved)(local));
function rearrangeExports({ types: t }, root, exportRefs, exports) {
    console.log("shaker - rearrangeExports");
    const rearranged = {
        ...exports,
    };
    const rootScope = root.scope;
    exportRefs.forEach((refs, name) => {
        if (refs.length <= 1) {
            if (refs.length === 1) {
                // Maybe exports is assigned to another variable?
                const declarator = refs[0].findParent((p) => p.isVariableDeclarator());
                if (!declarator) {
                    return;
                }
            }
            else {
                return;
            }
        }
        const uid = rootScope.generateUid(name);
        // Define variable in the beginning
        const [declaration] = root.unshiftContainer('body', [
            t.variableDeclaration('var', [t.variableDeclarator(t.identifier(uid))]),
        ]);
        rootScope.registerDeclaration(declaration);
        const constantViolations = [];
        // Replace every reference with defined variable
        refs.forEach((ref) => {
            const [replaced] = ref.replaceWith(t.identifier(uid));
            if (replaced.isBindingIdentifier()) {
                constantViolations.push(replaced);
            }
            else {
                (0, scopeHelpers_1.reference)(replaced);
            }
        });
        constantViolations.forEach((id) => {
            rootScope.registerConstantViolation(id);
        });
        const assigmentToExport = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), t.identifier(name)), t.identifier(uid)));
        // export.foo = _foo will be inserted either after the last _foo assigment or in the end of the file
        const body = root.get('body');
        const lastViolation = constantViolations[constantViolations.length - 1] ??
            body[body.length - 1];
        const pathInRoot = root
            .get('body')
            .find((n) => lastViolation.isDescendant(n));
        const [pushed] = pathInRoot.insertAfter(assigmentToExport);
        const local = pushed.get('expression.right');
        (0, scopeHelpers_1.reference)(local);
        rearranged[name] = local;
    });
    return rearranged;
}
function shakerPlugin(babel, { keepSideEffects = false, ifUnknownExport = 'skip-shaking', onlyExports, }) {
    console.log("shaker - shakerPlugin");
    const shakerLogger = shared_1.logger.extend('shaker');
    return {
        name: '@wyw-in-js/transform/shaker',
        pre(file) {
            this.filename = file.opts.filename;
            const log = shakerLogger.extend((0, getFileIdx_1.getFileIdx)(this.filename));
            log('start', `${this.filename}, onlyExports: ${onlyExports.join(',')}`);
            const onlyExportsSet = new Set(onlyExports);
            const collected = (0, collectExportsAndImports_1.collectExportsAndImports)(file.path);
            const sideEffectImports = collected.imports.filter(collectExportsAndImports_1.sideEffectImport);
            log('import-and-exports', [
                `imports: ${collected.imports.length} (side-effects: ${sideEffectImports.length})`,
                `exports: ${Object.values(collected.exports).length}`,
                `reexports: ${collected.reexports.length}`,
            ].join(', '));
            // We cannot just throw out exports if they are referred in the code
            // Let's dome some replacements
            const exports = rearrangeExports(babel, file.path, collected.exportRefs, collected.exports);
            Object.values(exports).forEach((local) => {
                if (local.isAssignmentExpression()) {
                    const left = local.get('left');
                    if (left.isIdentifier()) {
                        // For some reason babel does not mark id in AssignmentExpression as a reference
                        // So we need to do it manually
                        (0, scopeHelpers_1.reference)(left, left, true);
                    }
                }
            });
            const hasWywPreval = exports.__wywPreval !== undefined;
            const hasDefault = exports.default !== undefined;
            // If __wywPreval is not exported, we can remove it from onlyExports
            if (onlyExportsSet.has('__wywPreval') && !hasWywPreval) {
                onlyExportsSet.delete('__wywPreval');
            }
            if (onlyExportsSet.size === 0) {
                // Fast-lane: if there are no exports to keep, we can just shake out the whole file
                this.imports = [];
                this.exports = {};
                this.reexports = [];
                this.deadExports = Object.keys(exports);
                file.path.get('body').forEach((p) => {
                    p.remove();
                });
                return;
            }
            const importedAsSideEffect = onlyExportsSet.has('side-effect');
            onlyExportsSet.delete('side-effect');
            // Hackaround for packages which include a 'default' export without specifying __esModule; such packages cannot be
            // shaken as they will break interopRequireDefault babel helper
            // See example in shaker-plugin.test.ts
            // Real-world example was found in preact/compat npm package
            if (onlyExportsSet.has('default') &&
                hasDefault &&
                !collected.isEsModule) {
                this.imports = collected.imports;
                this.exports = exports;
                this.reexports = collected.reexports;
                this.deadExports = [];
                return;
            }
            if (!onlyExportsSet.has('*')) {
                // __esModule should be kept alive
                onlyExportsSet.add('__esModule');
                const aliveExports = new Set();
                const importNames = collected.imports.map(({ imported }) => imported);
                Object.entries(exports).forEach(([exported, local]) => {
                    if (onlyExportsSet.has(exported)) {
                        aliveExports.add(local);
                    }
                    else if (importNames.includes(local.node.name || '')) {
                        aliveExports.add(local);
                    }
                    else if ([...aliveExports].some((alive) => alive === local)) {
                        // It's possible to export multiple values from a single variable initializer, e.g
                        // export const { foo, bar } = baz();
                        // We need to treat all of them as used if any of them are used, since otherwise
                        // we'll attempt to delete the baz() call
                        aliveExports.add(local);
                    }
                });
                collected.reexports.forEach((exp) => {
                    if (onlyExportsSet.has(exp.exported)) {
                        aliveExports.add(exp.local);
                    }
                });
                const exportToPath = new Map();
                Object.entries(exports).forEach(([exported, local]) => {
                    exportToPath.set(exported, local);
                });
                collected.reexports.forEach((exp) => {
                    exportToPath.set(exp.exported, exp.local);
                });
                const notFoundExports = [...onlyExportsSet].filter((exp) => exp !== '__esModule' && !aliveExports.has(exportToPath.get(exp)));
                exportToPath.clear();
                const isAllExportsFound = notFoundExports.length === 0;
                if (!isAllExportsFound && ifUnknownExport !== 'ignore') {
                    if (ifUnknownExport === 'error') {
                        throw new Error(`Unknown export(s) requested: ${onlyExports.join(',')}`);
                    }
                    if (ifUnknownExport === 'reexport-all') {
                        // If there are unknown exports, we have keep alive all re-exports.
                        if (exports['*'] !== undefined) {
                            aliveExports.add(exports['*']);
                        }
                        collected.reexports.forEach((exp) => {
                            if (exp.exported === '*') {
                                aliveExports.add(exp.local);
                            }
                        });
                    }
                    if (ifUnknownExport === 'skip-shaking') {
                        this.imports = collected.imports;
                        this.exports = exports;
                        this.reexports = collected.reexports;
                        this.deadExports = [];
                        return;
                    }
                }
                const forDeleting = [
                    ...Object.values(exports),
                    ...collected.reexports.map((i) => i.local),
                ].filter((exp) => !aliveExports.has(exp));
                if (!keepSideEffects && !importedAsSideEffect) {
                    // Remove all imports that don't import something explicitly and should not be kept
                    sideEffectImports.forEach((i) => {
                        if (!shouldKeepSideEffect(i.source)) {
                            forDeleting.push(i.local);
                        }
                    });
                }
                const deleted = new Set();
                let dereferenced = [];
                let changed = true;
                while (changed && deleted.size < forDeleting.length) {
                    changed = false;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const path of forDeleting) {
                        if (deleted.has(path)) {
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        const binding = getBindingForExport(path);
                        const action = (0, scopeHelpers_1.findActionForNode)(path);
                        const parent = action?.[1];
                        const outerReferences = (binding?.referencePaths || []).filter((ref) => ref !== parent && !parent?.isAncestor(ref));
                        if (outerReferences.length > 0 && path.isIdentifier()) {
                            // Temporary deref it in order to simplify further checks.
                            (0, scopeHelpers_1.dereference)(path);
                            dereferenced.push(path);
                        }
                        if (!deleted.has(path) &&
                            (!binding || outerReferences.length === 0)) {
                            if (action) {
                                (0, scopeHelpers_1.applyAction)(action);
                            }
                            else {
                                (0, scopeHelpers_1.removeWithRelated)([path]);
                            }
                            deleted.add(path);
                            changed = true;
                        }
                    }
                    dereferenced.forEach((path) => {
                        // If path is still alive, we need to reference it back
                        if (!(0, isRemoved_1.isRemoved)(path)) {
                            (0, scopeHelpers_1.reference)(path);
                        }
                    });
                    dereferenced = [];
                    // Find and mark for deleting all unreferenced variables
                    const unreferenced = Object.values(file.scope.getAllBindings()).filter((i) => !i.referenced);
                    for (const binding of unreferenced) {
                        if (binding.path.isVariableDeclarator() &&
                            !forDeleting.includes(binding.path.get('id'))) {
                            forDeleting.push(...binding.constantViolations);
                            forDeleting.push(binding.path.get('id'));
                            changed = true;
                        }
                    }
                }
            }
            this.imports = withoutRemoved(collected.imports);
            this.exports = {};
            this.deadExports = [];
            Object.entries(exports).forEach(([exported, local]) => {
                if ((0, isRemoved_1.isRemoved)(local)) {
                    this.deadExports.push(exported);
                }
                else {
                    this.exports[exported] = local;
                }
            });
            this.reexports = withoutRemoved(collected.reexports);
        },
        visitor: {},
        post(file) {
            const log = shakerLogger.extend((0, getFileIdx_1.getFileIdx)(file.opts.filename));
            const processedImports = new Set();
            const imports = new Map();
            const addImport = ({ imported, source, }) => {
                if (processedImports.has(`${source}:${imported}`)) {
                    return;
                }
                if (!imports.has(source)) {
                    imports.set(source, []);
                }
                if (imported) {
                    imports.get(source).push(imported);
                }
                processedImports.add(`${source}:${imported}`);
            };
            this.imports.forEach(addImport);
            this.reexports.forEach(addImport);
            log('end', `remaining imports: %O`, imports);
            // eslint-disable-next-line no-param-reassign
            file.metadata.wywEvaluator = {
                imports,
            };
            (0, traversalCache_1.invalidateTraversalCache)(file.path);
        },
    };
}
exports.default = shakerPlugin;