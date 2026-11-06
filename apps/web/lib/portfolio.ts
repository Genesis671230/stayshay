/**
 * Selected design & build work by the Stayshay interiors team. Shown on /work, the interiors and maintenance
 * service pages and the homepage. Photos live in /public/work/<slug>/.
 */

export type WorkCategory = "Villa" | "Penthouse" | "Office";

export interface Chapter {
  img: string;
  eyebrow: string;
  title: string;
  text: string;
}

export interface Project {
  slug: string;
  name: string;
  category: WorkCategory;
  location: string;
  scope: string;
  year: string;
  /** One-line promise under the name. */
  tagline: string;
  cover: string;
  summary: string;
  story: string[];
  facts: [string, string][];
  highlights: { t: string; d: string }[];
  palette: string[];
  chapters: Chapter[];
  gallery: { img: string; caption: string }[];
  /** Related services (slugs in lib/services.ts). */
  services: string[];
}

const p = (slug: string, f: string) => `/work/${slug}/${f}.jpg`;

export const TEAM = {
  years: "15+",
  line: "A team of designers, engineers and site experts with over 15 years of experience in interior design, fit-out and renovation.",
  sectors: ["Villas", "Apartments", "Penthouses", "Offices", "Restaurants", "Hotels", "Retail & commercial"],
  disciplines: ["Interior design", "Project management", "Authority approvals", "MEP", "Joinery", "Stone & masonry", "Glazing", "Home automation", "Landscaping"],
};

