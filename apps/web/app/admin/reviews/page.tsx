import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin";
import { AdminReviews } from "@/components/admin-reviews";
import { adminAllowed } from "@/lib/admin-guard";
import { readReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Reviews", robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await adminAllowed())) return <AdminLogin />;
  return <AdminReviews initial={await readReviews()} />;
}
