"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createStylisPreprocessor = exports.createKeyframeSuffixerPlugin = exports.createStylisUrlReplacePlugin = exports.stylisGlobalPlugin = exports.transformUrl = void 0;
/* eslint-disable no-continue */
const path = __importStar(require("path"));
const stylis_1 = require("stylis");
const POSIX_SEP = path.posix.sep;
function transformUrl(url, outputFilename, sourceFilename, platformPath = path) {
    // Replace asset path with new path relative to the output CSS
    const relative = platformPath.relative(platformPath.dirname(outputFilename), 
    // Get the absolute path to the asset from the path relative to the JS file
    platformPath.resolve(platformPath.dirname(sourceFilename), url));
    if (platformPath.sep === POSIX_SEP) {
        return relative;
    }
    return relative.split(platformPath.sep).join(POSIX_SEP);
}
exports.transformUrl = transformUrl;
const DEFINED_KEYFRAMES = Symbol('definedKeyframes');
const ORIGINAL_KEYFRAME_NAME = Symbol('originalKeyframeName');
const ORIGINAL_VALUE_KEY = Symbol('originalValue');
const IS_GLOBAL_KEYFRAMES = Symbol('isGlobalKeyframes');
const getOriginalElementValue = (element) => {
    return element ? element[ORIGINAL_VALUE_KEY] ?? element.value : '';
};
function throwIfNotProd(key, value, type) {
    if (process.env.NODE_ENV !== 'production') {
        throw new Error(`"element.${key}" has type "${type}" (${JSON.stringify(value, null, 2)}), it's not expected. Please report a bug if it happens.`);
    }
    return false;
}
function childrenIsString(children) {
    return (typeof children === 'string' ||
        throwIfNotProd('children', children, 'Element[]'));
}
function propsAreStrings(props) {
    return Array.isArray(props) || throwIfNotProd('props', props, 'string');
}
function propsIsString(props) {
    return (typeof props === 'string' || throwIfNotProd('props', props, 'string[]'));
}
const isDeclaration = (element) => {
    return (element.type === stylis_1.DECLARATION &&
        propsIsString(element.props) &&
        childrenIsString(element.children));
};
const isKeyframes = (element) => {
    return element.type === stylis_1.KEYFRAMES && propsAreStrings(element.props);
};
const isRuleset = (element) => {
    return element.type === stylis_1.RULESET && propsAreStrings(element.props);
};
/**
 * Stylis plugin that mimics :global() selector behavior from Stylis v3.
 */
