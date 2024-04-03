"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.applyProcessors = applyProcessors;
exports.getDefinedProcessors = getDefinedProcessors;
exports.getProcessorForImport = getProcessorForImport;
var _fs = require("fs");
var _path = require("path");
var _core = require("@babel/core");
var _helperModuleImports = require("@babel/helper-module-imports");
var _processorUtils = require("@wyw-in-js/processor-utils");
var _shared = require("@wyw-in-js/shared");
var _collectExportsAndImports = require("./collectExportsAndImports");
var _collectTemplateDependencies = require("./collectTemplateDependencies");
var _getSource = require("./getSource");
var _isNotNull = require("./isNotNull");
var _scopeHelpers = require("./scopeHelpers");
var _traversalCache = require("./traversalCache");
const last = arr => arr[arr.length - 1];
function zip(arr1, arr2) {
  const result = [];
  for (let i = 0; i < arr1.length; i++) {
    result.push(arr1[i]);
    if (arr2[i]) result.push(arr2[i]);
  }
  return result;
}
function buildCodeFrameError(path, message) {
  console.log("getTagProcessor - buildCodeFrameError");
  try {
    return path.buildCodeFrameError(message);
  } catch {
    return new Error(message);
  }
}
const definedTagsCache = new Map();
const getDefinedTagsFromPackage = (pkgName, filename) => {
  var _packageJSON$wywInJ;
  console.log("getTagProcessor - getDefinedTagsFromPackage");
  if (definedTagsCache.has(pkgName)) {
    return definedTagsCache.get(pkgName);
  }
  const packageJSONPath = (0, _shared.findPackageJSON)(pkgName, filename);
  if (!packageJSONPath) {
    return undefined;
  }
  const packageDir = (0, _path.dirname)(packageJSONPath);
  const packageJSON = JSON.parse((0, _fs.readFileSync)(packageJSONPath, 'utf8'));
  const definedTags = (_packageJSON$wywInJ = packageJSON['wyw-in-js']) === null || _packageJSON$wywInJ === void 0 ? void 0 : _packageJSON$wywInJ.tags;
  const normalizedTags = definedTags ? Object.entries(definedTags).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value.startsWith('.') ? (0, _path.join)(packageDir, value) : require.resolve(value, {
      paths: [packageDir]
    })
  }), {}) : undefined;
  definedTagsCache.set(pkgName, normalizedTags);
  return normalizedTags;
};
function isValidProcessorClass(module) {
  console.log("getTagProcessor - isValidProcessorClass");
  return module instanceof _processorUtils.BaseProcessor.constructor;
}
function getProcessorFromPackage(packageName, tagName, filename) {
  console.log("getTagProcessor - getProcessorFromPackage");
  const definedTags = getDefinedTagsFromPackage(packageName, filename);
  const processorPath = definedTags === null || definedTags === void 0 ? void 0 : definedTags[tagName];
  if (!processorPath) {
    return null;
  }
  const Processor = require(processorPath).default;
  if (!isValidProcessorClass(Processor)) {
    return null;
  }
  return Processor;
}
function getProcessorFromFile(processorPath) {
  console.log("getTagProcessor - getProcessorFromFile");
  const Processor = require(processorPath).default;
  if (!isValidProcessorClass(Processor)) {
    return null;
  }
  return Processor;
}
function getProcessorForImport({
  imported,
  source
}, filename, options) {
  var _options$tagResolver;
  console.log("getTagProcessor - getProcessorForImport");
  const tagResolver = (_options$tagResolver = options.tagResolver) !== null && _options$tagResolver !== void 0 ? _options$tagResolver : () => null;
  const customFile = tagResolver(source, imported);
  const processor = customFile ? getProcessorFromFile(customFile) : getProcessorFromPackage(source, imported, filename);
  return [processor, {
    imported,
    source
  }];
}
function getBuilderForIdentifier(definedProcessor, path, imports, options) {
  var _tagPath$parentPath;
  console.log("getTagProcessor - getBuilderForIdentifier");
  const [Processor, tagSource] = definedProcessor;
  let tagPath = path;
  if ((_tagPath$parentPath = tagPath.parentPath) !== null && _tagPath$parentPath !== void 0 && _tagPath$parentPath.isMemberExpression({
    property: tagPath.node
  })) {
    tagPath = tagPath.parentPath;
  }
  if (!Processor || !tagSource || !tagPath) {
    return null;
  }
  const params = [['callee', tagPath.node]];
  let prev = tagPath;
  let current = tagPath.parentPath;
  while (current && current !== path) {
    var _current, _current2, _current3, _current4;
    if ((_current = current) !== null && _current !== void 0 && _current.isSequenceExpression() && last(current.node.expressions) === prev.node) {
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    if ((_current2 = current) !== null && _current2 !== void 0 && _current2.isCallExpression({
      callee: prev.node
    })) {
      const args = current.get('arguments');
      const cookedArgs = args.map(arg => {
        const buildError = arg.buildCodeFrameError.bind(arg);
        if (!arg.isExpression()) {
          throw buildError(`Unexpected type of an argument ${arg.type}`);
        }
        const source = (0, _getSource.getSource)(arg);
        const extracted = (0, _collectTemplateDependencies.extractExpression)(arg, options.evaluate, imports);
        return {
          ...extracted,
          source,
          buildCodeFrameError: buildError
        };
      }).filter(_isNotNull.isNotNull);
      params.push(['call', ...cookedArgs]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    if ((_current3 = current) !== null && _current3 !== void 0 && _current3.isMemberExpression({
      object: prev.node
    })) {
      const property = current.get('property');
      if (property.isIdentifier() && !current.node.computed) {
        params.push(['member', property.node.name]);
      } else if (property.isStringLiteral()) {
        params.push(['member', property.node.value]);
      } else {
        throw property.buildCodeFrameError(`Unexpected type of a property`);
      }
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    if ((_current4 = current) !== null && _current4 !== void 0 && _current4.isTaggedTemplateExpression({
      tag: prev.node
    })) {
      const [quasis, expressionValues] = (0, _collectTemplateDependencies.collectTemplateDependencies)(current, options.evaluate);
      params.push(['template', zip(quasis, expressionValues)]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    break;
  }
  const replacer = (replacement, isPure) => {
    (0, _scopeHelpers.mutate)(prev, p => {
      p.replaceWith(replacement);
      if (isPure) {
        p.addComment('leading', '#__PURE__');
      }
    });
  };
  const importHelpers = {
    addDefaultImport: (importedSource, nameHint) => (0, _helperModuleImports.addDefault)(path, importedSource, {
      nameHint
    }),
    addNamedImport: (name, importedSource, nameHint = name) => (0, _helperModuleImports.addNamed)(path, name, importedSource, {
      nameHint
    })
  };
  const astService = new Proxy(_core.types, {
    get(target, prop, receiver) {
      if (prop in importHelpers) {
        return importHelpers[prop];
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  return (...args) => {
    var _tagPath$node$loc;
    return new Processor(params, tagSource, astService, (_tagPath$node$loc = tagPath.node.loc) !== null && _tagPath$node$loc !== void 0 ? _tagPath$node$loc : null, replacer, ...args);
  };
}
function getDisplayName(path, idx, filename) {
  console.log("getTagProcessor - getDisplayName");
  let displayName;
  const parent = path.findParent(p => p.isObjectProperty() || p.isJSXOpeningElement() || p.isVariableDeclarator());
  if (parent) {
    if (parent.isObjectProperty()) {
      if ('name' in parent.node.key) {
        displayName = parent.node.key.name;
      } else if ('value' in parent.node.key) {
        displayName = parent.node.key.value.toString();
      } else {
        const keyPath = parent.get('key');
        displayName = (0, _getSource.getSource)(keyPath);
      }
    } else if (parent.isJSXOpeningElement()) {
      const name = parent.get('name');
      if (name.isJSXIdentifier()) {
        displayName = name.node.name;
      }
    } else if (parent.isVariableDeclarator()) {
      const id = parent.get('id');
      if (id.isIdentifier()) {
        displayName = id.node.name;
      }
    }
  }
  if (!displayName) {
    // Try to derive the path from the filename
    displayName = (0, _path.basename)(filename !== null && filename !== void 0 ? filename : 'unknown');
    if (filename && /^index\.[a-z\d]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = (0, _path.basename)((0, _path.dirname)(filename));
    }

    // Remove the file extension
    displayName = displayName.replace(/\.[a-z\d]+$/, '');
    if (displayName) {
      displayName += idx;
    } else {
      throw new Error("Couldn't determine a name for the component. Ensure that it's either:\n" + '- Assigned to a variable\n' + '- Is an object property\n' + '- Is a prop in a JSX element\n');
    }
  }
  return displayName;
}
function isTagReferenced(path) {
  console.log("getTagProcessor - isTagReferenced");
  // Check if the variable is referenced anywhere for basic DCE
  // Only works when it's assigned to a variable
  let isReferenced = true;
  const parent = path.findParent(p => p.isObjectProperty() || p.isJSXOpeningElement() || p.isVariableDeclarator());
  if (parent) {
    if (parent.isVariableDeclarator()) {
      const id = parent.get('id');
      // FIXME: replace with id.isReferencedIdentifier()
      if (id.isIdentifier()) {
        const {
          referencePaths
        } = path.scope.getBinding(id.node.name) || {
          referencePaths: []
        };
        isReferenced = referencePaths.length !== 0;
      }
    }
  }
  return isReferenced;
}
const counters = new WeakMap();
const getNextIndex = state => {
  var _counters$get;
  const counter = (_counters$get = counters.get(state)) !== null && _counters$get !== void 0 ? _counters$get : 0;
  counters.set(state, counter + 1);
  return counter;
};
function getDefinedProcessors(imports, path, filename, options) {
  console.log("getTagProcessor - getDefinedProcessors");
  const cache = (0, _traversalCache.getTraversalCache)(path, 'getDefinedProcessors');
  if (!cache.has(path)) {
    const defined = new Map();
    imports.forEach(i => {
      const [processor, tagSource] = getProcessorForImport(i, filename, options);
      const {
        local
      } = i;
      if (!processor) {
        return;
      }
      let name = null;
      if (local.isIdentifier()) {
        name = local.node.name;
      }
      if (name === null && local.isMemberExpression()) {
        const property = local.get('property');
        const object = local.get('object');
        if (property.isIdentifier() && object.isIdentifier()) {
          name = `${object.node.name}.${property.node.name}`;
        }
      }
      if (name === null) {
        return;
      }
      defined.set(name, [processor, tagSource]);
    });
    cache.set(path, defined);
  }
  return cache.get(path);
}
function createProcessorInstance(definedProcessor, imports, path, fileContext, options) {
  var _cache$get;
  console.log("getTagProcessor - createProcessorInstance");
  const cache = (0, _traversalCache.getTraversalCache)(path, 'createProcessorInstance');
  if (!cache.has(path.node)) {
    try {
      const builder = getBuilderForIdentifier(definedProcessor, path, imports, options);
      if (builder) {
        // Increment the index of the style we're processing
        // This is used for slug generation to prevent collision
        // Also used for display name if it couldn't be determined
        const idx = getNextIndex(fileContext);
        const displayName = getDisplayName(path, idx, fileContext.filename);
        const processor = builder(displayName, isTagReferenced(path), idx, options, fileContext);
        cache.set(path.node, processor);
      } else {
        cache.set(path.node, null);
      }
    } catch (e) {
      if (e === _processorUtils.BaseProcessor.SKIP) {
        cache.set(path.node, null);
        return null;
      }
      if (e instanceof Error) {
        throw buildCodeFrameError(path, e.message);
      }
      throw e;
    }
  }
  return (_cache$get = cache.get(path.node)) !== null && _cache$get !== void 0 ? _cache$get : null;
}
function applyProcessors(path, fileContext, options, callback) {
  console.log("getTagProcessor - applyProcessors");
  const imports = (0, _collectExportsAndImports.collectExportsAndImports)(path).imports.filter(_collectExportsAndImports.explicitImport);
  const definedProcessors = getDefinedProcessors(imports, path, fileContext.filename, options);
  const usages = [];
  definedProcessors.forEach((processor, idName) => {
    var _path$scope$getBindin;
    if (idName.includes('.')) {
      // It's a member expression
      const [object, property] = idName.split('.');
      const objBinding = path.scope.getBinding(object);
      if (!objBinding) {
        return;
      }
      objBinding.referencePaths.forEach(p => {
        const parent = p.parentPath;
        if (!(parent !== null && parent !== void 0 && parent.isMemberExpression())) {
          return;
        }
        const identifier = parent.get('property');
        if (identifier.isIdentifier({
          name: property
        })) {
          usages.push({
            identifier,
            processor
          });
        }
      });
      return;
    }
    (_path$scope$getBindin = path.scope.getBinding(idName)) === null || _path$scope$getBindin === void 0 || _path$scope$getBindin.referencePaths.forEach(identifier => {
      if (identifier.isIdentifier()) {
        usages.push({
          identifier,
          processor
        });
      }
    });
  });

  // The same order, the same slugs
  usages.sort((a, b) => {
    var _a$identifier$node$st, _b$identifier$node$st;
    return ((_a$identifier$node$st = a.identifier.node.start) !== null && _a$identifier$node$st !== void 0 ? _a$identifier$node$st : 0) - ((_b$identifier$node$st = b.identifier.node.start) !== null && _b$identifier$node$st !== void 0 ? _b$identifier$node$st : 0);
  });
  usages.forEach(usage => {
    const definedProcessor = usage.processor;
    if (!definedProcessor) {
      return;
    }
    const instance = createProcessorInstance(definedProcessor, imports, usage.identifier, fileContext, options);
    if (instance === null) {
      return;
    }
    callback(instance);
  });
}
//# sourceMappingURL=getTagProcessor.js.map