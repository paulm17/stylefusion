import { createGenerator } from '@unocss/core'
import presetUno from '@unocss/preset-uno'

// process the unocss styles
function processStyles(styles: Record<string, any>, prefix = "") {
  // Extract the 'root' property and store it in a new variable
 const { layer, ...rest } = styles;

 const rootRes = processRootLoop(rest, prefix);
 const stylesRes = processStylesLoop(rest, prefix);

 return { root: rootRes.join(" "), layer: layer !== undefined ? layer : "", styles: stylesRes.join(" ") };
}

function processStylesLoop(styles: Record<string, any>, prefix = "") {
  let result = [] as string[];
  for (let [key, value] of Object.entries(styles)) {
    if (key === 'root') {
      continue;
    }

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

function processRootLoop(styles: Record<string, any>, prefix = "") {
  let result = [] as string[];
  for (let [key, value] of Object.entries(styles)) {
    // target classes
    if (key.match(/&>./)) {
      key = key.replace(/\s+/g, "")
    }
    
    if (key === "root") {
      if (typeof value === "object" && !Array.isArray(value) && value !== null) {
        result.push(processRoot(value, prefix.replace(":", "")));
      }
    } else if (typeof value === "object" && !Array.isArray(value) && value !== null) {
      result.push(...processRootLoop(value, `${key}:`));
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

function processRoot(root: any, prefix: string = "") {
  if (Object.keys(root).length > 0) {
    const obj = Object.keys(root).map((key) => {
      const value = root[key];
      return `${key}: ${value};`;
    });

    if (prefix !== "" && !prefix.match(/\./)) {
      prefix = `.${prefix} `;
    }

    return prefix !== "" ? `${prefix}{ ${obj.join("")} }` : obj.join("");
  }

  return "";
}

type layersType = Record<string, {root: Record<string, string[]>, style: string[]}>;

// convert the markup from styles to unocss
function genStyleRootObj(cssClass: string) {
  const cssClass_s = cssClass.split("\n");
  const layerArray: layersType = {
    default: {
      root: {},
      style: []
    },
  };

  cssClass_s.forEach(element => {
    const regex = /(\.\w+){(.*)}/;
    const match = element.match(regex);

    let className = "";
    let layer = "default";

    if (match && match[1] && match[2]) {
      className = match[1];
      element = match[2].replace("css:", "");
    }

    const classDefinitions = element.split('|');    

    classDefinitions.forEach(classDef => {
      if (classDef.match(/layer\#/)) {
        const s_text = classDef.split("layer#");

        if (s_text && s_text[0]) {
          className = s_text[0];
        }
        if (s_text && s_text[1]) {
          layer = s_text[1]!;

          if (!Object.keys(layerArray).includes(layer)) {
            layerArray[layer] = {
              root: {},
              style: []
            }
          }
        }
      } else if (classDef.match(/root\#/)) {
        const s_text = classDef.split("root#");

        if (s_text && s_text[1]) {
          var re = new RegExp(className, "g");
          const s_root = s_text[1].replace(re, " ").split("}");

          if (!Object.keys(layerArray[layer!]!.root).includes(className)) {
            layerArray[layer!]!.root[className] = []
          }

          s_root.forEach((rootItem, index) => {
            if (index === 0) {
              const s_rootItem = rootItem.split(";");
              const items = s_rootItem.filter((item) => item !== "");
              layerArray[layer]!.root[className]?.push(...items);
            } else {
              rootItem = rootItem.trimStart();

              if (rootItem[rootItem.length - 1] === ";") {
                rootItem = `${rootItem}}`;
              }

              const regex = /(\.\w+){(.*)}/;
              const match = rootItem.match(regex);

              if (match && match[1] && match[2]) {
                if (!Object.keys(layerArray).includes(`${match[1]} ${className}`)) {
                  layerArray[layer]!.root[`${match[1]} ${className}`] = []
                }

                layerArray[layer]!.root[`${match[1]} ${className}`]?.push(match[2]);
              }              
            }
          })
        }
      } else if (classDef.match(/style\#/)) {
        const s_text = classDef.split("style#");

        if (s_text && s_text[1]) {
          layerArray[layer]?.style.push(...s_text[1].split(" "));
        }
      }
    });
  });

  return {
    css: JSON.stringify(layerArray),
  };
}

// extract from code blocks in webpack
function extractClassNames(code: string) {
  // Step 1: Match the function block
  const functionBlockMatch = code.match(
    /export default function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s+[\s\S]*}?\}/
  );

  if (!functionBlockMatch) return ""; // No function block found

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
      const styles = className.replace(/className:\s*["`]/, "").replace(/["`]/, "").replace(/\$\{.*?\}/g, "").split(" ");

      if (styles.length > 0) {
        styles.forEach((style) => {
          if (!stylesFromClassName.includes(style)) {
            stylesFromClassName.push(style);          
          }
        })
      }      
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
      presetUno({
        dark: "class",
      }),      
    ],    
  })
  
  const { css } = await generator.generate(source, {
    "preflights": false,    
  })

  return css;
}

async function genLayers(layers: string, classNameStyles: Set<string>) {
  let layersArr = JSON.parse(layers) as layersType;

  if (classNameStyles.size > 0) {
    layersArr["classNames"] = {
      root: {},
      style: [],
    }

    layersArr["classNames"].style = [...classNameStyles];
  }

  layersArr = filterDuplicates(layersArr);

  const headers = Object.keys(layersArr).join(", ");

  const allPromises = Object.keys(layersArr).map(async(layer) => {
    const layerStyles = layersArr[layer]!.style;
    const layerRoot = layersArr[layer]!.root;

    const styles = await genUnoCSS(layerStyles.join(" ").trim());    
    const stylesNL = styles.split("\n").filter(
      (value: string) => !value.includes("layer: default")
    );

    const rootText = Object.keys(layerRoot).map((key) => {
      if (layerRoot[key]!.length > 0) {
        return `${key} {${layerRoot[key]!.join("; ")};}`
      }
    }).filter(item => item !== undefined).join(";");

    return `@layer ${layer} {
      ${rootText !== "" ? `${rootText}\n` : ""}
      ${stylesNL.join("\n")}
    }`
  }); 

  const done = await Promise.all(allPromises);

  const css = `
    @layer ${headers};

    ${done.join("\n")}
  `;

  return css;
}

function filterDuplicates(layersArr: layersType) {
  const obj: Record<string, string[]> = {};

  Object.keys(layersArr).forEach((key) => {
    const style = layersArr[key]?.style;
    obj[key] = style || [];
  });

  const filtered = filterDuplicatesFromStyle(obj);

  Object.keys(filtered).forEach((key) => {
    layersArr[key]!.style = filtered[key] as string[];
  })

  return layersArr;
}

function filterDuplicatesFromStyle(obj: Record<string, string[]>) {
  let dupe = [] as string[];
  const keys = [...Object.keys(obj)];  
 
  // Loop through each key in the order specified by the keys array
  for (let i = 0; i < keys.reverse().length; i++) {    
    const currentKey = keys[i];
    const currentValue = obj[currentKey!];

    if (currentKey === "default") {
      continue;
    }

     // Compare the current item with all other items
     for (let j = i + 1; j < keys.length; j++) {
       const nextKey = keys[j];
       const nextValue = obj[nextKey!];
 
       // Find matches between the current and next items
       const matches = currentValue!.filter(item => nextValue!.includes(item));
 
       // If there are matches, add them to the dupe array and filter them out from the next item
       if (matches.length > 0) {
         dupe = [...dupe, ...matches];
         obj[nextKey!] = nextValue!.filter(item => !matches.includes(item));
       }
     }     
  }

  // Filter the current item against the dupe array
  obj["default"] = obj["default"]!.filter(item => !dupe.includes(item));

  // Return the filtered object and the dupe array
  return obj;
 }

export { 
  createGenerator, 
  extractClassNames, 
  genLayers, 
  genStyleRootObj, 
  processStyles
};