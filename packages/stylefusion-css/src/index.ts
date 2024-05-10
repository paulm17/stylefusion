import hash from "./hash";

// process the unocss styles
function processStyles(styles: Record<string, any>, className = "") {
  // Extract the layer and root property and store it in a new variable
 const { root, ...rest } = styles;

 const rootRes = processRoot(root, className);
 const layersRes = processLayersLoop(rest, "");
 const stylesRes = processStylesLoop(rest, className);

 return { root: rootRes, layer: layersRes, styles: stylesRes };
}

function processStylesLoop(styles: Record<string, any>, className: string) {
  let result = [] as string[];

  const loopStyles = (styles: Record<string, any>, className: string, prefix = "") => {
    for (let [key, value] of Object.entries(styles)) {
      key = key.trim().replace(/\[selector\]/g, `.${className}`);
      if (key === 'root') {
        continue;
      }

      if (typeof value === "object") {
        loopStyles(value, className, `${prefix !== "" ? `${prefix}#` : ""}${key}`);
      } else {
        if (!key.match(/^(\^|\$)/)) {
          key = kebabize(key);
          result.push(genStyleLine("d", prefix, `${key}: ${value}`));
        }
      }
    }
  }

  loopStyles(styles, className);

  return result;
}

function genStyleLine(priority: string, prefix: string, val: string) {
  let id = createUID(`${priority}|${prefix}${val}`);

  const selector = genSelector(id, prefix);
  const masterCSSLine = genMasterCSSLine(val, prefix);

  return `${priority}||${id}||${selector}||${val}||${masterCSSLine}`
}

function genSelector(id: string, prefix: string) {
  if (prefix.includes("#")) {
    let hasParent = false;
    let noId = false;
    const selector = [] as string[];
    const prefixes = prefix.split("#");
        
    prefixes.forEach((p) => {      
      if (p.includes("!")) {
        noId = true;
      }

      if (p.match(/^\.[a-z0-9]{6,8}/)) {
        selector.push(`${p}`);
        hasParent = true;
      } else if (p.includes(":where")) {
        selector.push(`${p}`);
      } else if (["focus", "hover", "first", "last", "before", "after"].includes(p)) {
        selector.push(["focus", "hover", "first", "last"].includes(p) ? `:${p}` : `::${p}`);
      } else if (p.startsWith(">")) {
        selector.push(` ${p}`);
      }
    });

    const colorSchemeArr = ["light", "dark"];

    if (prefixes.some((p) => colorSchemeArr.includes(p))) {
      prefixes.forEach((p) => {
        if (colorSchemeArr.includes(p)) {
          selector.unshift(`:where(.${p})`);
        }
      });
    } 

    if (prefixes.includes("rtl")) {
      selector.unshift("[dir=rtl] ");
    }

    if (hasParent) {
      if (!noId) {
        selector.push(` .${id}`);
      }
    } else {
      if (selector.some((p) => [":where(.light)", ":where(.dark)"].includes(p))) {
        [":where(.light)", ":where(.dark)"].forEach(element => {
          const index = selector.indexOf(element);
          if (index !== -1) {
             selector.splice(index + 1, 0, ` .${id}`);
          }
         });
      } else {
        selector.unshift(`.${id}`);
      }
    }

    return selector.join("").replace("_", " ").replace("!", "");
  } else {
    let selector = "";

    if (["light", "dark"].includes(prefix)) {
      selector = `:where(.${prefix}) .${id}`;
    } else if (["focus", "hover", "before", "after", "not-first-of-type"].includes(prefix)) {
      selector = ["focus", "hover"].includes(prefix) ? `.${id}:${prefix}` : `.${id}::${prefix}`;;
    } else if (["first", "last"].includes(prefix)) {
      selector = `.${id}:${prefix}-child`;;
    } else if (prefix.startsWith(":where")) {
      selector = `.${id}${prefix}`;
    } else {
      selector = `.${id}`;
    }

    return selector.replace("_", " ");
  }
}

function genMasterCSSLine(val: string, prefix: string) {
  if (prefix.includes("#")) {
    const selector = [] as string[];
    const prefixes = prefix.split("#");    

    selector.push(val);    

    prefixes.forEach((p) => {
      p = p.replace("_", "");
      
      if (p.startsWith(":where")) {
        selector.push(`_${p}`);
      } else if (["focus", "hover", "first", "last", "before", "after"].includes(p)) {
        selector.push(["focus", "hover", "first", "last"].includes(p) ? `:${p}` : `::${p}`);
      } else if (!["light", "dark"].includes(p)) {
        selector.push(`_${p}`);
      }
    });

    prefixes.forEach((prefix) => {
      if (["light", "dark"].includes(prefix)) {
        selector.push(`@${prefix}`);
      }
    });

    return selector.join("");
  } else {
    if (["light", "dark"].includes(prefix)) {
      return `${val}@${prefix}`;
    } else if (prefix.startsWith("[data-")) {
      return `${val}${prefix}`
    } else if (["focus", "hover", "first", "last", "before", "after"].includes(prefix)) {
      return ["focus", "hover", "first", "last"].includes(prefix) ? `${val}:${prefix}` : `${val}::${prefix}`
    } else if (prefix.startsWith(":where")) {
      return `${val}_${prefix}`
    } else {
      return `${val}`
    }
  }
}

function getLevel(str: string) {
  const match = str.match(/^[\^|\$]+/);
  return match ? match[0].length - 1 : 0;
}

function kebabize(str: string) {
  return str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? "-" : "") + $.toLowerCase())
}

