import type { Theme } from './extendTheme';
import { generateThemeTokens } from './generateCss';

export function generateThemeSource(theme?: Theme, rawTheme?: any) {
  if (!theme) {
    return `export default {}`;
  }
  if (typeof theme.toRuntimeSource !== 'function') {
    return `export default ${JSON.stringify(generateThemeTokens(theme, rawTheme))};`;
  }
  return theme.toRuntimeSource.call(theme, theme);
}
