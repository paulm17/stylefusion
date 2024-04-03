import { basename, dirname, extname, relative, sep, posix } from 'path';
import { logger, slugify } from '@wyw-in-js/shared';
import { buildSlug } from './buildSlug';
import { toValidCSSIdentifier } from './toValidCSSIdentifier';
export default function getClassNameAndSlug(displayName, idx, options, context) {
  console.log("getClassNameAndSlug.ts - getClassNameAndSlug");
  const relativeFilename = (context.root && context.filename ? relative(context.root, context.filename) : context.filename ?? 'unknown').replace(/\\/g, posix.sep);

  // Custom properties need to start with a letter, so we prefix the slug
  // Also use append the index of the class to the filename for uniqueness in the file
  const slug = toValidCSSIdentifier(`${displayName.charAt(0).toLowerCase()}${slugify(`${relativeFilename}:${idx}`)}`);

  // Collect some useful replacement patterns from the filename
  // Available variables for the square brackets used in `classNameSlug` options
  const ext = extname(relativeFilename);
  const slugVars = {
    hash: slug,
    title: displayName,
    index: idx,
    file: relativeFilename,
    ext,
    name: basename(relativeFilename, ext),
    dir: dirname(relativeFilename).split(sep).pop()
  };
  let className = options.displayName ? `${toValidCSSIdentifier(displayName)}_${slug}` : slug;

  // The className can be defined by the user either as fn or a string
  if (typeof options.classNameSlug === 'function') {
    try {
      className = toValidCSSIdentifier(options.classNameSlug(slug, displayName, slugVars));
    } catch {
      throw new Error('classNameSlug option must return a string');
    }
  }
  if (typeof options.classNameSlug === 'string') {
    className = toValidCSSIdentifier(buildSlug(options.classNameSlug, slugVars));
  }
  logger.extend('template-parse:generated-meta')(`slug: ${slug}, displayName: ${displayName}, className: ${className}`);
  return {
    className,
    slug
  };
}
//# sourceMappingURL=getClassNameAndSlug.js.map