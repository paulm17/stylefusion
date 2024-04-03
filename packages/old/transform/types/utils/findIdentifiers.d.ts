import type { NodePath } from '@babel/traverse';
import type { Node, Identifier, JSXIdentifier } from '@babel/types';
type FindType = 'any' | 'binding' | 'declaration' | 'reference';
export declare function nonType(path: NodePath): boolean;
export declare function findIdentifiers(expressions: NodePath<Node | null | undefined>[], type?: FindType): NodePath<Identifier | JSXIdentifier>[];
export {};
