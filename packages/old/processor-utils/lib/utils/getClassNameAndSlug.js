"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getClassNameAndSlug;
var _path = require("path");
var _shared = require("@wyw-in-js/shared");
var _buildSlug = require("./buildSlug");
var _toValidCSSIdentifier = require("./toValidCSSIdentifier");
function getClassNameAndSlug(displayName, idx, options, context) {
  var _context$filename;
  console.log("getClassNameAndSlug.ts - getClassNameAndSlug");
  const relativeFilename = (context.root && context.filename ? (0, _path.relative)(context.root, context.filename) : (_context$filename = context.filename) !== null && _context$filename !== void 0 ? _context$filename : 'unknown').replace(/\\/g, _path.posix.sep);

  // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file
  const slug = (0, _toValidCSSIdentifier.toValidCSSIdentifier)(`${displayName.charAt(0).toLowerCase()}${(0, _shared.slugify)(`${relativeFilename}:${idx}`)}`);

  // Collect some useful replacement patterns from the filename
  // Available variables for the square brackets used in `classNameSlug` options
  const ext = (0, _path.extname)(relativeFilename);
  const slugVars = {
    hash: slug,
    title: displayName,
    index: idx,
    file: relativeFilename,
    ext,
    name: (0, _path.basename)(relativeFilename, ext),
    dir: (0, _path.dirname)(relativeFilename).split(_path.sep).pop()
  };
  let className = options.displayName ? `${(0, _toValidCSSIdentifier.toValidCSSIdentifier)(displayName)}_${slug}` : slug;

  // The className can be defined by the user either as fn or a string
  if (typeof options.classNameSlug === 'function') {
    try {
      className = (0, _toValidCSSIdentifier.toValidCSSIdentifier)(options.classNameSlug(slug, displayName, slugVars));
    } catch {
      throw new Error('classNameSlug option must return a string');
    }
  }
  if (typeof options.classNameSlug === 'string') {
    className = (0, _toValidCSSIdentifier.toValidCSSIdentifier)((0, _buildSlug.buildSlug)(options.classNameSlug, slugVars));
  }
  _shared.logger.extend('template-parse:generated-meta')(`slug: ${slug}, displayName: ${displayName}, className: ${className}`);
  return {
    className,
    slug
  };
}
//# sourceMappingURL=getClassNameAndSlug.js.map