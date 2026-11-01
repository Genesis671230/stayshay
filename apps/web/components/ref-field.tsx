"use client";

import { useEffect, useState } from "react";

export function readRefCookie(): string {
  return document.cookie.split("; ").find((c) => c.startsWith("ss_ref="))?.slice(7) ?? "";
}

/** A code someone types on purpose replaces the link cookie. */
export function saveRefCookie(code: string) {
  if (!/^[A-Za-z0-9]{4,12}$/.test(code)) return;
  document.cookie = `ss_ref=${code.toUpperCase()}; path=/; max-age=${60 * 60 * 24 * 90}; samesite=lax${location.protocol === "https:" ? "; secure" : ""}`;
}

/** Optional "Referral code" input: prefilled from the link the person arrived with, checked as they type. */
export function RefField({ value, onChange, className = "" }: { value: string; onChange: (v: string) => void; className?: string }) {
  const [who, setWho] = useState<string | null | false>(null);
  useEffect(() => {
    if (!value) {
      const c = readRefCookie();
      if (c) onChange(c);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const code = value.trim();
    if (code.length < 4) {
      setWho(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/referrals/check?code=${encodeURIComponent(code)}`)
        .then((r) => r.json())
        .then((j) => {
          setWho(j.ok ? j.name : false);
          if (j.ok) saveRefCookie(j.code);
        })
        .catch(() => setWho(null));
    }, 350);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[13px] font-semibold">
        Referral code <span className="font-normal text-muted">(optional)</span>
      </span>
      <input
        className="w-full rounded-[14px] border border-line bg-white px-4 py-3 text-[15px] uppercase tracking-wider focus:border-brand focus:outline-none"
        value={value}
        maxLength={12}
        autoCapitalize="characters"
        placeholder="e.g. RASHID7K2"
        onChange={(e) => onChange(e.target.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase())}
      />
      {who && <span className="mt-1 block text-[12.5px] text-brand">Referred by {who}</span>}
      {who === false && <span className="mt-1 block text-[12.5px] text-warn">We couldn't find that code. Check it, or leave it empty.</span>}
    </label>
  );
}
