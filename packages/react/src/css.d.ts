import type { CSSObject, CSSObjectNoCallback } from './base';
import type { ThemeArgs } from './theme';

type Primitve = string | null | undefined | boolean | number;

type stringOrNumber = string | number;
type value = CSSObjectNoCallback | NestedCSSObject;
type CssArg = ((themeArgs: ThemeArgs) => value) | value;
type CssFn = (themeArgs: ThemeArgs) => stringOrNumber;

// Helper type for nested CSS objects
export type NestedCSSObject = {
  [key: string]: stringOrNumber | NestedCSSObject | CSSObject<any>;
};

interface Css {
  /**
   * @returns {string} The generated css class name to be referenced.
   */
  (arg: NestedCSSObject, ...templateArgs: (Primitve | CssFn )[]): string;
  /**
   * @returns {string} The generated css class name to be referenced. 
   */
  (...arg: CssArg[]): string;
}

declare const css: Css;

export default css;
