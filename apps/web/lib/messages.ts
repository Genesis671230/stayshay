import { TYPE_LABEL, whatsappLink, type ListingType } from "@stayshay/core";

/** Ready-to-send WhatsApp texts for the admin. Every button opens WhatsApp with the text; nothing sends by itself. */
const SITE = "https://stayshay.com";
const first = (name: string) => name.trim().split(/\s+/)[0] ?? name;
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export const wa = (phone: string, text: string) => whatsappLink(phone, text);
export const tel = (phone: string) => `tel:+${phone.replace(/\D/g, "")}`;

export function replyToLead(kind: string, name: string, data: Record<string, unknown>, extra: { listingTitle?: string | null; listingId?: string | null; areaName?: (s: string) => string } = {}): string {
  const n = first(name);
  if (kind === "inquiry") {
    return `Hi ${n}, this is Stayshay about "${extra.listingTitle ?? "the place"}"${extra.listingId ? ` (ref ${extra.listingId})` : ""}. Thanks for your request! When would suit you for a viewing this week?`;
  }
  if (kind === "owner") {
    return `Hi ${n}, thanks for listing your ${TYPE_LABEL[data.type as ListingType]?.toLowerCase() ?? "place"} with Stayshay! Please send 4 to 8 clear photos here (room, bathroom, kitchen, building) and we'll publish it today.`;
  }
  if (kind === "roommate") {
    return `Hi ${n}, Stayshay here. We've got your roommate profile and we're looking for someone who fits your budget and routine. We'll message you as soon as we have a match.`;
  }
  const types = Array.isArray(data.types) && data.types.length ? (data.types as ListingType[]).map((t) => TYPE_LABEL[t].toLowerCase()).join(" or ") : "place";
  const areas = Array.isArray(data.areaSlugs) && data.areaSlugs.length ? (data.areaSlugs as string[]).map((s) => extra.areaName?.(s) ?? s).join(", ") : "";
  const q = new URLSearchParams();
  if (Array.isArray(data.areaSlugs) && data.areaSlugs.length) q.set("area", (data.areaSlugs as string[]).join(","));
  if (Array.isArray(data.types) && data.types.length) q.set("type", (data.types as string[]).join(","));
  if (data.budget) q.set("max", String(data.budget));
  return `Hi ${n}, Stayshay here. Thanks for your request for a ${types}${areas ? ` in ${areas}` : ""}${data.budget ? ` up to AED ${Number(data.budget).toLocaleString("en-US")}` : ""}. Here are places that fit right now: ${SITE}/search?${q}. Tell me which ones you'd like to see and I'll arrange the viewings.`;
}

export function roommateIntro(to: { name: string }, other: { name: string; age?: number | null; profession?: string; budget: number; mode: string }, areas: string, reasons: string[]): string {
  const who = [first(other.name), other.age ? String(other.age) : "", other.profession].filter(Boolean).join(", ");
  return `Hi ${first(to.name)}, Stayshay here. We may have found a roommate for you: ${who}${other.mode === "has_place" ? ", who has a place" : ", also looking to share"}${areas ? ` (${areas})` : ""}, budget AED ${other.budget.toLocaleString("en-US")}/month. Why it could work: ${reasons.join("; ").toLowerCase()}. Shall we connect you both on WhatsApp?`;
}

export function renewalReminder(t: { tenantName: string; listingTitle: string; endDate: string }): string {
  return `Hi ${first(t.tenantName)}, this is Stayshay. A friendly reminder that your stay at "${t.listingTitle}" ends on ${fmtDate(t.endDate)}. Would you like to renew? Reply here and we'll arrange it with the owner.`;
}

export function broadcastText(a: { title: string; message: string; link?: string }): string {
  return `${a.title}\n\n${a.message}${a.link ? `\n\n${a.link}` : ""}\n\n— Stayshay`;
}

export { fmtDate };
