import { remNoScale, remStrict, rem, em } from '../utils/converters';

const getRegExp = (units: 'rem' | 'em') => new RegExp('\\b' + units + '\\(([^()]+)\\)', 'g');
const emRegExp = getRegExp('em');
const remRegExp = getRegExp('rem');

export function preset(obj: any, prefix: string = "") {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        // Recursively process nested objects
        preset(obj[key], key);
      } else if (typeof obj[key] === 'string') {
        if (prefix.match(/^@media|@container/)) {
          if (obj[key].includes("rem(")) {
            obj[key] = obj[key].replace(remRegExp, (_: any, value: any) => {
              return remNoScale(value);
            });
          } if (obj[key].includes("em(")) {
            obj[key] = obj[key].replace(emRegExp, (_: any, value: any) => {
              return em(value);
            });
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