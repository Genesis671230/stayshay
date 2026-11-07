import type { Metadata } from "next";
import { AdminLogin } from "@/components/admin";
import { AdminCommunity } from "@/components/admin-community";
import { adminAllowed } from "@/lib/admin-guard";
import { readPasses, readPosts } from "@/lib/community";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · Community", robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await adminAllowed())) return <AdminLogin />;
  const [posts, passes] = await Promise.all([readPosts(), readPasses()]);
  return (
    <AdminCommunity
      posts={posts.slice(0, 300).map(({ userId: _u, ...p }) => p)}
      passes={passes.map((p) => ({ id: p.id, name: p.name, email: p.email, area: p.area, status: p.status, amountAed: p.amountAed, periodEnd: p.periodEnd, createdAt: p.createdAt }))}
    />
  );
}
