import { serializeStyles } from '@emotion/serialize';
import { Theme } from './extendTheme';

export function generateTokenCss(theme?: Theme) {
  if (!theme) {
    return '';
  }
  // use emotion to serialize the object to css string
  const { styles } = serializeStyles(theme.generateStyleSheets?.() || []);

  return styles;
}

export function generateThemeTokens(theme?: Theme, rawTheme: any = {}) {
  if (!theme || typeof theme !== 'object') {
    return {};
  }
  // is created using extendTheme
  if ('vars' in theme && theme.vars) {
    return {
      vars: theme.vars,
      theme: rawTheme,
    };
  }
  return {};
}
