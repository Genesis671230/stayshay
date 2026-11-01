const PHONE_RE = /(?:\+|00)?(?:971[\s-]?)?\(?0?5\d\)?[\s.-]?\d{3}[\s.-]?\d{4}|\b0?5\d{8}\b/g;

/** Removes phone numbers people type into titles and descriptions: every contact goes through Stayshay. */
export function stripPhones(text: string): string {
  return text.replace(PHONE_RE, "").replace(/\s{2,}/g, " ").replace(/\s+([,.)])/g, "$1").trim();
}
