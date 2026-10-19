"use strict";
// Standalone teaching example; not private production source.
// Pure in-memory transition, no external execution or credentials.
function reconcile(current, event) {
  const unchanged = reason => ({...current, accepted:false, reason});
  if (!event || event.executionId !== current.executionId || event.attempt !== current.attempt) return unchanged("stale-or-mismatched");
  if (current.status !== "uncertain") return unchanged("already-final-or-not-uncertain");
  if (event.kind !== "operator-close" || event.reviewed !== true) return unchanged("review-required");
  if (!["failed","cancelled"].includes(event.outcome)) return unchanged("unsupported-outcome");
  return {...current,status:event.outcome,accepted:true,reason:"reviewed-close"};
}
function check(name, condition) { if (!condition) throw new Error("FAIL: " + name); console.log("PASS: " + name); }
const base = {executionId:"demo-run-a",attempt:2,status:"uncertain"};
const event = {executionId:"demo-run-a",attempt:2,kind:"operator-close",reviewed:true,outcome:"failed"};
const closed = reconcile(base,event);
check("matching reviewed close accepted", closed.accepted && closed.status === "failed");
check("original state not mutated", base.status === "uncertain");
check("duplicate close rejected", !reconcile(closed,event).accepted);
check("old attempt rejected", !reconcile(base,{...event,attempt:1}).accepted);
check("wrong execution rejected", !reconcile(base,{...event,executionId:"demo-run-b"}).accepted);
check("late success cannot overwrite final", reconcile(closed,{...event,kind:"worker-result",outcome:"succeeded"}).status === "failed");
check("review required", !reconcile(base,{...event,reviewed:false}).accepted);
check("success not inferred from uncertainty", !reconcile(base,{...event,outcome:"succeeded"}).accepted);
console.log("8/8 standalone checks passed. No atomic DB update, queue, Runner or end-to-end execution is tested.");
