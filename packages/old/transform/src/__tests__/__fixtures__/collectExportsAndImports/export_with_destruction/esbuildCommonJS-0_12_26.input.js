var __defProp = Object.defineProperty;
var __markAsModule = (target) =>
  __defProp(target, '__esModule', { value: true });
var __require =
  typeof require !== 'undefined'
    ? require
    : (x) => {
        throw new Error('Dynamic require of "' + x + '" is not supported');
      };
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
__export(exports, {
  a: () => a,
  b: () => b,
});
const obj = { a: 1, b: 2 };
const { a, b } = obj;
