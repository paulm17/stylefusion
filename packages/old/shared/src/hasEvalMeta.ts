import type { WYWEvalMeta } from './types';

export function hasEvalMeta(value: unknown): value is WYWEvalMeta {
  console.log("hasEvalMeta.ts - hasEvalMeta");
  return typeof value === 'object' && value !== null && '__wyw_meta' in value;
}
