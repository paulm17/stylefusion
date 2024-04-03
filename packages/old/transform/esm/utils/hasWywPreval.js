export default function hasWywPreval(exports) {
  console.log("hasWywPreval - hasWywPreval");
  if (!exports || typeof exports !== 'object') {
    return false;
  }
  return '__wywPreval' in exports;
}
//# sourceMappingURL=hasWywPreval.js.map