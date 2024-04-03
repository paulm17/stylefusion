/**
 * Collector traverses the AST and collects information about imports and
 * all usages of WYW-processors.
 */

import { logger } from '@wyw-in-js/shared';
import { EventEmitter } from '../utils/EventEmitter';
import { applyProcessors } from '../utils/getTagProcessor';
import { removeWithRelated } from '../utils/scopeHelpers';
import { invalidateTraversalCache } from '../utils/traversalCache';
export const filename = __filename;
export function collector(file, options, values) {
  console.log("collector - collector");
  const eventEmitter = options.eventEmitter ?? EventEmitter.dummy;
  const processors = [];
  eventEmitter.perf('transform:collector:processTemplate', () => {
    applyProcessors(file.path, file.opts, options, processor => {
      processor.build(values);
      processor.doRuntimeReplacement();
      processors.push(processor);
    });
  });
  if (processors.length === 0) {
    // We didn't find any processors.
    return processors;
  }

  // We can remove __wywPreval export and all related code
  const prevalExport = file.path.scope.getData('__wywPreval')?.findParent(p => p.isExpressionStatement());
  if (prevalExport) {
    removeWithRelated([prevalExport]);
  }
  return processors;
}
export default function collectorPlugin(babel, options) {
  console.log("collector - collectorPlugin");
  const values = options.values ?? new Map();
  const debug = logger.extend('collector');
  return {
    name: '@wyw-in-js/transform/collector',
    pre(file) {
      debug('start %s', file.opts.filename);
      const processors = collector(file, options, values);
      if (processors.length === 0) {
        // We didn't find any wyw-in-js template literals.
        return;
      }
      this.file.metadata.wywInJS = {
        processors,
        replacements: [],
        rules: {},
        dependencies: []
      };
      debug('end %s', file.opts.filename);
    },
    visitor: {},
    post(file) {
      invalidateTraversalCache(file.path);
    }
  };
}
//# sourceMappingURL=collector.js.map