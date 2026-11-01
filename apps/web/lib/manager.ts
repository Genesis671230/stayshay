import { randomUUID } from "node:crypto";
import { cleanPayment, cleanProperty, cleanTenant, normalizePhone, portfolioReport, type MPayment, type MProperty, type MTenant } from "@stayshay/core";
import { readJson, updateJson } from "./store";

/** Stayshay Manager data: one file, every record stamped with its owner's user id. */
interface ManagerFile {
  properties: MProperty[];
  tenants: MTenant[];
  payments: MPayment[];
}

const FILE = "manager.json";
const EMPTY: ManagerFile = { properties: [], tenants: [], payments: [] };
const newId = () => randomUUID().replace(/-/g, "").slice(0, 10);

export interface OwnerData {
  properties: MProperty[];
  tenants: MTenant[];
  payments: MPayment[];
}

export async function ownerData(ownerId: string): Promise<OwnerData> {
  const f = await readJson<ManagerFile>(FILE, EMPTY);
  // Records saved before shared spaces, photos and cheques existed get the defaults.
  return {
    properties: f.properties.filter((p) => p.ownerId === ownerId).map((p) => ({ ...p, photos: p.photos ?? [], spaces: p.spaces.map((s) => ({ ...s, capacity: s.capacity || 1 })) })),
    tenants: f.tenants.filter((t) => t.ownerId === ownerId),
    payments: f.payments
      .filter((p) => p.ownerId === ownerId)
      .map((p) => ({ ...p, months: p.months || 1, chequeNo: p.chequeNo ?? "", chequeStatus: p.chequeStatus ?? null, chequeIndex: p.chequeIndex ?? null }))
      .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
  };
}

type Result = { ok: true; data: OwnerData; id?: string } | { ok: false; error: string };

/** One mutation from the dashboard. Every lookup is scoped to the owner, so nobody can touch someone else's records. */
export async function managerAction(ownerId: string, body: Record<string, unknown>): Promise<Result> {
  const action = String(body.action ?? "");
  const now = new Date().toISOString();
  let error: string | null = null;
  let id: string | undefined;

  await updateJson<ManagerFile>(FILE, EMPTY, (f) => {
    const mineProp = (pid: unknown) => f.properties.find((p) => p.id === pid && p.ownerId === ownerId);
    switch (action) {
      case "property.save": {
        const input = (body.property ?? {}) as Record<string, unknown>;
        const clean = cleanProperty(input, newId);
        const existing = input.id ? mineProp(input.id) : undefined;
        if (input.id && !existing) {
          error = "Property not found";
          break;
        }
        if (f.properties.filter((p) => p.ownerId === ownerId).length >= 50 && !existing) {
          error = "Limit of 50 properties reached";
          break;
        }
        // Photos are added through the upload route; keep the ones already on the record.
        const keep = new Set(existing?.photos ?? []);
        const p: MProperty = { ...clean, photos: existing ? clean.photos.filter((u) => keep.has(u)) : [], id: existing?.id ?? newId(), ownerId, createdAt: existing?.createdAt ?? now, updatedAt: now };
        f.properties = existing ? f.properties.map((x) => (x.id === p.id ? p : x)) : [...f.properties, p];
        id = p.id;
        break;
      }
      case "property.delete": {
        const p = mineProp(body.id);
        if (!p) {
          error = "Property not found";
          break;
        }
        f.properties = f.properties.filter((x) => x.id !== p.id);
        f.tenants = f.tenants.filter((t) => t.propertyId !== p.id);
        f.payments = f.payments.filter((x) => x.propertyId !== p.id);
        break;
      }
      case "tenant.save": {
        const input = (body.tenant ?? {}) as Record<string, unknown>;
        const c = cleanTenant(input, normalizePhone);
        if (!c.value) {
          error = c.error ?? "Check the details";
          break;
        }
        const prop = mineProp(c.value.propertyId);
        if (!prop || !prop.spaces.some((s) => s.id === c.value!.spaceId)) {
          error = "Pick the apartment and space";
          break;
        }
        const existing = input.id ? f.tenants.find((t) => t.id === input.id && t.ownerId === ownerId) : undefined;
        if (input.id && !existing) {
          error = "Tenant not found";
          break;
        }
        const space = prop.spaces.find((x) => x.id === c.value!.spaceId)!;
        const others = f.tenants.filter((t) => t.status === "active" && t.spaceId === space.id && t.id !== existing?.id);
        if (c.value.status === "active" && others.length >= Math.max(1, space.capacity || 1)) {
          error = `${space.label} is full (${others.map((t) => t.name).join(", ")}). Raise how many people it holds in the apartment settings.`;
          break;
        }
        const t: MTenant = { ...c.value, id: existing?.id ?? newId(), ownerId, createdAt: existing?.createdAt ?? now };
        f.tenants = existing ? f.tenants.map((x) => (x.id === t.id ? t : x)) : [...f.tenants, t];
        id = t.id;
        break;
      }
      case "tenant.delete": {
        const before = f.tenants.length;
        f.tenants = f.tenants.filter((t) => !(t.id === body.id && t.ownerId === ownerId));
        if (f.tenants.length === before) error = "Tenant not found";
        break;
      }
      case "payment.add": {
        const c = cleanPayment((body.payment ?? {}) as Record<string, unknown>);
        if (!c.value) {
          error = c.error ?? "Check the payment";
          break;
        }
        if (!mineProp(c.value.propertyId)) {
          error = "Pick the apartment";
          break;
        }
        if (c.value.tenantId && !f.tenants.some((t) => t.id === c.value!.tenantId && t.ownerId === ownerId)) {
          error = "Tenant not found";
          break;
        }
        const p: MPayment = { ...c.value, id: newId(), ownerId, createdAt: now };
        f.payments = [p, ...f.payments].slice(0, 100_000);
        id = p.id;
        break;
      }
      case "payment.cheque": {
        // Mark a cheque cleared or bounced.
        const status = body.status === "cleared" || body.status === "bounced" || body.status === "pending" ? body.status : null;
        const pay = f.payments.find((p) => p.id === body.id && p.ownerId === ownerId);
        if (!pay || !status || pay.method !== "cheque") {
          error = "Cheque not found";
          break;
        }
        pay.chequeStatus = status;
        if (status === "cleared") pay.note = pay.note || `Cleared ${now.slice(0, 10)}`;
        break;
      }
      case "photo.remove": {
        const prop = mineProp(body.propertyId);
        if (!prop) {
          error = "Property not found";
          break;
        }
        prop.photos = (prop.photos ?? []).filter((u) => u !== body.url);
        prop.updatedAt = now;
        break;
      }
      case "payment.delete": {
        const before = f.payments.length;
        f.payments = f.payments.filter((p) => !(p.id === body.id && p.ownerId === ownerId));
        if (f.payments.length === before) error = "Payment not found";
        break;
      }
      default:
        error = "Unknown action";
    }
    return f;
  });

  if (error) return { ok: false, error };
  return { ok: true, data: await ownerData(ownerId), id };
}