function processLayersLoop(styles: Record<string, any>, prefix = "") {
  let layers = {} as Record<string, string[]>;

  const layersLoop = (polarity: string, styles: Record<string, any>, prefix = "") => {
    const priority = polarity === "^" ? "p" : "n";

    for (let [key, value] of Object.entries(styles)) {
      key = key.trimStart();
      if (key === 'root') {
        continue;
      }    
      
      if (typeof value === "object") {
        layersLoop(polarity, value, `${prefix !== "" ? `${prefix}#` : ""}${key}`);
      } else {
        const re = new RegExp(`^\\${polarity}`);

        if (key.match(re)) {
          const level = `${priority}${getLevel(key)}`;

          if (!Object.keys(layers).includes(level)) {
            layers[level] = [] as string[];
          }

          key = kebabize(key).replace(/^[\^|\$]+/g, "");
          layers[level]?.push(genStyleLine(level, prefix, `${key}: ${value}`));
        }
      }
    }
  }

  layersLoop("^", styles, prefix);
  layersLoop("$", styles, prefix);

  return layers;
}

function processRoot(root: any, className: string = "") {
  if (root !== undefined && Object.keys(root).length > 0) {
    const obj = Object.keys(root).map((key) => {
      let selector = key.trim().replace(/\[selector\]/g, `.${className}`);      
      const content = root[key];

      const selectorValue = Object.keys(content).map((key) => {
        return `${key}: ${content[key]}`;
      })

      return `${selector} { ${selectorValue.join("; ")} }`;
    });

    return obj.join("@@");
  }

  return "";
}

export type layersType = Record<string, {root: Record<string, string[]>, style: string[], keyframe: string[]}>;

// convert the markup from styles to unocss
async function genStyleRootObj(rules: Record<string, string>) {
  const layerArray: layersType = {
    default: {
      root: {},
      style: [],
      keyframe: []
    },
  };

  const selectors = [] as string[];

  Object.keys(rules).forEach((className) => {
    let element = rules[className] as string;
    const classDefinitions = element.split('||||');    

    classDefinitions.forEach(classDef => {
      if (classDef.length > 0) {
        if (classDef.match(/keyframes\#/)) {
          element = element.replace("keyframes#", "").replace("||||", "");
          element = element.replace("@keyframes", `@keyframes ${className}`);
          layerArray["default"]!.keyframe.push(element);
        } else if (classDef.match(/layer\#/)) {
            const s_text = classDef.split("layer#");

            if (s_text && s_text[1]) {
              const layers = JSON.parse(s_text[1]);
              
              Object.keys(layers).forEach((layer) => {
                if (!Object.keys(layerArray).includes(layer)) {
                  layerArray[layer] = {
                    root: {},
                    style: [],
                    keyframe: []
                  }
                }

                const lines = layers[layer] as string[];

                lines.map((line) => {
                  const _line = line.split("||");

                  if (!selectors.includes(_line[1]!)) {
                    selectors.push(_line[1]!);
                    layerArray[layer!]!.style.push(`${_line[2]!}||${_line[3]!}`.trim());                    
                  }
                });                
              });
            }
        } else if (classDef.match(/root\#/)) {
          const s_text = classDef.split("root#");

          if (s_text && s_text[1]) {
            const cssText = s_text[1].split("@@").map(item => item.trim()).filter(item => item != "");

            cssText.forEach((item) => {
              const regex = /{([^}]*)}/;
              const match = item.match(regex);

              if (match && match[1]) {
                let newClassName = item.replace(/{([^}]*)}/, "").trim();
                newClassName = newClassName.replace(/(\.\w+)(\s)\[/g, "$1[");

                if (!Object.keys(layerArray["default"]!.root).includes(newClassName)) {
                  layerArray["default"]!.root[newClassName] = [];
                }

                const items = match[1].split(";").filter(item => item !== " ").map(item => `${item.trim()};`);

                items.map(item => {
                  if (!layerArray["default"]!.root[newClassName]!.includes(item)) {
                    layerArray["default"]!.root[newClassName]!.push(...items);
                  }
                })
              }
            });
          }
        } else if (classDef.match(/style\#/)) {
          const s_text = classDef.split("style#");

          if (s_text && s_text[1]) {
            const lines = s_text[1].split("|||");

            // loop lines
            lines.forEach((line) => {
              const item = line.split("||");

              // remove dupes
              if (!selectors.includes(item[1]!)) {
                selectors.push(item[1]!);
                layerArray["default"]?.style.push(`${item[2]!}||${item[3]!}`.trim());
              }
            });            
          }
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
      
      // Object.keys(jsonStr).forEach((key) => {
      //   const styles = processStyles(jsonStr[key]).styles

      //   stylesFromClassNames.push(styles);
      // });
    });    
  }

  return `${stylesFromClassName.join(" ")} ${stylesFromClassNames.join(" ")}`.trim();
}

async function genLayers(layers: string, classNameStyles: Set<string>) {
  let layersArr = JSON.parse(layers) as layersType;

  // if (classNameStyles.size > 0) {
  //   layersArr["classNames"] = {
  //     root: {},
  //     style: [],
  //     keyframe: [],
  //   }

  //   layersArr["classNames"].style = [...classNameStyles];
  // }

  // // filter out any dupes, highest layer wins
  const filterLayersArr = filterDuplicates(layersArr);  

  const allPromises = Object.keys(filterLayersArr).map((layer) => {
    const layerStyles = filterLayersArr[layer]!.style;
    const layerRoot = filterLayersArr[layer]!.root;
    const layerKeyFrames = filterLayersArr[layer]!.keyframe;
    
    const styles = layerStyles.map((item) => {
      const line = item.split("||");
      return `${line[0]} {${line[1]}}`;
    });

    const rootText = Object.keys(layerRoot).map((key) => {
      if (layerRoot[key]!.length > 0) {
        return `${key} {${layerRoot[key]!.join("")}}`
      }
    }).filter(item => item !== undefined).join("\n");

    return `@layer ${layer} {
      ${layer === "default" && layerKeyFrames.length ? layerKeyFrames.join("\n") : ""}
      ${rootText !== "" ? `${rootText}\n` : ""}
      ${styles.join("\n")}
    }`
  });   

  let headers = Object.keys(filterLayersArr);
  headers.unshift("reset");
  const strHeaders = sortLayerHeaders(headers).join(", ");

  const css = `
    @layer ${strHeaders};

    ${allPromises.join("\n")}
  `;

  return css;
}

function sortLayerHeaders(arr: string[]) {
  // Step 1: Initialize arrays for each category
  const reset = [] as string[];
  const defaultArr = [] as string[];
  const pSeries = [] as string[];
  const nSeries = [] as string[];

  // Step 2: Iterate once to categorize and sort
  arr.forEach(item => {
    if (item === 'reset') {
        reset.push(item);
    } else if (item === 'default') {
        defaultArr.push(item);
    } else if (item.startsWith('p')) {
        pSeries.push(item);
    } else if (item.startsWith('n')) {
        nSeries.push(item);
    }
  });

  // Step 3: Sort the nSeries array in descending order
  nSeries.sort((a, b) => parseInt(b.slice(1), 10) - parseInt(a.slice(1), 10));

  // Step 4: Sort the pSeries array in ascending order
  pSeries.sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

  // Step 5: Return the arrays in the specified order
  const result = [...reset, ...nSeries, ...defaultArr, ...pSeries];

  return result;
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

export { 
  extractClassNames, 
  genLayers, 
  genStyleRootObj, 
  processStyles,
  createUID
};