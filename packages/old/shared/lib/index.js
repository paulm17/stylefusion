"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
Object.defineProperty(exports, "Debugger", {
  enumerable: true,
  get: function () {
    return _debug.Debugger;
  }
});
Object.defineProperty(exports, "IVariableContext", {
  enumerable: true,
  get: function () {
    return _IVariableContext.IVariableContext;
  }
});
Object.defineProperty(exports, "ValueType", {
  enumerable: true,
  get: function () {
    return _types.ValueType;
  }
});
Object.defineProperty(exports, "asyncResolveFallback", {
  enumerable: true,
  get: function () {
    return _asyncResolveFallback.asyncResolveFallback;
  }
});
Object.defineProperty(exports, "enableDebug", {
  enumerable: true,
  get: function () {
    return _logger.enableDebug;
  }
});
Object.defineProperty(exports, "findPackageJSON", {
  enumerable: true,
  get: function () {
    return _findPackageJSON.findPackageJSON;
  }
});
Object.defineProperty(exports, "hasEvalMeta", {
  enumerable: true,
  get: function () {
    return _hasEvalMeta.hasEvalMeta;
  }
});
Object.defineProperty(exports, "isBoxedPrimitive", {
  enumerable: true,
  get: function () {
    return _isBoxedPrimitive.isBoxedPrimitive;
  }
});
Object.defineProperty(exports, "isFeatureEnabled", {
  enumerable: true,
  get: function () {
    return _isFeatureEnabled.isFeatureEnabled;
  }
});
Object.defineProperty(exports, "logger", {
  enumerable: true,
  get: function () {
    return _logger.logger;
  }
});
Object.defineProperty(exports, "slugify", {
  enumerable: true,
  get: function () {
    return _slugify.slugify;
  }
});
Object.defineProperty(exports, "syncResolve", {
  enumerable: true,
  get: function () {
    return _asyncResolveFallback.syncResolve;
  }
});
var _debug = require("debug");
var _asyncResolveFallback = require("./asyncResolveFallback");
var _hasEvalMeta = require("./hasEvalMeta");
var _findPackageJSON = require("./findPackageJSON");
var _isBoxedPrimitive = require("./isBoxedPrimitive");
var _IVariableContext = require("./IVariableContext");
var _logger = require("./logger");
var _isFeatureEnabled = require("./options/isFeatureEnabled");
var _slugify = require("./slugify");
var _types = require("./types");
//# sourceMappingURL=index.js.map