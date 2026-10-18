// The pixel rules behind `prepare-sprite.mjs`, with no canvas or file access so they run under
// vitest on synthetic images (`prepare-sprite.test.mjs`). Pixels are RGBA, row-major, 8-bit.
//
// A sprite is cut in two steps:
// 1. `keyOut()` decides which pixels are the creature and softens its edge, in place;
// 2. `cut()` copies a box of those pixels into a new padded image.
// `--set` adds `alignment()` (do a variant's trimmed bounds match the base?) and `parseManifest()`.

/** Colour distance (0–441) under which a border-connected pixel is paper, and the edge ramp above it. */
export const PAPER = 34;
export const RAMP = 70;
/** In a transparent image, alpha below this is background (noise a generator leaves in clear areas). */
export const CLEAR = 8;
/** How far a variant's trimmed bounds may differ from the base's before `--set` refuses, in pixels. */
export const TOLERANCE = 4;

/** Indices of an image's border pixels (the corners twice, as the pilot counted them: its median must not move). */
function borderOf(w, h) {
  const border = [];
  for (let x = 0; x < w; x++) border.push(x, x + (h - 1) * w);
  for (let y = 0; y < h; y++) border.push(y * w, y * w + w - 1);
  return border;
}

/** Four-neighbours of pixel `i` (−1 where the image ends). */
const around = (i, w, h) => {
  const x = i % w;
  return [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w >= 0 ? i - w : -1, i + w < w * h ? i + w : -1];
};

/**
 * Whether an image is a transparent cut-out or a creature on flat paper, judged by its border:
 * more than half the border clear means transparent.
 */
export function detectMode(data, w, h) {
  const border = borderOf(w, h);
  let clear = 0;
  for (const i of border) if (data[i * 4 + 3] < CLEAR) clear++;
  return clear * 2 > border.length ? 'transparent' : 'paper';
}

/**
 * Marks the creature and softens its edge, in place. Returns the mode used, the paper colour (paper
 * mode) and the trimmed bounds of what is kept (`null` when nothing is).
 *
 * Paper: the paper colour is the median of the border; paper floods from the border through pixels
 * within `PAPER` of it, stopping at the ink outline. The shape holding `seed` is kept (every
 * non-paper pixel without a seed). A two-pixel edge is un-mixed: a pixel next to the paper gets
 * alpha from how far it lies toward the strongest colour just inside it, and that colour, so no
 * cream fringe shows on a dark ground.
 *
 * Transparent: alpha below `CLEAR` is background; the rest is kept (or the shape holding `seed`).
 * Only the edge changes: a partly transparent pixel takes the colour of the nearest opaque pixel
 * within two, keeping its own alpha, so a generator's white or black halo disappears.
 */
