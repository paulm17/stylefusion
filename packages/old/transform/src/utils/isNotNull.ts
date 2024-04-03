export function isNotNull<T>(x: T | null): x is T {
  console.log("isNotNull - isNotNull");
  return x !== null;
}
