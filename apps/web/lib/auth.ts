import { createHmac, randomBytes, randomUUID, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { normalizePhone } from "@stayshay/core";
import { DATA_DIR } from "./store";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

export interface User {
  id: string;
  email: string;
  name: string;
  /** E.164 digits; required before the account is complete (Google sign-ups add it after). */
  phone: string | null;
  picture: string | null;
  /** scrypt$<salt b64>$<hash b64>; null for Google-only accounts. */
  passwordHash: string | null;
  googleSub: string | null;
  createdAt: string;
  lastLoginAt: string;
}

/** What the browser may see about the signed-in user. */
export type PublicUser = Pick<User, "id" | "email" | "name" | "phone" | "picture"> & { provider: "google" | "password"; admin: boolean };

/* ---------- user store (users.json in STAYSHAY_DATA_DIR) ---------- */

const FILE = () => join(DATA_DIR, "users.json");
let queue: Promise<unknown> = Promise.resolve();

export async function readUsers(): Promise<User[]> {
  try {
    return JSON.parse(await readFile(FILE(), "utf8")) as User[];
  } catch {
    return [];
  }
}

function updateUsers<T>(fn: (users: User[]) => { users: User[]; result: T }): Promise<T> {
  const run = queue.then(async () => {
    const { users, result } = fn(await readUsers());
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(`${FILE()}.tmp`, JSON.stringify(users, null, 2));
    await rename(`${FILE()}.tmp`, FILE());
    return result;
  });
  queue = run.catch(() => {});
  return run;
}

export const normEmail = (e: string) => e.trim().toLowerCase();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ---------- passwords ---------- */

async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(pw, salt, 64);
  return `scrypt$${salt.toString("base64")}$${hash.toString("base64")}`;
}

async function verifyPassword(pw: string, stored: string | null): Promise<boolean> {
  if (!stored?.startsWith("scrypt$")) return false;
  const [, salt, hash] = stored.split("$");
  const expected = Buffer.from(hash, "base64");
  const actual = await scrypt(pw, Buffer.from(salt, "base64"), expected.length);
  return timingSafeEqual(actual, expected);
}

/* ---------- accounts ---------- */

export type AuthErrors = Partial<Record<"name" | "email" | "phone" | "password" | "form", string>>;

export async function signUp(input: { name?: string; email?: string; phone?: string; password?: string }): Promise<{ user?: User; errors: AuthErrors }> {
  const errors: AuthErrors = {};
  const name = String(input.name ?? "").trim();
  const email = normEmail(String(input.email ?? ""));
  const phone = normalizePhone(String(input.phone ?? ""));
  const password = String(input.password ?? "");
  if (name.length < 2) errors.name = "Enter your name";
  if (!EMAIL_RE.test(email)) errors.email = "Enter a valid email";
  if (!phone) errors.phone = "Enter a valid phone / WhatsApp number";
  if (password.length < 8) errors.password = "Use at least 8 characters";
  if (Object.keys(errors).length) return { errors };
  const passwordHash = await hashPassword(password);
  return updateUsers<{ user?: User; errors: AuthErrors }>((users) => {
    if (users.some((u) => u.email === email)) return { users, result: { errors: { email: "An account with this email already exists. Sign in instead." } } };
    const now = new Date().toISOString();
    const user: User = { id: randomUUID(), email, name, phone, picture: null, passwordHash, googleSub: null, createdAt: now, lastLoginAt: now };
    return { users: [...users, user], result: { user, errors: {} } };
  });
}

export async function signIn(emailIn: string, password: string): Promise<User | null> {
  const email = normEmail(emailIn);
  const user = (await readUsers()).find((u) => u.email === email);
  if (!user || !(await verifyPassword(password, user.passwordHash))) return null;
  await touch(user.id);
  return user;
}

/** Google sign-in: link by Google id, else by verified email, else create. */
export async function upsertGoogleUser(p: { sub: string; email: string; name: string; picture: string | null }): Promise<User> {
  const email = normEmail(p.email);
  return updateUsers((users) => {
    const now = new Date().toISOString();
    const i = users.findIndex((u) => u.googleSub === p.sub || u.email === email);
    if (i >= 0) {
      users[i] = { ...users[i], googleSub: p.sub, picture: users[i].picture ?? p.picture, name: users[i].name || p.name, lastLoginAt: now };
      return { users, result: users[i] };
    }
    const user: User = { id: randomUUID(), email, name: p.name || email.split("@")[0], phone: null, picture: p.picture, passwordHash: null, googleSub: p.sub, createdAt: now, lastLoginAt: now };
    return { users: [...users, user], result: user };
  });
}

