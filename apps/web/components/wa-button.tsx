"use client";

import { stayshayWhatsapp } from "@/lib/contact";
import { track } from "./analytics";

/** Tell the team (Telegram) and analytics that someone opened WhatsApp, without slowing the tap down. */
export function pingWa(kind: string, label: string) {
  track("whatsapp_click", { method: kind, label });
  try {
    const body = JSON.stringify({ kind, label, page: location.pathname });
    if (!navigator.sendBeacon?.("/api/wa", new Blob([body], { type: "application/json" }))) {
      void fetch("/api/wa", { method: "POST", headers: { "content-type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    /* never block the tap */
  }
}

/** One tap to WhatsApp with the request typed out. No form, no steps. Works without JS too (plain link). */
export function WaButton({ text, kind = "ask", label, className, children }: { text: string; kind?: string; label: string; className?: string; children: React.ReactNode }) {
  return (
    <a href={stayshayWhatsapp(text)} target="_blank" rel="noopener noreferrer" onClick={() => pingWa(kind, label)} className={className}>
      {children}
    </a>
  );
}
