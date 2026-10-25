import { NextResponse } from "next/server";
import { denyUnlessAdmin } from "@/lib/admin-guard";
import { readLeads, updateLead, type LeadStatus } from "@/lib/store";

const STATUSES: LeadStatus[] = ["new", "contacted", "matched", "closed"];

export async function GET() {
  return (await denyUnlessAdmin()) ?? NextResponse.json({ ok: true, leads: await readLeads() });
}

export async function PATCH(req: Request) {
  const deny = await denyUnlessAdmin();
  if (deny) return deny;
  const { id, status, note } = (await req.json().catch(() => ({}))) as { id?: string; status?: LeadStatus; note?: string };
  if (!id || (status && !STATUSES.includes(status))) return NextResponse.json({ ok: false }, { status: 400 });
  const lead = await updateLead(id, { ...(status && { status }), ...(note != null && { note: String(note).slice(0, 1000) }) });
  return lead ? NextResponse.json({ ok: true, lead }) : NextResponse.json({ ok: false }, { status: 404 });
}
