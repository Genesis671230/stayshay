import { Linking } from "react-native";
import { BRAND, whatsappLink } from "./core";
import { API_URL } from "./config";

/** wa.me opens the WhatsApp app on iOS and Android (no URL-scheme permissions needed), or the browser if it isn't installed. */
export function openWhatsapp(text: string) {
  return Linking.openURL(whatsappLink(BRAND.whatsapp, text));
}

/** Fire-and-forget copy of the request to the website, so the team keeps a record even if WhatsApp isn't sent. */
export function logLead(path: "/api/lead" | "/api/inquiry", body: unknown) {
  fetch(`${API_URL}${path}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...(body as object), source: "app", via: "app" }) }).catch(() => {});
}
