const PLACEHOLDER = /\[(.*?)]/g;

const isValidArgName = <TArgs extends Record<string, { toString(): string }>>(
  key: string | number | symbol,
  args: TArgs
): key is keyof TArgs => key in args;

export function buildSlug<TArgs extends Record<string, { toString(): string }>>(
  pattern: string,
  args: TArgs
) {
  console.log("buildSlug.ts - buildSlug");
  return pattern.replace(PLACEHOLDER, (_, name: string) =>
    isValidArgName(name, args) ? args[name].toString() : ''
  );
}
