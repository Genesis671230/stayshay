import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin";
import { AdminConsole } from "@/components/admin-console";
import { getListingsForAdmin, readAdminListings, readAnnouncements, readLeads, readTenancies } from "@/lib/store";
import { readRoommates } from "@/lib/roommates";
import { adminAllowed } from "@/lib/admin-guard";
import { readUsers, toPublic } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!(await adminAllowed())) return <AdminLogin />;
  const [adminListings, allListings, leads, tenancies, announcements, users, roommates] = await Promise.all([
    readAdminListings(),
    getListingsForAdmin(),
    readLeads(),
    readTenancies(),
    readAnnouncements(),
    readUsers(),
    readRoommates(),
  ]);
  return (
    <AdminConsole
      adminListings={adminListings}
      allListings={allListings}
      leads={leads}
      tenancies={tenancies}
      announcements={announcements}
      users={users.map((u) => ({ ...toPublic(u), createdAt: u.createdAt, lastLoginAt: u.lastLoginAt }))}
      roommates={roommates}
    />
  );
}
