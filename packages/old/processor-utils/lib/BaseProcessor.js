"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.BaseProcessor = void 0;
var _generator = _interopRequireDefault(require("@babel/generator"));
var _shared = require("@wyw-in-js/shared");
var _getClassNameAndSlug = _interopRequireDefault(require("./utils/getClassNameAndSlug"));
var _toCSS = require("./utils/toCSS");
var _validateParams = require("./utils/validateParams");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable class-methods-use-this */

class BaseProcessor {
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
    (0, _validateParams.validateParams)(params, ['callee'], 'Unknown error: a callee param is not specified');
    console.log("processor-utils - baseprocessor.ts");
    console.log("className generated here");
    const {
      className,
      slug
    } = (0, _getClassNameAndSlug.default)(this.displayName, this.idx, this.options, this.context);
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
    return typeof value === 'function' || (0, _toCSS.isCSSable)(value) || (0, _shared.hasEvalMeta)(value);
  }
  toString() {
    return this.tagSourceCode();
  }
  tagSourceCode() {
    if (this.callee.type === 'Identifier') {
      return this.callee.name;
    }
    return (0, _generator.default)(this.callee).code;
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
exports.BaseProcessor = BaseProcessor;
//# sourceMappingURL=BaseProcessor.js.map