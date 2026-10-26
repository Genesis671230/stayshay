import type { ListingType } from "@stayshay/core";

/**
 * Blog / guides. Written for people searching how to rent cheaply in the UAE, and for AI assistants that answer
 * those questions. Prices and examples are never typed in: `prices`, `listings` and `deals` blocks render from the
 * live catalogue, so the numbers stay true as listings change.
 *
 * Inline syntax in strings: [text](/path) for links and **bold**.
 */
export type Block =
  | { h2: string }
  | { p: string }
  | { ul: string[] }
  | { ol: string[] }
  | { tip: string }
  /** Live price table by area for one kind of place. */
  | { prices: ListingType; limit?: number }
  /** Live listing cards. */
  | { listings: { type?: ListingType; area?: string; maxPrice?: number; gender?: "male" | "female"; billsIncluded?: boolean; limit?: number } }
  /** Shay's live best-value picks. */
  | { deals: number }
  | { cta: "find" | "list" | "roommates" | "deals" | "ai" };

export interface Post {
  slug: string;
  title: string;
  /** Meta description, ≤ 160 chars. */
  description: string;
  keywords: string[];
  published: string;
  updated: string;
  /** Cover photo comes from a live listing of this kind (and area when given). */
  cover: { type: ListingType; area?: string };
  category: "Renters" | "Areas" | "Compare" | "Safety" | "Owners";
  blocks: Block[];
  faq: [string, string][];
}

