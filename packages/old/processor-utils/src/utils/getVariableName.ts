import type { IOptions } from './types';

export function getVariableName(
  varId: string,
  rawVariableName: IOptions['variableNameConfig'] | undefined
) {
  console.log("getVariableName.ts - getVariableName");
  switch (rawVariableName) {
    case 'raw':
      return varId;
    case 'dashes':
      return `--${varId}`;
    case 'var':
    default:
      return `var(--${varId})`;
  }
}
