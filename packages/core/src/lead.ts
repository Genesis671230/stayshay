import type { Gender, ListingType } from "./types.ts";
import { normalizePhone } from "./inquiry.ts";
import { TYPE_LABEL } from "./brand.ts";

const TYPES: ListingType[] = ["room", "bed_space", "partition", "studio", "roommate"];

/** "Find me a room": what a renter wants, captured by the tenant funnel. */
export interface TenantRequest {
  kind: "tenant";
  types: ListingType[];
  areaSlugs: string[];
  budget: number;
  moveIn: string;
  household: Gender | "couple";
  name: string;
  phone: string;
}

/** "List my place": what an owner has, captured by the owner funnel. */
export interface OwnerLead {
  kind: "owner";
  type: ListingType;
  areaSlug: string;
  rent: number;
  billsIncluded: boolean;
  deposit: number;
  spaces: number;
  household: Gender | "couple";
  name: string;
  phone: string;
}

export type Lead = TenantRequest | OwnerLead;
export type LeadErrors = Record<string, string>;

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const household = (v: unknown): Gender | "couple" => (v === "male" || v === "female" || v === "couple" ? v : "any");

export function validateLead(input: Record<string, unknown>): { ok: boolean; value?: Lead; errors: LeadErrors } {
  const errors: LeadErrors = {};
  const name = String(input.name ?? "").trim();
  const phone = normalizePhone(String(input.phone ?? ""));
  if (name.length < 2 || name.length > 80) errors.name = "Enter your name";
  if (!phone) errors.phone = "Enter a valid WhatsApp number";

  if (input.kind === "owner") {
    const type = TYPES.find((t) => t === input.type);
    const rent = Number(input.rent);
    const spaces = Number(input.spaces ?? 1);
    if (!type) errors.type = "Pick what you’re renting out";
    if (!input.areaSlug) errors.areaSlug = "Pick the area";
    if (!Number.isFinite(rent) || rent < 200 || rent > 100000) errors.rent = "Enter the monthly rent";
    if (!Number.isFinite(spaces) || spaces < 1 || spaces > 50) errors.spaces = "How many spaces?";
    const ok = !Object.keys(errors).length;
    return {
      ok,
      errors,
      value: ok
        ? {
            kind: "owner",
            type: type!,
            areaSlug: String(input.areaSlug).slice(0, 64),
            rent,
            billsIncluded: !!input.billsIncluded,
            deposit: Math.max(0, Number(input.deposit) || 0),
            spaces,
            household: household(input.household),
            name,
            phone: phone!,
          }
        : undefined,
    };
  }

  const types = (Array.isArray(input.types) ? input.types : []).filter((t): t is ListingType => TYPES.includes(t as ListingType));
  const budget = Number(input.budget);
  if (!Number.isFinite(budget) || budget < 200 || budget > 100000) errors.budget = "Set a budget";
  if (!isDate(input.moveIn)) errors.moveIn = "Pick a move-in date";
  const ok = !Object.keys(errors).length;
  return {
    ok,
    errors,
    value: ok
      ? {
          kind: "tenant",
          types,
          areaSlugs: (Array.isArray(input.areaSlugs) ? input.areaSlugs : []).map(String).slice(0, 5),
          budget,
          moveIn: String(input.moveIn),
          household: household(input.household),
          name,
          phone: phone!,
        }
      : undefined,
  };
}

const HOUSEHOLD = { any: "Anyone", male: "Male", female: "Female", couple: "Couple" } as const;

/** WhatsApp text for the hand-off at the end of each funnel. */
export function leadMessage(lead: Lead, areaName: (slug: string) => string): string {
  if (lead.kind === "owner") {
    return [
      "Hi Stayshay, I'd like to list my place.",
      `${TYPE_LABEL[lead.type]} in ${areaName(lead.areaSlug)}`,
      `Rent: AED ${lead.rent.toLocaleString("en-US")}/month${lead.billsIncluded ? ", bills included" : ""}`,
      `Deposit: ${lead.deposit ? `AED ${lead.deposit.toLocaleString("en-US")}` : "none"} · Spaces: ${lead.spaces}`,
      `For: ${HOUSEHOLD[lead.household]}`,
      `Name: ${lead.name}`,
      "I'll send photos here.",
    ].join("\n");
  }
  return [
    "Hi Stayshay, please find me a place.",
    `Looking for: ${lead.types.length ? lead.types.map((t) => TYPE_LABEL[t]).join(", ") : "any type"}`,
    `Areas: ${lead.areaSlugs.length ? lead.areaSlugs.map(areaName).join(", ") : "flexible"}`,
    `Budget: up to AED ${lead.budget.toLocaleString("en-US")}/month`,
    `Move-in: ${lead.moveIn} · ${HOUSEHOLD[lead.household]}`,
    `Name: ${lead.name}`,
  ].join("\n");
}
