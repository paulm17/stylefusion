"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createFileReporter = void 0;
var _fs = require("fs");
var _path = _interopRequireDefault(require("path"));
var _EventEmitter = require("../utils/EventEmitter");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/* eslint-disable no-console */

const workingDir = process.cwd();
function replacer(_key, value) {
  if (typeof value === 'string' && _path.default.isAbsolute(value)) {
    return _path.default.relative(workingDir, value);
  }
  if (value instanceof Map) {
    return Array.from(value.entries()).reduce((obj, [k, v]) => {
      const key = replacer(k, k);
      return {
        ...obj,
        [key]: replacer(key, v)
      };
    }, {});
  }
  return value;
}
function printTimings(timings, startedAt, sourceRoot) {
  if (timings.size === 0) {
    return;
  }
  console.log(`\nTimings:`);
  console.log(`  Total: ${(performance.now() - startedAt).toFixed()}ms`);
  Array.from(timings.entries()).forEach(([label, byLabel]) => {
    console.log(`\n  By ${label}:`);
    const array = Array.from(byLabel.entries());
    // array.sort(([, a], [, b]) => b - a);
    array.sort(([a], [b]) => a.localeCompare(b)).forEach(([value, time]) => {
      const name = value.startsWith(sourceRoot) ? _path.default.relative(sourceRoot, value) : value;
      console.log(`    ${name}: ${time}ms`);
    });
  });
}
const writeJSONl = (stream, data) => {
  stream.write(`${JSON.stringify(data, replacer)}\n`);
};
const createFileReporter = (options = false) => {
  if (!options || !options.dir) {
    return {
      emitter: _EventEmitter.EventEmitter.dummy,
      onDone: () => {}
    };
  }
  const reportFolder = (0, _fs.existsSync)(options.dir) ? options.dir : (0, _fs.mkdirSync)(options.dir, {
    recursive: true
  });
  if (!reportFolder) {
    throw new Error(`Could not create directory ${options.dir}`);
  }
  const actionStream = (0, _fs.createWriteStream)(_path.default.join(options.dir, 'actions.jsonl'));
  const dependenciesStream = (0, _fs.createWriteStream)(_path.default.join(options.dir, 'dependencies.jsonl'));
  const entrypointStream = (0, _fs.createWriteStream)(_path.default.join(options.dir, 'entrypoints.jsonl'));
  const startedAt = performance.now();
  const timings = new Map();
  const addTiming = (label, key, value) => {
    if (!timings.has(label)) {
      timings.set(label, new Map());
    }
    const forLabel = timings.get(label);
    forLabel.set(key, Math.round((forLabel.get(key) || 0) + value));
  };
  const processDependencyEvent = ({
    file,
    only,
    imports,
    fileIdx
  }) => {
    writeJSONl(dependenciesStream, {
      file,
      only,
      imports,
      fileIdx
    });
  };
  const processSingleEvent = meta => {
    if (meta.type === 'dependency') {
      processDependencyEvent(meta);
    }
  };
  const startTimes = new Map();
  const onEvent = (meta, type) => {
    if (type === 'single') {
      processSingleEvent(meta);
      return;
    }
    if (type === 'start') {
      Object.entries(meta).forEach(([label, value]) => {
        startTimes.set(`${label}\0${value}`, performance.now());
      });
    } else {
      Object.entries(meta).forEach(([label, value]) => {
        const startTime = startTimes.get(`${label}\0${value}`);
        if (startTime) {
          addTiming(label, String(value), performance.now() - startTime);
        }
      });
    }
  };
  let actionId = 0;
  const onAction = (...args) => {
    if ((0, _EventEmitter.isOnActionStartArgs)(args)) {
      const [, timestamp, type, idx, entrypointRef] = args;
      writeJSONl(actionStream, {
        actionId,
        entrypointRef,
        idx,
        startedAt: timestamp,
        type
      });

      // eslint-disable-next-line no-plusplus
      return actionId++;
    }
    const [result, timestamp, id, isAsync, error] = args;
    writeJSONl(actionStream, {
      actionId: id,
      error,
      finishedAt: timestamp,
      isAsync,
      result: `${result}ed`
    });
    return id;
  };
  const onEntrypointEvent = (emitterId, timestamp, event) => {
    entrypointStream.write(`${JSON.stringify([emitterId, timestamp, event])}\n`);
  };
  const emitter = new _EventEmitter.EventEmitter(onEvent, onAction, onEntrypointEvent);
  return {
    emitter,
    onDone: sourceRoot => {
      if (options.print) {
        printTimings(timings, startedAt, sourceRoot);
        console.log('\nMemory usage:', process.memoryUsage());
      }
      actionStream.end();
      dependenciesStream.end();
      timings.clear();
    }
  };
};
exports.createFileReporter = createFileReporter;
//# sourceMappingURL=fileReporter.js.map