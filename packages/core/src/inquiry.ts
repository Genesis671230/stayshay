import type { Listing } from "./types.ts";
import { TYPE_LABEL } from "./brand.ts";

export interface Inquiry {
  listingId: string | null;
  name: string;
  /** E.164 without "+", e.g. 971501234567. */
  phone: string;
  moveIn: string;
  budget: number | null;
  message: string;
  /** Honeypot: real users never fill this. */
  website?: string;
}

export type InquiryErrors = Partial<Record<keyof Inquiry, string>>;

/** Accepts 05x xxx xxxx, +9715…, 009715…, 9715… and foreign numbers with a country code. */
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);
  else if (/^0(5\d)/.test(digits)) digits = "971" + digits.slice(1);
  digits = digits.replace(/\D/g, "");
  if (digits.startsWith("971")) return /^9715\d{8}$/.test(digits) ? digits : null;
  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export function validateInquiry(input: Partial<Record<keyof Inquiry, unknown>>): {
  ok: boolean;
  value?: Inquiry;
  errors: InquiryErrors;
} {
  const errors: InquiryErrors = {};
  const name = String(input.name ?? "").trim();
  const phone = normalizePhone(String(input.phone ?? ""));
  const moveIn = String(input.moveIn ?? "").trim();
  const message = String(input.message ?? "").trim().slice(0, 1000);
  const budgetRaw = input.budget === "" || input.budget == null ? null : Number(input.budget);

  if (name.length < 2 || name.length > 80) errors.name = "Enter your name";
  if (!phone) errors.phone = "Enter a valid WhatsApp number";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(moveIn)) errors.moveIn = "Pick a move-in date";
  if (budgetRaw != null && (!Number.isFinite(budgetRaw) || budgetRaw < 200 || budgetRaw > 100000)) {
    errors.budget = "Budget looks off";
  }

  const ok = Object.keys(errors).length === 0;
  return {
    ok,
    errors,
    value: ok
      ? {
          listingId: input.listingId ? String(input.listingId).slice(0, 32) : null,
          name,
          phone: phone!,
          moveIn,
          budget: budgetRaw,
          message,
          website: String(input.website ?? ""),
        }
      : undefined,
  };
}

/** Prefilled WhatsApp text: the lister sees the ref, who is asking and when they want to move. */
export function whatsappMessage(listing: Listing | null, inq: Partial<Inquiry>): string {
  const lines = ["Hi, I found this on Stayshay."];
  if (listing) lines.push(`Ref ${listing.id}: ${TYPE_LABEL[listing.type]} - ${listing.title} (AED ${listing.priceAed.toLocaleString("en-US")}/month)`);
  if (inq.name) lines.push(`Name: ${inq.name}`);
  if (inq.moveIn) lines.push(`Move-in: ${inq.moveIn}`);
  if (inq.budget) lines.push(`Budget: AED ${Number(inq.budget).toLocaleString("en-US")}/month`);
  if (inq.message) lines.push(inq.message);
  lines.push("Is it still available? Can I book a viewing?");
  return lines.join("\n");
}

export function whatsappLink(phoneE164: string, text: string): string {
  return `https://wa.me/${phoneE164.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}
