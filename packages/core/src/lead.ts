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

/** "Find me a roommate": someone with a place to share, or someone looking to share one. */
export interface RoommateLead {
  kind: "roommate";
  /** has_place: has a room/flat and wants a flatmate. looking: wants to move in with someone. */
  mode: "has_place" | "looking";
  name: string;
  phone: string;
  age: number | null;
  gender: "male" | "female";
  nationality: string;
  profession: string;
  budget: number;
  areaSlugs: string[];
  moveIn: string;
  lifestyle: string[];
  about: string;
}

export type Lead = TenantRequest | OwnerLead | RoommateLead;
export type LeadErrors = Record<string, string>;

const isDate = (s: unknown) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const household = (v: unknown): Gender | "couple" => (v === "male" || v === "female" || v === "couple" ? v : "any");

export function validateLead(input: Record<string, unknown>): { ok: boolean; value?: Lead; errors: LeadErrors } {
  const errors: LeadErrors = {};
  const name = String(input.name ?? "").trim();
  const phone = normalizePhone(String(input.phone ?? ""));
  if (name.length < 2 || name.length > 80) errors.name = "Enter your name";
  if (!phone) errors.phone = "Enter a valid WhatsApp number";

  if (input.kind === "roommate") {
    const budget = Number(input.budget);
    const age = input.age === "" || input.age == null ? null : Number(input.age);
    if (input.gender !== "male" && input.gender !== "female") errors.gender = "Pick one";
    if (!Number.isFinite(budget) || budget < 200 || budget > 100000) errors.budget = "Set a budget";
    if (age != null && (!Number.isInteger(age) || age < 18 || age > 99)) errors.age = "Enter your age";
    if (!isDate(input.moveIn)) errors.moveIn = "Pick a move-in date";
    const ok = !Object.keys(errors).length;
    const text = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
    return {
      ok,
      errors,
      value: ok
        ? {
            kind: "roommate",
            mode: input.mode === "has_place" ? "has_place" : "looking",
            name,
            phone: phone!,
            age,
            gender: input.gender as "male" | "female",
            nationality: text(input.nationality, 40),
            profession: text(input.profession, 60),
            budget,
            areaSlugs: (Array.isArray(input.areaSlugs) ? input.areaSlugs : []).map(String).slice(0, 5),
            moveIn: String(input.moveIn),
            lifestyle: (Array.isArray(input.lifestyle) ? input.lifestyle : []).map(String).slice(0, 8),
            about: text(input.about, 400),
          }
        : undefined,
    };
  }

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
  if (lead.kind === "roommate") {
    return [
      lead.mode === "has_place" ? "Hi Stayshay, I have a place and I'm looking for a roommate." : "Hi Stayshay, I'm looking for a roommate to share with.",
      `Name: ${lead.name}${lead.age ? `, ${lead.age}` : ""} · ${lead.gender === "male" ? "Male" : "Female"}${lead.nationality ? ` · ${lead.nationality}` : ""}`,
      lead.profession ? `Work: ${lead.profession}` : "",
      `Budget: AED ${lead.budget.toLocaleString("en-US")}/month`,
      `Areas: ${lead.areaSlugs.length ? lead.areaSlugs.map(areaName).join(", ") : "flexible"}`,
      `Move-in: ${lead.moveIn}`,
      lead.lifestyle.length ? `Lifestyle: ${lead.lifestyle.join(", ")}` : "",
      lead.about ? `About me: ${lead.about}` : "",
      "Please list my profile.",
    ]
      .filter(Boolean)
      .join("\n");
  }
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
