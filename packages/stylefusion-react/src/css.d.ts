import type { CSSObjectNoCallback } from './base';
import type { ThemeArgs } from './theme';

type Primitve = string | null | undefined | boolean | number;
type StyleKeys = "root" | "layer" | "base" | "rtl" | "active" | "hover" | "focus" | "light" | "dark";
type StyleValueValue = string | number | CSSObjectNoCallback | StyleObject | Object;
type StyleValue = Record<string, StyleValueValue> | StyleValueValue;

// Step 2: Create a Recursive Type for Nested Structures
type StyleObject = {
 [K in StyleKeys]?: StyleValue;
};

// Step 3: Combine the Base and Recursive Types
type CSSObject = StyleObject & {
 [key: string]: StyleValue;
};

type CssArg = ((themeArgs: ThemeArgs) => CSSObject) | CSSObject;
type CssFn = (themeArgs: ThemeArgs) => CSSObject;

interface Css {
  /**
   * @returns {string} The generated css class name to be referenced.
   */
  (arg: CSSObject, ...templateArgs: (Primitve | CssFn)[]): string;
  /**
   * @returns {string} The generated css class name to be referenced.
   */
  (...arg: CssArg[]): string;
}

declare const css: Css;

export default css;
