import { remNoScale, remStrict, rem, em } from '../utils/converters';
import { alpha, darken, lighten } from './colorMix';

const getRegExp = (units: 'rem' | 'em') => new RegExp('\\b' + units + '\\(([^()]+)\\)', 'g');
const emRegExp = getRegExp('em');
const remRegExp = getRegExp('rem');

type ColorFunction = (args: string) => string;

// implement color functions
const phaseColor = (obj: any, key: string) => {
  if (/alpha|lighten|darken/.test(obj[key])) {
    const colorFunctions: ColorFunction[] = [alpha, lighten, darken];
    const getValueRegexp = (name: string) => new RegExp(`\\b${name}\\(([^()]+)\\)`, 'g');
    const getVarRegexp = (name: string) => new RegExp(`\\b${name}\\(([^()]*\\([^()]*\\)[^()]*)+\\)`, 'g');
  
    const applyColorFunction = (str: string, fnName: ColorFunction) => {
      return str.replace(getValueRegexp(fnName.name), (_, args) => fnName(args))
        .replace(getVarRegexp(fnName.name), (_, args) => fnName(args));
    }
  
    colorFunctions.forEach(fnName => {
      obj[key] = applyColorFunction(obj[key], fnName);
    });
  }
}

export function preset(obj: any, prefix: string = "") {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively process nested objects
        preset(obj[key], key);
      } else if (typeof obj[key] === 'string') {
        if (/^@media|@container/.test(prefix)) {
          if (obj[key].includes("rem(")) {
            obj[key] = obj[key].replace(remRegExp, (_: any, value: any) => {
              return remNoScale(value);
            });
          } else if (obj[key].includes("em(")) {
            obj[key] = obj[key].replace(emRegExp, (_: any, value: any) => {
              return em(value);
            });
          } else if (/^-?\d+/.test(obj[key])) {
            obj[key] = remStrict(obj[key]);
          }
        } else {
          if (obj[key].includes("rem(")) {
            obj[key] = obj[key].replace(remRegExp, (_: any, value: any) => {
              return rem(value);
            });
          } else if (obj[key].includes("em(")) {
            obj[key] = obj[key].replace(emRegExp, (_: any, value: any) => {
              return em(value);
            });
          } else if (/^-?\d+/.test(obj[key])) {
            obj[key] = remStrict(obj[key]);
          }
        }
      }
    }
  }
  return obj;
}

export function colorMix(obj: any, prefix: string = "") {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively process nested objects
        colorMix(obj[key], key);
      } else if (typeof obj[key] === 'string') {
        if (/^@media|@container/.test(prefix)) {
          phaseColor(obj, key);
        } else {
          phaseColor(obj, key);
        }
      }
    }
  }
  return obj;
}