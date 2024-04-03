let nextIdx = 1;
const processed = new Map();
export function getFileIdx(name) {
  console.log("getFileIdx - getFileIdx");
  if (!processed.has(name)) {
    // eslint-disable-next-line no-plusplus
    processed.set(name, nextIdx++);
  }
  return processed.get(name).toString().padStart(5, '0');
}
//# sourceMappingURL=getFileIdx.js.map