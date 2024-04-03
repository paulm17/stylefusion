/**
 * This file handles transforming template literals to class names or styled components and generates CSS content.
 * It uses CSS code from template literals and evaluated values of lazy dependencies stored in ValueCache.
 */
import type { TemplateElement } from '@babel/types';
import type { ExpressionValue, Replacements } from '@wyw-in-js/shared';
import type { TaggedTemplateProcessor } from '../TaggedTemplateProcessor';
import type { ValueCache, Rules } from '../types';
import type { IOptions } from './types';
export default function templateProcessor(tagProcessor: TaggedTemplateProcessor, [...template]: (TemplateElement | ExpressionValue)[], valueCache: ValueCache, variableNameConfig: IOptions['variableNameConfig'] | undefined): [rules: Rules, sourceMapReplacements: Replacements] | null;
