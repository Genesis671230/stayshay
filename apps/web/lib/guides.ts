import type { FamilyHome, ListingType } from "@stayshay/core";
import type { Block } from "./blog";

/**
 * Family-home and relocation landing pages (/family, /family/<slug>, /move, /move/<from>).
 *
 * Stayshay's live catalogue is shared housing (bed spaces → studios). Families and people relocating are served as a
 * concierge: every page carries the family brief form, which lands in /admin + Telegram and opens a WhatsApp thread.
 * Copy is written to be quotable by AI assistants: a direct short answer first, then detail. No invented prices:
 * live numbers come from `listings` / `prices` blocks; market facts are stated as ranges people can verify.
 */
export interface Guide {
  slug: string;
  path: string;
  /** <title>, ≤ 60 chars where possible. */
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  eyebrow: string;
  /** Two-to-four sentence direct answer, shown in a box above the fold (AEO). */
  answer: string;
  photo: string;
  form: { home: FamilyHome; area?: string; metro?: boolean; from?: string; heading?: string };
  blocks: Block[];
  faq: [string, string][];
  /** Live shared-housing listings to show as a budget / first-month option. */
  live?: { type?: ListingType; area?: string; limit?: number; title: string };
  related: string[];
}

/* ------------------------------------------------------------------ */
/* Shared facts (kept in one place so every page says the same thing)  */
/* ------------------------------------------------------------------ */

const LEASE_FACTS: string[] = [
  "**Contract:** Dubai family flats are normally let on a 12-month contract registered with **Ejari**. Monthly or 3-month furnished stays exist but cost more per month.",
  "**Payment:** rent is paid by post-dated cheques. Fewer cheques (1–2) gets a lower rent; 4, 6 or 12 cheques are negotiable, and some owners accept monthly bank transfer.",
  "**Security deposit:** commonly about 5% of the yearly rent for unfurnished and about 10% for furnished, refundable at the end.",
  "**Agency fee:** agents usually charge around 5% of the yearly rent. Stayshay charges families nothing.",
  "**DEWA (water and electricity):** a refundable connection deposit is paid when you activate the account (larger for villas than apartments), plus monthly bills. Ask whether chiller/AC is included, it changes the bill a lot.",
  "**Family visa link:** your Ejari is one of the documents used for sponsoring your spouse and children, so make sure the contract is in the sponsor's name.",
];

const BEFORE_YOU_SIGN: string[] = [
  "Visit at the time you'd commute, and check the walk to the metro or bus stop with children.",
  "Check the chiller/AC arrangement (DEWA-included, Empower or a separate chiller bill).",
  "Ask for the title deed or the owner's ID and make sure the person you pay is the owner or a RERA-registered broker.",
  "Never pay a deposit before viewing. Pay by cheque or bank transfer to the owner's or agency's account, and get a receipt.",
  "Agree in writing who pays maintenance and what happens if you need to leave early (often 1–2 months' rent penalty).",
];

const FAMILY_FAQ: [string, string][] = [
  ["Does Stayshay list 2BHK and 3BHK family apartments?", "Yes, as a free concierge. Send your brief (bedrooms, budget, areas, move-in) and our team sends real options with prices and viewing times on WhatsApp, usually the same day. Our public listings are shared housing, so family homes are matched by hand."],
  ["Is there a fee for families?", "Stayshay charges families nothing. If an option comes through an agency, the agency fee (usually around 5% of the yearly rent) is shown before you view."],
  ["Can I rent a family apartment in Dubai monthly?", "Yes, as a furnished monthly rental or serviced apartment, but it costs more per month than a 12-month contract. Many families stay 1–3 months furnished, then sign a yearly lease once they know the area."],
  ["How much salary do I need to sponsor my family in the UAE?", "The usual rule is a monthly salary of at least AED 4,000, or AED 3,000 plus company accommodation. Check the current rule with your employer's PRO or ICP/GDRFA before you apply."],
];

/* ------------------------------------------------------------------ */
/* Family-friendly areas                                               */
/* ------------------------------------------------------------------ */

interface FamilyArea {
  slug: string;
  name: string;
  /** Metro access in plain words. */
  metro: string;
  hasMetro: boolean;
  /** Who it suits and why, 2–3 sentences. */
  feel: string;
  good: string[];
  watch: string[];
  photo?: string;
}

