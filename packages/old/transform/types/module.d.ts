/**
 * This is a custom implementation for the module system for evaluating code,
 * used for resolving values for dependencies interpolated in `css` or `styled`.
 *
 * This serves 2 purposes:
 * - Avoid leakage from evaluated code to module cache in current context, e.g. `babel-register`
 * - Allow us to invalidate the module cache without affecting other stuff, necessary for rebuilds
 *
 * We also use it to transpile the code with Babel by default.
 * We also store source maps for it to provide correct error stacktraces.
 *
 */
/// <reference types="node" resolution-mode="require"/>
/// <reference types="debug" />
import NativeModule from 'module';
import type { Debugger } from '@wyw-in-js/shared';
import './utils/dispose-polyfill';
import { Entrypoint } from './transform/Entrypoint';
import type { IEntrypointDependency } from './transform/Entrypoint.types';
import type { IEvaluatedEntrypoint } from './transform/EvaluatedEntrypoint';
import type { Services } from './transform/types';
type HiddenModuleMembers = {
    _extensions: Record<string, () => void>;
    _resolveFilename: (id: string, options: {
        filename: string;
        id: string;
        paths: string[];
    }) => string;
    _nodeModulePaths(filename: string): string[];
};
export declare const DefaultModuleImplementation: typeof NativeModule & HiddenModuleMembers;
export declare class Module {
    #private;
    private services;
    private moduleImpl;
    readonly callstack: string[];
    readonly debug: Debugger;
    readonly dependencies: string[];
    readonly extensions: string[];
    readonly filename: string;
    id: string;
    readonly idx: string;
    readonly ignored: boolean;
    isEvaluated: boolean;
    readonly parentIsIgnored: boolean;
    require: {
        (id: string): unknown;
        ensure: () => void;
        resolve: (id: string) => string;
    };
    resolve: (id: string) => string;
    private cache;
    constructor(services: Services, entrypoint: Entrypoint, parentModule?: Module, moduleImpl?: HiddenModuleMembers);
    get exports(): Record<string | symbol, unknown>;
    set exports(value: Record<string | symbol, unknown>);
    protected get entrypoint(): Entrypoint;
    evaluate(): void;
    getEntrypoint(filename: string, only: string[], log: Debugger): Entrypoint | IEvaluatedEntrypoint | null;
    resolveDependency: (id: string) => IEntrypointDependency;
    protected createChild(entrypoint: Entrypoint): Module;
}
export {};
