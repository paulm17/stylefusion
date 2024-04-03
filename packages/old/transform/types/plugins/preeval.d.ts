/**
 * This file is a babel preset used to transform files inside evaluators.
 * It works the same as main `babel/extract` preset, but do not evaluate lazy dependencies.
 */
import type { PluginObj } from '@babel/core';
import type { StrictOptions } from '@wyw-in-js/shared';
import type { Core } from '../babel';
import type { IPluginState } from '../types';
import { EventEmitter } from '../utils/EventEmitter';
export type PreevalOptions = Pick<StrictOptions, 'classNameSlug' | 'displayName' | 'evaluate' | 'features' | 'tagResolver'> & {
    eventEmitter?: EventEmitter;
};
export declare function preeval(babel: Core, options: PreevalOptions): PluginObj<IPluginState & {
    onFinish: () => void;
}>;
export default preeval;
