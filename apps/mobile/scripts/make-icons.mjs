#!/usr/bin/env node
// Renders every app icon / splash / store graphic from the one Stayshay mark (apps/web/public/brand/stayshay-mark.svg).
//   npm run icons -w @stayshay/mobile
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = dirname(fileURLToPath(import.meta.url));
const app = join(here, "..");
const markSvg = await readFile(join(app, "../web/public/brand/stayshay-mark.svg"), "utf8");
const inner = markSvg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

const IVORY = "#F4F2E9";
const GREEN = "#145C46";
const MINT = "#DDF4E8";

/** The mark (viewBox 120x124) placed at (x, y) with height h. */
const mark = (x, y, h, body = inner) => `<svg x="${x}" y="${y}" width="${(h * 120) / 124}" height="${h}" viewBox="0 0 120 124">${body}</svg>`;
// Monochrome: same silhouette, single colour (Android themed icons read only the alpha).
const mono = inner.replace(/fill="#[0-9A-Fa-f]{6}"/g, 'fill="#FFFFFF"').replace(/stroke:#[0-9A-Fa-f]{6}/g, "stroke:#000000").replace(/stroke="#[0-9A-Fa-f]{6}"/g, 'stroke="#000000"');

async function png(svg, file, w, h = w) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, await sharp(Buffer.from(svg), { density: 300 }).resize(w, h).png().toBuffer());
  console.log("✓", file.replace(app + "/", ""), `${w}x${h}`);
}

const S = 1024;
// iOS / store icon: ivory field, soft mint disc, the pin centred a touch high (the tip carries visual weight).
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">
  <rect width="${S}" height="${S}" fill="${IVORY}"/>
  <circle cx="512" cy="500" r="410" fill="${MINT}"/>
  ${mark(512 - (680 * 120) / 124 / 2, 168, 680)}
</svg>`;
await png(icon, join(app, "assets/icon.png"), S);
await png(icon, join(app, "store/app-store-icon-1024.png"), S);
await png(icon, join(app, "store/play-store-icon-512.png"), 512);

// Android adaptive foreground: transparent, mark inside the 66% safe zone.
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${mark(512 - (540 * 120) / 124 / 2, 252, 540)}</svg>`, join(app, "assets/adaptive-icon.png"), S);
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}">${mark(512 - (540 * 120) / 124 / 2, 252, 540, mono)}</svg>`, join(app, "assets/adaptive-icon-mono.png"), S);

// Splash: the mark alone; the background colour comes from app.json.
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${mark(256 - (440 * 120) / 124 / 2, 36, 440)}</svg>`, join(app, "assets/splash-icon.png"), 512);
await png(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect width="96" height="96" rx="22" fill="${IVORY}"/>${mark(48 - (74 * 120) / 124 / 2, 10, 74)}</svg>`, join(app, "assets/favicon.png"), 96);

// Google Play feature graphic (1024x500).
await png(
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500">
    <rect width="1024" height="500" fill="${GREEN}"/>
    <circle cx="880" cy="420" r="260" fill="#1B6B53"/>
    ${mark(96, 150, 200).replace(/fill="#145C46"/g, `fill="${IVORY}"`).replace(/stroke:#F4F2E9/g, `stroke:${GREEN}`).replace(/stroke="#DDF4E8"/g, `stroke="${GREEN}"`)}
    <text x="320" y="250" font-family="Helvetica Neue, Helvetica, Arial" font-weight="800" font-size="96" letter-spacing="-4" fill="#FFFFFF">stayshay</text>
    <text x="324" y="312" font-family="Helvetica Neue, Helvetica, Arial" font-weight="500" font-size="30" fill="#8FE3BD">Rooms, bed spaces &amp; roommates · UAE</text>
  </svg>`,
  join(app, "store/feature-graphic-1024x500.png"),
  1024,
  500,
);
