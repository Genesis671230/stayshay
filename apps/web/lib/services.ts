/**
 * Home services: maintenance and interiors. Every request goes straight to WhatsApp with the job typed out,
 * no forms. Prices are quoted per job on WhatsApp; nothing here promises a fixed price.
 */

export type ServiceGroup = "maintenance" | "interiors";

export interface Service {
  slug: string;
  group: ServiceGroup;
  name: string;
  /** One line for menus and cards. */
  hint: string;
  photo: string;
  /** H1 / title for the page. */
  h1: string;
  /** Short direct answer at the top of the page (AEO). */
  answer: string;
  includes: string[];
  /** Quick-pick jobs: each one opens WhatsApp with that job typed out. */
  jobs: string[];
  faq: [string, string][];
  keywords: string[];
}

export const GROUP_LABEL: Record<ServiceGroup, string> = { maintenance: "Maintenance", interiors: "Interiors & fit-out" };

const COMMON_FAQ: [string, string][] = [
  ["How do I book?", "Tap a job or the WhatsApp button. Your request opens in WhatsApp already typed out. Add a photo of the problem, your area and a time that suits you, and we reply with a quote and a slot."],
  ["Do you cover my area?", "Dubai first (Deira, Bur Dubai, Karama, Al Barsha, JLT, Marina, JVC, Business Bay, Downtown, International City and more). Sharjah and Ajman on request: just ask on WhatsApp."],
  ["Who pays, tenant or landlord?", "For wear and tear in a rented home, check your tenancy contract: many landlords cover major repairs (AC, plumbing, electrical) and tenants cover small fixes. We can quote either party."],
];

