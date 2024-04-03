"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaggedTemplateProcessor = void 0;
const shared_1 = require("@wyw-in-js/shared");
const BaseProcessor_1 = require("./BaseProcessor");
const templateProcessor_1 = __importDefault(require("./utils/templateProcessor"));
const validateParams_1 = require("./utils/validateParams");
class TaggedTemplateProcessor extends BaseProcessor_1.BaseProcessor {
    #template;
    constructor(params, ...args) {
        console.log("TaggedTemplateProcessor.ts - constructor");
        // Should have at least two params and the first one should be a callee.
        (0, validateParams_1.validateParams)(params, ['callee', '...'], TaggedTemplateProcessor.SKIP);
        (0, validateParams_1.validateParams)(params, ['callee', 'template'], 'Invalid usage of template tag');
        const [tag, [, template]] = params;
        super([tag], ...args);
        template.forEach((element) => {
            if ('kind' in element && element.kind !== shared_1.ValueType.FUNCTION) {
                this.dependencies.push(element);
            }
        });
        this.#template = template;
    }
    build(values) {
        console.log("TaggedTemplateProcessor.ts - build");
        if (this.artifacts.length > 0) {
            // FIXME: why it was called twice?
            throw new Error('Tag is already built');
        }
        const artifact = (0, templateProcessor_1.default)(this, this.#template, values, this.options.variableNameConfig);
        if (artifact) {
            this.artifacts.push(['css', artifact]);
        }
    }
    toString() {
        return `${super.toString()}\`…\``;
    }
}
exports.TaggedTemplateProcessor = TaggedTemplateProcessor;