export const FAMILY_AREAS: FamilyArea[] = [
  { slug: "al-nahda-dubai", name: "Al Nahda (Dubai)", metro: "Green Line: Al Nahda and Stadium stations", hasMetro: true, feel: "Low and mid-rise family buildings on the Dubai–Sharjah border, with parks, supermarkets and schools close by. Popular with South Asian and Arab families who want Dubai rents without the Sharjah commute.", good: ["Green Line metro", "Al Nahda Pond Park and walkable shops", "Big choice of 1BHK and 2BHK flats"], watch: ["Evening traffic towards Sharjah", "Older buildings vary a lot, view a few"] },
  { slug: "al-qusais", name: "Al Qusais", metro: "Green Line: Al Qusais and Etisalat stations", hasMetro: true, feel: "Established residential area near the airport and Sharjah, with spacious older flats, hypermarkets and many community schools.", good: ["Larger flats for the money", "Two Green Line stations", "Close to schools and clinics"], watch: ["Airport-side noise in some blocks", "Parking can be tight"] },
  { slug: "mirdif", name: "Mirdif", metro: "Nearest Red Line stations: Rashidiya and Centrepoint (short drive); the planned Blue Line will serve the area", hasMetro: false, feel: "A quiet villa and low-rise community with Mirdif City Centre, Uptown Mirdif and Mushrif Park. A long-time favourite for families who want space and calm.", good: ["Villas, townhouses and low-rise flats", "Parks and family malls", "Many schools nearby"], watch: ["You will want a car", "Flight path in parts of the area"] },
  { slug: "dso", name: "Dubai Silicon Oasis", metro: "No metro yet; the planned Blue Line will run through the area. Buses link to Rashidiya and Centrepoint", hasMetro: false, feel: "A planned, gated community with affordable modern apartments, a central park, schools and a mall. Good value for families who drive.", good: ["Newer buildings and gated feel", "Good value 1BHK–3BHK", "Schools and nurseries inside the community"], watch: ["Car needed until the Blue Line opens", "Outer location for Marina/JLT commutes"] },
  { slug: "jvc", name: "Jumeirah Village Circle (JVC)", metro: "No metro; buses connect to the Red Line", hasMetro: false, feel: "A large mid-rise community with lots of newer 1BHK and 2BHK apartments, parks on almost every block, nurseries and supermarkets. Popular with young families from Europe, India and the Philippines.", good: ["New buildings with pools and gyms", "Many parks and nurseries", "Central for Al Barsha, Marina and Sports City"], watch: ["Construction in some pockets", "Traffic at the exits at rush hour"] },
  { slug: "discovery-gardens", name: "Discovery Gardens", metro: "Red Line (Route 2020): Discovery Gardens station, plus Ibn Battuta nearby", hasMetro: true, feel: "Themed low-rise buildings with green courtyards next to Ibn Battuta Mall. Good-value flats with a metro station on the doorstep.", good: ["Metro on the Expo 2020 branch", "Garden courtyards, quiet", "Next to Ibn Battuta Mall"], watch: ["Older fittings in some clusters", "Far from Deira and the airport"] },
  { slug: "al-barsha-1", name: "Al Barsha", metro: "Red Line: Mall of the Emirates and Sharaf DG stations", hasMetro: true, feel: "Central, connected and family-friendly, with Mall of the Emirates, a big park, international schools and hypermarkets. Rents are mid-range for the location.", good: ["Red Line metro", "Al Barsha Pond Park", "Central for Marina, Media City and Downtown"], watch: ["Busy around the mall", "Newer towers cost more"] },
  { slug: "al-karama", name: "Al Karama", metro: "Red Line ADCB station and the BurJuman interchange (Red and Green)", hasMetro: true, feel: "Central, walkable and lively, with Karama market, restaurants and community schools. Older low-rise blocks with practical family flats.", good: ["Very central", "Walk to markets, clinics and two metro stations", "Strong South Asian and Filipino community"], watch: ["Older buildings, check the AC and plumbing", "Parking"] },
  { slug: "bur-dubai", name: "Bur Dubai", metro: "Green Line Al Fahidi and BurJuman; Red Line Al Ghubaiba area", hasMetro: true, feel: "Old Dubai by the Creek, with Meena Bazaar, Indian groceries and restaurants, and family flats around Mankhool. A natural first home for many Indian families.", good: ["Central and historic", "Meena Bazaar and Indian groceries", "Metro and abra"], watch: ["Dense streets", "Older buildings"] },
  { slug: "international-city", name: "International City", metro: "No metro yet; the planned Blue Line will serve it. Buses to Rashidiya and Union", hasMetro: false, feel: "The cheapest family flats in Dubai, in country-themed clusters next to Dragon Mart. Practical for tight budgets if you can live with the distance.", good: ["Lowest rents in Dubai", "Dragon Mart and wholesale shopping", "Lots of studios and 1BHKs"], watch: ["Far from the metro", "Cluster quality varies a lot, view first"] },
  { slug: "al-furjan", name: "Al Furjan", metro: "Red Line (Route 2020): Al Furjan station", hasMetro: true, feel: "A newer townhouse and mid-rise community on the Expo branch of the metro, between Jebel Ali and Discovery Gardens. Good for families working in Jebel Ali, Dubai South or commuting to Abu Dhabi.", good: ["Metro on the doorstep", "Newer buildings", "Easy for Abu Dhabi commuters (Sheikh Zayed Rd / E11)"], watch: ["Ongoing construction", "Few big malls inside the community"] },
  { slug: "dubai-sports-city", name: "Dubai Sports City", metro: "No metro; buses connect to the Red Line", hasMetro: false, feel: "Affordable mid-rise apartments with sports academies, a golf course and quick access to Motor City and JVC.", good: ["Good value 1–3BHK", "Sports academies for kids", "Next to JVC and Motor City"], watch: ["Car needed", "Some buildings older than they look"] },
  { slug: "deira", name: "Deira", metro: "Red and Green Lines: Union, Al Rigga, Salah Al Din, Baniyas", hasMetro: true, feel: "The historic trading heart of Dubai, with the Gold Souk, Al Ghurair Centre and the cheapest central flats. Busy and convenient.", good: ["Cheapest central rents", "Two metro lines", "Close to the airport"], watch: ["Crowded streets", "Older buildings, inspect carefully"] },
  { slug: "al-nahda-sharjah", name: "Al Nahda (Sharjah)", metro: "No metro in Sharjah; the Dubai Green Line (Stadium / Al Nahda) is a short drive or taxi", hasMetro: false, feel: "Sharjah's side of Al Nahda: towers with big flats at lower rents than Dubai, next to Sahara Centre. Many families live here and work in Dubai.", good: ["More space for the money", "Sahara Centre and parks", "Close to Dubai's Green Line"], watch: ["Heavy traffic into Dubai at rush hour", "Sharjah rules: no alcohol, Tawtheeq not Ejari"] },
  { slug: "al-taawun", name: "Al Taawun (Sharjah)", metro: "No metro; buses and taxis to Dubai", hasMetro: false, feel: "Waterfront towers in Sharjah near Al Khan lagoon and Expo Centre Sharjah, with large 2BHK and 3BHK flats at a fraction of Dubai prices.", good: ["Large flats, sea and lagoon views", "Lower rents", "Family atmosphere"], watch: ["Commute to Dubai", "Check parking and chiller charges"] },
  { slug: "al-warqa", name: "Al Warqa", metro: "No metro; Rashidiya (Red Line) is a short drive", hasMetro: false, feel: "A quiet residential area next to Mirdif with low-rise buildings and villas, popular with Arab and South Asian families.", good: ["Quiet and spacious", "Near Mirdif malls and Dragon Mart", "Villas and townhouses"], watch: ["Car needed", "Fewer walkable shops"] },
  { slug: "jlt", name: "Jumeirah Lake Towers (JLT)", metro: "Red Line: DMCC and JLT stations", hasMetro: true, feel: "Towers around landscaped lakes with cafés, nurseries and two metro stations, next to Dubai Marina. Popular with European professionals and young families.", good: ["Two metro stations", "Walkable lakes and cafés", "Close to Marina and Media City"], watch: ["Higher rents", "Tower parking and service charges"] },
  { slug: "business-bay", name: "Business Bay", metro: "Red Line: Business Bay station", hasMetro: true, feel: "Modern towers along the canal next to Downtown. Best for families who want to walk to the office and Dubai Mall; less for those wanting parks and schools close by.", good: ["Walk to offices", "Canal promenade", "Next to Downtown"], watch: ["High rents", "Few schools inside the area"] },
  { slug: "dubai-marina", name: "Dubai Marina", metro: "Red Line: Dubai Marina (DMCC) and Sobha Realty stations, plus the Dubai Tram", hasMetro: true, feel: "Waterfront high-rises, beach access and the Marina Walk. Premium, lively and very popular with European families relocating to Dubai.", good: ["Beach and promenade", "Metro and tram", "International community"], watch: ["Among the highest rents", "Traffic and crowds at weekends"] },
  { slug: "motor-city", name: "Motor City", metro: "No metro; buses connect to the Red Line", hasMetro: false, feel: "A low-rise, green community next to Sports City with parks, a supermarket strip and schools close by. Calm and family-oriented.", good: ["Low-rise and green", "Schools and nurseries close", "Quieter than JVC"], watch: ["Car needed", "Limited stock, good flats go fast"] },
];