export const SERVICES: Service[] = [
  {
    slug: "ac-maintenance",
    group: "maintenance",
    name: "AC service & repair",
    hint: "Cleaning, gas top-up, not cooling, leaks",
    photo: "/photos/room.jpg",
    h1: "AC service and repair in Dubai",
    answer: "AC not cooling, leaking or noisy? Send the job on WhatsApp with a photo of the unit. We reply with a quote and a time, often the same day. Regular AC cleaning every 3 to 6 months keeps DEWA bills down in summer.",
    includes: ["Split and ducted AC cleaning", "Gas top-up and leak check", "Not cooling, water leaking, bad smell", "Thermostat and fan coil issues", "Duct cleaning for apartments and villas"],
    jobs: ["AC not cooling", "AC leaking water", "AC cleaning (whole flat)", "Duct cleaning", "AC gas top-up"],
    faq: [["How often should I service my AC in Dubai?", "Every 3 to 6 months for split units, and before summer at the latest. Dust and humidity block filters fast, which raises your DEWA bill and makes the AC smell."], ...COMMON_FAQ],
    keywords: ["ac repair dubai", "ac maintenance dubai", "ac cleaning dubai", "ac duct cleaning"],
  },
  {
    slug: "plumbing",
    group: "maintenance",
    name: "Plumbing",
    hint: "Leaks, blocked drains, heaters, taps",
    photo: "/photos/svc-plumbing.jpg",
    h1: "Plumber in Dubai, same-day jobs",
    answer: "Leaking tap, blocked drain or no hot water? Send a photo on WhatsApp and we reply with a quote and a time. Small jobs are often done the same day.",
    includes: ["Leaking taps, mixers and pipes", "Blocked sinks, toilets and floor drains", "Water heater repair and replacement", "Toilet flush and cistern fixes", "Shower and bathroom fittings"],
    jobs: ["Leaking pipe / tap", "Blocked drain", "Water heater not working", "Toilet flush broken", "Install new fittings"],
    faq: [["Is there a call-out fee?", "We tell you the full price on WhatsApp before anyone comes, so there are no surprises at the door."], ...COMMON_FAQ],
    keywords: ["plumber dubai", "plumbing services dubai", "blocked drain dubai", "water heater repair dubai"],
  },
  {
    slug: "electrical",
    group: "maintenance",
    name: "Electrical",
    hint: "Sockets, lights, breakers, fittings",
    photo: "/photos/svc-electrical.jpg",
    h1: "Electrician in Dubai for homes and rooms",
    answer: "Breaker tripping, socket dead or new lights to fit? Send the job on WhatsApp and we reply with a quote and a time.",
    includes: ["Sockets, switches and lights", "Breaker tripping and fault finding", "Chandeliers and fan installation", "Extra sockets for partitions", "Doorbells and small fixtures"],
    jobs: ["Breaker keeps tripping", "Socket not working", "Install lights / chandelier", "Add sockets", "Fault finding"],
    faq: COMMON_FAQ,
    keywords: ["electrician dubai", "electrical maintenance dubai"],
  },
  {
    slug: "painting",
    group: "maintenance",
    name: "Painting",
    hint: "Move-out paint, rooms, villas",
    photo: "/photos/svc-painting.jpg",
    h1: "Painting services in Dubai (move-out and refresh)",
    answer: "Most Dubai tenancies ask for the flat to be painted at move-out. Send the size (studio, 1BHK, 2BHK, villa) and colour on WhatsApp and we reply with a fixed quote.",
    includes: ["Move-out painting for deposit return", "Single room or full apartment", "Villa interior and exterior", "Wall repair, cracks and patching", "Feature walls and wallpaper"],
    jobs: ["Move-out painting", "Paint 1 room", "Paint 2BHK / 3BHK", "Villa painting", "Wall crack repair"],
    faq: [["Do I need to paint when I move out?", "Many Dubai tenancy contracts require it, or the landlord deducts it from your deposit. A quote from us is usually cheaper than the landlord's deduction. Check your contract first."], ...COMMON_FAQ],
    keywords: ["painting services dubai", "move out painting dubai", "apartment painting dubai"],
  },
  {
    slug: "handyman",
    group: "maintenance",
    name: "Handyman",
    hint: "Furniture, TV mounting, curtains, small fixes",
    photo: "/photos/svc-handyman.jpg",
    h1: "Handyman in Dubai for small jobs",
    answer: "Furniture to assemble, a TV to mount or a door that will not close? Send a list on WhatsApp and we quote the whole visit.",
    includes: ["IKEA and furniture assembly", "TV and shelf mounting", "Curtain rods and blinds", "Door, lock and hinge fixes", "Bed and wardrobe repairs"],
    jobs: ["Furniture assembly", "TV mounting", "Fix door / lock", "Hang curtains / shelves", "List of small jobs"],
    faq: COMMON_FAQ,
    keywords: ["handyman dubai", "furniture assembly dubai", "tv mounting dubai"],
  },
  {
    slug: "deep-cleaning",
    group: "maintenance",
    name: "Deep cleaning",
    hint: "Move-in / move-out, sofas, kitchens",
    photo: "/photos/living.jpg",
    h1: "Deep cleaning in Dubai (move-in and move-out)",
    answer: "Moving in or out? Send the size of the home on WhatsApp and we quote a deep clean: kitchen degreasing, bathrooms, windows, cupboards and floors.",
    includes: ["Move-in and move-out deep clean", "Kitchen and bathroom deep clean", "Sofa, carpet and mattress shampoo", "Window and balcony cleaning", "Regular weekly cleaning"],
    jobs: ["Move-out deep clean", "Move-in deep clean", "Sofa / carpet cleaning", "Weekly cleaning", "Kitchen deep clean"],
    faq: COMMON_FAQ,
    keywords: ["deep cleaning dubai", "move out cleaning dubai", "sofa cleaning dubai"],
  },
  {
    slug: "pest-control",
    group: "maintenance",
    name: "Pest control",
    hint: "Bed bugs, cockroaches, ants",
    photo: "/photos/bed-space.jpg",
    h1: "Pest control in Dubai (bed bugs, cockroaches)",
    answer: "Bed bugs and cockroaches spread fast in shared flats. Send the size of the home and the problem on WhatsApp and we quote a treatment, with a follow-up visit where needed.",
    includes: ["Bed bug treatment", "Cockroach and ant control", "Shared flat and partition treatment", "Follow-up visit", "Advice to stop it coming back"],
    jobs: ["Bed bugs", "Cockroaches", "Whole flat treatment", "Follow-up visit"],
    faq: [["Do I need to treat the whole flat for bed bugs?", "Usually yes. In shared flats bed bugs move between rooms, so treating one bed rarely works. Most treatments need a second visit after about two weeks."], ...COMMON_FAQ],
    keywords: ["pest control dubai", "bed bug treatment dubai", "cockroach control dubai"],
  },
  {
    slug: "movers",
    group: "maintenance",
    name: "Movers",
    hint: "Small moves, vans, packing",
    photo: "/photos/studio.jpg",
    h1: "Movers in Dubai for rooms, studios and flats",
    answer: "Moving a room, a studio or a whole flat? Send from-and-to areas and what you have on WhatsApp and we quote a van with helpers.",
    includes: ["Single-room and bed-space moves", "Studio and apartment moves", "Packing and boxes", "Furniture dismantle and re-assembly", "Same-day small moves"],
    jobs: ["Move one room", "Move a studio / 1BHK", "Move 2BHK / 3BHK", "Van with 2 helpers"],
    faq: COMMON_FAQ,
    keywords: ["movers dubai", "cheap movers dubai", "small move dubai"],
  },
  {
    slug: "interior-design",
    group: "interiors",
    name: "Interior design",
    hint: "Design, mood boards, styling",
    photo: "/photos/svc-interior-design.jpg",
    h1: "Interior design in Dubai for apartments and villas",
    answer: "Want your apartment, villa or holiday home to look like a hotel? Send photos of the space and your budget on WhatsApp. We come back with a design approach and a quote for design only, or design plus fit-out.",
    includes: ["Concept and mood board", "Layout and furniture plan", "Lighting and colour plan", "Furniture and decor sourcing", "Styling for photos and listings"],
    jobs: ["Design my apartment", "Design my villa", "Style for photos / listing", "Design + fit-out"],
    faq: [["How much does interior design cost in Dubai?", "It depends on the size and whether you want design only or design plus furniture and fit-out. Send photos and a budget on WhatsApp and we give you a clear quote before anything starts."], ...COMMON_FAQ],
    keywords: ["interior design dubai", "apartment interior design dubai", "villa interior design dubai"],
  },
  {
    slug: "renovation",
    group: "interiors",
    name: "Renovation & fit-out",
    hint: "Kitchens, bathrooms, flooring",
    photo: "/photos/svc-renovation.jpg",
    h1: "Renovation and fit-out in Dubai",
    answer: "Kitchen, bathroom or full apartment renovation: send photos and what you want on WhatsApp and we quote the job, including building permissions where your community needs them.",
    includes: ["Kitchen renovation", "Bathroom renovation", "Flooring (tiles, wood, vinyl)", "False ceilings and lighting", "Full apartment and villa refurbishment"],
    jobs: ["Kitchen renovation", "Bathroom renovation", "New flooring", "Full apartment refurbishment"],
    faq: [["Do I need permission to renovate in Dubai?", "Most buildings and communities need a no-objection letter from the building management or developer before work starts. Tenants also need the landlord's written approval."], ...COMMON_FAQ],
    keywords: ["renovation dubai", "fit out dubai", "kitchen renovation dubai", "bathroom renovation dubai"],
  },
  {
    slug: "partition-installation",
    group: "interiors",
    name: "Partition installation",
    hint: "Gypsum and wooden room partitions",
    photo: "/photos/partition.jpg",
    h1: "Room partition installation in Dubai",
    answer: "Want to split a room or hall? Send the room size on WhatsApp and we quote a partition. Only partitions with the building's approval and municipality rules followed: Dubai fines illegal partitions and overcrowding.",
    includes: ["Gypsum and wooden partitions", "Doors, locks and ventilation", "Sockets and lights per room", "Removal of old partitions", "Advice on building approval"],
    jobs: ["Quote for a partition", "Remove partitions", "Add door / lock", "Add sockets & lights"],
    faq: [["Are partitions legal in Dubai?", "Unapproved partitions and overcrowding are fined by Dubai Municipality, and many buildings ban them. Always get written approval from the building management and the owner first. We will not build partitions that break the rules."], ...COMMON_FAQ],
    keywords: ["partition installation dubai", "gypsum partition dubai", "room partition dubai"],
  },
  {
    slug: "curtains-blinds",
    group: "interiors",
    name: "Curtains & blinds",
    hint: "Blackout, roller, made to measure",
    photo: "/photos/svc-curtains.jpg",
    h1: "Curtains and blinds in Dubai, made to measure",
    answer: "Blackout curtains, roller blinds or motorised blinds: send window sizes or a photo on WhatsApp and we quote, including measuring and fitting.",
    includes: ["Blackout and sheer curtains", "Roller and zebra blinds", "Motorised blinds", "Measuring and fitting", "Curtain rods and tracks"],
    jobs: ["Blackout curtains", "Roller blinds", "Motorised blinds", "Measure my windows"],
    faq: COMMON_FAQ,
    keywords: ["curtains dubai", "blinds dubai", "blackout curtains dubai"],
  },
  {
    slug: "furnishing",
    group: "interiors",
    name: "Furnishing packages",
    hint: "Furnish a room, flat or holiday home",
    photo: "/photos/svc-furnishing.jpg",
    h1: "Furnishing packages for apartments in Dubai",
    answer: "Moving into an unfurnished flat or setting up a holiday home? Send the size and budget on WhatsApp and we quote a package: beds, sofa, dining, curtains, kitchen and delivery with assembly.",
    includes: ["Bedroom, living and dining sets", "Kitchen and bathroom essentials", "Curtains, rugs and lighting", "Delivery and assembly", "Holiday-home ready packages"],
    jobs: ["Furnish a studio / 1BHK", "Furnish a 2BHK / 3BHK", "Holiday home package", "Furnish shared rooms"],
    faq: COMMON_FAQ,
    keywords: ["furnishing packages dubai", "furnish apartment dubai", "holiday home furnishing dubai"],
  },
  {
    slug: "holiday-home-setup",
    group: "interiors",
    name: "Holiday home setup",
    hint: "Design, furnish and photos for Airbnb",
    photo: "/photos/svc-holiday-home.jpg",
    h1: "Holiday home setup in Dubai (furnish, style, photos)",
    answer: "Turning a flat into a holiday home? Send the unit size and area on WhatsApp. We quote furnishing, styling and listing photos, and point you to the DTCM holiday home permit steps.",
    includes: ["Furnishing and styling", "Linen, kitchen and amenities", "Listing photos", "Smart lock and Wi-Fi setup", "Guide to the DTCM holiday home permit"],
    jobs: ["Set up my holiday home", "Furnishing + styling", "Listing photos"],
    faq: [["Do I need a permit for a holiday home in Dubai?", "Yes. Short-term rentals in Dubai need a holiday home permit from the Department of Economy and Tourism (DET, formerly DTCM). Read our side-hustle guide for the steps."], ...COMMON_FAQ],
    keywords: ["holiday home setup dubai", "airbnb setup dubai", "holiday home furnishing"],
  },
];

export const SERVICE_BY_SLUG = new Map(SERVICES.map((s) => [s.slug, s]));

export function serviceMessage(s: Service, job?: string) {
  return `Hi Stayshay, I need ${s.name.toLowerCase()}${job ? `: ${job}` : ""}. Area: … Best time: …`;
}
