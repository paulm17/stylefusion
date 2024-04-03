"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createKeyframeSuffixerPlugin = createKeyframeSuffixerPlugin;
exports.createStylisPreprocessor = createStylisPreprocessor;
exports.createStylisUrlReplacePlugin = createStylisUrlReplacePlugin;
exports.stylisGlobalPlugin = void 0;
exports.transformUrl = transformUrl;
var path = _interopRequireWildcard(require("path"));
var _stylis = require("stylis");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && {}.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable no-continue */

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
const DEFINED_KEYFRAMES = Symbol('definedKeyframes');
const ORIGINAL_KEYFRAME_NAME = Symbol('originalKeyframeName');
const ORIGINAL_VALUE_KEY = Symbol('originalValue');
const IS_GLOBAL_KEYFRAMES = Symbol('isGlobalKeyframes');
const getOriginalElementValue = element => {
  var _element$ORIGINAL_VAL;
  return element ? (_element$ORIGINAL_VAL = element[ORIGINAL_VALUE_KEY]) !== null && _element$ORIGINAL_VAL !== void 0 ? _element$ORIGINAL_VAL : element.value : '';
};
function throwIfNotProd(key, value, type) {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(`"element.${key}" has type "${type}" (${JSON.stringify(value, null, 2)}), it's not expected. Please report a bug if it happens.`);
  }
  return false;
}
function childrenIsString(children) {
  return typeof children === 'string' || throwIfNotProd('children', children, 'Element[]');
}
function propsAreStrings(props) {
  return Array.isArray(props) || throwIfNotProd('props', props, 'string');
}
function propsIsString(props) {
  return typeof props === 'string' || throwIfNotProd('props', props, 'string[]');
}
const isDeclaration = element => {
  return element.type === _stylis.DECLARATION && propsIsString(element.props) && childrenIsString(element.children);
};
const isKeyframes = element => {
  return element.type === _stylis.KEYFRAMES && propsAreStrings(element.props);
};
const isRuleset = element => {
  return element.type === _stylis.RULESET && propsAreStrings(element.props);
};

/**
 * Stylis plugin that mimics :global() selector behavior from Stylis v3.
 */
