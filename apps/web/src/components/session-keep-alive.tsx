"use client";

import { useEffect } from "react";

const KEY = "kb_keepalive";
/** Well under the shortest rotation interval, and long enough that clicking
 * through six report pages costs one request rather than six. */
const MIN_GAP_MS = 60_000;

/** A fire-and-forget ping so a session that only ever reads pages still
 * rotates its token. Renders nothing, blocks nothing, and a failure is
 * ignored: the session is already valid, this only refreshes it. */
export function SessionKeepAlive() {
  useEffect(() => {
    // sessionStorage, not a ref: the point is to survive the navigations
    // between page loads, which is exactly when a ref would be gone.
    const last = Number(sessionStorage.getItem(KEY) ?? 0);
    if (Date.now() - last < MIN_GAP_MS) return;
    sessionStorage.setItem(KEY, String(Date.now()));
    void fetch("/api/session/keep", { method: "POST" }).catch(() => {});
  }, []);
  return null;
}
