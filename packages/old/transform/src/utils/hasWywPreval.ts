import type { Value } from '@wyw-in-js/processor-utils';

export default function hasWywPreval(exports: unknown): exports is {
  __wywPreval: Record<string, () => Value> | null | undefined;
} {
  console.log("hasWywPreval - hasWywPreval");
  if (!exports || typeof exports !== 'object') {
    return false;
  }

  return '__wywPreval' in exports;
}
