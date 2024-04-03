"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFeatureEnabled = void 0;
const minimatch_1 = require("minimatch");
const cachedMatchers = new Map();
const isFeatureEnabled = (features, featureName, filename) => {
    console.log("options/isFeatureEnabled.ts - isFeatureEnabled");
    const value = features?.[featureName] ?? false;
    if (typeof value === 'boolean') {
        return value;
    }
    // Fast check for glob patterns
    if (value === '*' || value === '**/*') {
        return true;
    }
    const array = Array.isArray(value) ? value : [value];
    /**
     * Check rule by rule like .gitignore
     */
    return array
        .map((pattern) => {
        let matcher = cachedMatchers.get(pattern);
        if (!matcher) {
            matcher = [pattern.startsWith('!'), new minimatch_1.Minimatch(pattern)];
            cachedMatchers.set(pattern, matcher);
        }
        return [matcher[0], matcher[1].match(filename)];
    })
        .reduce((acc, [negated, match]) => (negated ? acc && match : acc || match), false);
};
exports.isFeatureEnabled = isFeatureEnabled;
