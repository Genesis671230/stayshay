import type { LeadRecord } from "./store";
import { esc, notify } from "./telegram";
import { SITE } from "./seo";

const KIND: Record<string, string> = { inquiry: "Viewing request", tenant: "Find-me-a-room request", owner: "Owner wants to list", roommate: "Roommate profile", chat: "Shay chat lead", family: "FAMILY home request (apartment)", campaign: "🏆 CHALLENGE application (AED 500–5,000)" };

/** Instant Telegram alert for every new lead, with one-tap WhatsApp back to them. Never muted. */
export function leadAlert(l: LeadRecord) {
  const d = l.data as Record<string, unknown>;
  const details = Object.entries(d)
    .filter(([k, v]) => !["name", "phone", "website"].includes(k) && (typeof v === "string" || typeof v === "number" || typeof v === "boolean") && v !== "")
    .slice(0, 9)
    .map(([k, v]) => `${esc(k)}: ${esc(String(v).slice(0, 160))}`);
  const digits = l.phone.replace(/\D/g, "");
  notify(
    [`<b>${KIND[l.kind] ?? "New lead"}</b>${l.refCode ? ` · via referral ${esc(l.refCode)}` : ""}`, `${esc(l.name)} · ${esc(l.phone)}`, ...details].join("\n"),
    {
      urgent: true,
      buttons: [[...(digits.length >= 9 ? [{ text: "WhatsApp them", url: `https://wa.me/${digits}` }] : []), { text: "Open admin", url: `${SITE}/admin` }]],
    },
  );
}
