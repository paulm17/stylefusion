/**
 * Collector traverses the AST and collects information about imports and
 * all usages of WYW-processors.
 */
import type { BabelFile, PluginObj } from '@babel/core';
import type { ValueCache } from '@wyw-in-js/processor-utils';
import type { StrictOptions } from '@wyw-in-js/shared';
import { EventEmitter } from '../utils/EventEmitter';
import type { Core } from '../babel';
import type { IPluginState } from '../types';
export declare const filename: string;
export declare function collector(file: BabelFile, options: Pick<StrictOptions, 'classNameSlug' | 'displayName' | 'evaluate' | 'tagResolver'> & {
    eventEmitter?: EventEmitter;
}, values: ValueCache): {
    artifacts: import("@wyw-in-js/shared").Artifact[];
}[];
export default function collectorPlugin(babel: Core, options: StrictOptions & {
    eventEmitter?: EventEmitter;
    values?: ValueCache;
}): PluginObj<IPluginState>;