/* ------------------------------------------------------------------ */
/* Family pages                                                        */
/* ------------------------------------------------------------------ */

const hub: Guide = {
  slug: "",
  path: "/family",
  title: "Family apartments in Dubai: 1BHK, 2BHK, 3BHK near metro",
  h1: "Family apartments in Dubai, found for you",
  description: "1BHK, 2BHK and 3BHK family apartments and family sharing rooms in Dubai and Sharjah, near the metro. Send your budget and get real options on WhatsApp. Free for families.",
  keywords: ["family apartment Dubai", "2BHK for rent Dubai", "3BHK for rent Dubai", "1BHK for rent Dubai", "family sharing Dubai", "family room for rent Dubai", "apartment near metro Dubai"],
  eyebrow: "Family homes · Dubai & Sharjah",
  answer: "Tell Stayshay how many bedrooms you need, your monthly budget, the areas you like and when you move. Our team sends real 1BHK, 2BHK, 3BHK or family-sharing options with prices and viewing times on WhatsApp, usually the same day. It's free for families.",
  photo: "/photos/living.jpg",
  form: { home: "2bhk" },
  blocks: [
    { h2: "Which home fits your family" },
    { ul: [
      "**[Family sharing room](/family/family-sharing-apartment-dubai):** a private room for a couple or small family inside a shared flat. The cheapest way to live together in Dubai.",
      "**[Studio](/rent/studios):** one open room with kitchen and bathroom. Fine for a couple or a couple with a baby.",
      "**[1BHK](/family/1bhk-apartment-dubai):** one bedroom plus a living room. The most common choice for couples and families with one young child.",
      "**[2BHK](/family/2bhk-apartment-dubai):** two bedrooms. The family standard: children get their own room, or you share with relatives.",
      "**[3BHK](/family/3bhk-apartment-dubai):** three bedrooms, often with a maid's room. For larger families or a home office.",
    ] },
    { h2: "Best areas for families, by budget" },
    { p: "**Lowest rents:** [International City](/family/family-apartments-international-city), [Deira](/family/family-apartments-deira), [Al Qusais](/family/family-apartments-al-qusais) and Sharjah ([Al Nahda](/family/family-apartments-al-nahda-sharjah), [Al Taawun](/family/family-apartments-al-taawun)). **Middle:** [Al Nahda Dubai](/family/family-apartments-al-nahda-dubai), [Al Karama](/family/family-apartments-al-karama), [Discovery Gardens](/family/family-apartments-discovery-gardens), [JVC](/family/family-apartments-jvc), [Silicon Oasis](/family/family-apartments-dso), [Sports City](/family/family-apartments-dubai-sports-city). **Higher:** [Al Barsha](/family/family-apartments-al-barsha-1), [JLT](/family/family-apartments-jlt), [Business Bay](/family/family-apartments-business-bay), [Dubai Marina](/family/family-apartments-dubai-marina)." },
    { p: "Want the metro at your door? Start with [family apartments near the metro](/family/family-apartment-near-metro-dubai)." },
    { h2: "How renting a family flat works in Dubai" },
    { ul: LEASE_FACTS },
    { h2: "Checks before you sign" },
    { ol: BEFORE_YOU_SIGN },
    { tip: "Moving from abroad? Many families take a [furnished monthly flat](/family/furnished-family-apartment-monthly-dubai) for the first 1–3 months, then sign a yearly lease. See our [relocation guides](/move)." },
  ],
  faq: FAMILY_FAQ,
  live: { type: "studio", title: "Studios you can move into now (good first month for a couple)" },
  related: ["/move", "/family/2bhk-apartment-dubai", "/family/family-sharing-apartment-dubai", "/blog/new-to-dubai-guide"],
};

