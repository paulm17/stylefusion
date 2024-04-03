function _usingCtx2() { var r = "function" == typeof SuppressedError ? SuppressedError : function (r, n) { var e = Error(); return e.name = "SuppressedError", e.suppressed = n, e.error = r, e; }, n = {}, e = []; function using(r, n) { if (null != n) { if (Object(n) !== n) throw new TypeError("using declarations can only be used with objects, functions, null, or undefined."); if (r) var o = n[Symbol.asyncDispose || Symbol.for("Symbol.asyncDispose")]; if (null == o && (o = n[Symbol.dispose || Symbol.for("Symbol.dispose")]), "function" != typeof o) throw new TypeError("Property [Symbol.dispose] is not a function."); e.push({ v: n, d: o, a: r }); } return n; } return { e: n, u: using.bind(null, !1), a: using.bind(null, !0), d: function () { var o = this.e; function next() { for (; r = e.pop();) try { var r, t = r.d.call(r.v); if (r.a) return Promise.resolve(t).then(next, err); } catch (r) { return err(r); } if (o !== n) throw o; } function err(e) { return o = o !== n ? new r(o, e) : e, next(); } return next(); } }; }
import { isAborted } from '../actions/AbortError';
/**
 * The first stage of processing an entrypoint.
 * This stage is responsible for:
 * - scheduling the explodeReexports action
 * - scheduling the transform action
 * - rescheduling itself if the entrypoint is superseded
 */
export function* processEntrypoint() {
  const {
    only,
    log
  } = this.entrypoint;
  log('start processing (only: %o)', only);
  try {
    try {
      var _usingCtx = _usingCtx2();
      const abortSignal = _usingCtx.u(this.createAbortSignal());
      yield ['explodeReexports', this.entrypoint, undefined, abortSignal];
      const result = yield* this.getNext('transform', this.entrypoint, undefined, abortSignal);
      this.entrypoint.assertNotSuperseded();
      this.entrypoint.setTransformResult(result);
      log('entrypoint processing finished');
    } catch (_) {
      _usingCtx.e = _;
    } finally {
      _usingCtx.d();
    }
  } catch (e) {
    if (isAborted(e) && this.entrypoint.supersededWith) {
      log('processing aborted, schedule the next attempt');
      yield* this.getNext('processEntrypoint', this.entrypoint.supersededWith, undefined, null);
      return;
    }
    log(`Unhandled error: %O`, e);
    throw e;
  }
}
//# sourceMappingURL=processEntrypoint.js.map