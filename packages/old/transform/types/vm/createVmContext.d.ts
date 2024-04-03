/// <reference types="node" resolution-mode="require"/>
import * as vm from 'vm';
import type { FeatureFlags, StrictOptions } from '@wyw-in-js/shared';
export declare function createVmContext(filename: string, features: FeatureFlags<'happyDOM'>, additionalContext: Partial<vm.Context>, overrideContext?: StrictOptions['overrideContext']): {
    context: vm.Context;
    teardown: (() => void) | (() => void);
};
