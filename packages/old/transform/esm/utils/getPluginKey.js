export const getPluginKey = plugin => {
  console.log("getPluginKey - getPluginKey");
  if (typeof plugin === 'string') {
    return plugin;
  }
  if (Array.isArray(plugin)) {
    return getPluginKey(plugin[0]);
  }
  if (typeof plugin === 'object' && plugin !== null && 'key' in plugin) {
    return plugin.key ?? null;
  }
  return null;
};
//# sourceMappingURL=getPluginKey.js.map