const typePages: Guide[] = [
  {
    slug: "2bhk-apartment-dubai",
    path: "/family/2bhk-apartment-dubai",
    title: "2BHK for rent in Dubai: family flats near metro",
    h1: "2BHK apartments for rent in Dubai",
    description: "Find a 2BHK family apartment in Dubai or Sharjah: best areas by budget, near-metro options, cheques, deposit and Ejari explained. Get real options on WhatsApp, free.",
    keywords: ["2BHK for rent Dubai", "2 bedroom apartment Dubai", "2BHK Al Nahda", "2BHK Al Qusais", "2BHK JVC", "2BHK near metro Dubai", "2BHK monthly rent Dubai", "2BHK Sharjah"],
    eyebrow: "2 bedrooms · hall · kitchen",
    answer: "A 2BHK (two bedrooms, hall and kitchen) is the standard family flat in Dubai. The best value is in Al Qusais, Al Nahda, Discovery Gardens, International City, Silicon Oasis and Sharjah; JLT, Business Bay and the Marina cost the most. Send Stayshay your budget and areas and we'll WhatsApp you real 2BHK options, free.",
    photo: "/photos/living.jpg",
    form: { home: "2bhk" },
    blocks: [
      { h2: "Where 2BHKs are best value" },
      { ul: [
        "**On the metro, mid budget:** [Al Nahda](/family/family-apartments-al-nahda-dubai), [Al Qusais](/family/family-apartments-al-qusais), [Discovery Gardens](/family/family-apartments-discovery-gardens), [Al Furjan](/family/family-apartments-al-furjan), [Al Karama](/family/family-apartments-al-karama).",
        "**Newer buildings with pools, need a car:** [JVC](/family/family-apartments-jvc), [Silicon Oasis](/family/family-apartments-dso), [Sports City](/family/family-apartments-dubai-sports-city), [Motor City](/family/family-apartments-motor-city).",
        "**Most space for the money:** [Al Nahda Sharjah](/family/family-apartments-al-nahda-sharjah) and [Al Taawun](/family/family-apartments-al-taawun), if you can handle the commute.",
        "**Premium and walkable:** [JLT](/family/family-apartments-jlt), [Dubai Marina](/family/family-apartments-dubai-marina), [Business Bay](/family/family-apartments-business-bay).",
      ] },
      { h2: "What to ask about every 2BHK" },
      { ul: ["Is chiller/AC included or billed separately?", "How many cheques, and is there a discount for fewer?", "Is there a maid's room or storage? (Often called 2BHK + maid's.)", "Covered parking: how many spaces?", "Distance to your children's school, in rush-hour minutes."] },
      { h2: "How the lease works" },
      { ul: LEASE_FACTS },
      { h2: "Checks before you pay" },
      { ol: BEFORE_YOU_SIGN },
    ],
    faq: [
      ["Which area has the cheapest 2BHK in Dubai?", "International City, Deira and Al Qusais usually have the lowest 2BHK rents in Dubai; Sharjah's Al Nahda and Al Taawun are cheaper still for a similar size."],
      ["Can I find a 2BHK near the metro?", "Yes. Al Nahda and Al Qusais (Green Line), Discovery Gardens and Al Furjan (Red Line Expo branch), Al Karama, Al Barsha and JLT all have family buildings within walking distance of a station."],
      ["Can two families share a 2BHK?", "Families do share 2BHKs (one room each, shared kitchen), but the tenancy holder must have the landlord's permission and the flat must not be overcrowded. See family sharing."],
      ...FAMILY_FAQ.slice(1, 3),
    ],
    live: { type: "room", title: "Need a room for the first month? Private rooms live now" },
    related: ["/family/3bhk-apartment-dubai", "/family/1bhk-apartment-dubai", "/family/family-apartment-near-metro-dubai", "/family/family-sharing-apartment-dubai"],
  },
  {
    slug: "3bhk-apartment-dubai",
    path: "/family/3bhk-apartment-dubai",
    title: "3BHK for rent in Dubai: big family apartments",
    h1: "3BHK apartments for rent in Dubai",
    description: "3BHK family apartments in Dubai and Sharjah: best value areas, near-metro buildings, maid's rooms, cheques and deposits. Send your brief, get real options on WhatsApp.",
    keywords: ["3BHK for rent Dubai", "3 bedroom apartment Dubai", "3BHK Sharjah", "3BHK with maid room Dubai", "large family apartment Dubai", "3BHK near metro Dubai"],
    eyebrow: "3 bedrooms · often with maid's room",
    answer: "A 3BHK suits larger families, live-in help or a home office. The best value is in Sharjah (Al Taawun, Al Nahda), Al Qusais, Mirdif, Silicon Oasis and Sports City; Barsha, JLT and the Marina cost more but are central. Send Stayshay your brief and we'll WhatsApp you real 3BHK options, free.",
    photo: "/photos/living.jpg",
    form: { home: "3bhk" },
    blocks: [
      { h2: "Where to look for a 3BHK" },
      { ul: [
        "**Space for the money:** [Al Taawun](/family/family-apartments-al-taawun) and [Al Nahda Sharjah](/family/family-apartments-al-nahda-sharjah).",
        "**Dubai value with schools nearby:** [Al Qusais](/family/family-apartments-al-qusais), [Mirdif](/family/family-apartments-mirdif), [Al Warqa](/family/family-apartments-al-warqa), [Silicon Oasis](/family/family-apartments-dso).",
        "**Newer communities:** [JVC](/family/family-apartments-jvc), [Sports City](/family/family-apartments-dubai-sports-city), [Motor City](/family/family-apartments-motor-city), [Al Furjan](/family/family-apartments-al-furjan).",
        "**Central:** [Al Barsha](/family/family-apartments-al-barsha-1), [JLT](/family/family-apartments-jlt), [Dubai Marina](/family/family-apartments-dubai-marina).",
      ] },
      { p: "In Mirdif, Al Warqa and Al Furjan a 3-bedroom **townhouse or villa** can cost close to a 3BHK flat in a central tower, with a garden. Tell us if you're open to both." },
      { h2: "How the lease works" },
      { ul: LEASE_FACTS },
      { h2: "Checks before you sign" },
      { ol: BEFORE_YOU_SIGN },
    ],
    faq: [
      ["Do 3BHK apartments in Dubai come with a maid's room?", "Many do, especially in towers built after 2005. Ask for \"3BHK + maid's\" if you need one."],
      ["Is a 3BHK villa more expensive than a 3BHK flat?", "Not always. In Mirdif, Al Warqa and Al Furjan a 3-bedroom townhouse can be close to a central 3BHK flat, with a garden but usually without a metro nearby."],
      ...FAMILY_FAQ.slice(1),
    ],
    live: { type: "studio", title: "Studios for the first weeks while you search" },
    related: ["/family/2bhk-apartment-dubai", "/family/family-apartments-mirdif", "/family/family-apartments-al-taawun", "/move"],
  },
  {
    slug: "1bhk-apartment-dubai",
    path: "/family/1bhk-apartment-dubai",
    title: "1BHK for rent in Dubai: couples & small families",
    h1: "1BHK apartments for rent in Dubai",
    description: "1BHK apartments in Dubai for couples and small families: cheapest areas, near-metro buildings, monthly vs yearly, cheques and deposit. Get real options on WhatsApp, free.",
    keywords: ["1BHK for rent Dubai", "1 bedroom apartment Dubai", "1BHK monthly rent Dubai", "cheap 1BHK Dubai", "1BHK near metro Dubai", "1BHK for couple Dubai"],
    eyebrow: "1 bedroom · hall · kitchen",
    answer: "A 1BHK (one bedroom, hall and kitchen) is the go-to home for couples and families with a baby. Cheapest in International City, Deira, Al Qusais and Sharjah; best value on the metro in Al Nahda, Discovery Gardens and Al Karama. Send Stayshay your budget and we'll WhatsApp you real options.",
    photo: "/photos/studio.jpg",
    form: { home: "1bhk" },
    blocks: [
      { h2: "1BHK or studio?" },
      { p: "A studio is cheaper but one room. A 1BHK gives you a door between the bedroom and the living space, which matters once a baby arrives or one of you works from home. If the budget is tight, a [monthly studio](/rent/studios) or a [couple partition](/blog/couple-room-partition-dubai) gets you started." },
      { prices: "studio", limit: 10 },
      { h2: "Good 1BHK areas" },
      { ul: [
        "**Cheapest:** [International City](/family/family-apartments-international-city), [Deira](/family/family-apartments-deira), [Al Qusais](/family/family-apartments-al-qusais).",
        "**On the metro:** [Al Nahda](/family/family-apartments-al-nahda-dubai), [Discovery Gardens](/family/family-apartments-discovery-gardens), [Al Karama](/family/family-apartments-al-karama), [Al Barsha](/family/family-apartments-al-barsha-1).",
        "**New buildings:** [JVC](/family/family-apartments-jvc), [Silicon Oasis](/family/family-apartments-dso), [Sports City](/family/family-apartments-dubai-sports-city).",
      ] },
      { h2: "How the lease works" },
      { ul: LEASE_FACTS },
    ],
    faq: [
      ["Can I rent a 1BHK in Dubai monthly?", "Yes, furnished 1BHKs are available monthly, at a higher monthly price than a yearly contract. Unfurnished 1BHKs are almost always yearly with cheques."],
      ["Is a 1BHK enough for a family of three?", "With a baby or toddler, yes for most families. Once children are older, a 2BHK is more comfortable."],
      ...FAMILY_FAQ.slice(1, 3),
    ],
    live: { type: "studio", title: "Studios live now on Stayshay" },
    related: ["/family/2bhk-apartment-dubai", "/rent/studios", "/family/family-sharing-apartment-dubai", "/blog/couple-room-partition-dubai"],
  },
  {
    slug: "family-sharing-apartment-dubai",
    path: "/family/family-sharing-apartment-dubai",
    title: "Family sharing room in Dubai: rooms for families",
    h1: "Family sharing rooms and flats in Dubai",
    description: "Family room in a sharing flat in Dubai and Sharjah: how it works, what's included, which areas, and how to stay safe. Tell us your family size and budget, we send options.",
    keywords: ["family sharing Dubai", "family room for rent Dubai", "family sharing flat Dubai", "room for family in sharing flat", "family sharing Al Nahda", "family sharing Karama", "family room Sharjah"],
    eyebrow: "Family sharing · private room, shared flat",
    answer: "Family sharing means your family rents one private room (often with its own bathroom) inside a flat shared with one or two other families, with a shared kitchen. It is the cheapest way for a family to live together in Dubai, common in Al Karama, Bur Dubai, Al Nahda, Al Qusais, Deira and Sharjah. Tell Stayshay your family size and budget and we'll send real options.",
    photo: "/photos/couples.jpg",
    form: { home: "sharing", heading: "Find a family sharing room" },
    blocks: [
      { h2: "What usually comes with a family room" },
      { ul: ["A private room, ideally with an attached bathroom", "Shared kitchen (ask about cooking times and fridge space)", "Bills (DEWA, Wi-Fi) often included", "Monthly rent with one month's deposit and one month's notice"] },
      { h2: "Areas with the most family sharing" },
      { p: "[Al Karama](/family/family-apartments-al-karama), [Bur Dubai](/family/family-apartments-bur-dubai), [Al Nahda](/family/family-apartments-al-nahda-dubai), [Al Qusais](/family/family-apartments-al-qusais), [Deira](/family/family-apartments-deira) and [Al Nahda Sharjah](/family/family-apartments-al-nahda-sharjah)." },
      { p: "Couples can also look at private rooms and couple partitions already live on Stayshay:" },
      { listings: { type: "room", limit: 6 } },
      { h2: "Stay safe and legal" },
      { ul: [
        "Sharing is allowed only with the landlord's permission and without overcrowding. Ask whether the main tenant has the landlord's consent.",
        "Meet the other families before you agree, and agree kitchen and cleaning rules in writing.",
        "Children need space and quiet for homework; ask who else lives in the flat and their work hours.",
        "Pay only after viewing and always get a receipt. Read our [shared housing rules guide](/blog/dubai-shared-housing-rules-renters).",
      ] },
    ],
    faq: [
      ["What is family sharing in Dubai?", "Your family rents one private room in a flat shared with other families or couples, with a shared kitchen. It's much cheaper than renting a whole flat."],
      ["Is family sharing legal in Dubai?", "Shared housing is legal when the landlord agrees and the flat isn't overcrowded. Unpermitted partitions and overcrowding are not allowed."],
      ["Is a family room with attached bathroom available?", "Yes, often called a master room. It costs more than a room with a shared bathroom but is the better choice with children."],
      ["Do I get Ejari in family sharing?", "Usually not, because the main tenant holds the Ejari. If you need Ejari for a family visa, rent a whole studio or flat instead."],
    ],
    live: { type: "partition", title: "Couple partitions and rooms live now" },
    related: ["/family/1bhk-apartment-dubai", "/blog/couple-room-partition-dubai", "/rent/rooms", "/family"],
  },
  {
    slug: "family-apartment-near-metro-dubai",
    path: "/family/family-apartment-near-metro-dubai",
    title: "Family apartments near Dubai Metro: 1–3BHK",
    h1: "Family apartments near the Dubai Metro",
    description: "Family 1BHK, 2BHK and 3BHK apartments within walking distance of Dubai Metro: Green Line, Red Line and Route 2020 areas compared. Free shortlist on WhatsApp.",
    keywords: ["apartment near metro Dubai", "family apartment near metro station", "2BHK near metro Dubai", "flat near Green Line metro", "apartment near Red Line metro", "near metro family flat"],
    eyebrow: "Walk to the metro",
    answer: "The best-value family flats within walking distance of the Dubai Metro are in Al Nahda and Al Qusais (Green Line), Al Karama, Bur Dubai and Deira (both lines), Discovery Gardens and Al Furjan (Red Line, Route 2020), and Al Barsha and JLT (Red Line). Send Stayshay your budget and line, and we'll shortlist buildings within a 10-minute walk.",
    photo: "/photos/metro-station.jpg",
    form: { home: "2bhk", metro: true },
    blocks: [
      { h2: "Family areas by metro line" },
      ...FAMILY_AREAS.filter((a) => a.hasMetro).map((a): Block => ({ p: `**[${a.name}](/family/family-apartments-${a.slug})**: ${a.metro}.` })),
      { p: "Planning ahead: the **Blue Line** (under construction) will serve Mirdif, Silicon Oasis, Academic City and International City, which are currently car or bus areas." },
      { h2: "Shared homes near stations, live now" },
      { p: "Single, couple or sending one family member ahead? See every listing by station on our [metro map pages](/metro)." },
    ],
    faq: [
      ["Which metro line is best for families on a budget?", "The Green Line through Al Qusais, Al Nahda, Deira and Bur Dubai has the most affordable family flats near stations."],
      ["Is there a metro in Silicon Oasis or International City?", "Not yet. Both are on the route of the planned Blue Line; until it opens, residents use buses or cars."],
      ...FAMILY_FAQ.slice(0, 2),
    ],
    live: { title: "Places near metro stations live now" },
    related: ["/metro", "/family/2bhk-apartment-dubai", "/blog/bed-space-near-metro-dubai", "/family"],
  },
  {
    slug: "furnished-family-apartment-monthly-dubai",
    path: "/family/furnished-family-apartment-monthly-dubai",
    title: "Furnished family apartment Dubai, monthly rent",
    h1: "Furnished family apartments in Dubai, by the month",
    description: "Furnished 1BHK and 2BHK family apartments in Dubai on monthly terms: for relocation, the first months, or between leases. No 12-month contract. Get options on WhatsApp.",
    keywords: ["furnished apartment monthly Dubai", "monthly rent family apartment Dubai", "short term family apartment Dubai", "relocation apartment Dubai", "serviced apartment monthly Dubai", "furnished 2BHK monthly Dubai"],
    eyebrow: "Furnished · monthly · no yearly contract",
    answer: "Furnished monthly family flats in Dubai are ideal for the first 1–3 months after relocating: no cheques, bills usually included, and time to choose an area before a 12-month lease. They cost more per month than a yearly contract. Tell Stayshay your dates and family size and we'll send available options.",
    photo: "/photos/studio.jpg",
    form: { home: "2bhk", heading: "Get furnished monthly options" },
    blocks: [
      { h2: "When a furnished monthly flat makes sense" },
      { ul: ["You've just landed and Emirates ID, bank account and cheque book aren't ready yet", "You want to try an area (and the school run) before committing for a year", "You're between leases or waiting for a new building's handover", "A short project or contract of under a year"] },
      { h2: "What's normally included" },
      { ul: ["Furniture, kitchenware and linen", "DEWA, chiller, Wi-Fi (check for a monthly cap)", "Building pool and gym access", "Cleaning sometimes, at extra cost"] },
      { h2: "Already in Dubai and on a smaller budget?" },
      { p: "A furnished monthly studio is often half the price of a furnished 1BHK. These are live right now:" },
    ],
    faq: [
      ["Can I rent a family apartment in Dubai for one month?", "Yes, furnished holiday-home and serviced apartments rent by the month. Expect a higher monthly price than a yearly lease."],
      ["Do monthly furnished flats need Ejari?", "Holiday homes and serviced apartments use a tourism permit instead of Ejari. If you need Ejari for a visa or school, you'll need a yearly lease."],
      ...FAMILY_FAQ.slice(0, 2),
    ],
    live: { type: "studio", title: "Furnished monthly studios live now" },
    related: ["/move", "/family/2bhk-apartment-dubai", "/rent/studios", "/blog/new-to-dubai-guide"],
  },
  {
    slug: "2bhk-apartment-sharjah",
    path: "/family/2bhk-apartment-sharjah",
    title: "2BHK for rent in Sharjah: Al Nahda, Al Taawun",
    h1: "2BHK family apartments in Sharjah",
    description: "2BHK apartments in Sharjah for families working in Dubai: Al Nahda, Al Taawun, Al Khan, Al Majaz and Muwaileh compared, with the commute. Free options on WhatsApp.",
    keywords: ["2BHK for rent Sharjah", "family apartment Sharjah", "2BHK Al Nahda Sharjah", "2BHK Al Taawun", "2BHK Al Majaz", "Sharjah family flat"],
    eyebrow: "Sharjah · more space for the money",
    answer: "Sharjah 2BHKs cost noticeably less than similar flats in Dubai and are often larger, which is why many Dubai workers' families live in Al Nahda, Al Taawun, Al Khan, Al Majaz and Muwaileh. The trade-off is the rush-hour commute into Dubai. Send Stayshay your budget and work location and we'll find options.",
    photo: "/photos/living.jpg",
    form: { home: "2bhk", area: "al-nahda-sharjah" },
    blocks: [
      { h2: "Sharjah family areas" },
      { ul: [
        "**[Al Nahda Sharjah](/family/family-apartments-al-nahda-sharjah):** on the Dubai border, closest to the Green Line.",
        "**[Al Taawun](/family/family-apartments-al-taawun):** waterfront towers, big flats.",
        "**[Al Khan](/areas/al-khan) and [Al Majaz](/areas/al-majaz):** lagoon views, parks and the Corniche.",
        "**[Muwaileh](/areas/muwaileh):** newer, near the universities, cheaper, further from Dubai.",
      ] },
      { h2: "Sharjah vs Dubai" },
      { p: "Sharjah uses **Tawtheeq** (not Ejari), has no metro, and doesn't allow alcohol. Read our full comparison: [Sharjah vs Dubai rent](/blog/sharjah-vs-dubai-rent)." },
    ],
    faq: [
      ["Is it cheaper to live in Sharjah and work in Dubai?", "Rent is clearly lower in Sharjah, but budget for fuel, Salik or taxis and 45–90 minutes each way at rush hour."],
      ["What is Tawtheeq?", "Sharjah's tenancy registration, the equivalent of Ejari in Dubai. You need it for utilities and family visas."],
      ...FAMILY_FAQ.slice(1, 2),
    ],
    live: { area: "al-nahda-sharjah", title: "Live in Al Nahda Sharjah now" },
    related: ["/family/2bhk-apartment-dubai", "/blog/sharjah-vs-dubai-rent", "/family/family-apartments-al-taawun", "/family"],
  },
];

