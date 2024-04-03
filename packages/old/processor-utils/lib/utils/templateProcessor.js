"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = templateProcessor;
var _shared = require("@wyw-in-js/shared");
var _getVariableName = require("./getVariableName");
var _stripLines = _interopRequireDefault(require("./stripLines"));
var _throwIfInvalid = _interopRequireDefault(require("./throwIfInvalid"));
var _toCSS = _interopRequireWildcard(require("./toCSS"));
var _units = require("./units");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-continue */
/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */

// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(?:${_units.units.join('|')})\\b`);
function templateProcessor(tagProcessor, [...template], valueCache, variableNameConfig) {
  console.log("templateProcessor.ts - templateProcessor");
  const sourceMapReplacements = [];
  // Check if the variable is referenced anywhere for basic DCE
  // Only works when it's assigned to a variable
  const {
    isReferenced
  } = tagProcessor;

  // Serialize the tagged template literal to a string
  let cssText = '';
  let item;
  // eslint-disable-next-line no-cond-assign
  while (item = template.shift()) {
    if ('type' in item) {
      // It's a template element
      cssText += item.value.cooked;
      continue;
    }

    // It's an expression
    const {
      ex
    } = item;
    const {
      end,
      start
    } = ex.loc;
    const beforeLength = cssText.length;

    // The location will be end of the current string to start of next string
    const next = template[0]; // template[0] is the next template element
    const loc = {
      start,
      end: next ? {
        line: next.loc.start.line,
        column: next.loc.start.column
      } : {
        line: end.line,
        column: end.column + 1
      }
    };
    const value = 'value' in item ? item.value : valueCache.get(item.ex.name);

    // Is it props based interpolation?
    if (item.kind === _shared.ValueType.FUNCTION || typeof value === 'function') {
      var _next$value$cooked;
      // Check if previous expression was a CSS variable that we replaced
      // If it has a unit after it, we need to move the unit into the interpolation
      // e.g. `var(--size)px` should actually be `var(--size)`
      // So we check if the current text starts with a unit, and add the unit to the previous interpolation
      // Another approach would be `calc(var(--size) * 1px), but some browsers don't support all units
      // https://bugzilla.mozilla.org/show_bug.cgi?id=956573
      const matches = (_next$value$cooked = next.value.cooked) === null || _next$value$cooked === void 0 ? void 0 : _next$value$cooked.match(unitRegex);
      try {
        if (matches) {
          var _next$value$cooked$su, _next$value$cooked2, _unit$length;
          template.shift();
          const [unit] = matches;
          const varId = tagProcessor.addInterpolation(item.ex, cssText, item.source, unit);
          cssText += (0, _getVariableName.getVariableName)(varId, variableNameConfig);
          cssText += (_next$value$cooked$su = (_next$value$cooked2 = next.value.cooked) === null || _next$value$cooked2 === void 0 ? void 0 : _next$value$cooked2.substring((_unit$length = unit === null || unit === void 0 ? void 0 : unit.length) !== null && _unit$length !== void 0 ? _unit$length : 0)) !== null && _next$value$cooked$su !== void 0 ? _next$value$cooked$su : '';
        } else {
          const varId = tagProcessor.addInterpolation(item.ex, cssText, item.source);
          cssText += (0, _getVariableName.getVariableName)(varId, variableNameConfig);
        }
      } catch (e) {
        if (e instanceof Error) {
          throw item.buildCodeFrameError(e.message);
        }
        throw e;
      }
    } else {
      (0, _throwIfInvalid.default)(tagProcessor.isValidValue.bind(tagProcessor), value, item, item.source);
      if (value !== undefined && typeof value !== 'function') {
        // Skip the blank string instead of throw ing an error
        if (value === '') {
          continue;
        }
        if ((0, _shared.hasEvalMeta)(value)) {
          // If it's a React component wrapped in styled, get the class name
          // Useful for interpolating components
          cssText += `.${value.__wyw_meta.className}`;
        } else if ((0, _toCSS.isCSSable)(value)) {
          // If it's a plain object or an array, convert it to a CSS string
          cssText += (0, _stripLines.default)(loc, (0, _toCSS.default)(value));
        } else {
          // For anything else, assume it'll be stringified
          cssText += (0, _stripLines.default)(loc, value);
        }
        sourceMapReplacements.push({
          original: loc,
          length: cssText.length - beforeLength
        });
      }
    }
  }
  const rules = tagProcessor.extractRules(valueCache, cssText, tagProcessor.location);

  // tagProcessor.doRuntimeReplacement(classes);
  if (!isReferenced && !cssText.includes(':global')) {
    return null;
  }

  // eslint-disable-next-line no-param-reassign
  return [rules, sourceMapReplacements];
}
//# sourceMappingURL=templateProcessor.js.map