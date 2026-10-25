import type { Amenity, Lifestyle, ListingType } from "./types.ts";

/** Single place for everything brand-level. Rename the product here. */
export const BRAND = {
  name: "Stayshay",
  domain: "stayshay.com",
  tagline: "Monthly rooms, bed spaces and studios across the UAE.",
  supportEmail: "hello@stayshay.com",
  /** WhatsApp for every inquiry, roommate profile and new listing (E.164 digits). */
  whatsapp: "971569048493",
  whatsappDisplay: "+971 56 904 8493",
  /**
   * Shown while the catalogue is seeded with sample listings.
   * Flip to false once real lister data is live.
   */
  previewData: false,
} as const;

export const TYPE_LABEL: Record<ListingType, string> = {
  room: "Private room",
  bed_space: "Bed space",
  partition: "Partition",
  studio: "Studio",
  roommate: "Roommate",
};

export const TYPE_LABEL_PLURAL: Record<ListingType, string> = {
  room: "Private rooms",
  bed_space: "Bed spaces",
  partition: "Partitions",
  studio: "Studios",
  roommate: "Roommates",
};

export const TYPE_SLUG: Record<ListingType, string> = {
  room: "rooms",
  bed_space: "bed-space",
  partition: "partitions",
  studio: "studios",
  roommate: "roommates",
};

export const AMENITY_LABEL: Record<Amenity, string> = {
  wifi: "Wi-Fi",
  ac: "A/C",
  kitchen: "Kitchen",
  washer: "Washer",
  parking: "Parking",
  gym: "Gym",
  pool: "Pool",
  cleaning: "Cleaning",
  balcony: "Balcony",
  private_bath: "Private bath",
  dewa_included: "DEWA included",
};

export const LIFESTYLE_LABEL: Record<Lifestyle, string> = {
  non_smoker: "Non-smoker",
  early_riser: "Early riser",
  pet_friendly: "Pet friendly",
  quiet: "Quiet",
  social: "Social",
};

export const BUDGET_CHIPS = [1500, 3000, 4500, 6000] as const;
