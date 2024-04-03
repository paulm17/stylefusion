import evaluate from '../../evaluators';
import hasWywPreval from '../../utils/hasWywPreval';
import { isUnprocessedEntrypointError } from '../actions/UnprocessedEntrypointError';
const wrap = fn => {
  try {
    return fn();
  } catch (e) {
    return e;
  }
};

/**
 * Executes the code prepared in previous steps within the current `Entrypoint`.
 * Returns all exports that were requested in `only`.
 */
// eslint-disable-next-line require-yield
export function* evalFile() {
  console.log("transform - evalFile");
  const {
    entrypoint
  } = this;
  const {
    log
  } = entrypoint;
  log(`>> evaluate __wywPreval`);
  let evaluated;
  while (evaluated === undefined) {
    try {
      evaluated = evaluate(this.services, entrypoint);
    } catch (e) {
      if (isUnprocessedEntrypointError(e)) {
        entrypoint.log('Evaluation has been aborted because one if the required files is not processed. Schedule reprocessing and repeat evaluation.');
        yield ['processEntrypoint', e.entrypoint, undefined];
      } else {
        throw e;
      }
    }
  }
  const wywPreval = hasWywPreval(evaluated.value) ? evaluated.value.__wywPreval : undefined;
  if (!wywPreval) {
    return null;
  }
  const valueCache = new Map();
  Object.entries(wywPreval).forEach(([key, lazyValue]) => {
    const value = wrap(lazyValue);
    valueCache.set(key, value);
  });
  log(`<< evaluated __wywPreval %O`, valueCache);
  return [valueCache, evaluated.dependencies];
}
//# sourceMappingURL=evalFile.js.map