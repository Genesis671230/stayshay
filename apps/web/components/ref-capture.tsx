"use client";

import { useEffect } from "react";

const CODE_RE = /^[A-Za-z0-9]{4,12}$/;

/**
 * Remembers who referred this visitor (?ref=CODE or a partner profile) for 90 days.
 * First referrer wins, so a later link can't take over someone else's introduction.
 */
export function RefCapture({ code }: { code?: string }) {
  useEffect(() => {
    const ref = code ?? new URLSearchParams(location.search).get("ref");
    if (!ref || !CODE_RE.test(ref)) return;
    if (document.cookie.split("; ").some((c) => c.startsWith("ss_ref="))) return;
    document.cookie = `ss_ref=${ref.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
    window.gtag?.("event", "referral_visit", { ref_code: ref.toUpperCase() });
  }, [code]);
  return null;
}
