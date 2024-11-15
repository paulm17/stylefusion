export interface ThemeArgs {}
export { ExtendTheme } from './utils/extendTheme';

/* -------- */
export interface Theme {
  /** Controls focus ring styles. Supports the following options:
   *  - `auto` – focus ring is displayed only when the user navigates with keyboard (default value)
   *  - `always` – focus ring is displayed when the user navigates with keyboard and mouse
   *  - `never` – focus ring is always hidden (not recommended)
   */
  focusRing: 'auto' | 'always' | 'never';

  /** Rem units scale, change if you customize font-size of `<html />` element
   *  default value is `1` (for `100%`/`16px` font-size on `<html />`)
   */
  scale: number;

  /** Determines whether `font-smoothing` property should be set on the body, `true` by default */
  fontSmoothing: boolean;

  /** White color */
  white: string;

  /** Black color */
  black: string;

  /** Object of colors, key is color name, value is an array of at least 10 strings (colors) */
  colors: ThemeColors;

  /** Index of theme.colors[color].
   *  Primary shade is used in all components to determine which color from theme.colors[color] should be used.
   *  Can be either a number (0–9) or an object to specify different color shades for light and dark color schemes.
   *  Default value `{ light: 6, dark: 8 }`
   *
   *  For example,
   *  { primaryShade: 6 } // shade 6 is used both for dark and light color schemes
   *  { primaryShade: { light: 6, dark: 7 } } // different shades for dark and light color schemes
   * */
  primaryShade: ColorShade | PrimaryShade;

  /** Key of `theme.colors`, hex/rgb/hsl values are not supported.
   *  Determines which color will be used in all components by default.
   *  Default value – `blue`.
   * */
  primaryColor: string;

  /** Determines whether text color must be changed based on the given `color` prop in filled variant
   *  For example, if you pass `color="blue.1"` to Button component, text color will be changed to `var(--raikou-color-black)`
   *  Default value – `false`
   * */
  autoContrast: boolean;

  /** Determines which luminance value is used to determine if text color should be light or dark.
   *  Used only if `theme.autoContrast` is set to `true`.
   *  Default value is `0.3`
   * */
  luminanceThreshold: number;

  /** Font-family used in all components, system fonts by default */
  fontFamily: string;

  /** Monospace font-family, used in code and other similar components, system fonts by default  */
  fontFamilyMonospace: string;

  /** Controls various styles of h1-h6 elements, used in TypographyStylesProvider and Title components */
  headings: {
    fontFamily: string;
    fontWeight: string;
    textWrap: 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable';
    sizes: {
      h1: HeadingStyle;
      h2: HeadingStyle;
      h3: HeadingStyle;
      h4: HeadingStyle;
      h5: HeadingStyle;
      h6: HeadingStyle;
    };
  };

  /** Object of values that are used to set `border-radius` in all components that support it */
  radius: RadiusValues;

  /** Key of `theme.radius` or any valid CSS value. Default `border-radius` used by most components */
  defaultRadius: Radius;

  /** Object of values that are used to set various CSS properties that control spacing between elements */
  spacing: SpacingValues;

  /** Object of values that are used to control `font-size` property in all components */
  fontSizes: FontSizesValues;

  /** Object of values that are used to control `line-height` property in `Text` component */
  lineHeights: LineHeightValues;

  /** Object of values that are used to control breakpoints in all components,
   *  values are expected to be defined in em
   * */
  breakpoints: BreakpointsValues;

  /** Object of values that are used to add `box-shadow` styles to components that support `shadow` prop */
  shadows: ShadowsValues;

  /** Determines whether user OS settings to reduce motion should be respected, `false` by default */
  respectReducedMotion: boolean;

  /** Determines which cursor type will be used for interactive elements
   * - `default` – cursor that is used by native HTML elements, for example, `input[type="checkbox"]` has `cursor: default` styles
   * - `pointer` – sets `cursor: pointer` on interactive elements that do not have these styles by default
   */
  cursorType: 'default' | 'pointer';

  /** Default gradient configuration for components that support `variant="gradient"` */
  defaultGradient: Gradient;

  /** Class added to the elements that have active styles, for example, `Button` and `ActionIcon` */
  activeClassName: string;

  /** Class added to the elements that have focus styles, for example, `Button` or `ActionIcon`.
   *  Overrides `theme.focusRing` property.
   */
  focusClassName: string;

  /** Allows adding `classNames`, `styles` and `defaultProps` to any component */
  components: ThemeComponents;

  /** Any other properties that you want to access with the theme objects */
  other: ThemeOther;
}

export interface ThemeComponent {
  // classNames?: any;
  styles?: any;
  vars?: any;
  defaultProps?: any;
}

export type ThemeComponents = Record<string, ThemeComponent>;

export interface HeadingStyle {
  fontSize: string;
  fontWeight?: string;
  lineHeight: string;
}

export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type BreakpointsValues = Record<Size | (string & {}), string>;
export type FontSizesValues = Record<Size | (string & {}), string>;
export type RadiusValues = Record<Size | (string & {}), string>;
export type SpacingValues = Record<Size | (string & {}), string>;
export type ShadowsValues = Record<Size | (string & {}), string>;
export type LineHeightValues = Record<Size | (string & {}), string>;

export type Breakpoint = keyof BreakpointsValues;
export type FontSize = keyof FontSizesValues;
export type Radius = keyof RadiusValues | (string & {}) | number;
export type Spacing = keyof SpacingValues | (string & {}) | number;
export type Shadow = keyof ShadowsValues | (string & {});
export type LineHeight = keyof LineHeightValues;

export interface ThemeOther {
  [key: string]: any;
}

export interface Gradient {
  from: string;
  to: string;
  deg?: number;
}

export type ColorsTuple = readonly [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  ...string[],
];

export type ColorShade = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export interface PrimaryShade {
  light: ColorShade;
  dark: ColorShade;
}

export type DefaultColor =
  | 'dark'
  | 'gray'
  | 'red'
  | 'pink'
  | 'grape'
  | 'violet'
  | 'indigo'
  | 'blue'
  | 'cyan'
  | 'green'
  | 'lime'
  | 'yellow'
  | 'orange'
  | 'teal'
  | (string & {});

export interface ThemeColorsOverride {}

export type ThemeColors = ThemeColorsOverride extends {
  colors: Record<infer CustomColors, ColorsTuple>;
}
  ? Record<CustomColors, ColorsTuple>
  : Record<DefaultColor, ColorsTuple>;

export type Color = keyof ThemeColors;
