type interactions = "active"
| "enabled"
| "disabled"
| "hover"
| "focus"
| "focus-within"
| "focus-visible" 
| "dark" 
| "data-[enabled]" 
| "data-[disabled]" 
| "data-[active]";

type positional = "first" 
| "last" 
| "only"
| "odd"
| "even"
| "first-of-type"
| "last-of-type"
| "only-of-type";

type content = "empty";

type state = "visited" | "open";

type forms = "default" 
| "checked" 
| "intermediate" 
| "placeholder-shown"
| "autofill"
| "optional"
| "required"
| "valid"
| "invalid"
| "in-range"
| "out-of-range"
| "read-only";

type psudeoElement = "backdrop-element" 
| "backdrop"
| "placeholder" 
| "before" 
| "after" 
| "selection" 
| "marker" 
| "file"
| "first-letter"
| "first-line"; 

type StyleKeys = "root" | "base" | interactions | positional | content | forms | state | psudeoElement;
type StyleValue = string | string[] | Record<string, string> | StyleObject;

// Step 2: Create a Recursive Type for Nested Structures
type StyleObject = {
 [K in StyleKeys]?: StyleValue;
};

// Step 3: Combine the Base and Recursive Types
type CSSObject = StyleObject & {
 [key: string]: StyleValue;
};

// Define the Css interface with the same pattern as Code A
interface Css {
 /**
   * @returns {string} The generated css class name to be referenced.
   */
 (arg: TemplateStringsArray, ...templateArgs: (StyleValue | ((themeArgs: any) => CSSObject))[]): string;
 /**
   * @returns {string} The generated css class name to be referenced.
   */
 (...arg: CSSObject[]): string;
}

declare const css: Css;

export default css;
