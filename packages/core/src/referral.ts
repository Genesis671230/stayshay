/**
 * Refer & earn. Anyone (brokers especially) shares stayshay.com/?ref=CODE. People who join through the link
 * are tied to the code; when one of them moves in through Stayshay, the referrer earns a reward.
 * It is a referral reward paid by Stayshay, not a brokerage commission (UAE rules: brokering needs RERA registration).
 */
export const REFERRAL_REWARDS = {
  /** Referred renter signs a stay through Stayshay. */
  tenant_move_in: 100,
  /** Referred owner's listing gets its first tenant through Stayshay. */
  owner_first_fill: 150,
} as const;

export type RewardKind = keyof typeof REFERRAL_REWARDS;

export const REWARD_LABEL: Record<RewardKind, string> = {
  tenant_move_in: "Renter moved in",
  owner_first_fill: "Owner's first tenant",
};

/** Where a referred person is in the journey, furthest stage wins. */
export type ReferralStage = "joined" | "searching" | "listed" | "moved_in" | "rewarded";

export const STAGE_LABEL: Record<ReferralStage, string> = {
  joined: "Joined",
  searching: "Looking for a place",
  listed: "Listed a place",
  moved_in: "Moved in",
  rewarded: "Reward paid",
};

export const STAGE_ORDER: ReferralStage[] = ["joined", "searching", "listed", "moved_in", "rewarded"];

/** Codes are 4 to 12 letters or digits, case-insensitive. */
export function normalizeRefCode(raw: unknown): string | null {
  const s = String(raw ?? "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
  return s.length >= 4 && s.length <= 12 ? s : null;
}

/** A readable code from a name plus a short random tail, e.g. "AHMED7K2". */
export function makeRefCode(name: string, rand: () => number = Math.random): string {
  const base = name.normalize("NFKD").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "SHAY";
  const tail = Array.from({ length: 3 }, () => "23456789ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(rand() * 31)]).join("");
  return base + tail;
}

export function referralLink(code: string, site = "https://stayshay.com"): string {
  return `${site}/?ref=${encodeURIComponent(code)}`;
}
