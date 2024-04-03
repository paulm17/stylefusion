"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const shared_1 = require("@wyw-in-js/shared");
const buildSlug_1 = require("./buildSlug");
const toValidCSSIdentifier_1 = require("./toValidCSSIdentifier");
function getClassNameAndSlug(displayName, idx, options, context) {
    console.log("getClassNameAndSlug.ts - getClassNameAndSlug");
    const relativeFilename = (context.root && context.filename
        ? (0, path_1.relative)(context.root, context.filename)
        : context.filename ?? 'unknown').replace(/\\/g, path_1.posix.sep);
    // Custom properties need to start with a letter, so we prefix the slug
    // Also use append the index of the class to the filename for uniqueness in the file
    const slug = (0, toValidCSSIdentifier_1.toValidCSSIdentifier)(`${displayName.charAt(0).toLowerCase()}${(0, shared_1.slugify)(`${relativeFilename}:${idx}`)}`);
    // Collect some useful replacement patterns from the filename
    // Available variables for the square brackets used in `classNameSlug` options
    const ext = (0, path_1.extname)(relativeFilename);
    const slugVars = {
        hash: slug,
        title: displayName,
        index: idx,
        file: relativeFilename,
        ext,
        name: (0, path_1.basename)(relativeFilename, ext),
        dir: (0, path_1.dirname)(relativeFilename).split(path_1.sep).pop(),
    };
    let className = options.displayName
        ? `${(0, toValidCSSIdentifier_1.toValidCSSIdentifier)(displayName)}_${slug}`
        : slug;
    // The className can be defined by the user either as fn or a string
    if (typeof options.classNameSlug === 'function') {
        try {
            className = (0, toValidCSSIdentifier_1.toValidCSSIdentifier)(options.classNameSlug(slug, displayName, slugVars));
        }
        catch {
            throw new Error('classNameSlug option must return a string');
        }
    }
    if (typeof options.classNameSlug === 'string') {
        className = (0, toValidCSSIdentifier_1.toValidCSSIdentifier)((0, buildSlug_1.buildSlug)(options.classNameSlug, slugVars));
    }
    shared_1.logger.extend('template-parse:generated-meta')(`slug: ${slug}, displayName: ${displayName}, className: ${className}`);
    return { className, slug };
}
exports.default = getClassNameAndSlug;
