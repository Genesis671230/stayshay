import type { Metadata } from "next";
import { cookies } from "next/headers";
import { AdminDashboard, AdminLogin } from "@/components/admin";
import { ADMIN_COOKIE, isAdmin, readAdminListings } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin | Stayshay", robots: { index: false, follow: false } };

export default async function AdminPage() {
  if (!isAdmin((await cookies()).get(ADMIN_COOKIE)?.value)) return <AdminLogin />;
  return <AdminDashboard initial={await readAdminListings()} />;
}
