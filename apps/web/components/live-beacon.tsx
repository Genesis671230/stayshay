"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const store = (s: Storage | undefined, k: string, make: () => string): [string, boolean] => {
  try {
    const v = s?.getItem(k);
    if (v) return [v, true];
    const n = make();
    s?.setItem(k, n);
    return [n, false];
  } catch {
    return [make(), false];
  }
};
const rid = () => Math.random().toString(36).slice(2, 12) + Date.now().toString(36);

/**
 * First-party live-visitor beacon for the founder's Telegram alerts: path, referrer, screen width, a random
 * session id. No cookies, no personal data from the page; the server adds IP-based location.
 */
export function LiveBeacon() {
  const path = usePathname();
  useEffect(() => {
    const [, returning] = store(typeof localStorage === "undefined" ? undefined : localStorage, "ss_vid", rid);
    const [sid] = store(typeof sessionStorage === "undefined" ? undefined : sessionStorage, "ss_sid", rid);
    const q = new URLSearchParams(location.search);
    const utm = [q.get("utm_source"), q.get("utm_campaign")].filter(Boolean).join("/") || undefined;
    const send = () => {
      const body = JSON.stringify({ sid, path: location.pathname, ref: document.referrer || undefined, w: innerWidth, utm, r: returning ? 1 : 0 });
      if (!navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }))) fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    };
    send();
    const beat = setInterval(() => document.visibilityState === "visible" && send(), 60_000);
    return () => clearInterval(beat);
  }, [path]);
  return null;
}