const areaPages: Guide[] = FAMILY_AREAS.map((a) => ({
  slug: `family-apartments-${a.slug}`,
  path: `/family/family-apartments-${a.slug}`,
  title: `Family apartments in ${a.name}: 1BHK, 2BHK, 3BHK`,
  h1: `Family apartments in ${a.name}`,
  description: `Renting a family flat in ${a.name}: metro access, who it suits, what to watch for, and 1BHK–3BHK options sent to you on WhatsApp. Free for families.`.slice(0, 160),
  keywords: [`family apartment ${a.name}`, `2BHK ${a.name}`, `1BHK ${a.name}`, `3BHK ${a.name}`, `family room ${a.name}`, `flat for rent ${a.name}`],
  eyebrow: a.hasMetro ? `Family homes · ${a.metro.split(":")[0]}` : "Family homes",
  answer: `${a.feel} Metro: ${a.metro}. Send Stayshay your bedrooms, budget and move-in date and we'll WhatsApp you real ${a.name} options.`,
  photo: a.photo ?? (a.hasMetro ? "/photos/metro-station.jpg" : "/photos/living.jpg"),
  form: { home: "2bhk", area: a.slug, metro: a.hasMetro },
  blocks: [
    { h2: `Why families choose ${a.name}` },
    { ul: a.good },
    { h2: "Worth knowing" },
    { ul: a.watch },
    { h2: "Getting around" },
    { p: `${a.metro}. ${a.hasMetro ? "Choose a building within a 10-minute walk of the station so the daily commute stays easy with children." : "Most families here drive or use taxis; check the school bus route before you sign."}` },
    { h2: "Live shared homes in the area" },
    { p: `Coming alone first, or on a smaller budget? These are live on Stayshay today. See everything in [${a.name}](/areas/${a.slug}).` },
  ],
  faq: [
    [`Is ${a.name} good for families?`, `${a.feel}`],
    [`Is there a metro in ${a.name}?`, `${a.metro}.`],
    ...FAMILY_FAQ.slice(0, 2),
  ],
  live: { area: a.slug, title: `Live in ${a.name} now` },
  related: ["/family/2bhk-apartment-dubai", "/family/family-apartment-near-metro-dubai", `/areas/${a.slug}`, "/family"],
}));

