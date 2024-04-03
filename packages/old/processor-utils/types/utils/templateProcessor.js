"use strict";
/* eslint-disable no-continue */
/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shared_1 = require("@wyw-in-js/shared");
const getVariableName_1 = require("./getVariableName");
const stripLines_1 = __importDefault(require("./stripLines"));
const throwIfInvalid_1 = __importDefault(require("./throwIfInvalid"));
const toCSS_1 = __importStar(require("./toCSS"));
const units_1 = require("./units");
// Match any valid CSS units followed by a separator such as ;, newline etc.
const unitRegex = new RegExp(`^(?:${units_1.units.join('|')})\\b`);
function templateProcessor(tagProcessor, [...template], valueCache, variableNameConfig) {
    console.log("templateProcessor.ts - templateProcessor");
    const sourceMapReplacements = [];
    // Check if the variable is referenced anywhere for basic DCE
    // Only works when it's assigned to a variable
    const { isReferenced } = tagProcessor;
    // Serialize the tagged template literal to a string
    let cssText = '';
    let item;
    // eslint-disable-next-line no-cond-assign
    while ((item = template.shift())) {
        if ('type' in item) {
            // It's a template element
            cssText += item.value.cooked;
            continue;
        }
        // It's an expression
        const { ex } = item;
        const { end, start } = ex.loc;
        const beforeLength = cssText.length;
        // The location will be end of the current string to start of next string
        const next = template[0]; // template[0] is the next template element
        const loc = {
            start,
            end: next
                ? { line: next.loc.start.line, column: next.loc.start.column }
                : { line: end.line, column: end.column + 1 },
        };
        const value = 'value' in item ? item.value : valueCache.get(item.ex.name);
        // Is it props based interpolation?
        if (item.kind === shared_1.ValueType.FUNCTION || typeof value === 'function') {
            // Check if previous expression was a CSS variable that we replaced
            // If it has a unit after it, we need to move the unit into the interpolation
            // e.g. `var(--size)px` should actually be `var(--size)`
            // So we check if the current text starts with a unit, and add the unit to the previous interpolation
            // Another approach would be `calc(var(--size) * 1px), but some browsers don't support all units
            // https://bugzilla.mozilla.org/show_bug.cgi?id=956573
            const matches = next.value.cooked?.match(unitRegex);
            try {
                if (matches) {
                    template.shift();
                    const [unit] = matches;
                    const varId = tagProcessor.addInterpolation(item.ex, cssText, item.source, unit);
                    cssText += (0, getVariableName_1.getVariableName)(varId, variableNameConfig);
                    cssText += next.value.cooked?.substring(unit?.length ?? 0) ?? '';
                }
                else {
                    const varId = tagProcessor.addInterpolation(item.ex, cssText, item.source);
                    cssText += (0, getVariableName_1.getVariableName)(varId, variableNameConfig);
                }
            }
            catch (e) {
                if (e instanceof Error) {
                    throw item.buildCodeFrameError(e.message);
                }
                throw e;
            }
        }
        else {
            (0, throwIfInvalid_1.default)(tagProcessor.isValidValue.bind(tagProcessor), value, item, item.source);
            if (value !== undefined && typeof value !== 'function') {
                // Skip the blank string instead of throw ing an error
                if (value === '') {
                    continue;
                }
                if ((0, shared_1.hasEvalMeta)(value)) {
                    // If it's a React component wrapped in styled, get the class name
                    // Useful for interpolating components
                    cssText += `.${value.__wyw_meta.className}`;
                }
                else if ((0, toCSS_1.isCSSable)(value)) {
                    // If it's a plain object or an array, convert it to a CSS string
                    cssText += (0, stripLines_1.default)(loc, (0, toCSS_1.default)(value));
                }
                else {
                    // For anything else, assume it'll be stringified
                    cssText += (0, stripLines_1.default)(loc, value);
                }
                sourceMapReplacements.push({
                    original: loc,
                    length: cssText.length - beforeLength,
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
exports.default = templateProcessor;