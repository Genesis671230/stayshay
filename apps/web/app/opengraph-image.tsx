import { ImageResponse } from "next/og";

export const alt = "Stayshay: monthly rooms, bed spaces, partitions and studios across the UAE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "radial-gradient(circle at 80% 20%, #2a7a5c 0%, #1B3F2E 55%, #0d241a 100%)", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width="64" height="64" viewBox="415 248.5 1100 1100">
            <rect x="415" y="248.5" width="1100" height="1100" rx="250" fill="#F6F3EC" />
            <path d="M614 407H744V858L1144 407H1316L744 1057H1000L903 1190H614Z" fill="#1B3F2E" />
            <path d="M1135 700L1275 870C1300 902 1316 945 1316 1000C1316 1105 1235 1190 1130 1190H975L1072 1057H1125C1160 1057 1187 1030 1187 995C1187 975 1180 960 1167 945L1050 797Z" fill="#1B3F2E" />
          </svg>
          <div style={{ fontSize: 44, fontWeight: 600, letterSpacing: -1, color: "#F6F3EC" }}>stayshay</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2 }}>Live like it’s luxury.</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, color: "#8fe3bd" }}>Pay like it’s shared.</div>
          <div style={{ fontSize: 30, marginTop: 28, color: "rgba(255,255,255,0.85)" }}>Bed spaces · Partitions · Rooms · Studios · Roommates — Dubai & UAE</div>
        </div>
      </div>
    ),
    size,
  );
}
