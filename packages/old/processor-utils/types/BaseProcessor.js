"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseProcessor = void 0;
const generator_1 = __importDefault(require("@babel/generator"));
const shared_1 = require("@wyw-in-js/shared");
const getClassNameAndSlug_1 = __importDefault(require("./utils/getClassNameAndSlug"));
const toCSS_1 = require("./utils/toCSS");
const validateParams_1 = require("./utils/validateParams");
class BaseProcessor {
    tagSource;
    astService;
    location;
    replacer;
    displayName;
    isReferenced;
    idx;
    options;
    context;
    static SKIP = Symbol('skip');
    artifacts = [];
    className = "";
    styleRoot = "";
    styleStr = "";
    dependencies = [];
    interpolations = [];
    slug;
    callee;
    evaluated;
    constructor(params, tagSource, astService, location, replacer, displayName, isReferenced, idx, options, context) {
        this.tagSource = tagSource;
        this.astService = astService;
        this.location = location;
        this.replacer = replacer;
        this.displayName = displayName;
        this.isReferenced = isReferenced;
        this.idx = idx;
        this.options = options;
        this.context = context;
        (0, validateParams_1.validateParams)(params, ['callee'], 'Unknown error: a callee param is not specified');
        console.log("processor-utils - baseprocessor.ts");
        console.log("className generated here");
        const { className, slug } = (0, getClassNameAndSlug_1.default)(this.displayName, this.idx, this.options, this.context);
        this.className = className;
        this.slug = slug;
        [[, this.callee]] = params;
    }
    isValidValue(value) {
        return (typeof value === 'function' || (0, toCSS_1.isCSSable)(value) || (0, shared_1.hasEvalMeta)(value));
    }
    toString() {
        return this.tagSourceCode();
    }
    tagSourceCode() {
        if (this.callee.type === 'Identifier') {
            return this.callee.name;
        }
        return (0, generator_1.default)(this.callee).code;
    }
}
exports.BaseProcessor = BaseProcessor;
