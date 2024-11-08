import { prepareCssVars } from '@mui/system/cssVars';
import type { CSSObject } from '../base';
import { NestedCSSObject } from '../css';
import { Device, MediaFeatureObject, MediaQueryBuilder } from './mediaQueryBuilder';

export interface ThemeInput<ColorScheme extends string = string> extends Record<string, any> {
  /**
   * The prefix to be used for the CSS variables.
   */
  cssVarPrefix?: string;
  /**
   * The color schemes to be used for the theme.
   */
  colorSchemes?: Record<ColorScheme, any>;
  /**
   * The default color scheme to be used for the theme. It must be one of the keys from `theme.colorSchemes`.
   * Required when `colorSchemes` is provided.
   * @default 'light'
   */
  defaultColorScheme?: ColorScheme;
  /**
   * If provided, it will be used to create a selector for the color scheme.
   * This is useful if you want to use class or data-* attributes to apply the color scheme.
   *
   * The callback receives the colorScheme with the possible values of:
   * - undefined: the selector for tokens that are not color scheme dependent
   * - string: the selector for the color scheme
   *
   * @example
   * // class selector
   * (colorScheme) => colorScheme !== 'light' ? `.theme-${colorScheme}` : ":root"
   *
   * @example
   * // data-* attribute selector
   * (colorScheme) => colorScheme !== 'light' ? `[data-theme="${colorScheme}"`] : ":root"
   */
  getSelector?: (
    colorScheme: ColorScheme | undefined,
    css: Record<string, any>,
  ) => string | Record<string, any>;
  /**
   * A function to skip generating a CSS variable for a specific path or value.
   *
   * Note: properties with function as a value are always skipped.
   *
   * @example
   * // skip the `meta.*` fields from generating CSS variables and `theme.vars`
   * (keys, value) => keys[0] === 'meta'
   *
   */
  shouldSkipGeneratingVar?: (objectPathKeys: Array<string>, value: string | number) => boolean;
  components?: Partial<
    Record<
      string,
      {
        styleOverrides?: Record<string, any>;
        defaultProps: Record<string, any>;
      }
    >
  >;
}

export type ExtendTheme<
  Options extends {
    colorScheme: string;
    tokens: Record<string, any>;
  } = {
    colorScheme: string;
    tokens: Record<string, any>;
  },
> = ThemeInput<Options['colorScheme']> &
  Options['tokens'] & {
    vars: Options['tokens'];
    applyMixin: (
      cmd: "hover" | "ltr" | "rtl" | "where-ltr" | "where-rtl",
      styles: CSSObject<any> | NestedCSSObject,
    ) => Record<string, CSSObject<any> | string>;
    getDirectionSelector: (key: any) => string;
    getHoverSelector: (key: any) => string;
    applyMedia: (query: MediaQueryOptions, styles: CSSObject<any> | NestedCSSObject) => Record<string, CSSObject<any>>;
    applyStyles: (
      colorScheme: Options['colorScheme'],
      styles: CSSObject<any> | NestedCSSObject,
    ) => Record<string, CSSObject<any>>;
    getColorSchemeSelector: (colorScheme: Options['colorScheme']) => string;
    generateStyleSheets: () => Array<Record<string, any>>;
  };

export type Theme = Record<string, any>;

type MediaQueryOptions = {
  devices?: Device | Device[]; // Device(s) like "screen", "tv", etc.
  features?: MediaFeatureObject | MediaFeatureObject[]; // Feature(s) to add to the query
  only?: boolean; // Whether to use "only" in the query
  operator?: "and" | "or"; // Operator for joining features
};

/**
 * A utility to tell zero-runtime to generate CSS variables for the theme.
 */
export function extendTheme<
  Options extends {
    colorScheme: string;
    tokens: Record<string, any>;
  } = {
    colorScheme: string;
    tokens: Record<string, any>;
  },
>(theme: ThemeInput) {
  const {
    cssVarPrefix,
    shouldSkipGeneratingVar,
    getSelector = defaultGetSelector,
    defaultColorScheme = 'light',
    ...otherTheme
  } = theme;

  function defaultGetSelector(
    colorScheme: string | undefined,
    css: Record<string, any>,
  ): string | Record<string, any> {
    if (colorScheme === 'light' && defaultColorScheme !== 'light') {
      return {
        '@media (prefers-color-scheme: light)': {
          ':root': css,
        },
      };
    }
    if (colorScheme === 'dark' && defaultColorScheme !== 'dark') {
      return {
        '@media (prefers-color-scheme: dark)': {
          ':root': css,
        },
      };
    }
    return ':root';
  }

  if (
    theme.colorSchemes &&
    (!defaultColorScheme || !Object.keys(theme.colorSchemes).includes(defaultColorScheme))
  ) {
    throw new Error(
      `Zero: \`defaultColorScheme\` must be one of ${JSON.stringify(
        theme.colorSchemes,
      )}, but got "\`${theme.defaultColorScheme}\`".`,
    );
  }

  const parserConfig = {
    prefix: cssVarPrefix,
    shouldSkipGeneratingVar,
    getSelector,
  };
  const { generateThemeVars, generateStyleSheets } = prepareCssVars(otherTheme, parserConfig);

  const finalTheme = {
    ...theme,
    defaultColorScheme,
    vars: generateThemeVars(),
    generateStyleSheets,
  } as unknown as ExtendTheme<{ colorScheme: Options['colorScheme']; tokens: Options['tokens'] }>;

  finalTheme.getColorSchemeSelector = (colorScheme: string) => {
    if (colorScheme.includes("where")) {
      colorScheme = colorScheme.replace("where-", "");
      return `:where([data-raikou-color-scheme='${colorScheme}']) &`;
    } else if (!theme.getSelector) {
      return `@media (prefers-color-scheme: ${colorScheme})`;
    }
    return `:where(${theme.getSelector(colorScheme, {})}) &`;
  };

  finalTheme.applyStyles = function applyStyles(colorScheme, styles) {
    return {
      [this.getColorSchemeSelector(colorScheme)]: styles,
    };
  };

  finalTheme.getDirectionSelector = (direction: "ltr" | "rtl" | "where-ltr" | "where-rtl") => {    
    if (direction === "ltr" || direction === "rtl") {
      return `[dir='${direction}'] &`;
    } else {
      return `:where([dir='${direction.replace("where-", "")}']) &`;
    }    
  };

  finalTheme.getHoverSelector = (key: string) => {   
    return `@media (${key}: ${key})`;
  };

  finalTheme.applyMedia = function applyMedia(query, styles) {
    const builder = new MediaQueryBuilder();

    if (query.devices) {
      builder.addDevice(query.devices);
    }
    if (query.features) {
      builder.addFeature(query.features);
    }
    if (query.only !== undefined) {
      builder.setOnly(query.only);
    }
    if (query.operator) {
      builder.setOperator(query.operator);
    }

    return {
      [builder.build()]: styles,
    }
  };

  finalTheme.applyMixin = function applyMixin(cmd, styles) {
    if (cmd === "hover") {
      return {
        [this.getHoverSelector("hover")]: styles,
        [this.getHoverSelector("none")]: styles,
      };
    } else if (["ltr", "rtl", "where-ltr", "where-rtl"].includes(cmd)) {
      return {
        [this.getDirectionSelector(cmd)]: styles,
      };
    }

    return {};
  };

  return finalTheme;
}
