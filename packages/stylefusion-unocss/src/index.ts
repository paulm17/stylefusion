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

 return { root: rootRes, layer: layer !== undefined ? `${layer}##` : "", styles: stylesRes.join(" ") };
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
      const layerSplitText = match[1].split("##");

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

async function genLayers(layersArr: Record<string, string[]>, root: string, classNameStyles: Set<string>) {
  if (classNameStyles.size > 0) {
    layersArr["classNames"] = [...classNameStyles];
  }

  layersArr = filterDuplicates(layersArr);

  const headers = Object.keys(layersArr).join(", ");

  const allPromises = Object.keys(layersArr).map(async(layer) => {
    const styles = await genUnoCSS(layersArr[layer]!.join(" ").trim());

    const stylesNL = styles.split("\n").filter(
      (value: string) => !value.includes("layer: default")
    );

    return `@layer ${layer} {
      ${layer === "default" ? root : ""}
      ${stylesNL.join("\n")}
    }`
  }); 

  const allLayers = await Promise.all(allPromises);

  const css = `
    @layer ${headers};

    ${allLayers.join("\n")}
  `;

  return css;
}

function filterDuplicates(obj: Record<string, string[]>) {
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

// function filterDuplicates(keys: string[],obj: Record<string, string[]>) {
//   console.log("keys", keys);

//   keys.forEach((key) => {
    
//   })

//   // for (let i = 0; i < keys.length - 1; i++) {
//   //   const currentKey = keys[i];
//   //   const nextKey = keys[i + 1];

//   //   // Get the current and next key values
//   //   const currentValues = obj[currentKey!];
//   //   const nextValues = obj[nextKey!];

//   //   // console.log(currentKey, currentValues);
//   //   // console.log(nextKey, nextValues);

//   //   // // Filter out duplicates from the current key values that exist in the next key values
//   //   // obj[currentKey!] = currentValues!.filter(
//   //   //   (value) => !nextValues!.includes(value)
//   //   // );

//   //   // // Keep track of duplicates
//   //   // const duplicates = currentValues!.filter((value) =>
//   //   //   nextValues!.includes(value)
//   //   // );

//   //   // // Optionally, remove duplicates from the next key values
//   //   // obj[nextKey!] = nextValues!.filter(value => !duplicates.includes(value));

//   //   // console.log("dupes", duplicates);
//   // }

//   return obj;
// }

// function filterDuplicates(keys: string[], obj: Record<string, string[]>): Record<string, string[]> {
//   // Initialize an array to keep track of duplicates
//   const duplicates: string[] = [];
 
//   console.log("keys", keys);

//   // Loop through all keys
//   keys.forEach((currentKey, currentIndex) => {
//      // Get the current key values
//      const currentValues = obj[currentKey];

//     //  // Loop through all other keys to find duplicates
//      keys.forEach((otherKey, otherIndex) => {
//        if (currentIndex !== otherIndex) {
//          const otherValues = obj[otherKey];
 
//          // Find duplicates between current and other key values
//          const currentDuplicates = currentValues!.filter(value => otherValues!.includes(value));
 
//     //      // Add found duplicates to the duplicates array
//          duplicates.push(...currentDuplicates);

//          console.log("dupes", duplicates);
//          console.log("otherKey", otherKey);
 
//     //      // Remove duplicates from the other key values
//         //  obj[otherKey] = otherValues!.filter(value => !duplicates.includes(value));
//        }
//      });
 
//      // Remove duplicates from the current key values
//     //  obj[currentKey] = currentValues!.filter(value => !duplicates.includes(value));
//   });
 
//   // // Remove duplicates from the last key values
//   // const lastKey = keys[keys.length - 1];
//   // // @ts-ignore
//   // obj[lastKey!] = obj[lastKey!].filter(value => !duplicates.includes(value!));
 
//   return obj;
//  }

export { 
  createGenerator, 
  extractClassNames, 
  genLayers, 
  genStyleRootObj, 
  processStyles
};