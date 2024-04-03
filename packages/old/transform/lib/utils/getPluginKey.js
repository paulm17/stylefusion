"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getPluginKey = void 0;
const getPluginKey = plugin => {
  console.log("getPluginKey - getPluginKey");
  if (typeof plugin === 'string') {
    return plugin;
  }
  if (Array.isArray(plugin)) {
    return getPluginKey(plugin[0]);
  }
  if (typeof plugin === 'object' && plugin !== null && 'key' in plugin) {
    var _key;
    return (_key = plugin.key) !== null && _key !== void 0 ? _key : null;
  }
  return null;
};
exports.getPluginKey = getPluginKey;
//# sourceMappingURL=getPluginKey.js.map