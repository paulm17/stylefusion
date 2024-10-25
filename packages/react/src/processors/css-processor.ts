import { getCacheInstance } from "../utils/cache";
import hash from "../utils/hash";

function processStyles(styles: any, className = "") {
  return processRoot(styles, className);
}

function processAtomicStyles(styles: any, className = "") {
  return processAtomicRoot(styles, className);
}

function processRoot(root: any, className: string = "") {
  function convertStyles(jsonInput: any, className: string) {
    const styleMap = new Map<string, string[]>();

    Object.entries(jsonInput).forEach(([key, value]) => {
      let selector = key.startsWith('.') ? key : `.${className}`;
      selector = selector.replaceAll(" > ", "");

      if (typeof value === 'object') {
        // @ts-ignore
        Object.entries(value).forEach(([k, v]) => {
          let style = "";

          if (v && typeof v === 'object') {
            if (k.startsWith("@media") && k.includes("prefers-color-scheme")) {
              const colorScheme = k.match(/(?<=prefers-color-scheme:\s*)(light|dark)/i)?.[0]?.toLowerCase() ?? "";
              const result = convertStyles(v, `:where([data-theme=${colorScheme}]) ${key}`);
              
              Object.keys(result).map((k) => {
                styleMap.set(k.replace(/^(\.+)/g, ""), result[k]);  
              });
            }
          } else {
            style = `${kebabCase(k)}: ${v}`;

            if (key.startsWith("@media")) {
              if (key.includes("hover")) {
                styleMap.set(key, [style]);
              }
            }
          }

          if (style !== "") {
            if (!styleMap.has(selector)) {
              styleMap.set(selector, []);
            }
            styleMap.get(selector)!.push(style);
          }
        });
      } else {
        const style = `${kebabCase(key)}: ${value}`;
        if (!styleMap.has(selector)) {
          styleMap.set(selector, []);
        }

        styleMap.get(selector)!.push(style);
      }
    });

    return Object.fromEntries(styleMap);
  }
  
  function kebabCase(str: string) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }
  
  const result = convertStyles(root, className);

  return result;
}

function processAtomicRoot(root: any, className: string = "") {
  const styleMap = new Map<string, string>();
  const cacheInstance = getCacheInstance(undefined);    

  function convertStyles(jsonInput: any, selector: string = "", isObject: boolean = false) {
    Object.entries(jsonInput).forEach(([key, value]) => {
      if (typeof value === 'object') {
        const cleanSelector = key.replace(`.${selector} `, "").replaceAll(" ", "");
        convertStyles(value, cleanSelector, true);
      } else {
        const style = `${kebabCase(key)}: ${value}`;
        
        if (isObject) {
          const dbSelector = `${selector}|${style}`;

          if (cacheInstance.has(dbSelector)) {
            const id = cacheInstance.get(dbSelector);

            styleMap.set(`${id}|.${id}${selector}`, style);
          } else {
            const id = createUID(style)
            cacheInstance.set(dbSelector, id);

            styleMap.set(`${id}|.${id}${selector}`, style);
          }
        } else {
          if (cacheInstance.has(style)) {
            const id = cacheInstance.get(style);
            
            styleMap.set(`${id}|.${id}`, style);
          } else {
            const id = createUID(style)
            cacheInstance.set(style, id);

            styleMap.set(`${id}|.${id}`, style);
          }
        }
      }
    });
  }

  function kebabCase(str: string) {
    return str.replace(/([A-Z])/g, '-$1').toLowerCase();
  }

  convertStyles(root, className);
  
  return Object.fromEntries(styleMap);
}

function createUID(str: string) {
  let id = hash(str);

  if (!/^[a-z]/i.test(id.charAt(0))) {
    id = `x${id}`;
  }
  if (id.length < 6) {
    id = `x${id}`;
  } else if (id.length > 6) {
    id = `${id.substring(0,6)}`;
  }

  return id;
}

export { processStyles, processAtomicStyles };