/** Adds an uploaded photo URL to the owner's apartment (max 20). */
export async function addPhoto(ownerId: string, propertyId: string, url: string): Promise<OwnerData | null> {
  let ok = false;
  await updateJson<ManagerFile>(FILE, EMPTY, (f) => {
    const p = f.properties.find((x) => x.id === propertyId && x.ownerId === ownerId);
    if (p && (p.photos ?? []).length < 20) {
      p.photos = [...(p.photos ?? []), url];
      p.updatedAt = new Date().toISOString();
      ok = true;
    }
    return f;
  });
  return ok ? ownerData(ownerId) : null;
}

/** Stayshay's own view across every owner: how full the managed beds are and where tenants are needed. */
export async function managerOverview(today: string) {
  const f = await readJson<ManagerFile>(FILE, EMPTY);
  const owners = new Set(f.properties.map((p) => p.ownerId));
  const reports = [...owners].map((o) => {
    const d = { properties: f.properties.filter((p) => p.ownerId === o).map((p) => ({ ...p, photos: p.photos ?? [], spaces: p.spaces.map((s) => ({ ...s, capacity: s.capacity || 1 })) })), tenants: f.tenants.filter((t) => t.ownerId === o), payments: f.payments.filter((p) => p.ownerId === o).map((p) => ({ ...p, months: p.months || 1 })) };
    return { ownerId: o, report: portfolioReport(d.properties, d.tenants, d.payments, today.slice(0, 7), today) };
  });
  const needs = new Map<string, { area: string; kind: string; slots: number; avgRent: number; rents: number[] }>();
  for (const { report } of reports)
    for (const r of report.properties)
      for (const v of r.vacant) {
        const key = `${r.property.areaSlug}|${v.space.kind}`;
        const n = needs.get(key) ?? { area: r.property.areaSlug, kind: v.space.kind, slots: 0, avgRent: 0, rents: [] };
        n.slots += v.free;
        n.rents.push(...Array.from({ length: v.free }, () => v.perPersonAed));
        needs.set(key, n);
      }
  const sum = (k: "spaces" | "occupied" | "toFill" | "missing" | "expected" | "collected") => reports.reduce((s, r) => s + r.report[k], 0);
  return {
    owners: owners.size,
    apartments: f.properties.length,
    tenants: f.tenants.filter((t) => t.status === "active").length,
    spaces: sum("spaces"),
    occupied: sum("occupied"),
    toFill: sum("toFill"),
    missing: sum("missing"),
    expected: sum("expected"),
    collected: sum("collected"),
    needs: [...needs.values()].map((n) => ({ ...n, avgRent: Math.round(n.rents.reduce((a, b) => a + b, 0) / Math.max(1, n.rents.length)) })).sort((a, b) => b.slots - a.slots),
  };
}
