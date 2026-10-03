"use strict";
/* How the app saves data: every piece is a localStorage item under the prefix "logbook:user:". */
const tA = "logbook";
function iu(e, t) {
  return `${tA}:${t ? "shared" : "user"}:${e}`;
}
const g_ = {
  async get(e, t = !1) {
    const r = window.localStorage.getItem(iu(e, t));
    if (r === null) throw new Error(`Key not found: ${e}`);
    return { key: e, value: r, shared: t };
  },
  async set(e, t, r = !1) {
    return (window.localStorage.setItem(iu(e, r), t), { key: e, value: t, shared: r });
  },
  async delete(e, t = !1) {
    return (window.localStorage.removeItem(iu(e, t)), { key: e, deleted: !0, shared: t });
  },
  async list(e = "", t = !1) {
    const r = iu(e, t),
      n = `${tA}:${t ? "shared" : "user"}:`;
    return {
      keys: Object.keys(window.localStorage)
        .filter((o) => o.startsWith(r))
        .map((o) => o.slice(n.length)),
      prefix: e,
      shared: t,
    };
  },
};
window.storage = g_;
