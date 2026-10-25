#!/usr/bin/env node
// Renders every app icon / splash / store graphic from the Stayshay mark (Shay: blob + glowing capsule eyes,
// same drawing as apps/web/public/brand/stayshay-mark.svg).
//   npm run icons -w @stayshay/mobile
import { writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");

const IVORY = "#F4F2E9";
const GREEN = "#145C46";
const MINT = "#DDF4E8";


async function png(svg, file, w, h = w) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, await sharp(Buffer.from(svg), { density: 300 }).resize(w, h).png().toBuffer());
  console.log("✓", file.replace(app + "/", ""), `${w}x${h}`);
}

const S = 1024;
const BLOB = "M58 4C92 2 116 20 116 56C116 94 94 116 60 116C25 116 4 96 4 60C4 26 24 6 58 4Z";
// Shay mark (blob + glowing capsule eyes), placed at (x, y) with side length w.
const shay = (x, y, w, { light = false } = {}) => `<svg x="${x}" y="${y}" width="${w}" height="${w}" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="b${x}" x1="0.1" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="${light ? "#FFFFFF" : "#3FD99A"}"/><stop offset="0.4" stop-color="${light ? "#F4FFF9" : "#27AE78"}"/><stop offset="1" stop-color="${light ? "#DDF4E8" : "#145C46"}"/></linearGradient>
    <radialGradient id="s${x}" cx="0.3" cy="0.2" r="0.45"><stop offset="0" stop-color="#FFFFFF" stop-opacity="0.5"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient>
    <filter id="g${x}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <path d="${BLOB}" fill="url(#b${x})"/><path d="${BLOB}" fill="url(#s${x})"/>
  <g filter="url(#g${x})" fill="${light ? GREEN : "#F4FFF9"}"><rect x="40" y="46" width="13" height="31" rx="6.5"/><rect x="67" y="46" width="13" height="31" rx="6.5"/></g>
</svg>`;
// Soft halo behind the mark (the "glow").
const halo = (cx, cy, r) => `<defs><radialGradient id="h"><stop offset="0" stop-color="#6EE7B7" stop-opacity="0.55"/><stop offset="1" stop-color="#6EE7B7" stop-opacity="0"/></radialGradient></defs><circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#h)"/>`;

// iOS / store icon: ivory field, mint halo, Shay centred.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><rect width="${S}" height="${S}" fill="${IVORY}"/>${halo(512, 520, 470)}${shay(512 - 300, 512 - 300, 600)}</svg>`;
await png(icon, join(app, "assets/icon.png"), S);
await png(icon, join(app, "store/app-store-icon-1024.png"), S);
await png(icon, join(app, "store/play-store-icon-512.png"), 512);

// Android adaptive foreground: transparent, mark inside the 66% safe zone.
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${shay(512 - 250, 512 - 250, 500)}</svg>`, join(app, "assets/adaptive-icon.png"), S);
// Monochrome (themed icons read alpha only): solid blob with the eyes cut out.
await png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}"><defs><mask id="m"><rect width="120" height="120" fill="#fff"/><rect x="40" y="46" width="13" height="31" rx="6.5" fill="#000"/><rect x="67" y="46" width="13" height="31" rx="6.5" fill="#000"/></mask></defs><svg x="262" y="262" width="500" height="500" viewBox="0 0 120 120"><path d="${BLOB}" fill="#FFFFFF" mask="url(#m)"/></svg></svg>`,
  join(app, "assets/adaptive-icon-mono.png"),
  S,
);

// Splash: the mark with its halo; background colour comes from app.json.
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${halo(256, 256, 250)}${shay(256 - 170, 256 - 170, 340)}</svg>`, join(app, "assets/splash-icon.png"), 512);
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="22" fill="${IVORY}"/>${shay(10, 10, 76)}</svg>`, join(app, "assets/favicon.png"), 96);

// Google Play feature graphic (1024x500).
await png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
    <rect width="1024" height="500" fill="${GREEN}"/>
    <circle cx="880" cy="420" r="260" fill="#1B6B53"/>
    ${halo(200, 250, 190)}
    ${shay(90, 140, 220)}
    <text x="350" y="250" font-family="Helvetica Neue, Helvetica, Arial" font-weight="800" font-size="96" letter-spacing="-4" fill="#FFFFFF">stayshay</text>
    <text x="354" y="312" font-family="Helvetica Neue, Helvetica, Arial" font-weight="500" font-size="30" fill="#8FE3BD">Luxury living. Shared prices. Smart AI.</text>
  </svg>`,
  join(app, "store/feature-graphic-1024x500.png"),
  1024,
  500,
);