export async function updateProfile(id: string, patch: { name?: string; phone?: string }): Promise<{ user?: User; errors: AuthErrors }> {
  const errors: AuthErrors = {};
  const name = patch.name != null ? String(patch.name).trim() : undefined;
  const phone = patch.phone != null ? normalizePhone(String(patch.phone)) : undefined;
  if (name != null && name.length < 2) errors.name = "Enter your name";
  if (patch.phone != null && !phone) errors.phone = "Enter a valid phone / WhatsApp number";
  if (Object.keys(errors).length) return { errors };
  return updateUsers<{ user?: User; errors: AuthErrors }>((users) => {
    const i = users.findIndex((u) => u.id === id);
    if (i < 0) return { users, result: { errors: { form: "Account not found" } } };
    users[i] = { ...users[i], ...(name != null && { name }), ...(phone && { phone }) };
    return { users, result: { user: users[i], errors: {} } };
  });
}

async function touch(id: string) {
  await updateUsers((users) => ({ users: users.map((u) => (u.id === id ? { ...u, lastLoginAt: new Date().toISOString() } : u)), result: null }));
}

/* ---------- sessions: signed cookie "<uid>.<expiry>.<hmac>" ---------- */

export const SESSION_COOKIE = "ss_session";
const MAX_AGE = 60 * 60 * 24 * 60; // 60 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) throw new Error("SESSION_SECRET must be set (32+ characters)");
  return s;
}
const sign = (payload: string) => createHmac("sha256", secret()).update(payload).digest("base64url");

export function sessionValue(userId: string): string {
  const payload = `${userId}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  return `${payload}.${sign(payload)}`;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: (process.env.PUBLIC_BASE_URL ?? "").startsWith("https:"),
  path: "/",
  maxAge: MAX_AGE,
};

function verifySession(value: string | undefined): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, mac] = parts;
  const expected = sign(`${uid}.${exp}`);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return uid;
}

export async function currentUser(): Promise<User | null> {
  try {
    const uid = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
    return uid ? ((await readUsers()).find((u) => u.id === uid) ?? null) : null;
  } catch {
    return null;
  }
}

const adminEmails = () =>
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => normEmail(e))
    .filter(Boolean);

export const isAdminEmail = (email: string) => adminEmails().includes(normEmail(email));

export function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, name: u.name, phone: u.phone, picture: u.picture, provider: u.googleSub ? "google" : "password", admin: isAdminEmail(u.email) };
}

/* ---------- Google OAuth (authorization code flow) ---------- */

export const googleEnabled = () => !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function siteUrl(req: Request): string {
  if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${req.headers.get("x-forwarded-proto") ?? "http"}://${host}`;
}

export function googleAuthUrl(redirectUri: string, state: string): string {
  const q = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${q}`;
}

/** Exchanges the code, then has Google verify the ID token (signature, expiry) and checks audience + verified email. */
export async function googleProfile(code: string, redirectUri: string) {
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, redirect_uri: redirectUri, grant_type: "authorization_code" }),
    signal: AbortSignal.timeout(10000),
  });
  if (!tokenRes.ok) throw new Error(`google token ${tokenRes.status}`);
  const { id_token } = (await tokenRes.json()) as { id_token?: string };
  if (!id_token) throw new Error("google: no id_token");
  const infoRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(id_token)}`, { signal: AbortSignal.timeout(10000) });
  if (!infoRes.ok) throw new Error(`google tokeninfo ${infoRes.status}`);
  const info = (await infoRes.json()) as { aud?: string; sub?: string; email?: string; email_verified?: string | boolean; name?: string; picture?: string; iss?: string };
  if (info.aud !== process.env.GOOGLE_CLIENT_ID) throw new Error("google: wrong audience");
  if (!["accounts.google.com", "https://accounts.google.com"].includes(info.iss ?? "")) throw new Error("google: wrong issuer");
  if (!info.sub || !info.email || !(info.email_verified === true || info.email_verified === "true")) throw new Error("google: email not verified");
  return { sub: info.sub, email: info.email, name: info.name ?? "", picture: info.picture ?? null };
}

export const newState = () => randomBytes(18).toString("base64url");
