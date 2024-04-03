/* eslint-disable class-methods-use-this */

import generator from '@babel/generator';
import { hasEvalMeta } from '@wyw-in-js/shared';
import getClassNameAndSlug from './utils/getClassNameAndSlug';
import { isCSSable } from './utils/toCSS';
import { validateParams } from './utils/validateParams';
export class BaseProcessor {
  static SKIP = Symbol('skip');
  artifacts = [];
  className = "";
  styleRoot = "";
  styleStr = "";
  dependencies = [];
  interpolations = [];
  constructor(params, tagSource, astService, location, replacer, displayName, isReferenced, idx, options, context) {
    this.tagSource = tagSource;
    this.astService = astService;
    this.location = location;
    this.replacer = replacer;
    this.displayName = displayName;
    this.isReferenced = isReferenced;
    this.idx = idx;
    this.options = options;
    this.context = context;
    validateParams(params, ['callee'], 'Unknown error: a callee param is not specified');
    console.log("processor-utils - baseprocessor.ts");
    console.log("className generated here");
    const {
      className,
      slug
    } = getClassNameAndSlug(this.displayName, this.idx, this.options, this.context);
    this.className = className;
    this.slug = slug;
    [[, this.callee]] = params;
  }

  /**
   * A replacement for tag referenced in a template literal.
   */

  /**
   * A replacement for the tag in evaluation time.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with an object with metadata.
   */

  isValidValue(value) {
    return typeof value === 'function' || isCSSable(value) || hasEvalMeta(value);
  }
  toString() {
    return this.tagSourceCode();
  }
  tagSourceCode() {
    if (this.callee.type === 'Identifier') {
      return this.callee.name;
    }
    return generator(this.callee).code;
  }

  /**
   * Perform a replacement for the tag in evaluation time.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with an object with metadata.
   */

  /**
   * Perform a replacement for the tag with its runtime version.
   * For example, `css` tag will be replaced with its className,
   * whereas `styled` tag will be replaced with a component.
   * If some parts require evaluated data for render,
   * they will be replaced with placeholders.
   */
}
//# sourceMappingURL=BaseProcessor.js.map