const stylisGlobalPlugin = (element) => {
    function getGlobalSelectorModifiers(el) {
        const { parent } = el;
        const value = getOriginalElementValue(el);
        const parentValue = getOriginalElementValue(parent);
        if ((parent?.children.length === 0 && parentValue.includes(':global(')) ||
            (parent && !value.includes(':global('))) {
            return getGlobalSelectorModifiers(parent);
        }
        const match = value.match(/(&\f( )?)?:global\(/);
        if (match === null) {
            throw new Error(`Failed to match :global() selector in "${value}". Please report a bug if it happens.`);
        }
        const [, baseSelector, spaceDelimiter] = match;
        return {
            includeBaseSelector: !!baseSelector,
            includeSpaceDelimiter: !!spaceDelimiter,
        };
    }
    if (!isRuleset(element)) {
        return;
    }
    Object.assign(element, {
        props: element.props.map((cssSelector) => {
            // The value can be changed by other middlewares, but we need an original one with `&`
            Object.assign(element, { [ORIGINAL_VALUE_KEY]: element.value });
            // Avoids calling tokenize() on every string
            if (!cssSelector.includes(':global(')) {
                return cssSelector;
            }
            if (element.children.length === 0) {
                return cssSelector;
            }
            const { includeBaseSelector, includeSpaceDelimiter } = getGlobalSelectorModifiers(element);
            const tokens = (0, stylis_1.tokenize)(cssSelector);
            let selector = '';
            for (let i = 0, len = tokens.length; i < len; i++) {
                const token = tokens[i];
                //
                // Match for ":global("
                if (token === ':' && tokens[i + 1] === 'global') {
                    //
                    // Match for ":global()"
                    if (tokens[i + 2] === '()') {
                        selector = [
                            ...tokens.slice(i + 4),
                            includeSpaceDelimiter ? ' ' : '',
                            ...(includeBaseSelector ? tokens.slice(0, i - 1) : []),
                            includeSpaceDelimiter ? '' : ' ',
                        ].join('');
                        break;
                    }
                    //
                    // Match for ":global(selector)"
                    selector = [
                        tokens[i + 2].slice(1, -1),
                        includeSpaceDelimiter ? ' ' : '',
                        ...(includeBaseSelector ? tokens.slice(0, i - 1) : []),
                        includeSpaceDelimiter ? '' : ' ',
                    ].join('');
                    break;
                }
            }
            return selector;
        }),
    });
};
exports.stylisGlobalPlugin = stylisGlobalPlugin;
function createStylisUrlReplacePlugin(filename, outputFilename) {
    return (element) => {
        if (element.type === 'decl' && outputFilename) {
            // When writing to a file, we need to adjust the relative paths inside url(..) expressions.
            // It'll allow css-loader to resolve an imported asset properly.
            // eslint-disable-next-line no-param-reassign
            element.return = element.value.replace(/\b(url\((["']?))(\.[^)]+?)(\2\))/g, (_match, p1, _p2, p3, p4) => p1 + transformUrl(p3, outputFilename, filename) + p4);
        }
    };
}
exports.createStylisUrlReplacePlugin = createStylisUrlReplacePlugin;
function createKeyframeSuffixerPlugin() {
    const prefixes = ['webkit', 'moz', 'ms', 'o', ''].map((i) => i ? `-${i}-` : '');
    const getPrefixedProp = (prop) => prefixes.map((prefix) => `${prefix}${prop}`);
    const buildPropsRegexp = (prop, isAtRule) => {
        const [at, colon] = isAtRule ? ['@', ''] : ['', ':'];
        return new RegExp(`^(${at}(?:${getPrefixedProp(prop).join('|')})${colon})\\s*`);
    };
    const animationNameRegexp = /:global\(([\w_-]+)\)|([\w_-]+)/;
    const getReplacer = (startsWith, searchValue, replacer) => {
        return (input) => {
            const [fullMatch] = input.match(startsWith) ?? [];
            if (fullMatch === undefined) {
                return input;
            }
            const rest = input.slice(fullMatch.length);
            return fullMatch + rest.replace(searchValue, replacer);
        };
    };
    const elementToKeyframeSuffix = (el) => {
        if (el.parent) {
            return elementToKeyframeSuffix(el.parent);
        }
        return el.value.replaceAll(/[^a-zA-Z0-9_-]/g, '');
    };
    const animationPropsSet = new Set([
        ...getPrefixedProp('animation'),
        ...getPrefixedProp('animation-name'),
    ]);
    const getDefinedKeyframes = (element) => {
        if (element[DEFINED_KEYFRAMES]) {
            return element[DEFINED_KEYFRAMES];
        }
        if (element.parent) {
            return getDefinedKeyframes(element.parent);
        }
        const keyframes = new Set();
        for (const sibling of element.siblings ?? []) {
            if (sibling[ORIGINAL_KEYFRAME_NAME]) {
                keyframes.add(sibling[ORIGINAL_KEYFRAME_NAME]);
                continue;
            }
            const name = sibling.props[0];
            if (!isKeyframes(sibling) ||
                sibling[IS_GLOBAL_KEYFRAMES] === true ||
                name?.startsWith(':global(')) {
                continue;
            }
            keyframes.add(sibling.props[0]);
        }
        Object.assign(element, { [DEFINED_KEYFRAMES]: keyframes });
        return keyframes;
    };
    return (element) => {
        if (isKeyframes(element) && element.parent) {
            const suffix = elementToKeyframeSuffix(element);
            const replaceFn = (_match, globalMatch, scopedMatch) => globalMatch || `${scopedMatch}-${suffix}`;
            const originalName = element.props[0];
            const isGlobal = originalName?.startsWith(':global(') ?? false;
            Object.assign(element, {
                [ORIGINAL_KEYFRAME_NAME]: isGlobal ? undefined : originalName,
                [IS_GLOBAL_KEYFRAMES]: isGlobal,
                props: element.props.map(getReplacer(/^\s*/, animationNameRegexp, replaceFn)),
                value: getReplacer(buildPropsRegexp('keyframes', true), animationNameRegexp, replaceFn)(element.value),
            });
            return;
        }
        if (isDeclaration(element)) {
            const suffix = elementToKeyframeSuffix(element);
            const keys = [
                'children',
                'return',
                'value',
            ];
            if (animationPropsSet.has(element.props)) {
                const scopedKeyframes = getDefinedKeyframes(element);
                const patch = Object.fromEntries(keys.map((key) => {
                    const tokens = (0, stylis_1.tokenize)(element[key]);
                    let result = '';
                    for (let i = 0; i < tokens.length; i += 1) {
                        if (tokens[i] === ':' &&
                            tokens[i + 1] === 'global' &&
                            tokens[i + 2].startsWith('(')) {
                            const globalName = tokens[i + 2].substring(1, tokens[i + 2].length - 1);
                            i += 2;
                            result += globalName;
                            if (tokens[i + 1] !== ';') {
                                result += ' ';
                            }
                            continue;
                        }
                        if (scopedKeyframes.has(tokens[i])) {
                            result += `${tokens[i]}-${suffix}`;
                            continue;
                        }
                        result += tokens[i];
                    }
                    return [key, result];
                }));
                Object.assign(element, patch);
            }
        }
    };
}
exports.createKeyframeSuffixerPlugin = createKeyframeSuffixerPlugin;
const isMiddleware = (obj) => obj !== null;
function createStylisPreprocessor(options) {
    function stylisPreprocess(selector, text) {
        const compiled = (0, stylis_1.compile)(`${selector} {${text}}\n`);
        return (0, stylis_1.serialize)(compiled, (0, stylis_1.middleware)([
            createStylisUrlReplacePlugin(options.filename, options.outputFilename),
            exports.stylisGlobalPlugin,
            options.prefixer === false ? null : stylis_1.prefixer,
            createKeyframeSuffixerPlugin(),
            stylis_1.stringify,
        ].filter(isMiddleware)));
    }
    return stylisPreprocess;
}
exports.createStylisPreprocessor = createStylisPreprocessor;
