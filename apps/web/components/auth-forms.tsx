"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Logo } from "./ui";
import { Shay } from "./shay";

const field = "w-full rounded-[14px] border border-line bg-white px-4 py-3.5 text-[15.5px] focus:border-brand focus:outline-none";
type Errors = Partial<Record<"name" | "email" | "phone" | "password" | "form", string>>;
const ERROR_TEXT: Record<string, string> = {
  google_off: "Google sign-in isn't switched on yet. Use email for now.",
  google_state: "That Google sign-in expired. Please try again.",
  google_failed: "Google sign-in didn't work. Please try again or use email.",
};

function GoogleButton({ next }: { next: string }) {
  return (
    <a href={`/api/auth/google?next=${encodeURIComponent(next)}`} className="flex h-12 w-full items-center justify-center gap-3 rounded-full border border-line-strong bg-white text-[15px] font-semibold text-ink hover:border-ink">
      <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden>
        <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
        <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
        <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
        <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
      </svg>
      Continue with Google
    </a>
  );
}

export function LoginForm({ google, next, error }: { google: boolean; next: string; error?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState<Errors>(error ? { form: ERROR_TEXT[error] ?? "Sign-in failed" } : {});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const res = await fetch(mode === "signin" ? "/api/auth/login" : "/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(mode === "signin" ? { email: f.email, password: f.password } : f),
    }).catch(() => null);
    const j = await res?.json().catch(() => ({}));
    setBusy(false);
    if (res?.ok) {
      router.push(next);
      router.refresh();
    } else setErrors(j?.errors ?? { form: "Something went wrong. Try again." });
  };

  const err = (k: keyof Errors) => (errors[k] ? <span className="mt-1 block text-[12.5px] font-medium text-warn">{errors[k]}</span> : null);

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 md:px-12">
        <a href="/" aria-label="Stayshay home">
          <Logo />
        </a>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-[34px] leading-tight">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
          <p className="mt-2 text-[15px] text-muted">{mode === "signin" ? "Sign in to save places, track your requests and hear from listers." : "Free. We use your number only to send you matches and arrange viewings."}</p>

          {google && (
            <div className="mt-7">
              <GoogleButton next={next} />
              <div className="my-5 flex items-center gap-3 text-[12.5px] text-muted">
                <span className="h-px flex-1 bg-line" /> or with email <span className="h-px flex-1 bg-line" />
              </div>
            </div>
          )}

          <form onSubmit={submit} noValidate className={`space-y-3.5 ${google ? "" : "mt-7"}`}>
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">Full name</span>
                <input className={field} value={f.name} onChange={set("name")} autoComplete="name" />
                {err("name")}
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold">Email</span>
              <input className={field} type="email" value={f.email} onChange={set("email")} autoComplete="email" />
              {err("email")}
            </label>
            {mode === "signup" && (
              <label className="block">
                <span className="mb-1.5 block text-[13px] font-semibold">Phone / WhatsApp</span>
                <input className={field} type="tel" inputMode="tel" value={f.phone} onChange={set("phone")} placeholder="050 123 4567" autoComplete="tel" />
                {err("phone")}
              </label>
            )}
            <label className="block">
              <span className="mb-1.5 block text-[13px] font-semibold">Password</span>
              <input className={field} type="password" value={f.password} onChange={set("password")} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
              {err("password")}
            </label>
            {errors.form && <p className="rounded-[12px] bg-warn-bg px-3.5 py-2.5 text-[13.5px] font-medium text-warn">{errors.form}</p>}
            <button disabled={busy} className="h-12 w-full rounded-full bg-brand text-[15.5px] font-semibold text-white disabled:opacity-50">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-[14px] text-muted">
            {mode === "signin" ? "New to Stayshay? " : "Already have an account? "}
            <button
              onClick={() => {
                setMode(mode === "signin" ? "signup" : "signin");
                setErrors({});
              }}
              className="font-semibold text-brand underline underline-offset-2"
            >
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
          <p className="mt-6 text-center text-[12px] leading-relaxed text-muted">
            By continuing you agree to our <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy policy</a>.
          </p>
        </div>
      </div>
      <div className="relative hidden items-center justify-center overflow-hidden bg-brand lg:flex">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-20 h-[28rem] w-[28rem] rounded-full bg-white/5" />
        <div className="relative max-w-[420px] px-10 text-center text-white">
          <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-full bg-white">
            <Shay size={130} waving />
          </div>
          <p className="mt-8 text-[28px] font-extrabold leading-tight tracking-[-0.03em]">One account for rooms, roommates and listing your place.</p>
          <ul className="mt-6 space-y-2.5 text-left text-[15px] text-white/85">
            {["Save places and get new matches", "Track your viewing requests", "Shay remembers what you’re looking for"].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <Icon name="check" size={17} className="text-[#8fe3bd]" /> {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function AccountForm({ user, complete }: { user: { name: string; email: string; phone: string | null; picture: string | null; provider: string; admin: boolean }; complete: boolean }) {
  const router = useRouter();
  const [f, setF] = useState({ name: user.name, phone: user.phone ? `+${user.phone}` : "" });
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);
  return (
    <div className="mx-auto max-w-[620px] px-5 py-12">
      {complete && !user.phone && (
        <div className="mb-6 flex items-center gap-4 rounded-[22px] bg-mint p-5">
          <Shay size={56} waving />
          <p className="text-[15px] font-medium text-brand">Almost done! Add your phone / WhatsApp so listers and our team can reach you about viewings.</p>
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-mint">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {user.picture ? <img src={user.picture} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" /> : <span className="flex h-full items-center justify-center text-[26px] font-bold text-brand">{user.name[0]}</span>}
        </div>
        <div>
          <h1 className="text-[26px] font-extrabold tracking-[-0.03em]">{user.name}</h1>
          <p className="text-[14px] text-muted">
            {user.email} · signed in with {user.provider === "google" ? "Google" : "email"}
          </p>
        </div>
      </div>
      <form
        className="mt-8 space-y-4 rounded-[24px] border border-line p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setSaved(false);
          const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
          const j = await res.json().catch(() => ({}));
          if (res.ok) {
            setErrors({});
            setSaved(true);
            router.refresh();
          } else setErrors(j.errors ?? {});
        }}
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Name</span>
          <input className={field} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          {errors.name && <span className="mt-1 block text-[12.5px] text-warn">{errors.name}</span>}
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">Phone / WhatsApp</span>
          <input className={field} type="tel" inputMode="tel" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="050 123 4567" />
          {errors.phone && <span className="mt-1 block text-[12.5px] text-warn">{errors.phone}</span>}
        </label>
        <div className="flex items-center gap-3">
          <button className="h-11 rounded-full bg-brand px-6 text-[14.5px] font-semibold text-white">Save</button>
          {saved && (
            <span className="flex items-center gap-1 text-[13.5px] font-medium text-brand">
              <Icon name="check" size={15} /> Saved
            </span>
          )}
        </div>
      </form>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          ["Find a place", "/search"],
          ["Roommates", "/roommates"],
          ["List your place", "/list"],
        ].map(([t, h]) => (
          <a key={h} href={h} className="flex h-12 items-center justify-center rounded-full border border-line text-[14px] font-semibold hover:border-brand hover:text-brand">
            {t}
          </a>
        ))}
      </div>
      {user.admin && (
        <a href="/admin" className="mt-3 flex h-12 items-center justify-center rounded-full bg-ink text-[14px] font-semibold text-white">
          Open admin
        </a>
      )}
      <button
        onClick={async () => {
          await fetch("/api/auth/logout", { method: "POST" });
          router.push("/");
          router.refresh();
        }}
        className="mt-8 w-full text-center text-[14px] text-muted underline"
      >
        Sign out
      </button>
    </div>
  );
}
