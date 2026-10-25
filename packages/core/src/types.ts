export type ListingType = "room" | "bed_space" | "partition" | "studio" | "roommate";
export type Gender = "male" | "female" | "any";
export type Occupancy = "single" | "couple" | "shared";
export type ListerType = "owner" | "agent" | "tenant_sublet";

export type Amenity =
  | "wifi"
  | "ac"
  | "kitchen"
  | "washer"
  | "parking"
  | "gym"
  | "pool"
  | "cleaning"
  | "balcony"
  | "private_bath"
  | "dewa_included";

export type Lifestyle = "non_smoker" | "early_riser" | "pet_friendly" | "quiet" | "social";

/** Lifecycle a listing moves through once the lister dashboard exists. */
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "live"
  | "reserved"
  | "rented"
  | "expired"
  | "reported";

export interface Area {
  slug: string;
  name: string;
  nameAr: string;
  emirate: string;
  lat: number;
  lng: number;
  nearMetro: string | null;
  aliases: string[];
}

export interface Compliance {
  /** Lister declared written landlord consent for sharing / subletting. */
  landlordConsent: boolean;
  /** Lister declared a Dubai Municipality permit for the partition / layout. */
  dmPermit: boolean;
}

export interface RoommateProfile {
  age: number;
  profession: string;
  lifestyle: Lifestyle[];
}

export interface Listing {
  id: string;
  type: ListingType;
  title: string;
  areaSlug: string;
  building: string;
  priceAed: number;
  billsIncluded: boolean;
  deposit: number;
  commission: number;
  availableFrom: string;
  minStayMonths: number;
  occupancy: Occupancy;
  bedsInRoom: number;
  bedsAvailable: number;
  gender: Gender;
  furnished: boolean;
  amenities: Amenity[];
  nearMetroMinutes: number | null;
  compliance: Compliance;
  verifiedLister: boolean;
  listerName: string;
  listerType: ListerType;
  rating: number;
  reviews: number;
  photos: string[];
  description: string;
  profile?: RoommateProfile;
  status?: ListingStatus;

  // Imported listing detail (homebook test data). All optional so hand-made listings still type-check.
  /** Upper end when the lister gives a range (e.g. different beds in one flat). */
  priceMaxAed?: number | null;
  slug?: string;
  typeName?: string | null;
  areaName?: string | null;
  city?: string | null;
  /** Exact pin from the source; falls back to the area centre when missing. */
  lat?: number | null;
  lng?: number | null;
  metro?: string | null;
  utilities?: string | null;
  upfrontCost?: number;
  availability?: string | null;
  minimumStay?: string | null;
  noticePeriod?: string | null;
  maxCapacity?: number | null;
  flatmates?: string | null;
  sleepingSet?: string | null;
  bathroom?: string | null;
  balcony?: string | null;
  preferredTenant?: string[];
  preferredNationality?: string[];
  features?: string[];
  descriptionLines?: string[];
  views?: number | null;
  postedAt?: string;
  /** Admin-only: the lister's WhatsApp. Stripped before anything reaches renters. */
  listerPhone?: string;
}
