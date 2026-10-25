import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth-forms";
import { currentUser, googleEnabled } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in | Stayshay" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/account";
  if (await currentUser()) redirect(safeNext);
  return <LoginForm google={googleEnabled()} next={safeNext} error={error} />;
}
