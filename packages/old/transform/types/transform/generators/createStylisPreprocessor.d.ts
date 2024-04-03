/// <reference types="node" resolution-mode="require"/>
import * as path from 'path';
import type { Middleware } from 'stylis';
import type { Options } from '../../types';
export declare function transformUrl(url: string, outputFilename: string, sourceFilename: string, platformPath?: typeof path): string;
/**
 * Stylis plugin that mimics :global() selector behavior from Stylis v3.
 */
export declare const stylisGlobalPlugin: Middleware;
export declare function createStylisUrlReplacePlugin(filename: string, outputFilename: string | undefined): Middleware;
export declare function createKeyframeSuffixerPlugin(): Middleware;
export declare function createStylisPreprocessor(options: Options & {
    prefixer?: boolean;
}): (selector: string, text: string) => string;
