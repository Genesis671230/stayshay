import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminLogin } from "@/components/admin";
import { AdminConsole } from "@/components/admin-console";
import { ADMIN_COOKIE, getListingsForAdmin, isAdmin, readAdminListings, readAnnouncements, readLeads, readTenancies } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | Stayshay", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!isAdmin((await cookies()).get(ADMIN_COOKIE)?.value)) return <AdminLogin />;
  const [adminListings, allListings, leads, tenancies, announcements] = await Promise.all([readAdminListings(), getListingsForAdmin(), readLeads(), readTenancies(), readAnnouncements()]);
  return <AdminConsole adminListings={adminListings} allListings={allListings} leads={leads} tenancies={tenancies} announcements={announcements} />;
}