export const PROJECTS: Project[] = [
  {
    slug: "penthouse-the-greens",
    name: "Penthouse Panorama",
    category: "Penthouse",
    location: "The Greens, Dubai",
    scope: "Turnkey design & build",
    year: "2024",
    tagline: "A three-level penthouse above the fairways",
    cover: p("penthouse-the-greens", "great-room"),
    summary: "A 593 sqm triplex reworked into one calm, light-filled home, with double-height living, a marble kitchen and a roof terrace looking over the golf course and the skyline.",
    story: [
      "The brief was simple to say and hard to build: make three floors feel like one home. We opened the lower level to pull daylight deep into the plan, raised the living room to a full double-height volume and let floor-to-ceiling glass do the rest.",
      "Structure, MEP, joinery, stone and smart-home automation were planned together from day one, so every switch, speaker and shelf lands exactly where the drawings said it would.",
    ],
    facts: [["Size", "593 sqm, three floors"], ["Bedrooms", "3 + terrace"], ["Scope", "Design, build, joinery, automation"], ["Location", "The Greens, Dubai"]],
    highlights: [
      { t: "Double-height living", d: "A salon that rises two floors under sculptural pendants, with the skyline as the main wall." },
      { t: "A kitchen made to host", d: "Laser-cut marble, natural stone and backlit shelving around a full suite of built-in appliances." },
      { t: "Designed with the family", d: "The children’s rooms were planned with the children themselves, down to a saffron basin in sculpted stone." },
    ],
    palette: ["#e9e1d6", "#c9b49a", "#8a6f55", "#3b3530"],
    chapters: [
      { img: p("penthouse-the-greens", "great-room"), eyebrow: "01 · The great room", title: "Living on a double-height scale", text: "Warm timber, honed marble and slim metal frame deep, low seating. The glazing runs floor to ceiling, so the room feels part of the view." },
      { img: p("penthouse-the-greens", "kitchen-marble"), eyebrow: "02 · Kitchen", title: "Marble, stone and light", text: "Book-matched marble and backlit shelving turn a working kitchen into the heart of every dinner party." },
      { img: p("penthouse-the-greens", "terrace-pool"), eyebrow: "03 · Terrace", title: "Living up to the sky", text: "The top floor opens onto a terrace and pool, lit for long evenings over the greens." },
    ],
    gallery: [
      { img: p("penthouse-the-greens", "living-skyline"), caption: "Open-plan living with skyline views" },
      { img: p("penthouse-the-greens", "double-height"), caption: "Dining under the double-height void" },
      { img: p("penthouse-the-greens", "pendants"), caption: "Sculptural lighting" },
      { img: p("penthouse-the-greens", "kids-bath"), caption: "A playful kids’ bathroom" },
    ],
    services: ["interior-design", "renovation", "villa-renovation", "furnishing"],
  },
  {
    slug: "villa-velora",
    name: "Villa Velora",
    category: "Villa",
    location: "Jumeirah Islands, Dubai",
    scope: "Full villa design & build",
    year: "2026",
    tagline: "Travertine, oak and one long olive line",
    cover: p("villa-velora", "facade"),
    summary: "A two-storey villa rebuilt inside and out around a single double-height hall, with a new white-stone facade, a show kitchen and a pool garden.",
    story: [
      "Velora was reworked around one tall room. A folded travertine stair now climbs the full height of the living hall, and everything else on the ground floor opens off it through broad arches instead of doors.",
      "Outside, the facade was reset in crisp white stone with a single soaring arched window and a glazed garage that shows the car rather than hiding it. The pool terrace and planted garden finish the sequence.",
    ],
    facts: [["Type", "Private villa, two floors"], ["Scope", "Interior + exterior rebuild"], ["Style", "Warm contemporary"], ["Location", "Jumeirah Islands"]],
    highlights: [
      { t: "One room carries the house", d: "Full-height curtains, a folded stone stair and a curved olive sofa make the hall the centre of the home." },
      { t: "Bronze as the thread", d: "Slim bronze reveals edge every arch, cabinet and ceiling tray, tying stone, oak and marble together." },
      { t: "Each room its own mood", d: "Olive in the hall, taupe in the family lounge, cane in the guest suite and powder blue for the teen room." },
    ],
    palette: ["#efe8dc", "#cdbb9f", "#6f7550", "#8b6a45"],
    chapters: [
      { img: p("villa-velora", "living-hall"), eyebrow: "01 · Living hall", title: "The stair is the centrepiece", text: "A travertine flight climbs a wall of textured stone, with a mezzanine walkway in silvered oak above. Furniture stays low so the volume stays the star." },
      { img: p("villa-velora", "kitchen"), eyebrow: "02 · Kitchen & dining", title: "Two rooms, one open frame", text: "The show kitchen and dining room share the same oak and fossil-marble language, joined through a wide radiused opening." },
      { img: p("villa-velora", "pool-terrace"), eyebrow: "03 · Outside", title: "A new face for the villa", text: "White stone, ribbed cornices and one arched window give the villa a calm new street presence, with the pool terrace behind." },
    ],
    gallery: [
      { img: p("villa-velora", "entrance"), caption: "Arrival through curved oak piers" },
      { img: p("villa-velora", "olive-lounge"), caption: "The olive lounge" },
      { img: p("villa-velora", "dining"), caption: "Dining under mesh pendants" },
      { img: p("villa-velora", "family-lounge"), caption: "Family lounge" },
      { img: p("villa-velora", "guest-suite"), caption: "Guest suite in cane and linen" },
      { img: p("villa-velora", "teen-room"), caption: "Powder-blue teen room" },
      { img: p("villa-velora", "media-room"), caption: "Media room" },
      { img: p("villa-velora", "garage"), caption: "The showroom garage" },
      { img: p("villa-velora", "garden"), caption: "Pool and garden" },
    ],
    services: ["villa-renovation", "interior-design", "renovation", "painting"],
  },
  {
    slug: "villa-pinea",
    name: "Villa Pinea",
    category: "Villa",
    location: "Jumeirah Islands, Dubai",
    scope: "Turnkey design & build",
    year: "2026",
    tagline: "A Mediterranean family home in a sculpted garden",
    cover: p("villa-pinea", "exterior"),
    summary: "A two-storey family villa under a terracotta roof: cloud-pruned pines, a mosaic infinity pool with fire bowls, and interiors in travertine, Rosso Levanto marble, smoked oak and bronze.",
    story: [
      "Pinea is a family home that should feel like a boutique hotel without feeling formal. A double-height reception gathers around a living tree, the dining room and bar sit under a lit hammered-metal ceiling, and the private suites are finished like a resort.",
      "Outside, sculpted pines, a travertine terrace and a mosaic infinity pool frame the house, with a rooftop retreat for the evenings.",
    ],
    facts: [["Type", "Family villa, two floors"], ["Scope", "Turnkey interiors + landscape"], ["Materials", "Travertine, marble, oak, bronze"], ["Location", "Jumeirah Islands"]],
    highlights: [
      { t: "A garden of sculpted pines", d: "Cloud-pruned pines, a mosaic infinity pool with fire bowls and a rooftop retreat." },
      { t: "Stone and bronze throughout", d: "Travertine walls, Rosso Levanto and forest-green marble, with bronze carried from reception to bathrooms." },
      { t: "Joinery for every hobby", d: "A walnut study with a backlit watch cabinet, a mirrored walk-in wardrobe and a showcase garage." },
    ],
    palette: ["#efe6da", "#b9825e", "#7a2f2a", "#2f4a3c"],
    chapters: [
      { img: p("villa-pinea", "reception"), eyebrow: "01 · Reception", title: "Gathered around a living tree", text: "A double-height lounge framed in red marble, with a mature indoor tree, a lit ceramics display and a cloud-like pendant over curved sofas." },
      { img: p("villa-pinea", "dining"), eyebrow: "02 · Entertaining", title: "A table for eight under a hammered ceiling", text: "A round marble table, a curved bronze island in forest-green marble and a full-height wine cabinet behind fluted walnut." },
      { img: p("villa-pinea", "master"), eyebrow: "03 · Principal suite", title: "Soft light, soft edges", text: "A low upholstered bed under gilded art and a lit, mirrored ceiling, framed in slatted oak and bronze mirror." },
    ],
    gallery: [
      { img: p("villa-pinea", "living"), caption: "Family living in travertine and walnut" },
      { img: p("villa-pinea", "dining-bar"), caption: "The bar" },
      { img: p("villa-pinea", "media-wall"), caption: "Media wall" },
      { img: p("villa-pinea", "study"), caption: "Walnut study" },
      { img: p("villa-pinea", "bath"), caption: "Amber glass tub" },
      { img: p("villa-pinea", "walk-in"), caption: "Infinity-mirror walk-in" },
      { img: p("villa-pinea", "guest-suite"), caption: "Guest suite in copper and oak" },
      { img: p("villa-pinea", "kids-room"), caption: "Children’s room" },
      { img: p("villa-pinea", "terrace"), caption: "Infinity pool and terrace" },
      { img: p("villa-pinea", "rooftop"), caption: "Rooftop retreat" },
    ],
    services: ["villa-renovation", "interior-design", "furnishing", "curtains-blinds"],
  },
  {
    slug: "villa-ambra",
    name: "Villa Ambra",
    category: "Villa",
    location: "Marina Gates, Dubai Marina",
    scope: "Interior fit-out",
    year: "2026",
    tagline: "Oak, stone and amber light on the marina",
    cover: p("villa-ambra", "living"),
    summary: "A two-level waterfront home named after the cascade of amber glass that falls through its double-height hall, catching the marina sun all day.",
    story: [
      "Around the amber chandelier the palette is warm and tactile: smoked oak joinery, honed stone, textured plaster and bronze-tinted glass. Folding glass doors open the living room onto a planted terrace with the yachts just beyond.",
      "Joinery does the heavy lifting: a lit wine store built into the stair, full-height kitchen walls that hide every appliance, a fitted study and a walk-in wardrobe.",
    ],
    facts: [["Type", "Waterfront villa, two levels"], ["Scope", "Interior fit-out + joinery"], ["Style", "Warm minimal"], ["Location", "Marina Gates, Dubai Marina"]],
    highlights: [
      { t: "A double-height hall", d: "A cascading amber glass chandelier falls through two storeys beside a plaster wall and bronze glass stair." },
      { t: "Joinery that works hard", d: "A lit oak wine store under the stair, full-height kitchen walls, a fitted study and a walk-in wardrobe." },
      { t: "Living on the water", d: "Folding glass doors and full-height bedroom glazing open the home to its terrace and the marina." },
    ],
    palette: ["#f0e7da", "#c99a5b", "#5b4636", "#24211f"],
    chapters: [
      { img: p("villa-ambra", "living"), eyebrow: "01 · Living", title: "Open to the terrace, open to the marina", text: "A smoked oak media wall faces a deep sectional, with a grand piano by the glass and amber petals drifting across the wall above the dining table." },
      { img: p("villa-ambra", "kitchen"), eyebrow: "02 · Kitchen", title: "Smoked oak and honed stone", text: "A full wall of oak hides the appliances, and a stone waterfall island seats four under a slim linear pendant." },
      { img: p("villa-ambra", "master"), eyebrow: "03 · Master suite", title: "Waking up on the water", text: "A curved, cove-lit ceiling over a low bed, with full-height glass framing the yachts and towers." },
    ],
    gallery: [
      { img: p("villa-ambra", "hero"), caption: "Kitchen and hall under the amber cascade" },
      { img: p("villa-ambra", "stair"), caption: "The stair that holds the wine store" },
      { img: p("villa-ambra", "bedroom"), caption: "Bedroom with marina views" },
      { img: p("villa-ambra", "study"), caption: "Fitted study" },
      { img: p("villa-ambra", "wardrobe"), caption: "Walk-in wardrobe" },
      { img: p("villa-ambra", "marina"), caption: "The view from the terrace" },
    ],
    services: ["interior-design", "renovation", "furnishing", "holiday-home-setup"],
  },
  {
    slug: "dhg-properties-office",
    name: "DHG Properties",
    category: "Office",
    location: "Dubai Hills",
    scope: "Turnkey office fit-out",
    year: "2026",
    tagline: "A real estate office that feels like a hotel lobby",
    cover: p("dhg-properties-office", "reception-lounge"),
    summary: "A client-facing real estate office in Dubai Hills: marble reception, client lounge and coffee bar, a ten-seat boardroom, glass-fronted private offices and director suites.",
    story: [
      "Clients should feel welcome the moment the lift opens. Dark fluted timber, warm oak and a slatted timber ceiling are set against veined marble and soft stone floors, leading guests from reception into a lounge and coffee bar.",
      "Behind the front of house, the plan moves to a boardroom, glass-fronted private offices and director suites, with a fitted pantry and stone washrooms finished to the same standard.",
    ],
    facts: [["Type", "Commercial office"], ["Scope", "Design, approvals, fit-out"], ["Spaces", "Reception, lounge, boardroom, offices"], ["Location", "Dubai Hills"]],
    highlights: [
      { t: "Made for client meetings", d: "A marble reception, a lounge for waiting clients and a coffee bar, all in view from the entrance." },
      { t: "A boardroom for closing deals", d: "Ten seats around a marble-inlaid table, sculpted pendants and a full-height joinery wall." },
      { t: "Built for the team", d: "Glass-fronted private offices, director suites, a fitted pantry and two styles of washroom." },
    ],
    palette: ["#ece7e1", "#b8a58e", "#5a4a3d", "#1f1d1b"],
    chapters: [
      { img: p("dhg-properties-office", "reception"), eyebrow: "01 · Reception", title: "A reception that does the talking", text: "A veined marble desk, backlit lettering on fluted timber and a slatted ceiling with linear lights." },
      { img: p("dhg-properties-office", "boardroom"), eyebrow: "02 · Boardroom", title: "Ten seats, one table", text: "Warm grey oak and tan leather, a marble inlay down the table, wave pendants and lit niches either side of the screen." },
      { img: p("dhg-properties-office", "private-offices"), eyebrow: "03 · Workspace", title: "Private offices behind glass", text: "Frameless glass doors with frosted bands give each office privacy without losing light." },
    ],
    gallery: [
      { img: p("dhg-properties-office", "lounge"), caption: "Client lounge" },
      { img: p("dhg-properties-office", "coffee-bar"), caption: "Coffee bar framed in marble" },
      { img: p("dhg-properties-office", "boardroom-table"), caption: "Head of the table" },
      { img: p("dhg-properties-office", "office"), caption: "Director suite" },
      { img: p("dhg-properties-office", "manager-office"), caption: "Manager’s office" },
      { img: p("dhg-properties-office", "washroom"), caption: "Black marble washroom" },
    ],
    services: ["commercial-fit-out", "interior-design", "electrical", "painting"],
  },
  {
    slug: "atelier-lumen",
    name: "Atelier Lumen",
    category: "Office",
    location: "Dubai",
    scope: "Turnkey office fit-out",
    year: "2026",
    tagline: "A design studio built around light and material",
    cover: p("atelier-lumen", "lounge"),
    summary: "A design-led studio office: client lounge, glass meeting pods, a lit material library, a boardroom for reviews, an open studio, coffee bar and stone washrooms.",
    story: [
      "Planned as a working studio rather than a corporate floor. Pale travertine, smoked glass and dark oak sit against soft white walls, with circular light coves and linear slots leading the eye through the space.",
      "The plan moves from a client lounge and meeting pods to a sample room and boardroom for material reviews, then a quiet open studio, with a coffee bar, pantry and stone washrooms finished to hospitality standard.",
    ],
    facts: [["Type", "Studio office"], ["Scope", "Design, fit-out, joinery"], ["Spaces", "Lounge, library, boardroom, studio"], ["Location", "Dubai"]],
    highlights: [
      { t: "Made for client meetings", d: "A client lounge, glass meeting pods and a sample room, a few steps from arrival." },
      { t: "A working material library", d: "Lit shelving for stone, timber and fabric samples, with a long table for laying out schemes." },
      { t: "Built for the team", d: "Open-plan workstations, a focused studio, a pantry and a coffee bar." },
    ],
    palette: ["#f2f0ec", "#d9d2c5", "#8b8378", "#2c2a28"],
    chapters: [
      { img: p("atelier-lumen", "lounge"), eyebrow: "01 · Client lounge", title: "Softer, and made to linger", text: "A low curved sofa on a travertine plinth and layered stone tables, looking through glass to the sample room." },
      { img: p("atelier-lumen", "material-library"), eyebrow: "02 · Material library", title: "Every sample, close at hand", text: "Floor-to-ceiling lit shelving for stone, timber and fabric, with flat-file drawers below." },
      { img: p("atelier-lumen", "boardroom"), eyebrow: "03 · Boardroom", title: "A room for big decisions", text: "A round table under a circular light cove, with lit display shelving along one wall." },
    ],
    gallery: [
      { img: p("atelier-lumen", "library-table"), caption: "The sample table" },
      { img: p("atelier-lumen", "meeting-pod"), caption: "Meeting pod" },
      { img: p("atelier-lumen", "open-plan"), caption: "Open studio" },
      { img: p("atelier-lumen", "coffee-bar"), caption: "Coffee bar" },
      { img: p("atelier-lumen", "washroom-vanity"), caption: "Travertine washroom" },
    ],
    services: ["commercial-fit-out", "interior-design", "electrical", "ac-maintenance"],
  },
];

export const PROJECT_BY_SLUG = new Map(PROJECTS.map((x) => [x.slug, x]));

/** Projects to show on a service page: the ones that list it first, then the rest. */
export function projectsFor(serviceSlug: string, n = 6): Project[] {
  return [...PROJECTS].sort((a, b) => Number(b.services.includes(serviceSlug)) - Number(a.services.includes(serviceSlug))).slice(0, n);
}

export function workMessage(x: Project) {
  return `Hi Stayshay, I saw your ${x.name} project (${x.category.toLowerCase()}, ${x.location}). I'd like something similar.\nProperty: … (villa / apartment / office)\nArea: …\nSize: …\nBudget: …\nTimeline: …`;
}