export const FAMILY_GUIDES: Guide[] = [hub, ...typePages, ...areaPages];

/* ------------------------------------------------------------------ */
/* Relocation: /move and /move/<from>                                  */
/* ------------------------------------------------------------------ */

interface Origin {
  slug: string;
  /** "the UK", "France" */
  name: string;
  demonym: string;
  /** Short visa-on-entry line. */
  entry: string;
  licence: string;
  flight: string;
  areas: string[];
  community: string;
  documents: string;
}

const WESTERN_DOCS = "Get degree, marriage and children's birth certificates legalised in your home country (your foreign ministry, then the UAE embassy, or the UAE's current e-attestation route). The UAE uses them for your work visa and to sponsor your family.";
const ASIA_DOCS = "Attest your degree, marriage certificate and children's birth certificates at your foreign ministry and the UAE embassy before you fly; employers and the family visa process ask for them.";

export const ORIGINS: Origin[] = [
  { slug: "uk", name: "the UK", demonym: "British", entry: "British passport holders get a visa on arrival, then switch to a residence visa through an employer, business licence or property.", licence: "UK licences can be converted to a UAE licence without lessons or a driving test (eye test and fee).", flight: "about 7 hours from London", areas: ["dubai-marina", "jlt", "al-barsha-1", "jvc", "mirdif", "dubai-sports-city"], community: "There is a very large British community, plenty of British-curriculum schools, and English is the everyday language of business.", documents: WESTERN_DOCS },
  { slug: "france", name: "France", demonym: "French", entry: "French passport holders get a visa on arrival, then move to a residence visa through an employer, business or property.", licence: "French licences can be converted to a UAE licence without lessons or a test.", flight: "about 6.5–7 hours from Paris", areas: ["dubai-marina", "jlt", "al-barsha-1", "jvc", "business-bay", "mirdif"], community: "Dubai has a large French-speaking community with French-curriculum schools, and English is used everywhere for work and daily life.", documents: WESTERN_DOCS },
  { slug: "germany", name: "Germany", demonym: "German", entry: "German passport holders get a visa on arrival, then move to a residence visa through an employer, business or property.", licence: "German licences can be converted to a UAE licence without lessons or a test.", flight: "about 6 hours from Frankfurt or Munich", areas: ["jlt", "dubai-marina", "al-barsha-1", "jvc", "motor-city", "business-bay"], community: "There's an active German community, a German-curriculum school, and English is the working language.", documents: WESTERN_DOCS },
  { slug: "norway", name: "Norway", demonym: "Norwegian", entry: "Norwegian passport holders get a visa on arrival, then move to a residence visa through an employer, business or property.", licence: "Norwegian licences are on the UAE's conversion list (no lessons or test), subject to the current RTA rules.", flight: "about 6.5–7 hours from Oslo", areas: ["dubai-marina", "jlt", "jvc", "al-barsha-1", "motor-city", "dso"], community: "The Scandinavian community is smaller but close-knit, and English is the everyday language. Winters are the best season; summers are very hot, so plan your move for September–April if you can.", documents: WESTERN_DOCS },
  { slug: "usa", name: "the USA", demonym: "American", entry: "US passport holders get a visa on arrival, then move to a residence visa through an employer, business or property.", licence: "US licences can be converted to a UAE licence without lessons or a test (check the current RTA list for your state's licence).", flight: "about 12–14 hours from the US East Coast", areas: ["dubai-marina", "jlt", "al-barsha-1", "jvc", "business-bay", "mirdif"], community: "There are American-curriculum schools across the city and a sizeable US community. Note that US citizens still file US taxes even though the UAE has no income tax.", documents: WESTERN_DOCS },
  { slug: "canada", name: "Canada", demonym: "Canadian", entry: "Canadian passport holders get a visa on arrival, then move to a residence visa through an employer, business or property.", licence: "Canadian licences can be converted to a UAE licence without lessons or a test.", flight: "about 13 hours from Toronto", areas: ["dubai-marina", "jlt", "jvc", "al-barsha-1", "dso", "mirdif"], community: "There's a large Canadian community, Canadian-curriculum schools, and English everywhere.", documents: WESTERN_DOCS },
  { slug: "india", name: "India", demonym: "Indian", entry: "Indian citizens usually need a visa arranged before travel (employment, visit or family visa). Some, such as holders of a valid US visa or UK/EU residence, can get a visa on arrival; check before you fly.", licence: "Indian licences can't be converted directly; you'll take driving lessons and an RTA test (some experienced drivers get a shorter course).", flight: "about 3 hours from Mumbai, Delhi or Kochi", areas: ["al-karama", "bur-dubai", "al-nahda-dubai", "al-qusais", "jvc", "al-nahda-sharjah"], community: "Indians are Dubai's largest community: CBSE and Kerala-board schools, temples, gurdwaras and churches, and food from every state. See our guide to [Indian neighbourhoods in Dubai](/blog/indian-neighbourhoods-dubai).", documents: ASIA_DOCS },
  { slug: "pakistan", name: "Pakistan", demonym: "Pakistani", entry: "Pakistani citizens need a visa arranged before travel (employment, visit or family visa).", licence: "Pakistani licences can't be converted directly; you'll take lessons and an RTA test.", flight: "about 2–3 hours from Karachi, Lahore or Islamabad", areas: ["al-qusais", "al-nahda-dubai", "deira", "al-karama", "al-nahda-sharjah", "international-city"], community: "There's a very large Pakistani community, Pakistani-curriculum schools, mosques everywhere and familiar food in Deira, Karama and Al Qusais.", documents: ASIA_DOCS },
  { slug: "philippines", name: "the Philippines", demonym: "Filipino", entry: "Filipino citizens need a visa arranged before travel, plus the Philippine government's overseas-worker requirements (OEC) if you're going for a job.", licence: "Philippine licences can't be converted directly; you'll take lessons and an RTA test.", flight: "about 9 hours from Manila", areas: ["al-karama", "al-barsha-1", "jvc", "deira", "bur-dubai", "discovery-gardens"], community: "There is a big Filipino community with Filipino groceries, churches and restaurants, especially in Karama, Satwa and Al Barsha.", documents: ASIA_DOCS },
  { slug: "abu-dhabi", name: "Abu Dhabi", demonym: "Abu Dhabi", entry: "Your UAE residence visa and Emirates ID stay valid when you move emirates. You only change your tenancy (Tawtheeq in Abu Dhabi to Ejari in Dubai), utilities and possibly schools.", licence: "Your UAE driving licence works in Dubai; just register Salik for the Dubai toll gates.", flight: "about 1.5 hours by car on Sheikh Zayed Road / E11; intercity buses run from Abu Dhabi to Ibn Battuta and Al Ghubaiba", areas: ["al-furjan", "discovery-gardens", "jvc", "dubai-sports-city", "dubai-marina", "al-barsha-1"], community: "If you'll still work in Abu Dhabi, live on Dubai's south-west side (Al Furjan, Discovery Gardens, JVC, Dubai South) to cut the commute. If you're moving for a Dubai job, choose by your new office's metro line.", documents: "Give notice on your Abu Dhabi lease as your contract requires (often 2–3 months), close your ADDC/TAQA account and transfer your children's school records before term starts." },
];

