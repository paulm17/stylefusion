import type { Param, Params } from '../types';
type ParamName = Param[0];
type ParamConstraint = ParamName | [...ParamName[]] | '*';
export type ParamConstraints = [...ParamConstraint[]] | [...ParamConstraint[], '...'];
type ParamMapping = {
    [K in ParamName]: Extract<Param, readonly [K, ...unknown[]]>;
};
type GetParamByName<T> = T extends '*' ? Param : T extends keyof ParamMapping ? ParamMapping[T] : T extends Array<infer TNames> ? TNames extends ParamName ? Extract<Param, readonly [TNames, ...unknown[]]> : never : never;
export type MapParams<TNames extends ParamConstraints, TRes extends Param[] = []> = TNames extends [infer THead, ...infer TTail] ? THead extends '...' ? [...TRes, ...Params] : MapParams<Extract<TTail, ParamConstraints>, // Extract the remaining ParamConstraints.
[
    ...TRes,
    GetParamByName<Extract<THead, ParamName | '*' | ParamName[]>>
]> : TRes;
export declare function isValidParams<T extends ParamConstraints>(params: Params, constraints: T): params is MapParams<T>;
export declare function validateParams<T extends ParamConstraints>(params: Params, constraints: T, messageOrError: unknown): asserts params is MapParams<T>;
export {};
