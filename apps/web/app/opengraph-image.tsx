import { ImageResponse } from "next/og";

export const alt = "Stayshay: monthly rooms, bed spaces, partitions and studios across the UAE";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#145C46", color: "white", padding: 72, fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: -1 }}>stayshay</div>
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