const ORIGIN_BY_SLUG = new Map(ORIGINS.map((o) => [o.slug, o]));
const areaLink = (s: string) => {
  const a = FAMILY_AREAS.find((x) => x.slug === s);
  return a ? `[${a.name}](/family/family-apartments-${s})` : s;
};

const STEPS = (o: Origin): Block[] => [
  { h2: "Your move, step by step" },
  { ol: [
    `**Before you fly.** ${o.documents}`,
    `**Arriving.** ${o.entry}`,
    "**First 2–6 weeks: a furnished base.** Until your Emirates ID, bank account and cheque book are ready, most families stay in a [furnished monthly flat](/family/furnished-family-apartment-monthly-dubai) or one of us goes ahead in a [monthly studio](/rent/studios).",
    "**Residence visa and Emirates ID.** Medical test and biometrics, then your Emirates ID. After that: bank account, mobile line, DEWA.",
    "**Choose an area by commute and school.** Map your office and your children's school first, then shortlist areas. See [family apartments near the metro](/family/family-apartment-near-metro-dubai).",
    "**Sign the yearly lease.** Ejari registration, post-dated cheques, deposit and DEWA connection. We explain each one below.",
    "**Sponsor your family.** With your Ejari, salary certificate and attested certificates you can apply for your spouse's and children's residence visas.",
  ] },
];