const stylisGlobalPlugin = element => {
  function getGlobalSelectorModifiers(el) {
    const {
      parent
    } = el;
    const value = getOriginalElementValue(el);
    const parentValue = getOriginalElementValue(parent);
    if ((parent === null || parent === void 0 ? void 0 : parent.children.length) === 0 && parentValue.includes(':global(') || parent && !value.includes(':global(')) {
      return getGlobalSelectorModifiers(parent);
    }
    const match = value.match(/(&\f( )?)?:global\(/);
    if (match === null) {
      throw new Error(`Failed to match :global() selector in "${value}". Please report a bug if it happens.`);
    }
    const [, baseSelector, spaceDelimiter] = match;
    return {
      includeBaseSelector: !!baseSelector,
      includeSpaceDelimiter: !!spaceDelimiter
    };
  }
  if (!isRuleset(element)) {
    return;
  }
  Object.assign(element, {
    props: element.props.map(cssSelector => {
      // The value can be changed by other middlewares, but we need an original one with `&`
      Object.assign(element, {
        [ORIGINAL_VALUE_KEY]: element.value
      });

      // Avoids calling tokenize() on every string
      if (!cssSelector.includes(':global(')) {
        return cssSelector;
      }
      if (element.children.length === 0) {
        return cssSelector;
      }
      const {
        includeBaseSelector,
        includeSpaceDelimiter
      } = getGlobalSelectorModifiers(element);
      const tokens = (0, _stylis.tokenize)(cssSelector);
      let selector = '';
      for (let i = 0, len = tokens.length; i < len; i++) {
        const token = tokens[i];

        //
        // Match for ":global("
        if (token === ':' && tokens[i + 1] === 'global') {
          //
          // Match for ":global()"
          if (tokens[i + 2] === '()') {
            selector = [...tokens.slice(i + 4), includeSpaceDelimiter ? ' ' : '', ...(includeBaseSelector ? tokens.slice(0, i - 1) : []), includeSpaceDelimiter ? '' : ' '].join('');
            break;
          }

          //
          // Match for ":global(selector)"
          selector = [tokens[i + 2].slice(1, -1), includeSpaceDelimiter ? ' ' : '', ...(includeBaseSelector ? tokens.slice(0, i - 1) : []), includeSpaceDelimiter ? '' : ' '].join('');
          break;
        }
      }
      return selector;
    })
  });
};
exports.stylisGlobalPlugin = stylisGlobalPlugin;
function createStylisUrlReplacePlugin(filename, outputFilename) {
  return element => {
    if (element.type === 'decl' && outputFilename) {
      // When writing to a file, we need to adjust the relative paths inside url(..) expressions.
      // It'll allow css-loader to resolve an imported asset properly.
      // eslint-disable-next-line no-param-reassign
      element.return = element.value.replace(/\b(url\((["']?))(\.[^)]+?)(\2\))/g, (_match, p1, _p2, p3, p4) => p1 + transformUrl(p3, outputFilename, filename) + p4);
    }
  };
}
function createKeyframeSuffixerPlugin() {
  const prefixes = ['webkit', 'moz', 'ms', 'o', ''].map(i => i ? `-${i}-` : '');
  const getPrefixedProp = prop => prefixes.map(prefix => `${prefix}${prop}`);
  const buildPropsRegexp = (prop, isAtRule) => {
    const [at, colon] = isAtRule ? ['@', ''] : ['', ':'];
    return new RegExp(`^(${at}(?:${getPrefixedProp(prop).join('|')})${colon})\\s*`);
  };
  const animationNameRegexp = /:global\(([\w_-]+)\)|([\w_-]+)/;
  const getReplacer = (startsWith, searchValue, replacer) => {
    return input => {
      var _input$match;
      const [fullMatch] = (_input$match = input.match(startsWith)) !== null && _input$match !== void 0 ? _input$match : [];
      if (fullMatch === undefined) {
        return input;
      }
      const rest = input.slice(fullMatch.length);
      return fullMatch + rest.replace(searchValue, replacer);
    };
  };
  const elementToKeyframeSuffix = el => {
    if (el.parent) {
      return elementToKeyframeSuffix(el.parent);
    }
    return el.value.replaceAll(/[^a-zA-Z0-9_-]/g, '');
  };
  const animationPropsSet = new Set([...getPrefixedProp('animation'), ...getPrefixedProp('animation-name')]);
  const getDefinedKeyframes = element => {
    if (element[DEFINED_KEYFRAMES]) {
      return element[DEFINED_KEYFRAMES];
    }
    if (element.parent) {
      return getDefinedKeyframes(element.parent);
    }
    const keyframes = new Set();
    for (const sibling of (_element$siblings = element.siblings) !== null && _element$siblings !== void 0 ? _element$siblings : []) {
      var _element$siblings;
      if (sibling[ORIGINAL_KEYFRAME_NAME]) {
        keyframes.add(sibling[ORIGINAL_KEYFRAME_NAME]);
        continue;
      }
      const name = sibling.props[0];
      if (!isKeyframes(sibling) || sibling[IS_GLOBAL_KEYFRAMES] === true || name !== null && name !== void 0 && name.startsWith(':global(')) {
        continue;
      }
      keyframes.add(sibling.props[0]);
    }
    Object.assign(element, {
      [DEFINED_KEYFRAMES]: keyframes
    });
    return keyframes;
  };
  return element => {
    if (isKeyframes(element) && element.parent) {
      var _originalName$startsW;
      const suffix = elementToKeyframeSuffix(element);
      const replaceFn = (_match, globalMatch, scopedMatch) => globalMatch || `${scopedMatch}-${suffix}`;
      const originalName = element.props[0];
      const isGlobal = (_originalName$startsW = originalName === null || originalName === void 0 ? void 0 : originalName.startsWith(':global(')) !== null && _originalName$startsW !== void 0 ? _originalName$startsW : false;
      Object.assign(element, {
        [ORIGINAL_KEYFRAME_NAME]: isGlobal ? undefined : originalName,
        [IS_GLOBAL_KEYFRAMES]: isGlobal,
        props: element.props.map(getReplacer(/^\s*/, animationNameRegexp, replaceFn)),
        value: getReplacer(buildPropsRegexp('keyframes', true), animationNameRegexp, replaceFn)(element.value)
      });
      return;
    }
    if (isDeclaration(element)) {
      const suffix = elementToKeyframeSuffix(element);
      const keys = ['children', 'return', 'value'];
      if (animationPropsSet.has(element.props)) {
        const scopedKeyframes = getDefinedKeyframes(element);
        const patch = Object.fromEntries(keys.map(key => {
          const tokens = (0, _stylis.tokenize)(element[key]);
          let result = '';
          for (let i = 0; i < tokens.length; i += 1) {
            if (tokens[i] === ':' && tokens[i + 1] === 'global' && tokens[i + 2].startsWith('(')) {
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
const isMiddleware = obj => obj !== null;
function createStylisPreprocessor(options) {
  function stylisPreprocess(selector, text) {
    const compiled = (0, _stylis.compile)(`${selector} {${text}}\n`);
    return (0, _stylis.serialize)(compiled, (0, _stylis.middleware)([createStylisUrlReplacePlugin(options.filename, options.outputFilename), stylisGlobalPlugin, options.prefixer === false ? null : _stylis.prefixer, createKeyframeSuffixerPlugin(), _stylis.stringify].filter(isMiddleware)));
  }
  return stylisPreprocess;
}
//# sourceMappingURL=createStylisPreprocessor.js.map