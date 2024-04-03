const PLACEHOLDER = /\[(.*?)]/g;
const isValidArgName = (key, args) => key in args;
export function buildSlug(pattern, args) {
  console.log("buildSlug.ts - buildSlug");
  return pattern.replace(PLACEHOLDER, (_, name) => isValidArgName(name, args) ? args[name].toString() : '');
}
//# sourceMappingURL=buildSlug.js.map