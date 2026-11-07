/**
 * The Stayshay Challenge. Performance rewards (not a lucky draw): every reward is paid only for real, confirmed
 * results checked by the team. Edit amounts, targets and dates here; the /win page and admin read from this.
 */
export const CAMPAIGN = {
  name: "The Stayshay Challenge",
  /** `target` reads after "AED X when …". Last day results count (inclusive), Dubai time. */
  endsOn: "2026-12-31",
  grandPrize: 5000,
  tracks: [
    {
      key: "referrals",
      title: "Refer renters",
      who: "Anyone: friends, HR teams, building watchmen, community admins",
      reward: 500,
      target: "5 people you refer move in through Stayshay",
      icon: "users",
    },
    {
      key: "agents",
      title: "Agents & brokers",
      who: "RERA agents, brokers and bed-space managers",
      reward: 1000,
      target: "10 of your listings are approved and 3 of them get a tenant through Stayshay",
      icon: "key",
    },
    {
      key: "listings",
      title: "List your property",
      who: "Owners and landlords with rooms, beds, studios or flats",
      reward: 500,
      target: "you list 5+ spaces and 3 of them get filled through Stayshay",
      icon: "grid",
    },
    {
      key: "leads",
      title: "Bring family & apartment leads",
      who: "Relocation helpers, company admins, community groups",
      reward: 750,
      target: "a family you introduce signs a 1BHK–3BHK lease through Stayshay (paid per family)",
      icon: "heart",
    },
  ],
} as const;

export type CampaignTrack = (typeof CAMPAIGN.tracks)[number]["key"];
export const TRACK_KEYS = CAMPAIGN.tracks.map((t) => t.key) as CampaignTrack[];
