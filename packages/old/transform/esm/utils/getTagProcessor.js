import { readFileSync } from 'fs';
import { basename, dirname, join } from 'path';
import { types as t } from '@babel/core';
import { addDefault, addNamed } from '@babel/helper-module-imports';
import { BaseProcessor } from '@wyw-in-js/processor-utils';
import { findPackageJSON } from '@wyw-in-js/shared';
import { collectExportsAndImports, explicitImport } from './collectExportsAndImports';
import { collectTemplateDependencies, extractExpression } from './collectTemplateDependencies';
import { getSource } from './getSource';
import { isNotNull } from './isNotNull';
import { mutate } from './scopeHelpers';
import { getTraversalCache } from './traversalCache';
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
  console.log("getTagProcessor - getDefinedTagsFromPackage");
  if (definedTagsCache.has(pkgName)) {
    return definedTagsCache.get(pkgName);
  }
  const packageJSONPath = findPackageJSON(pkgName, filename);
  if (!packageJSONPath) {
    return undefined;
  }
  const packageDir = dirname(packageJSONPath);
  const packageJSON = JSON.parse(readFileSync(packageJSONPath, 'utf8'));
  const definedTags = packageJSON['wyw-in-js']?.tags;
  const normalizedTags = definedTags ? Object.entries(definedTags).reduce((acc, [key, value]) => ({
    ...acc,
    [key]: value.startsWith('.') ? join(packageDir, value) : require.resolve(value, {
      paths: [packageDir]
    })
  }), {}) : undefined;
  definedTagsCache.set(pkgName, normalizedTags);
  return normalizedTags;
};
function isValidProcessorClass(module) {
  console.log("getTagProcessor - isValidProcessorClass");
  return module instanceof BaseProcessor.constructor;
}
function getProcessorFromPackage(packageName, tagName, filename) {
  console.log("getTagProcessor - getProcessorFromPackage");
  const definedTags = getDefinedTagsFromPackage(packageName, filename);
  const processorPath = definedTags?.[tagName];
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
export function getProcessorForImport({
  imported,
  source
}, filename, options) {
  console.log("getTagProcessor - getProcessorForImport");
  const tagResolver = options.tagResolver ?? (() => null);
  const customFile = tagResolver(source, imported);
  const processor = customFile ? getProcessorFromFile(customFile) : getProcessorFromPackage(source, imported, filename);
  return [processor, {
    imported,
    source
  }];
}
function getBuilderForIdentifier(definedProcessor, path, imports, options) {
  console.log("getTagProcessor - getBuilderForIdentifier");
  const [Processor, tagSource] = definedProcessor;
  let tagPath = path;
  if (tagPath.parentPath?.isMemberExpression({
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
    if (current?.isSequenceExpression() && last(current.node.expressions) === prev.node) {
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (current?.isCallExpression({
      callee: prev.node
    })) {
      const args = current.get('arguments');
      const cookedArgs = args.map(arg => {
        const buildError = arg.buildCodeFrameError.bind(arg);
        if (!arg.isExpression()) {
          throw buildError(`Unexpected type of an argument ${arg.type}`);
        }
        const source = getSource(arg);
        const extracted = extractExpression(arg, options.evaluate, imports);
        return {
          ...extracted,
          source,
          buildCodeFrameError: buildError
        };
      }).filter(isNotNull);
      params.push(['call', ...cookedArgs]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    if (current?.isMemberExpression({
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
    if (current?.isTaggedTemplateExpression({
      tag: prev.node
    })) {
      const [quasis, expressionValues] = collectTemplateDependencies(current, options.evaluate);
      params.push(['template', zip(quasis, expressionValues)]);
      prev = current;
      current = current.parentPath;
      // eslint-disable-next-line no-continue
      continue;
    }
    break;
  }
  const replacer = (replacement, isPure) => {
    mutate(prev, p => {
      p.replaceWith(replacement);
      if (isPure) {
        p.addComment('leading', '#__PURE__');
      }
    });
  };
  const importHelpers = {
    addDefaultImport: (importedSource, nameHint) => addDefault(path, importedSource, {
      nameHint
    }),
    addNamedImport: (name, importedSource, nameHint = name) => addNamed(path, name, importedSource, {
      nameHint
    })
  };
  const astService = new Proxy(t, {
    get(target, prop, receiver) {
      if (prop in importHelpers) {
        return importHelpers[prop];
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  return (...args) => new Processor(params, tagSource, astService, tagPath.node.loc ?? null, replacer, ...args);
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
        displayName = getSource(keyPath);
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
    displayName = basename(filename ?? 'unknown');
    if (filename && /^index\.[a-z\d]+$/.test(displayName)) {
      // If the file name is 'index', better to get name from parent folder
      displayName = basename(dirname(filename));
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
  const counter = counters.get(state) ?? 0;
  counters.set(state, counter + 1);
  return counter;
};
export function getDefinedProcessors(imports, path, filename, options) {
  console.log("getTagProcessor - getDefinedProcessors");
  const cache = getTraversalCache(path, 'getDefinedProcessors');
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
  console.log("getTagProcessor - createProcessorInstance");
  const cache = getTraversalCache(path, 'createProcessorInstance');
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
      if (e === BaseProcessor.SKIP) {
        cache.set(path.node, null);
        return null;
      }
      if (e instanceof Error) {
        throw buildCodeFrameError(path, e.message);
      }
      throw e;
    }
  }
  return cache.get(path.node) ?? null;
}
export function applyProcessors(path, fileContext, options, callback) {
  console.log("getTagProcessor - applyProcessors");
  const imports = collectExportsAndImports(path).imports.filter(explicitImport);
  const definedProcessors = getDefinedProcessors(imports, path, fileContext.filename, options);
  const usages = [];
  definedProcessors.forEach((processor, idName) => {
    if (idName.includes('.')) {
      // It's a member expression
      const [object, property] = idName.split('.');
      const objBinding = path.scope.getBinding(object);
      if (!objBinding) {
        return;
      }
      objBinding.referencePaths.forEach(p => {
        const parent = p.parentPath;
        if (!parent?.isMemberExpression()) {
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
    path.scope.getBinding(idName)?.referencePaths.forEach(identifier => {
      if (identifier.isIdentifier()) {
        usages.push({
          identifier,
          processor
        });
      }
    });
  });

  // The same order, the same slugs
  usages.sort((a, b) => (a.identifier.node.start ?? 0) - (b.identifier.node.start ?? 0));
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