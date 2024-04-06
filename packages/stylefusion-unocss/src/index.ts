import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

// process the unocss styles
function processStyles(styles: Record<string, any>, prefix = "") {
  // Extract the 'root' property and store it in a new variable
 const { root, ...rest } = styles;

 let rootRes = "";
 if (root !== undefined) {
  rootRes = processRoot(root);
 }

 const stylesRes = processStylesLoop(rest, prefix);

 return { root: rootRes, styles: stylesRes.join(" ") };
}

function processStylesLoop(styles: Record<string, any>, prefix = "") {
  let result = [] as string[];
  for (let [key, value] of Object.entries(styles)) {

    // target classes
    if (key.match(/&>./)) {
      key = key.replace(/\s+/g, "")
    }
    
    if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      // If the value is an object, recursively process it
      result.push(...processStylesLoop(value, `${key}:`));
    } else {
      if (typeof value === "string") {
        const values = extractItems(value);

        values?.forEach((val: string) => {
          result.push(`${prefix}${key !== "base" ? `${key}:` : ""}${val.replace(/\s+/g, "_")}`);
        });
      } else {
        value.forEach((val: string) => {
          result.push(`${prefix}${key !== "base" ? `${key}:` : ""}${val.replace(/\s+/g, "_")}`);
        })
      }
    }
  }

  return result;
}

function extractItems(input: string) {
  // Enhanced regex to match a wider range of patterns
  const regex = /(\w+-\w+(-\w+)?)|(\[.*?\])/g;

  // Find all matches and return them in an array
  return input.match(regex);
}

function processRoot(root: any) {
  if (Object.keys(root).length > 0) {
    const obj = Object.keys(root).map((key) => {
      const value = root[key];
      return `${key}: ${value};`;
    });

    return obj.join("");
  }

  return "";
}

// convert the markup from styles to unocss
function genStyleRootObj(cssClass: string) {
  const classDefinitions = cssClass.split('\n');
 
  const styleArray: string[] = [];
  const rootArray: string[] = [];

  classDefinitions.forEach(classDef => {
    const regex = /{(.*?)}/;
    const match = classDef.match(regex);

    if (match && match[1]) {
      const splitText = match[1].split("|");

      styleArray.push(splitText[0]?.replace("tmp:", "") || "");

      if (splitText[1] !== ";") {
        const rootText = splitText[1]?.split(";") || [];

        if (rootText.length > 0) {
          const rootTextStr = rootText?.map(item => `${item}`).join(";");
          rootArray.push(`\n${classDef.split("{")[0]}{${rootTextStr}}`);
        }
      }
    }
  });
 
  return {
     style: styleArray.join(" "),
     root: `${rootArray.join("")}\n`,
  };
 }

// extract from code blocks in webpack
function extractClassNames(code: string) {
  // Step 1: Match the function block
  const functionBlockMatch = code.match(
    /export default function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s+[\s\S]*}?\}/
  );

  if (!functionBlockMatch) return []; // No function block found

  // Step 2: Remove all new lines
  const singleLineCode = functionBlockMatch[0]
    .replace(/[\r\n]+/gm, "")
    .replace(/\s+/g, " ");

  // Step 3: Extract classNames
  const classNameMatches = singleLineCode.match(
    /className:\s*["`](.*?)["`]/
  );

  const classNamesMatches = singleLineCode.match(
    /classNames:\s*{\s*([^}]*)\s*}/
  );

  let stylesFromClassName = "";
  let stylesFromClassNames = "";

  // get styles from ClassName
  if (classNameMatches !== null) {
    stylesFromClassName = classNameMatches[0].replace(/className:\s*["`]/, "").replace(`\``, "").replace(/\$\{.*?\}/g, "");
  }

  // get styles from ClassNames
  if (classNamesMatches !== null) {
    const extractedValues = extractArrayValues(classNamesMatches[1]);
    stylesFromClassNames = processStyles(extractedValues).styles;
  }

  return `${stylesFromClassName} ${stylesFromClassNames}`.trim();
}

function extractArrayValues(input: string | undefined) {
  if (!input) return [];

  const regex = /"([^"]+)":\s*"([^"]+)"/g;
  const matches = [...input.matchAll(regex)];
  const keyValues = {};

  if (!matches) return [];
  matches.forEach((match) => {
    const key = match[1]; // The first capturing group is the key
    const value = match[2]; // The second capturing group is the value

    // @ts-ignore
    keyValues[key] = value;
  });

  return keyValues;
}

async function genUnoCSS(source: string) {
  const generator = createGenerator({
    presets: [
      presetUno(),
    ],
  })
  
  const { css } = await generator.generate(source, {
    "preflights": false,    
  })

  return css;
}

export { createGenerator, extractClassNames, genStyleRootObj, genUnoCSS, processStyles, presetUno };