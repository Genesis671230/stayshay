import { randomUUID } from "node:crypto";
import { cleanPayment, cleanProperty, cleanTenant, normalizePhone, type MPayment, type MProperty, type MTenant } from "@stayshay/core";
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
  return {
    properties: f.properties.filter((p) => p.ownerId === ownerId),
    tenants: f.tenants.filter((t) => t.ownerId === ownerId),
    payments: f.payments.filter((p) => p.ownerId === ownerId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)),
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
        const p: MProperty = { ...clean, id: existing?.id ?? newId(), ownerId, createdAt: existing?.createdAt ?? now, updatedAt: now };
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
        const clash = f.tenants.find((t) => t.status === "active" && t.spaceId === c.value!.spaceId && t.id !== existing?.id && c.value!.status === "active");
        if (clash) {
          error = `${clash.name} already lives in that space`;
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
