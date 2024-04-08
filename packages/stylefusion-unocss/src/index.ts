import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

// process the unocss styles
function processStyles(styles: Record<string, any>, prefix = "") {
  // Extract the 'root' property and store it in a new variable
 const { root, layer, ...rest } = styles;

 let rootRes = "";
 if (root !== undefined) {
  rootRes = processRoot(root);
 }

 const stylesRes = processStylesLoop(rest, prefix);

 return { root: rootRes, layer: layer !== undefined ? `${layer}#` : "", styles: stylesRes.join(" ") };
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
 
  const styleArray: Record<string, string[]> = {
    default: [],
  };
  const rootArray: string[] = [];

  classDefinitions.forEach(classDef => {
    classDef = classDef.replace("tmp:", "");

    const regex = /{(.*?)}/;
    const match = classDef.match(regex);

    if (match && match[1]) {
      let layer = undefined;
      const layerSplitText = match[1].split("#");

      if (layerSplitText && layerSplitText.length > 1) {
        layer = layerSplitText.shift();

        if (!Object.keys(styleArray).includes(layer!)) {
          styleArray[layer!] = [];
        }
      }

      if (layerSplitText && layerSplitText.length > 0) {
        const splitText = layerSplitText[0]?.split("|");

        if (splitText && splitText[0]) {
          const newLayer = layer === undefined ? "default" : layer;

          styleArray[newLayer]?.push(splitText[0]);
        }

        if (splitText && splitText[1] !== ";") {
          const rootText = splitText[1]?.split(";") || [];

          if (rootText.length > 0) {
            const rootTextStr = rootText?.map(item => `${item}`).join(";");
            rootArray.push(`\n${classDef.split("{")[0]}{${rootTextStr}}`);
          }
        }
      }
    }
  });

  const StyleArrayString: Record<string, string> = {};

  Object.keys(styleArray).forEach(key => {
    StyleArrayString[key] = styleArray[key]!.join(' ');
 });

  return {
     style: JSON.stringify(StyleArrayString),
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
    /className:\s*["`](.*?)["`]/g
  );

  const classNamesMatches = singleLineCode.match(
    /classNames:(\s*{\s*\w*:\s+{.*\s*}\s+})/gs
  );

  let stylesFromClassName = [] as string[];
  let stylesFromClassNames = [] as string[];

  // get styles from ClassName
  if (classNameMatches !== null) {
    classNameMatches.forEach((className) => {
      stylesFromClassName.push(className.replace(/className:\s*["`]/, "").replace(`\``, "").replace(/\$\{.*?\}/g, ""));      
    })
  }

  // get styles from ClassNames
  if (classNamesMatches !== null) {
    classNamesMatches.forEach((className) => {
      const str = className.replace(/classNames:\s+/, "").replace(/(\w+):/g, '"$1":');
      const jsonStr = JSON.parse(str);
      
      Object.keys(jsonStr).forEach((key) => {
        const styles = processStyles(jsonStr[key]).styles

        stylesFromClassNames.push(styles);
      });
    });    
  }

  return `${stylesFromClassName.join(" ")} ${stylesFromClassNames.join(" ")}`.trim();
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

async function genLayers(source: string, root: string, classNameStyles: string) {
  const layersArr = JSON.parse(source);

  if (classNameStyles !== "") {
    layersArr["classNames"] = classNameStyles;
  }

  const headers = Object.keys(layersArr).join(", ");

  const allPromises = Object.keys(layersArr).map(async(layer) => {
    const unocss = await genUnoCSS(layersArr[layer])

    return `
      @layer ${layer} {
        ${layer === "default" ? root : ""}
        ${unocss}
      }
    `
  });

  const allLayers = await Promise.all(allPromises);

  const css = `
    @layer ${headers};

    ${allLayers.join("\n")}
  `;

  return css;
}

export { 
  createGenerator, 
  extractClassNames, 
  genLayers, 
  genStyleRootObj, 
  processStyles
};