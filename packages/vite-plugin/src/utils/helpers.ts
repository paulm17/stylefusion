const px = (value: number) => `${value}px`;
const em = (value: number) => `${value}em`;

type RaikouTheme = any;
type RaikouBreakpoint = any;

export function getStylesRef(refName: string) {
  return `___ref-${refName || ''}`;
}

function getBreakpointValue(theme: RaikouTheme, breakpoint: RaikouBreakpoint | number) {
  return breakpoint in theme.breakpoints && typeof breakpoint !== 'number'
    ? (px(theme.breakpoints[breakpoint]) as number)
    : (px(breakpoint) as number);
}

const getHelpers = (theme: RaikouTheme) => ({
  light: '[data-raikou-color-scheme="light"] &',
  dark: '[data-raikou-color-scheme="dark"] &',
  rtl: '[dir="rtl"] &',
  ltr: '[dir="ltr"] &',
  notRtl: '[dir="ltr"] &',
  notLtr: '[dir="rtl"] &',
  ref: getStylesRef,
  smallerThan: (breakpoint: RaikouBreakpoint | number) =>
    `@media (max-width: ${em(getBreakpointValue(theme, breakpoint) - 0.1)})`,
  largerThan: (breakpoint: RaikouBreakpoint | number) =>
    `@media (min-width: ${em(getBreakpointValue(theme, breakpoint))})`,
});

export { getHelpers };
