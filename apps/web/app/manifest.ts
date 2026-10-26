import type { MetadataRoute } from "next";
import { BRAND } from "@stayshay/core";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.name}: monthly rooms & bed spaces in the UAE`,
    short_name: BRAND.name,
    description: BRAND.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#145C46",
    icons: [{ src: "/brand/stayshay-mark.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
