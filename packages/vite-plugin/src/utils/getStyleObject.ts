import os from 'node:os';
import fs from 'fs';
import { css } from './emotion';
import { getHelpers } from './helpers';

// function extractStylesObject(code: string) {
//   // Step 1: Match the function block
//   const functionBlockMatch = code.match(
//     /function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s+[\s\S]*}?\}/
//   );

//   if (!functionBlockMatch) return ""; // No function block found

//   // Step 2: Remove all new lines
//   const singleLineCode = functionBlockMatch[0]
//     .replace(/[\r\n]+/gm, "")
//     .replace(/\s+/g, " ");

//   const components = ['Button', 'Badge', 'Box', 'Alert'];
//   const pattern = new RegExp(`\\((${components.join('|')})\\,\\s+[\\s\\S]*?\\}\\)`, 'g');

//   // Step 3: Extract Raikou component
//   const raikouComponentMatches = singleLineCode.match(pattern);

//   if (!raikouComponentMatches) return ""; // Nothing found

//   // Step 4: Extract theme function
//   const themeFunction = raikouComponentMatches[0].match(/\(theme\,\s+[\s\S]*?\}\)/gm);

// 	if (!themeFunction) return ""; // Nothing found

// 	const styleObject = themeFunction[0].split(" => ")[1].replace(/[()]/g, '');

// 	return `return ${styleObject}`;
// }

function extractStylesObject(code: string) {
  // Step 1: Match the function block
  const functionBlockMatch = code.match(
    /function\s+\w+\s*\(\)\s*\{[\s\S]*?return\s+[\s\S]*}?\}/
  );

  if (!functionBlockMatch) return ""; // No function block found

  // Step 2: Remove all new lines
  const singleLineCode = functionBlockMatch[0]
    .replace(/[\r\n]+/gm, "")
    .replace(/\s+/g, " ");
    
  const components = ['Button', 'Badge', 'Box', 'Alert'];
  const pattern = new RegExp(`\<(${components.join('|')})\\s+[\\s\\S]*(${components.join('|')})\\>`, 'gm');
  
  // Step 3: Extract Raikou component
  const raikouComponentMatches = singleLineCode.match(pattern);

  if (!raikouComponentMatches) return ""; // Nothing found
  
  // Step 4: Extract theme function
  const themeFunction = raikouComponentMatches[0].match(/\(theme\,\s+[\s\S]*?\}\)/gm);

  if (!themeFunction) return ""; // Nothing found

  const styleObject = themeFunction[0].split(" => ")[1].replace(/[()]/g, '');

  return `return ${styleObject}`;
}

function replaceStylesObject(id: string, code: string, rawTheme: any) {
  if (id.endsWith(".tsx")) {
    const styleObject = extractStylesObject(code);
    const styles = new Function("theme", "u", styleObject);
    const stylesObject = typeof styles === 'function' ? styles(rawTheme, getHelpers(rawTheme as any)) : styles;

    if (!stylesObject) {
      return code;
    }

    const cssClassNames = Object.keys(stylesObject).reduce((acc, key) => {
      const value = stylesObject[key];
      const parsedValue = typeof value === 'function' ? value(rawTheme) : value;
      return { ...acc, [key]: css(parsedValue) };
    }, {})

    const componentName = getComponentName(code);

    if (componentName) {
      writeFile(componentName, cssClassNames);
    }

    // replace styles object with classNames
    return code.replace(/styles\=\{\(theme\,\s+[\s\S]*?\}\)\}/, "");
  }

  return code;
}

function getComponentName(code: string) {
  const components = ['Button', 'Badge', 'Box', 'Alert'];
  const pattern = new RegExp(`(?<=<)(${components.join('|')})`, 'gm');
  const matches = code.match(pattern);
  return matches ? matches[0] : null;
}

function writeFile(componentName: string, cssClassNames: any) {
  const fileName = `raikou_tmp_file.txt`;
  const filePath = `${os.tmpdir()}/${fileName}`;
  console.log(`${componentName}_${JSON.stringify(cssClassNames)}`);
  fs.writeFileSync(filePath, `${componentName}_${JSON.stringify(cssClassNames)}`, { encoding: 'utf8', flag: 'w', mode: 0o666 });
}

function removeFile() {
  const fileName = `raikou_tmp_file.txt`;
  const filePath = `${os.tmpdir()}/${fileName}`;
  fs.unlinkSync(filePath);
}

export { extractStylesObject, replaceStylesObject, removeFile };