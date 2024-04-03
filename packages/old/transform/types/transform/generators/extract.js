"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.extract = void 0;
const source_map_1 = require("source-map");
const createStylisPreprocessor_1 = require("./createStylisPreprocessor");
function extractCssFromAst(rules, originalCode, options) {
    console.log("transform - extractCssFromAst");
    const mappings = [];
    let cssText = '';
    let preprocessor;
    if (typeof options.preprocessor === 'function') {
        // eslint-disable-next-line prefer-destructuring
        preprocessor = options.preprocessor;
    }
    else {
        switch (options.preprocessor) {
            case 'none':
                preprocessor = (selector, text) => `${selector} {${text}}\n`;
                break;
            case 'stylis':
            default:
                preprocessor = (0, createStylisPreprocessor_1.createStylisPreprocessor)(options);
        }
    }
    Object.keys(rules).forEach((selector, index) => {
        mappings.push({
            generated: {
                line: index + 1,
                column: 0,
            },
            original: rules[selector].start,
            name: selector,
            source: '',
        });
        if (rules[selector].atom) {
            // For atoms, we just directly insert cssText, to give the atomizer full control over the rules
            cssText += `${rules[selector].cssText}\n`;
        }
        else {
            // Run each rule through stylis to support nesting
            cssText += `${preprocessor(selector, rules[selector].cssText)}\n`;
        }
    });
    return {
        cssText,
        rules,
        get cssSourceMapText() {
            if (mappings?.length) {
                const generator = new source_map_1.SourceMapGenerator({
                    file: options.filename.replace(/\.js$/, '.css'),
                });
                mappings.forEach((mapping) => generator.addMapping({ ...mapping, source: options.filename }));
                generator.setSourceContent(options.filename, originalCode);
                return generator.toString();
            }
            return '';
        },
    };
}
/**
 * Extract artifacts (e.g. CSS) from processors
 */
// eslint-disable-next-line require-yield
function* extract() {
    console.log("transform - extract");
    const { options } = this.services;
    const { entrypoint } = this;
    const { processors } = this.data;
    const { loadedAndParsed } = entrypoint;
    if (loadedAndParsed.evaluator === 'ignored') {
        throw new Error('entrypoint was ignored');
    }
    let allRules = {};
    const allReplacements = [];
    processors.forEach((processor) => {
        processor.artifacts.forEach((artifact) => {
            if (artifact[0] !== 'css')
                return;
            const [rules, replacements] = artifact[1];
            allRules = {
                ...allRules,
                ...rules,
            };
            allReplacements.push(...replacements);
        });
    });
    return {
        ...extractCssFromAst(allRules, loadedAndParsed.code, options),
        replacements: allReplacements,
    };
}
exports.extract = extract;
