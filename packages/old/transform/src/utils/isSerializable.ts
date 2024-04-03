import { isBoxedPrimitive } from '@wyw-in-js/shared';

import type { Serializable } from '../types';

export function isSerializable(o: unknown): o is Serializable {
  console.log("isSerializable - isSerializable");
  if (Array.isArray(o)) {
    return o.every(isSerializable);
  }

  if (o === null) return true;

  if (isBoxedPrimitive(o)) return true;

  if (typeof o === 'object') {
    return Object.values(o).every(isSerializable);
  }

  return (
    typeof o === 'string' || typeof o === 'number' || typeof o === 'boolean'
  );
}
