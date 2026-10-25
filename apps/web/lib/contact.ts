import { whatsappLink } from "@stayshay/core";

/** Stayshay's WhatsApp line. Inquiries route through it until listers get verified numbers. */
export const STAYSHAY_WHATSAPP = (process.env.NEXT_PUBLIC_STAYSHAY_WHATSAPP ?? "").replace(/\D/g, "");

export const hasWhatsapp = STAYSHAY_WHATSAPP.length >= 10;

export function stayshayWhatsapp(text: string): string {
  return hasWhatsapp ? whatsappLink(STAYSHAY_WHATSAPP, text) : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
