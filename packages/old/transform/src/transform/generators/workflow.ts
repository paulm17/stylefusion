import { isAborted } from '../actions/AbortError';
import type { IWorkflowAction, SyncScenarioForAction } from '../types';

/**
 * The entry point for file processing. Sequentially calls `processEntrypoint`,
 * `evalFile`, `collect`, and `extract`. Returns the result of transforming
 * the source code as well as all artifacts obtained from code execution.
 */
export function* workflow(
  this: IWorkflowAction
): SyncScenarioForAction<IWorkflowAction> {
  console.log("transform - workflow");
  const { cache, options } = this.services;
  const { entrypoint } = this;

  if (entrypoint.ignored) {
    return {
      code: entrypoint.loadedAndParsed.code ?? '',
      sourceMap: options.inputSourceMap,
    };
  }

  try {
    yield* this.getNext('processEntrypoint', entrypoint, undefined, null);
    entrypoint.assertNotSuperseded();
  } catch (e) {
    if (isAborted(e) && entrypoint.supersededWith) {
      entrypoint.log('workflow aborted, schedule the next attempt');
      return yield* this.getNext(
        'workflow',
        entrypoint.supersededWith,
        undefined,
        null
      );
    }

    throw e;
  }

  const originalCode = entrypoint.loadedAndParsed.code ?? '';

  // File is ignored or does not contain any tags. Return original code.
  if (!entrypoint.hasWywMetadata()) {
    if (entrypoint.generation === 1) {
      // 1st generation here means that it's __wywPreval entrypoint
      // without __wywPreval, so we don't need it cached
      cache.delete('entrypoints', entrypoint.name);
    }

    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  // *** 2nd stage ***

  const evalStageResult = yield* this.getNext(
    'evalFile',
    entrypoint,
    undefined,
    null
  );

  if (evalStageResult === null) {
    return {
      code: originalCode,
      sourceMap: options.inputSourceMap,
    };
  }

  const [valueCache, dependencies] = evalStageResult;

  // *** 3rd stage ***

  const collectStageResult = yield* this.getNext(
    'collect',
    entrypoint,
    {
      valueCache,
    },
    null
  );

  if (!collectStageResult.metadata) {
    return {
      code: collectStageResult.code!,
      sourceMap: collectStageResult.map,
    };
  }

  // *** 4th stage

  const extractStageResult = yield* this.getNext(
    'extract',
    entrypoint,
    {
      processors: collectStageResult.metadata.processors,
    },
    null
  );

  return {
    ...extractStageResult,
    code: collectStageResult.code ?? '',
    dependencies,
    replacements: [
      ...extractStageResult.replacements,
      ...collectStageResult.metadata.replacements,
    ],
    sourceMap: collectStageResult.map,
  };
}
