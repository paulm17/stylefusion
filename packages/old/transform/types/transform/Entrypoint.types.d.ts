/// <reference types="debug" />
import type { TransformOptions } from '@babel/core';
import type { File } from '@babel/types';
import type { Debugger, Evaluator } from '@wyw-in-js/shared';
import type { Services } from './types';
export interface IEntrypointCode {
    readonly ast: File;
    code: string;
    evalConfig: TransformOptions;
    evaluator: Evaluator;
}
export interface IIgnoredEntrypoint {
    readonly ast?: File;
    readonly code?: string;
    evaluator: 'ignored';
    reason: 'extension' | 'rule';
}
export interface IEntrypointDependency {
    only: string[];
    resolved: string | null;
    source: string;
}
export type LoadAndParseFn = (services: Services, name: string, loadedCode: string | undefined, log: Debugger) => IEntrypointCode | IIgnoredEntrypoint;
