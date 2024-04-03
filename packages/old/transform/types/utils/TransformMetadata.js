"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransformMetadata = exports.withTransformMetadata = void 0;
const withTransformMetadata = (value) => typeof value === 'object' &&
    value !== null &&
    typeof value.wywInJS === 'object';
exports.withTransformMetadata = withTransformMetadata;
const getTransformMetadata = (value) => {
    console.log("TransformMetadata - getTransformMetadata");
    if ((0, exports.withTransformMetadata)(value) && value.wywInJS !== null) {
        const metadata = value.wywInJS;
        // eslint-disable-next-line no-param-reassign
        delete value.wywInJS;
        return metadata;
    }
    return undefined;
};
exports.getTransformMetadata = getTransformMetadata;
