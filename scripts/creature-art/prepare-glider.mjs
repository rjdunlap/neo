// RW02b (docs/rework/GENERATED-CREATURE-PILOT.md): cuts the illustrated cloud glider out of the
// generated concept sheet and writes a transparent, trimmed, padded sprite for the dev preview.
//
//   node scripts/creature-art/prepare-glider.mjs [--check]
//
// Steps, all in a headless Chromium canvas (no image tools beyond the repository's Playwright):
// 1. crop the "Illustrated adventure" glider from the sheet;
// 2. flood-fill the cream paper from the crop's border, stopping at the ink outline;
// 3. keep only the connected shape that holds the glider's eye (drops a neighbour's feet and bushes);
// 4. soften the edge: a pixel next to the paper gets alpha from its distance to the paper colour and
//    has the paper un-mixed from its colour, so no cream fringe shows on a dark background;
// 5. trim, pad and write the PNG. `--check` also writes light/dark/checker previews to test-results/.
import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SHEET = join(root, 'docs/rework/concepts/art-directions-2026-10-16.png');
const OUT = join(root, 'src/art/creatures/illustrated/glider.png');
/** The illustrated glider's box on the 1536 × 1024 sheet, and a point inside it (the eye's white). */
const CROP = { x: 528, y: 262, w: 462, h: 194 };
const SEED = { x: 925 - CROP.x, y: 360 - CROP.y };
/** Colour distance (0–441) under which a border-connected pixel is paper, and the edge ramp above it. */
const PAPER = 34;
const RAMP = 70;
const PAD = 8;
const check = process.argv.includes('--check');

const browser = await chromium.launch();
const page = await browser.newPage();
const sheet = 'data:image/png;base64,' + readFileSync(SHEET).toString('base64');
const result = await page.evaluate(
  async ({ sheet, CROP, SEED, PAPER, RAMP, PAD, check }) => {
    const img = new Image();
    img.src = sheet;
    await img.decode();
    const { w, h } = CROP;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, CROP.x, CROP.y, w, h, 0, 0, w, h);
    const px = g.getImageData(0, 0, w, h);
    const d = px.data;
    // The paper colour: the median of the crop's border.
    const border = [];
    for (let x = 0; x < w; x++) border.push(x, x + (h - 1) * w);
    for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
    const med = (k) => border.map((i) => d[i * 4 + k]).sort((a, b) => a - b)[border.length >> 1];
    const paper = [med(0), med(1), med(2)];
    const dist = (i) => Math.hypot(d[i * 4] - paper[0], d[i * 4 + 1] - paper[1], d[i * 4 + 2] - paper[2]);

    // 2. Paper: flood from the border through pixels close to the paper colour.
    const bg = new Uint8Array(w * h);
    const stack = border.filter((i) => dist(i) < PAPER);
    for (const i of stack) bg[i] = 1;
    while (stack.length) {
      const i = stack.pop();
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || bg[j]) continue;
        if (dist(j) < PAPER) {
          bg[j] = 1;
          stack.push(j);
        }
      }
    }
    // 3. Keep the shape connected to the eye.
    const keep = new Uint8Array(w * h);
    const s2 = [SEED.y * w + SEED.x];
    keep[s2[0]] = 1;
    while (s2.length) {
      const i = s2.pop();
      const x = i % w;
      for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
        if (j < 0 || j >= w * h || keep[j] || bg[j]) continue;
        keep[j] = 1;
        s2.push(j);
      }
    }
    // 4. Alpha with a soft, de-fringed edge two pixels deep: ring 1 touches the paper, ring 2 touches ring 1.
    const ring = new Uint8Array(w * h);
    const near = (i, test) => [i % w > 0 ? i - 1 : -1, i % w < w - 1 ? i + 1 : -1, i - w, i + w].some((j) => j < 0 || j >= w * h || test(j));
    for (let i = 0; i < w * h; i++) if (keep[i] && near(i, (j) => !keep[j])) ring[i] = 1;
    for (let i = 0; i < w * h; i++) if (keep[i] && !ring[i] && near(i, (j) => ring[j] === 1)) ring[i] = 2;
    const src = d.slice();
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let i = 0; i < w * h; i++) {
      if (!keep[i]) {
        d[i * 4 + 3] = 0;
        continue;
      }
      const x = i % w;
      const y = (i / w) | 0;
      if (ring[i]) {
        // Un-mix: the pixel is paper blended with the strongest colour just inside it (usually ink).
        let f = -1;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const j = i + dy * w + dx;
          if (x + dx < 0 || x + dx >= w || j < 0 || j >= w * h || !keep[j] || ring[j] === 1) continue;
          if (f < 0 || dist(j) > dist(f)) f = j;
        }
        if (f >= 0 && dist(f) > RAMP) {
          const fv = [0, 1, 2].map((k) => src[f * 4 + k] - paper[k]);
          const cv = [0, 1, 2].map((k) => d[i * 4 + k] - paper[k]);
          const a = Math.min(1, Math.max(0, (fv[0] * cv[0] + fv[1] * cv[1] + fv[2] * cv[2]) / (fv[0] ** 2 + fv[1] ** 2 + fv[2] ** 2)));
          if (a < 1) {
            for (let k = 0; k < 3; k++) d[i * 4 + k] = src[f * 4 + k];
            d[i * 4 + 3] = Math.round(a * 255);
          }
        }
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
    g.putImageData(px, 0, 0);
    // 5. Trim and pad.
    const tw = maxX - minX + 1 + PAD * 2;
    const th = maxY - minY + 1 + PAD * 2;
    const out = document.createElement('canvas');
    out.width = tw;
    out.height = th;
    out.getContext('2d').drawImage(c, minX, minY, tw - PAD * 2, th - PAD * 2, PAD, PAD, tw - PAD * 2, th - PAD * 2);
    const previews = [];
    if (check) {
      for (const fill of ['#fff8ec', '#2b2340', 'checker']) {
        const p = document.createElement('canvas');
        p.width = tw * 2;
        p.height = th * 2;
        const pg = p.getContext('2d');
        if (fill === 'checker') for (let y = 0; y < p.height; y += 16) for (let x = 0; x < p.width; x += 16) {
          pg.fillStyle = (x + y) % 32 ? '#bbb' : '#eee';
          pg.fillRect(x, y, 16, 16);
        }
        else {
          pg.fillStyle = fill;
          pg.fillRect(0, 0, p.width, p.height);
        }
        pg.drawImage(out, 0, 0, p.width, p.height);
        previews.push(p.toDataURL('image/png'));
      }
    }
    return { png: out.toDataURL('image/png'), size: [tw, th], origin: [CROP.x + minX - PAD, CROP.y + minY - PAD], paper, previews };
  },
  { sheet, CROP, SEED, PAPER, RAMP, PAD, check },
);
await browser.close();

const bytes = (url) => Buffer.from(url.split(',')[1], 'base64');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, bytes(result.png));
if (check) {
  mkdirSync(join(root, 'test-results'), { recursive: true });
  ['light', 'dark', 'checker'].forEach((n, i) => writeFileSync(join(root, `test-results/rw02b-glider-${n}.png`), bytes(result.previews[i])));
}
console.log(JSON.stringify({ out: 'src/art/creatures/illustrated/glider.png', size: result.size, sheetOrigin: result.origin, paper: result.paper }));