const moveHub: Guide = {
  slug: "",
  path: "/move",
  title: "Moving to Dubai with family: relocation guide",
  h1: "Moving to Dubai? We'll find your first home",
  description: "Relocating to Dubai with your family from the UK, Europe, the US, India, Pakistan, the Philippines or Abu Dhabi: step-by-step guide, best areas and free home search on WhatsApp.",
  keywords: ["moving to Dubai with family", "relocate to Dubai", "relocation Dubai apartment", "moving to Dubai from UK", "moving to Dubai from Europe", "new to Dubai accommodation", "where to live in Dubai with family"],
  eyebrow: "Relocation support · free",
  answer: "Moving to Dubai with your family usually goes: attest your documents, arrive on a visit or work visa, stay 2–6 weeks in a furnished monthly flat, get your Emirates ID and bank account, then sign a yearly lease and sponsor your family. Stayshay helps with the home part for free: tell us your dates, family size and budget, and we'll send real options on WhatsApp before you land.",
  photo: "/photos/living.jpg",
  form: { home: "2bhk", heading: "Tell us about your move" },
  blocks: [
    { h2: "Moving from" },
    { ul: ORIGINS.map((o) => `[Moving to Dubai from ${o.name}](/move/${o.slug}): ${o.flight}.`) },
    { h2: "Your move, step by step" },
    { ol: [
      "**Before you fly:** attest degree, marriage and birth certificates; get your job offer and visa process started.",
      "**First weeks:** stay in a [furnished monthly flat](/family/furnished-family-apartment-monthly-dubai) while you get your Emirates ID, bank account and cheque book.",
      "**Choose the area:** map your office and school first. Our [family area guides](/family) compare metro, schools and budget.",
      "**Sign the lease:** Ejari, cheques, deposit, DEWA.",
      "**Sponsor your family:** spouse and children's residence visas.",
    ] },
    { h2: "How renting works in Dubai" },
    { ul: LEASE_FACTS },
    { h2: "First-week essentials" },
    { p: "Read our [new to Dubai guide](/blog/new-to-dubai-guide), [how to save money in Dubai](/blog/how-to-save-money-dubai) and [getting around: monthly transport options](/blog/monthly-transport-dubai)." },
  ],
  faq: [
    ["How do I find an apartment in Dubai before I arrive?", "Send Stayshay your dates, family size, budget and office location. We shortlist real options and can video-call viewings, but never pay a deposit for a place you or someone you trust hasn't seen."],
    ["Where should a family live when moving to Dubai?", "Choose by commute and school. Popular family areas include JVC, Al Barsha, JLT, Dubai Marina, Mirdif and Silicon Oasis; for lower rents, Al Qusais, Al Nahda, Discovery Gardens and Sharjah."],
    ["Can I rent an apartment in Dubai without Emirates ID?", "Furnished monthly flats and holiday homes accept a passport and entry stamp. A yearly lease with Ejari normally needs your Emirates ID or visa, so most families start furnished."],
    FAMILY_FAQ[3],
  ],
  live: { type: "studio", title: "Monthly studios you can book now" },
  related: ["/family", "/blog/new-to-dubai-guide", "/family/furnished-family-apartment-monthly-dubai", "/blog/how-to-save-money-dubai"],
};

const movePages: Guide[] = ORIGINS.map((o) => ({
  slug: o.slug,
  path: `/move/${o.slug}`,
  title: `Moving to Dubai from ${o.name} with family`,
  h1: `Moving to Dubai from ${o.name}`,
  description: `Relocating from ${o.name} to Dubai with your family: visa, documents, driving licence, best areas for ${o.demonym} families and a free home search on WhatsApp.`.slice(0, 160),
  keywords: [`moving to Dubai from ${o.name.replace(/^the /, "")}`, `relocate from ${o.name.replace(/^the /, "")} to Dubai`, `${o.demonym} family Dubai`, `${o.demonym} expats Dubai where to live`, `apartment Dubai ${o.demonym}`],
  eyebrow: `Relocation · ${o.flight}`,
  answer: `${o.entry} ${o.licence} ${o.demonym} families most often settle in ${o.areas.slice(0, 4).map((s) => FAMILY_AREAS.find((a) => a.slug === s)?.name ?? s).join(", ")}. Stayshay finds your first home for free: send us your dates, family size and budget.`,
  photo: "/photos/living.jpg",
  form: { home: "2bhk", from: o.name.replace(/^the /, ""), heading: `Moving from ${o.name}? Tell us what you need` },
  blocks: [
    ...STEPS(o),
    { h2: `Where ${o.demonym} families live` },
    { p: o.community },
    { ul: o.areas.map((s) => { const a = FAMILY_AREAS.find((x) => x.slug === s); return a ? `${areaLink(s)}: ${a.good.slice(0, 2).join(", ")}.` : s; }) },
    { h2: "Driving" },
    { p: o.licence },
    { h2: "How renting works in Dubai" },
    { ul: LEASE_FACTS },
    { h2: "Checks before you pay anything" },
    { ol: BEFORE_YOU_SIGN },
  ],
  faq: [
    [`Do I need a visa to move to Dubai from ${o.name}?`, o.entry],
    [`Can I drive in Dubai with a licence from ${o.name}?`, o.licence],
    [`Where do ${o.demonym} families live in Dubai?`, `${o.areas.map((s) => FAMILY_AREAS.find((a) => a.slug === s)?.name ?? s).join(", ")}. Choose by commute and school.`],
    ["How long does it take to find an apartment in Dubai?", "With your Emirates ID and cheques ready, usually 1–3 weeks. Most families stay furnished for the first month while they search."],
    FAMILY_FAQ[3],
  ],
  live: { type: "studio", title: "Monthly studios to land in" },
  related: ["/move", "/family", "/family/furnished-family-apartment-monthly-dubai", "/blog/new-to-dubai-guide"],
}));

export const MOVE_GUIDES: Guide[] = [moveHub, ...movePages];
export const ALL_GUIDES = [...FAMILY_GUIDES, ...MOVE_GUIDES];
export const GUIDE_BY_PATH = new Map(ALL_GUIDES.map((g) => [g.path, g]));
export { ORIGIN_BY_SLUG };