export const POSTS: Post[] = [
  {
    slug: "cheap-bed-space-dubai",
    title: "Cheap bed space in Dubai: live prices by area and how to pick a good one",
    description: "What a bed space in Dubai really costs this month, area by area, what should be included, and the checks to make before you pay anything.",
    keywords: ["cheap bed space Dubai", "bed space Dubai monthly", "bedspace Bur Dubai", "bed space Karama", "executive bed space Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "bed_space" },
    category: "Renters",
    blocks: [
      { p: "A bed space is the cheapest way to live in Dubai: you rent one bed in a shared room, usually with a shared kitchen and bathroom, on a monthly basis with no yearly contract. For many people arriving for a new job it is the first home in the city, and a good one can be clean, quiet and close to the metro." },
      { h2: "What a bed space costs right now" },
      { p: "These figures come straight from the live listings on Stayshay and update automatically. \"From\" is the cheapest bed in that area today; \"typical\" is the middle price." },
      { prices: "bed_space" },
      { h2: "What should be included in the rent" },
      { ul: [
        "**Bills (DEWA, Wi-Fi, gas).** Most bed spaces include them. If not, ask for the average monthly share in writing.",
        "**Deposit.** Often one month or less. Get a receipt and agree when it comes back.",
        "**People per room.** \"Executive\" bed spaces usually mean 2–3 people per room and a proper bed, not a bunk.",
        "**Cleaning, laundry and cooking rules.** Ask who cleans shared areas and whether cooking is allowed.",
        "**Notice period.** One month is normal. Agree it before moving in.",
      ] },
      { h2: "Best areas for a cheap bed space" },
      { p: "Older, central neighbourhoods have the most choice and the shortest commutes by metro: [Bur Dubai](/rent/bed-space/bur-dubai), [Al Karama](/rent/bed-space/al-karama), [Deira](/rent/bed-space/deira) and [Al Barsha](/rent/bed-space/al-barsha-1) near Mall of the Emirates. [International City](/areas/international-city) and [Al Nahda](/areas/al-nahda-1) are cheaper but need a bus or a longer ride." },
      { listings: { type: "bed_space", limit: 6 } },
      { h2: "Checks before you pay" },
      { ol: [
        "Visit in person, at the time of day you'd normally come home.",
        "Meet the person who collects the rent and ask whether they are the owner, the main tenant or an agent.",
        "If the main tenant is sub-letting, ask whether the landlord has agreed in writing.",
        "Pay the deposit only after the viewing, and always get a receipt.",
      ] },
      { tip: "Tell Shay your budget and where you work, and it will shortlist bed spaces for you, including bills-included and no-deposit ones." },
      { cta: "find" },
    ],
    faq: [
      ["How much is a bed space in Dubai per month?", "It depends on the area and how many people share the room. Stayshay shows today's cheapest and typical price for every area, updated from live listings."],
      ["Is a bed space legal in Dubai?", "Shared housing is common, but overcrowding and unpermitted partitions are not allowed. Choose a place where the landlord has agreed to sharing and the room isn't overcrowded."],
      ["Do I need Ejari for a bed space?", "Ejari is registered by the person holding the tenancy contract for the whole unit. As a bed-space renter you usually won't be on it, so keep your receipts and written terms."],
      ["Can I rent a bed space for one month?", "Yes. Most bed spaces are monthly with about one month's notice."],
    ],
  },
  {
    slug: "partition-rooms-dubai-guide",
    title: "Partition rooms in Dubai: prices, rules and what to check",
    description: "A practical guide to partition rooms in Dubai: what they cost now, how they differ from a bed space or room, the rules on partitions, and red flags.",
    keywords: ["partition Dubai", "partition room Dubai", "master partition", "partition for couples Dubai", "cheap partition Karama"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "partition" },
    category: "Renters",
    blocks: [
      { p: "A partition is a private sleeping space made by dividing a larger room or hall with a partition wall. It gives you a door and some privacy for less than a full room. You'll see ads for \"master partitions\" (bigger, sometimes with a window or attached bathroom) and \"partitions for couples\"." },
      { h2: "Partition prices this month" },
      { prices: "partition" },
      { h2: "Partitions and the rules" },
      { p: "Dubai Municipality acts against unsafe or unpermitted partitions and overcrowded flats, and inspections can force a building to remove them at short notice. That's a real risk for renters: you can lose your home and your deposit. Before you commit, ask:" },
      { ul: [
        "Has the landlord agreed in writing to the flat being shared?",
        "Was the layout approved (a permit for the partition walls)?",
        "How many people live in the flat in total, and how many share each bathroom?",
        "Is there a window or proper ventilation, and a smoke detector?",
      ] },
      { p: "On Stayshay, listings where the lister has given both landlord consent and permit details get a **Verified** badge. Stayshay isn't a government body and doesn't issue permits; the badge shows what the lister provided and the checks we ran." },
      { h2: "Partition vs bed space vs room" },
      { ul: [
        "**Bed space**: cheapest, shared room, no privacy. See [bed spaces](/rent/bed-space).",
        "**Partition**: your own small space with a door; shared bathroom and kitchen. See [partitions](/rent/partitions).",
        "**Private room**: a real room with a window, sometimes an attached bathroom. See [rooms](/rent/rooms).",
      ] },
      { listings: { type: "partition", limit: 6 } },
      { cta: "find" },
    ],
    faq: [
      ["Are partitions legal in Dubai?", "Partitions need approval and flats can't be overcrowded. Unpermitted partitions can be removed after an inspection, so check for landlord consent and a permit before you pay."],
      ["Can couples rent a partition in Dubai?", "Some listings accept couples. Filter for couples on Stayshay or ask Shay for couple-friendly partitions."],
      ["What is a master partition?", "A larger partition, often with a window or its own bathroom, priced between a normal partition and a private room."],
    ],
  },
  {
    slug: "cheapest-areas-to-rent-dubai",
    title: "Cheapest areas to rent in Dubai for monthly rooms, partitions and studios",
    description: "Where rent is lowest in Dubai and Sharjah right now, based on live listings, and how each area works for commute, metro access and daily life.",
    keywords: ["cheapest area to live in Dubai", "cheap apartment Dubai", "affordable areas Dubai", "cheap rent Dubai monthly", "cheap rooms Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "studio" },
    category: "Areas",
    blocks: [
      { p: "Cheap and well-located usually pull against each other in Dubai. These tables show where you can live for the least right now, so you can weigh the saving against the commute." },
      { h2: "Cheapest areas for a bed space" },
      { prices: "bed_space", limit: 8 },
      { h2: "Cheapest areas for a private room" },
      { prices: "room", limit: 8 },
      { h2: "Cheapest areas for a studio" },
      { prices: "studio", limit: 8 },
      { h2: "How to choose between them" },
      { ul: [
        "**On the Red or Green metro line?** [Al Karama](/areas/al-karama), [Bur Dubai](/areas/bur-dubai), [Deira](/areas/deira), [Al Barsha](/areas/al-barsha-1) and [Barsha Heights](/areas/barsha-heights-tecom) save you a car.",
        "**Lowest rent, longer commute:** [International City](/areas/international-city), [Discovery Gardens](/areas/discovery-gardens) and [Al Nahda](/areas/al-nahda-1).",
        "**Working in Sharjah, or OK with the Al Ittihad Road traffic:** [Al Nahda, Sharjah](/areas/al-nahda-sharjah) and [Al Qasimia](/areas/al-qasimia-sharjah) are often the best value.",
      ] },
      { h2: "Shay's best-value picks today" },
      { deals: 6 },
      { cta: "deals" },
    ],
    faq: [
      ["What is the cheapest area to live in Dubai?", "On current listings, International City, Deira, Al Karama and Bur Dubai have the lowest prices for shared housing. The tables on this page update from live listings."],
      ["Is it cheaper to live in Sharjah and work in Dubai?", "Rent is usually lower in Sharjah, but the daily commute can be long. Compare total monthly cost, including transport, and time."],
    ],
  },
  {
    slug: "monthly-studio-rent-dubai",
    title: "Monthly studio rent in Dubai without a yearly contract",
    description: "How to rent a studio in Dubai month to month: live prices, where to look, what's included, and what to check before you sign.",
    keywords: ["monthly studio rent Dubai", "studio for rent monthly Dubai", "furnished studio Dubai monthly", "cheap studio apartment Dubai", "studio without deposit Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "studio" },
    category: "Renters",
    blocks: [
      { p: "Most Dubai apartments are let on yearly contracts paid in a few cheques. A monthly studio lets you skip that: one month's rent and a deposit, often furnished, often with bills included. You pay a little more per month for the flexibility." },
      { h2: "Studio prices this month" },
      { prices: "studio" },
      { h2: "Where monthly studios are" },
      { p: "[International City](/rent/studios/international-city) and [Al Nahda](/areas/al-nahda-2) are cheapest. [Business Bay](/rent/studios/business-bay), [JLT](/areas/jumeirah-lakes-towers-jlt) and [JVC](/areas/jumeirah-village-circle) cost more but are newer buildings with gyms and pools." },
      { listings: { type: "studio", limit: 6 } },
      { h2: "Before you sign" },
      { ul: [
        "Ask whether DEWA, Wi-Fi and cooling (chiller) are included. Chiller fees can be large in summer.",
        "Check the notice period and whether the deposit is refundable.",
        "If it's a holiday-home style unit, ask whether it's registered for short stays.",
      ] },
      { cta: "find" },
    ],
    faq: [
      ["Can I rent a studio in Dubai for one month?", "Yes. Many furnished studios are offered monthly, usually with a deposit and a minimum stay of one to three months."],
      ["Do monthly studios include bills?", "Many do. Each Stayshay listing says whether utilities are included."],
    ],
  },
  {
    slug: "dubizzle-vs-bayut-vs-stayshay-rooms",
    title: "Dubizzle vs Bayut vs Property Finder vs Stayshay: where to find a room or bed space in Dubai",
    description: "An honest comparison of the main places to find shared housing in the UAE: what each is best for, prices shown, fees and safety.",
    keywords: ["dubizzle rooms for rent", "bayut room for rent", "property finder room", "dubizzle bed space", "dubizzle alternative", "best site to find room in Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room" },
    category: "Compare",
    blocks: [
      { p: "If you're looking for a bed space, partition or room, you'll probably check several sites and a few Facebook and WhatsApp groups. Here's what each one is good for, so you can spend your time where the right listings are." },
      { h2: "Dubizzle" },
      { p: "The UAE's biggest classifieds site, with a large \"Rooms for rent\" section. It has the most volume, posted by owners, tenants and agents. The trade-off is that listings vary a lot in detail and quality, so you'll filter and message a lot." },
      { h2: "Bayut and Property Finder" },
      { p: "The two big property portals. They're best for renting or buying a whole apartment or villa, usually through a licensed agent, on yearly contracts. Shared rooms are a small part of what they list." },
      { h2: "Facebook and WhatsApp groups" },
      { p: "Fast and free, with lots of bed spaces, but nothing is checked and scams are common. Never pay before a viewing." },
      { h2: "Stayshay" },
      { p: "Built only for affordable monthly living: [bed spaces](/rent/bed-space), [partitions](/rent/partitions), [rooms](/rent/rooms), [studios](/rent/studios) and [roommates](/roommates). Every listing shows the monthly rent, deposit, upfront cost and whether bills are included before you message anyone. Listings are reviewed before they go live, and the Verified badge shows when a lister has given landlord consent (and a permit for partitions). It's free for renters, and [Shay](/ai), our assistant, can shortlist places for you, on the site or inside ChatGPT and Claude." },
      { h2: "Side by side" },
      { ul: [
        "**Best for whole apartments on a yearly lease:** Bayut, Property Finder.",
        "**Most listings of every kind:** Dubizzle.",
        "**Monthly shared housing with full costs and checks shown:** Stayshay.",
      ] },
      { deals: 4 },
      { cta: "ai" },
    ],
    faq: [
      ["What is the best website to find a room in Dubai?", "For monthly shared housing with the full cost shown up front, use a dedicated site like Stayshay. For whole apartments on yearly contracts, use Bayut or Property Finder. Dubizzle has the most volume overall."],
      ["Is Stayshay free?", "Yes. There's no fee or commission for renters, and listing a place is free."],
    ],
  },
  {
    slug: "avoid-rental-scams-uae",
    title: "How to avoid room and bed space scams in the UAE",
    description: "The common rental scams in Dubai and Sharjah, the warning signs, and a simple checklist that keeps your deposit safe.",
    keywords: ["rental scam Dubai", "bed space scam", "room rent fraud UAE", "fake listing Dubai", "safe room rental Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room" },
    category: "Safety",
    blocks: [
      { p: "Most people renting rooms in the UAE are honest. The few who aren't use the same tricks again and again, and you can spot nearly all of them." },
      { h2: "Common scams" },
      { ul: [
        "**\"Pay to hold it\":** a great price, someone else is \"about to take it\", and you're asked to transfer a deposit before seeing the place.",
        "**The fake owner:** someone shows the flat but has no right to rent it, collects deposits from several people, then disappears.",
        "**Photos that don't match:** pictures copied from another listing or a hotel.",
        "**Surprise costs:** \"bills extra\", \"agent fee\" or \"key deposit\" mentioned only when you arrive with your bags.",
      ] },
      { h2: "Checklist before you pay" },
      { ol: [
        "View the place in person (or by live video if you're abroad, then visit before paying the rest).",
        "Ask who holds the tenancy contract, and if they're sub-letting, for the landlord's written consent.",
        "Agree rent, deposit, bills and notice in writing (WhatsApp is fine).",
        "Pay by bank transfer to a named person and get a receipt.",
      ] },
      { p: "Stayshay shows every cost before you message, reviews listings before they go live, and never asks you to pay through the site. [Tell us on WhatsApp](https://wa.me/971569048493) if anything looks wrong." },
      { cta: "find" },
    ],
    faq: [
      ["Should I pay a deposit before viewing a room in Dubai?", "No. Pay only after you've seen the place and met the person renting it, and always get a receipt."],
      ["How do I check that someone is allowed to rent out a room?", "Ask who holds the tenancy contract. If they're the tenant rather than the owner, ask for the landlord's written consent to sublet."],
    ],
  },
  {
    slug: "sharjah-vs-dubai-rent",
    title: "Sharjah vs Dubai for shared housing: rent, commute and lifestyle",
    description: "Compare live bed space, room and studio prices in Sharjah and Dubai, plus the commute trade-off and which areas work best.",
    keywords: ["Sharjah vs Dubai rent", "bed space Sharjah", "room for rent Al Nahda Sharjah", "cheap room Sharjah", "studio Sharjah monthly"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room", area: "al-nahda-sharjah" },
    category: "Areas",
    blocks: [
      { p: "Sharjah is the classic way to cut rent if you work in Dubai. The saving is real, and so is the traffic. Here's how to decide." },
      { h2: "Rooms in Sharjah right now" },
      { listings: { area: "al-nahda-sharjah", limit: 6 } },
      { h2: "The commute" },
      { p: "Areas on the border, like [Al Nahda, Sharjah](/areas/al-nahda-sharjah), are close to Dubai's Al Nahda and Al Qusais metro stations. Further in, like [Al Qasimia](/areas/al-qasimia-sharjah) and [Abu Shagara](/areas/abu-shagara-sharjah), you'll rely on buses or a car, and peak traffic on the main roads can double the journey." },
      { h2: "Rule of thumb" },
      { ul: [
        "Work in Deira, Al Qusais or Dubai Airport? Sharjah usually makes sense.",
        "Work in Barsha, Marina or JLT? Look at [Al Barsha](/areas/al-barsha-1), [Discovery Gardens](/areas/discovery-gardens) or [JVC](/areas/jumeirah-village-circle) instead.",
      ] },
      { cta: "find" },
    ],
    faq: [["Is rent cheaper in Sharjah than Dubai?", "Generally yes, especially for studios and rooms. Compare live listings and include transport costs and time."]],
  },
  {
    slug: "find-roommate-dubai",
    title: "How to find a good roommate in Dubai",
    description: "Where to find roommates in Dubai, what to agree on before moving in, and how Stayshay's roommate board matches you by budget, area and habits.",
    keywords: ["roommate Dubai", "find roommate Dubai", "flatmate Dubai", "room share Dubai", "female roommate Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room" },
    category: "Renters",
    blocks: [
      { p: "Sharing a flat with the right person can halve your rent and make the city feel like home. Sharing with the wrong one is the fastest way to want to leave." },
      { h2: "Agree on these first" },
      { ul: ["Budget and how bills are split", "Move-in date and how long you'll stay", "Cleaning, guests, smoking and quiet hours", "Who signs the contract and who holds the deposit"] },
      { h2: "Where to look" },
      { p: "The [Stayshay roommate board](/roommates) lists people already looking, with a photo, budget, area and habits. Profiles are approved by our team before they appear, and phone numbers are never shown publicly." },
      { cta: "roommates" },
    ],
    faq: [["How do I find a roommate in Dubai?", "Create a free profile on the Stayshay roommate board with your budget, area and habits, or browse people already looking."]],
  },
  {
    slug: "female-only-bed-space-dubai",
    title: "Ladies-only bed spaces and rooms in Dubai",
    description: "Female-only bed spaces, partitions and rooms in Dubai: live listings, safe areas near the metro, and what to ask before you move in.",
    keywords: ["ladies bed space Dubai", "female bed space Dubai", "female only room Dubai", "ladies partition Karama", "bed space for ladies Bur Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "bed_space" },
    category: "Renters",
    blocks: [
      { p: "Many flats in Dubai are let as ladies-only. Here are the ones live on Stayshay right now. Mixed listings that accept women are included in searches too, and male-only listings never are." },
      { listings: { gender: "female", limit: 9 } },
      { h2: "What to ask" },
      { ul: ["Is the whole flat ladies-only, or just the room?", "Is there a lock on the room and the main door?", "Who else has keys (owner, cleaner)?", "Is the building entrance staffed or on camera?"] },
      { p: "Tip: on the [search page](/search?gender=female) choose **Female** to see every place that accepts women." },
      { cta: "find" },
    ],
    faq: [["Where can I find a female-only bed space in Dubai?", "Filter by Female on Stayshay, or ask Shay for ladies-only bed spaces in your area."]],
  },
  {
    slug: "couple-room-partition-dubai",
    title: "Rooms and partitions for couples in Dubai",
    description: "Where couples can rent a room, partition or studio monthly in Dubai, what it costs, and what landlords ask for.",
    keywords: ["couple partition Dubai", "room for couple Dubai", "couple sharing Dubai", "studio for couple Dubai monthly"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "partition" },
    category: "Renters",
    blocks: [
      { p: "Not every shared flat takes couples, so filtering early saves a lot of messages. Couple-friendly listings say so in \"Who can live here\"." },
      { h2: "Typical prices for couples" },
      { p: "Couples usually choose a master partition, a private room with its own bathroom, or a studio. Here's what those cost now:" },
      { prices: "room", limit: 6 },
      { prices: "studio", limit: 6 },
      { cta: "find" },
    ],
    faq: [["Can couples share a room in Dubai?", "Yes, many listings accept couples. Check the \"Who can live here\" section or ask Shay to filter for couples."]],
  },
  {
    slug: "clean-cheap-apartment-dubai",
    title: "Clean, cheap apartments and studios in Dubai: how to find one",
    description: "How to find a clean, affordable apartment or studio in Dubai on a monthly basis: live prices, the cheapest areas and a viewing checklist.",
    keywords: ["cheap apartment Dubai", "clean apartment Dubai", "cheap flat Dubai monthly", "budget apartment Dubai", "cheap studio Dubai"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "studio" },
    category: "Renters",
    blocks: [
      { p: "\"Cheap\" and \"clean\" can go together. The trick is knowing what the going rate is, so you can spot when a low price is just a good deal and when it's a warning sign." },
      { prices: "studio" },
      { h2: "Viewing checklist" },
      { ul: ["AC works and has been serviced (ask when)", "No damp marks on ceilings or behind furniture", "Kitchen and bathroom drains run freely", "Window seals: dust and heat come in through gaps", "Ask when pest control was last done"] },
      { h2: "Best-value places today" },
      { deals: 6 },
      { cta: "deals" },
    ],
    faq: [["How can I find a cheap apartment in Dubai?", "Compare live studio prices by area, look at International City, Al Nahda and Deira for the lowest rents, and check Shay's best deals for below-market listings."]],
  },
  {
    slug: "moving-to-dubai-first-month-housing",
    title: "Moving to Dubai: where to stay your first month",
    description: "Just landed or starting a new job? Monthly housing options for your first weeks in Dubai, what they cost, and how to move in fast.",
    keywords: ["moving to Dubai accommodation", "first month Dubai stay", "temporary accommodation Dubai", "short term room Dubai", "new to Dubai room"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room" },
    category: "Renters",
    blocks: [
      { p: "Hotels add up fast and yearly leases need paperwork you might not have yet. A monthly bed space, room or studio bridges the gap while you get your Emirates ID and learn the city." },
      { ol: [
        "Pick an area near work or near a metro station on the Red or Green line.",
        "Choose bills included, so your first month has no surprise costs.",
        "Book viewings for your first two days. Shay can line them up before you land.",
        "Stay one or two months, then decide whether to stay or move closer to work.",
      ] },
      { listings: { billsIncluded: true, limit: 6 } },
      { cta: "ai" },
    ],
    faq: [["Where should I stay my first month in Dubai?", "A monthly room or bed space with bills included near a metro station is the cheapest and most flexible start."]],
  },
  {
    slug: "bed-space-near-metro-dubai",
    title: "Bed spaces and rooms near Dubai Metro: the best stations for cheap living",
    description: "Living close to the Dubai Metro saves time and money. The best stations for affordable bed spaces and rooms, with live listings.",
    keywords: ["bed space near metro Dubai", "room near metro station Dubai", "bed space near ADCB metro", "room near Burjuman metro", "near metro Karama"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "bed_space", area: "al-karama" },
    category: "Areas",
    blocks: [
      { p: "Without a car, the metro decides your day. Places within a 10-minute walk of a station rent quickly, so it pays to know where to look." },
      { ul: [
        "**ADCB, BurJuman** for [Al Karama](/areas/al-karama) and [Bur Dubai](/areas/bur-dubai): central and very busy.",
        "**Union, Al Rigga, Baniyas** for [Deira](/areas/deira): lots of cheap bed spaces, close to both lines.",
        "**Mall of the Emirates** for [Al Barsha](/areas/al-barsha-1): popular with people working in Barsha, Al Quoz and Media City.",
        "**Dubai Internet City** for [Barsha Heights (TECOM)](/areas/barsha-heights-tecom).",
        "**Al Nahda, Stadium** for [Al Nahda](/areas/al-nahda-1) and [Al Qusais](/areas/al-qusais-1).",
      ] },
      { p: "On the [search page](/search?metro=1), turn on **Near metro** to see places within about 10 minutes' walk." },
      { cta: "find" },
    ],
    faq: [["Which metro station has the cheapest bed spaces?", "Stations in Deira, Al Karama and Bur Dubai (Union, Al Rigga, ADCB, BurJuman) have the most affordable shared housing on current listings."]],
  },
  {
    slug: "rent-out-room-bed-space-dubai",
    title: "How to rent out your room or bed space in Dubai (free listing)",
    description: "Owners and main tenants: how to list a room, partition or bed space in Dubai, what renters want to see, and how to fill it faster with Stayshay.",
    keywords: ["list room for rent Dubai", "advertise bed space Dubai", "rent out partition Dubai", "post room ad Dubai free"],
    published: "2026-10-26",
    updated: "2026-10-26",
    cover: { type: "room" },
    category: "Owners",
    blocks: [
      { p: "Empty beds cost you money every day. Renters choose fast when they can see everything up front, so a complete listing fills sooner than a cheap one." },
      { ol: [
        "Take bright photos in daylight: the bed, the room, the bathroom, the kitchen and the building entrance.",
        "State the full monthly cost: rent, deposit, bills and any upfront fee.",
        "Say who it suits (male, female, couples) and the house rules.",
        "If you're the main tenant, get the landlord's written consent; it earns you the Verified badge.",
      ] },
      { p: "Listing on Stayshay is free. Send it in a few minutes at [stayshay.com/list](/list) and our team reviews it before it goes live." },
      { cta: "list" },
    ],
    faq: [["Is it free to list a room on Stayshay?", "Yes. Listing is free, and every listing is reviewed before it goes live."]],
  },
];

export const POST_BY_SLUG = new Map(POSTS.map((p) => [p.slug, p]));
