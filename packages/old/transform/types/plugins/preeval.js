"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preeval = void 0;
const shared_1 = require("@wyw-in-js/shared");
const getTagProcessor_1 = require("../utils/getTagProcessor");
const EventEmitter_1 = require("../utils/EventEmitter");
const addIdentifierToWywPreval_1 = require("../utils/addIdentifierToWywPreval");
const getFileIdx_1 = require("../utils/getFileIdx");
const removeDangerousCode_1 = require("../utils/removeDangerousCode");
const traversalCache_1 = require("../utils/traversalCache");
function preeval(babel, options) {
    console.log("preeval - preeval");
    const { types: t } = babel;
    const eventEmitter = options.eventEmitter ?? EventEmitter_1.EventEmitter.dummy;
    return {
        name: '@wyw-in-js/transform/preeval',
        pre(file) {
            const filename = file.opts.filename;
            const log = shared_1.logger.extend('preeval').extend((0, getFileIdx_1.getFileIdx)(filename));
            log('start', 'Looking for template literals…');
            const rootScope = file.scope;
            this.processors = [];
            eventEmitter.perf('transform:preeval:processTemplate', () => {
                (0, getTagProcessor_1.applyProcessors)(file.path, file.opts, options, (processor) => {
                    processor.dependencies.forEach((dependency) => {
                        if (dependency.ex.type === 'Identifier') {
                            (0, addIdentifierToWywPreval_1.addIdentifierToWywPreval)(rootScope, dependency.ex.name);
                        }
                    });
                    processor.doEvaltimeReplacement();
                    this.processors.push(processor);
                });
            });
            if ((0, shared_1.isFeatureEnabled)(options.features, 'dangerousCodeRemover', filename)) {
                log('start', 'Strip all JSX and browser related stuff');
                eventEmitter.perf('transform:preeval:removeDangerousCode', () => (0, removeDangerousCode_1.removeDangerousCode)(file.path));
            }
        },
        visitor: {},
        post(file) {
            const log = shared_1.logger
                .extend('preeval')
                .extend((0, getFileIdx_1.getFileIdx)(file.opts.filename));
            (0, traversalCache_1.invalidateTraversalCache)(file.path);
            if (this.processors.length === 0) {
                log('end', "We didn't find any wyw-in-js template literals");
                // We didn't find any wyw-in-js template literals.
                return;
            }
            this.file.metadata.wywInJS = {
                processors: this.processors,
                replacements: [],
                rules: {},
                dependencies: [],
            };
            const wywPreval = file.path.getData('__wywPreval');
            if (!wywPreval) {
                // Event if there is no dependencies, we still need to add __wywPreval
                const wywExport = t.expressionStatement(t.assignmentExpression('=', t.memberExpression(t.identifier('exports'), t.identifier('__wywPreval')), t.objectExpression([])));
                file.path.pushContainer('body', wywExport);
            }
            log('end', '__wywPreval has been added');
        },
    };
}
exports.preeval = preeval;
exports.default = preeval;
