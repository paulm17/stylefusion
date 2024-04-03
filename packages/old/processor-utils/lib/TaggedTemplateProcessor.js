"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TaggedTemplateProcessor = void 0;
var _shared = require("@wyw-in-js/shared");
var _BaseProcessor = require("./BaseProcessor");
var _templateProcessor = _interopRequireDefault(require("./utils/templateProcessor"));
var _validateParams = require("./utils/validateParams");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
class TaggedTemplateProcessor extends _BaseProcessor.BaseProcessor {
  #template;
  constructor(params, ...args) {
    console.log("TaggedTemplateProcessor.ts - constructor");
    // Should have at least two params and the first one should be a callee.
    (0, _validateParams.validateParams)(params, ['callee', '...'], TaggedTemplateProcessor.SKIP);
    (0, _validateParams.validateParams)(params, ['callee', 'template'], 'Invalid usage of template tag');
    const [tag, [, template]] = params;
    super([tag], ...args);
    template.forEach(element => {
      if ('kind' in element && element.kind !== _shared.ValueType.FUNCTION) {
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
    const artifact = (0, _templateProcessor.default)(this, this.#template, values, this.options.variableNameConfig);
    if (artifact) {
      this.artifacts.push(['css', artifact]);
    }
  }
  toString() {
    return `${super.toString()}\`…\``;
  }

  /**
   * It is called for each resolved expression in a template literal.
   * @param node
   * @param precedingCss
   * @param source
   * @param unit
   * @return chunk of CSS that should be added to extracted CSS
   */
}
exports.TaggedTemplateProcessor = TaggedTemplateProcessor;
//# sourceMappingURL=TaggedTemplateProcessor.js.map