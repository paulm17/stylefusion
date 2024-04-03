"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginKey = void 0;
const getPluginKey = (plugin) => {
    console.log("getPluginKey - getPluginKey");
    if (typeof plugin === 'string') {
        return plugin;
    }
    if (Array.isArray(plugin)) {
        return (0, exports.getPluginKey)(plugin[0]);
    }
    if (typeof plugin === 'object' && plugin !== null && 'key' in plugin) {
        return plugin.key ?? null;
    }
    return null;
};
exports.getPluginKey = getPluginKey;