export function keyOut(data, w, h, { mode = 'auto', seed = null } = {}) {
  if (mode === 'auto') mode = detectMode(data, w, h);
  const n = w * h;
  const bg = new Uint8Array(n);
  let paper = null;
  if (mode === 'paper') {
    const border = borderOf(w, h);
    const med = (k) => border.map((i) => data[i * 4 + k]).sort((a, b) => a - b)[border.length >> 1];
    paper = [med(0), med(1), med(2)];
    const dist = (i) => Math.hypot(data[i * 4] - paper[0], data[i * 4 + 1] - paper[1], data[i * 4 + 2] - paper[2]);
    const stack = border.filter((i) => dist(i) < PAPER);
    for (const i of stack) bg[i] = 1;
    while (stack.length) {
      const i = stack.pop();
      for (const j of around(i, w, h)) {
        if (j < 0 || bg[j]) continue;
        if (dist(j) < PAPER) {
          bg[j] = 1;
          stack.push(j);
        }
      }
    }
  } else {
    for (let i = 0; i < n; i++) if (data[i * 4 + 3] < CLEAR) bg[i] = 1;
  }

  // Keep the shape connected to the seed, or everything that is not background.
  const keep = new Uint8Array(n);
  if (seed) {
    const s = seed.y * w + seed.x;
    if (seed.x < 0 || seed.y < 0 || seed.x >= w || seed.y >= h || bg[s]) throw new Error(`seed ${seed.x},${seed.y} is not on the creature`);
    const stack = [s];
    keep[s] = 1;
    while (stack.length) {
      const i = stack.pop();
      for (const j of around(i, w, h)) {
        if (j < 0 || keep[j] || bg[j]) continue;
        keep[j] = 1;
        stack.push(j);
      }
    }
  } else for (let i = 0; i < n; i++) keep[i] = bg[i] ? 0 : 1;

  const src = data.slice();
  let minX = w, minY = h, maxX = -1, maxY = -1;
  if (mode === 'paper') {
    // Distances read the live buffer, as the pilot did: an edge pixel already un-mixed counts with
    // its new colour when a later neighbour looks inward. Changing this would change the glider's bytes.
    const dist = (i) => Math.hypot(data[i * 4] - paper[0], data[i * 4 + 1] - paper[1], data[i * 4 + 2] - paper[2]);
    // Ring 1 touches the paper (or the image's edge), ring 2 touches ring 1.
    const ring = new Uint8Array(n);
    const near = (i, test) => around(i, w, h).some((j) => j < 0 || test(j));
    for (let i = 0; i < n; i++) if (keep[i] && near(i, (j) => !keep[j])) ring[i] = 1;
    for (let i = 0; i < n; i++) if (keep[i] && !ring[i] && near(i, (j) => ring[j] === 1)) ring[i] = 2;
    for (let i = 0; i < n; i++) {
      if (!keep[i]) {
        data[i * 4 + 3] = 0;
        continue;
      }
      const x = i % w;
      const y = (i / w) | 0;
      if (ring[i]) {
        // Un-mix: the pixel is paper blended with the strongest colour just inside it (usually ink).
        let f = -1;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const j = i + dy * w + dx;
          if (x + dx < 0 || x + dx >= w || j < 0 || j >= n || !keep[j] || ring[j] === 1) continue;
          if (f < 0 || dist(j) > dist(f)) f = j;
        }
        if (f >= 0 && dist(f) > RAMP) {
          const fv = [0, 1, 2].map((k) => src[f * 4 + k] - paper[k]);
          const cv = [0, 1, 2].map((k) => data[i * 4 + k] - paper[k]);
          const a = Math.min(1, Math.max(0, (fv[0] * cv[0] + fv[1] * cv[1] + fv[2] * cv[2]) / (fv[0] ** 2 + fv[1] ** 2 + fv[2] ** 2)));
          if (a < 1) {
            for (let k = 0; k < 3; k++) data[i * 4 + k] = src[f * 4 + k];
            data[i * 4 + 3] = Math.round(a * 255);
          }
        }
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  } else {
    for (let i = 0; i < n; i++) {
      if (!keep[i]) {
        data[i * 4 + 3] = 0;
        continue;
      }
      const x = i % w;
      const y = (i / w) | 0;
      if (data[i * 4 + 3] < 255) {
        // De-fringe: take the colour of the nearest opaque pixel within two, keep the alpha.
        let f = -1, best = Infinity;
        for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
          const j = i + dy * w + dx;
          if (x + dx < 0 || x + dx >= w || j < 0 || j >= n || !keep[j] || src[j * 4 + 3] < 255) continue;
          const d = dx * dx + dy * dy;
          if (d < best) {
            best = d;
            f = j;
          }
        }
        if (f >= 0) for (let k = 0; k < 3; k++) data[i * 4 + k] = src[f * 4 + k];
      }
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const bounds = maxX < 0 ? null : { minX, minY, maxX, maxY };
  return { mode, paper, bounds };
}

/** Copies `box` (x, y, w, h in image pixels) out of an image into a new one with `pad` clear pixels round it. */
export function cut(data, w, h, box, pad) {
  const tw = box.w + pad * 2;
  const th = box.h + pad * 2;
  const out = new Uint8ClampedArray(tw * th * 4);
  for (let y = 0; y < box.h; y++) {
    const sy = box.y + y;
    if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < box.w; x++) {
      const sx = box.x + x;
      if (sx < 0 || sx >= w) continue;
      const s = (sy * w + sx) * 4;
      const d = ((y + pad) * tw + x + pad) * 4;
      out[d] = data[s];
      out[d + 1] = data[s + 1];
      out[d + 2] = data[s + 2];
      out[d + 3] = data[s + 3];
    }
  }
  return { data: out, w: tw, h: th };
}

/** The smallest box holding every bounds given. */
export function union(list) {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const o of list) {
    b.minX = Math.min(b.minX, o.minX);
    b.minY = Math.min(b.minY, o.minY);
    b.maxX = Math.max(b.maxX, o.maxX);
    b.maxY = Math.max(b.maxY, o.maxY);
  }
  return b;
}

/** A variant's edge offsets from the base's bounds (positive moves right or down), and whether all are within `tolerance`. */
export function alignment(base, variant, tolerance = TOLERANCE) {
  const offsets = { left: variant.minX - base.minX, top: variant.minY - base.minY, right: variant.maxX - base.maxX, bottom: variant.maxY - base.maxY };
  const ok = Object.values(offsets).every((v) => Math.abs(v) <= tolerance);
  return { offsets, ok };
}

/** Assets a species set swaps under one mesh; they share a box. Other assets (portrait, alt) are cut alone. */
export const ALIGNED = ['base', 'blink', 'happy', 'surprised', 'sleepy', 'sad'];

const CHOSEN = /^(yes|y|x|✓|✔|chosen|true)$/i;

/**
 * The chosen files for a species from the generated-art manifest (`docs/rework/concepts/generated/README.md`):
 * table rows whose File column is `<species>-<asset>-<n>.png` and whose Chosen column says yes.
 * Returns `[{ file, asset }]` sorted by asset; a second chosen file for one asset is an error.
 */
export function parseManifest(markdown, species) {
  const rows = markdown.split('\n').filter((l) => /^\s*\|/.test(l)).map((l) => l.split('|').slice(1, -1).map((c) => c.trim()));
  const head = rows.find((r) => r.some((c) => /^file$/i.test(c)));
  if (!head) throw new Error('manifest has no table with a File column');
  const fileCol = head.findIndex((c) => /^file$/i.test(c));
  const chosenCol = head.findIndex((c) => /^chosen$/i.test(c));
  if (chosenCol < 0) throw new Error('manifest table has no Chosen column');
  const name = new RegExp(`^\`?(${species}-([a-z]+)-(\\d+)\\.png)\`?$`);
  const chosen = new Map();
  for (const r of rows) {
    if (r === head || r.every((c) => /^:?-+:?$/.test(c))) continue;
    const m = name.exec(r[fileCol] ?? '');
    if (!m || !CHOSEN.test(r[chosenCol] ?? '')) continue;
    if (chosen.has(m[2])) throw new Error(`two chosen files for ${species} ${m[2]}: ${chosen.get(m[2])} and ${m[1]}`);
    chosen.set(m[2], m[1]);
  }
  return [...chosen].map(([asset, file]) => ({ file, asset })).sort((a, b) => a.asset.localeCompare(b.asset));
}
