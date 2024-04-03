export const withTransformMetadata = value => typeof value === 'object' && value !== null && typeof value.wywInJS === 'object';
export const getTransformMetadata = value => {
  console.log("TransformMetadata - getTransformMetadata");
  if (withTransformMetadata(value) && value.wywInJS !== null) {
    const metadata = value.wywInJS;
    // eslint-disable-next-line no-param-reassign
    delete value.wywInJS;
    return metadata;
  }
  return undefined;
};
//# sourceMappingURL=TransformMetadata.js.map