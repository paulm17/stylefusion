import type { WYWTransformMetadata } from '../../utils/TransformMetadata';
import { withTransformMetadata } from '../../utils/TransformMetadata';

type Serializer<T> = {
  serialize: (value: T) => string;
  test: (value: unknown) => value is T;
};

export default {
  test: withTransformMetadata,
  serialize: ({ wywInJS }) => `
CSS:

${Object.keys(wywInJS.rules ?? {})
  .map((selector) =>
    wywInJS.rules[selector].atom
      ? wywInJS.rules[selector].cssText
      : `${selector} {${wywInJS.rules[selector].cssText}}`
  )
  .join('\n')}

Dependencies: ${
    wywInJS.dependencies?.length ? wywInJS.dependencies.join(', ') : 'NA'
  }
`,
} as Serializer<{ wywInJS: WYWTransformMetadata & { rules?: any } }>;
