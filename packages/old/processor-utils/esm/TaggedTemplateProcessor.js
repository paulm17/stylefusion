import { ValueType } from '@wyw-in-js/shared';
import { BaseProcessor } from './BaseProcessor';
import templateProcessor from './utils/templateProcessor';
import { validateParams } from './utils/validateParams';
export class TaggedTemplateProcessor extends BaseProcessor {
  #template;
  constructor(params, ...args) {
    console.log("TaggedTemplateProcessor.ts - constructor");
    // Should have at least two params and the first one should be a callee.
    validateParams(params, ['callee', '...'], TaggedTemplateProcessor.SKIP);
    validateParams(params, ['callee', 'template'], 'Invalid usage of template tag');
    const [tag, [, template]] = params;
    super([tag], ...args);
    template.forEach(element => {
      if ('kind' in element && element.kind !== ValueType.FUNCTION) {
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
    const artifact = templateProcessor(this, this.#template, values, this.options.variableNameConfig);
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
//# sourceMappingURL=TaggedTemplateProcessor.js.map