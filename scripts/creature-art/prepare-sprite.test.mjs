// Checks for the sprite preparation tool on small synthetic images drawn here (no binary fixtures):
// keying a creature off flat paper, passing a transparent cut-out through with only its edge
// de-fringed, and `--set` refusing a variant that drifted from its base. The pure rules run on
// pixel arrays; the end-to-end run writes real PNGs and needs the repository's Playwright
// Chromium, so it is skipped where none is installed (CI runs `npm test` without one).
import { chromium } from 'playwright';
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import { alignment, CLEAR, cut, detectMode, keyOut, parseManifest, shrink, union } from './sprite-core.mjs';
import { parseArgs, run } from './prepare-sprite.mjs';

const PAPER = [252, 243, 225];
const INK = [40, 20, 50];
const FUR = [120, 200, 230];

/** A w × h RGBA image filled with one colour (alpha 255) or clear. */
function image(w, h, fill) {
  const data = new Uint8ClampedArray(w * h * 4);
  if (fill) for (let i = 0; i < w * h; i++) data.set([...fill, 255], i * 4);
  return { w, h, data };
}
const put = (img, x, y, rgb, a = 255) => img.data.set([...rgb, a], (y * img.w + x) * 4);
const px = (img, x, y) => [...img.data.subarray((y * img.w + x) * 4, (y * img.w + x) * 4 + 4)];
/** A creature: an ink-outlined box of fur from (x0, y0) to (x1, y1) inclusive. */
function creature(img, x0, y0, x1, y1) {
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) put(img, x, y, x === x0 || x === x1 || y === y0 || y === y1 ? INK : FUR);
}
const mix = (a, b, t) => a.map((v, k) => Math.round(v * (1 - t) + b[k] * t));

describe('keying a creature off flat paper', () => {
  function sheet() {
    const img = image(40, 30, PAPER);
    creature(img, 10, 8, 29, 21);
    // A half-mixed edge all round the outline, as an anti-aliased ink line leaves on paper.
    for (let x = 9; x <= 30; x++) for (const y of [7, 22]) put(img, x, y, mix(PAPER, INK, 0.5));
    for (let y = 7; y <= 22; y++) for (const x of [9, 30]) put(img, x, y, mix(PAPER, INK, 0.5));
    put(img, 3, 3, INK); // a neighbour's speck, not connected to the creature
    return img;
  }

  it('detects paper, floods it to clear and keeps the creature’s own colours', () => {
    const img = sheet();
    expect(detectMode(img.data, img.w, img.h)).toBe('paper');
    const r = keyOut(img.data, img.w, img.h, { seed: { x: 20, y: 15 } });
    expect(r.mode).toBe('paper');
    expect(r.paper).toEqual(PAPER);
    expect(px(img, 0, 0)[3]).toBe(0);
    expect(px(img, 20, 15)).toEqual([...FUR, 255]);
    expect(px(img, 10, 8)).toEqual([...INK, 255]);
    // With a seed only its shape survives; the speck is paper now.
    expect(px(img, 3, 3)[3]).toBe(0);
    expect(r.bounds).toEqual({ minX: 9, minY: 7, maxX: 30, maxY: 22 });
  });

  it('un-mixes the edge: a paper-blended pixel becomes ink at half alpha, so no cream fringe', () => {
    const img = sheet();
    keyOut(img.data, img.w, img.h, { seed: { x: 20, y: 15 } });
    const edge = px(img, 20, 7);
    expect(edge.slice(0, 3)).toEqual(INK);
    expect(edge[3]).toBeGreaterThan(100);
    expect(edge[3]).toBeLessThan(160);
  });

  it('keeps every shape without a seed and refuses a seed on the paper', () => {
    const img = sheet();
    const r = keyOut(img.data, img.w, img.h, {});
    expect(px(img, 3, 3)).toEqual([...INK, 255]);
    expect(r.bounds).toEqual({ minX: 3, minY: 3, maxX: 30, maxY: 22 });
    expect(() => keyOut(sheet().data, 40, 30, { seed: { x: 0, y: 0 } })).toThrow(/seed/);
  });

  it('clears an enclosed hole only when told where it is, so a painted white dot stays', () => {
    /** A ring: an ink-outlined band of fur round an enclosed patch of paper. */
    const ring = () => {
      const img = sheet();
      for (let y = 12; y <= 17; y++) for (let x = 16; x <= 23; x++) put(img, x, y, x === 16 || x === 23 || y === 12 || y === 17 ? INK : PAPER);
      return img;
    };
    const kept = ring();
    keyOut(kept.data, kept.w, kept.h, { seed: { x: 12, y: 10 } });
    expect(px(kept, 19, 14)).toEqual([...PAPER, 255]);
    const cut = ring();
    const r = keyOut(cut.data, cut.w, cut.h, { seed: { x: 12, y: 10 }, holes: [{ x: 19, y: 14 }] });
    expect(px(cut, 19, 14)[3]).toBe(0);
    expect(px(cut, 17, 13)[3]).toBe(0);
    // The hole's own ink rim stays, and the outer bounds do not change.
    expect(px(cut, 16, 14)[3]).toBeGreaterThan(0);
    expect(r.bounds).toEqual({ minX: 9, minY: 7, maxX: 30, maxY: 22 });
    expect(() => keyOut(ring().data, 40, 30, { holes: [{ x: 12, y: 10 }] })).toThrow(/hole/);
  });
});

describe('passing a transparent cut-out through', () => {
  function cutout() {
    const img = image(40, 30, null);
    creature(img, 10, 8, 29, 21);
    put(img, 9, 15, [255, 255, 255], 100); // a white halo pixel a generator left on the edge
    put(img, 35, 3, FUR, CLEAR - 1); // noise too faint to be the creature
    return img;
  }

  it('detects the clear border and leaves the creature’s pixels exactly as they were', () => {
    const img = cutout();
    const before = img.data.slice();
    expect(detectMode(img.data, img.w, img.h)).toBe('transparent');
    const r = keyOut(img.data, img.w, img.h, {});
    expect(r.mode).toBe('transparent');
    expect(r.paper).toBeNull();
    for (let y = 8; y <= 21; y++) for (let x = 10; x <= 29; x++) expect(px(img, x, y)).toEqual([...before.subarray((y * 40 + x) * 4, (y * 40 + x) * 4 + 4)]);
    expect(r.bounds).toEqual({ minX: 9, minY: 8, maxX: 29, maxY: 21 });
  });

  it('de-fringes only the edge (the halo takes the ink’s colour, keeps its alpha) and clears faint noise', () => {
    const img = cutout();
    keyOut(img.data, img.w, img.h, {});
    expect(px(img, 9, 15)).toEqual([...INK, 100]);
    expect(px(img, 35, 3)[3]).toBe(0);
  });

  it('can be forced on a flat image and paper forced on a clear one', () => {
    const flat = image(12, 12, PAPER);
    creature(flat, 3, 3, 8, 8);
    expect(keyOut(flat.data, 12, 12, { mode: 'transparent' }).bounds).toEqual({ minX: 0, minY: 0, maxX: 11, maxY: 11 });
    const clear = cutout();
    expect(keyOut(clear.data, clear.w, clear.h, { mode: 'paper' }).mode).toBe('paper');
  });
});

describe('cutting, aligning and the manifest', () => {
  it('cuts a padded box and leaves the padding clear, even past the image’s edge', () => {
    const img = image(10, 10, FUR);
    const s = cut(img.data, 10, 10, { x: 8, y: 8, w: 4, h: 4 }, 2);
    expect([s.w, s.h]).toEqual([8, 8]);
    expect(px(s, 2, 2)).toEqual([...FUR, 255]);
    expect(px(s, 0, 0)[3]).toBe(0);
    expect(px(s, 5, 5)[3]).toBe(0); // beyond the 10 × 10 image
  });

  it('shrinks by a whole factor, averaging in premultiplied alpha so a soft edge keeps the ink’s colour', () => {
    // A 4 × 2 image: two opaque ink pixels, one half-alpha ink pixel, one clear pixel with a stray colour.
    const data = new Uint8ClampedArray([
      10, 20, 30, 255, 10, 20, 30, 255, 10, 20, 30, 128, 200, 200, 200, 0,
      10, 20, 30, 255, 10, 20, 30, 255, 10, 20, 30, 128, 200, 200, 200, 0,
    ]);
    const s = shrink({ data, w: 4, h: 2 }, 2);
    expect([s.w, s.h]).toEqual([2, 1]);
    expect([...s.data.subarray(0, 4)]).toEqual([10, 20, 30, 255]);
    // The right block holds two half-alpha ink pixels and two clear ones: the ink's colour at a quarter alpha.
    expect([...s.data.subarray(4, 8)]).toEqual([10, 20, 30, 64]);
    expect(shrink({ data, w: 4, h: 2 }, 1).data).toEqual(data);
    expect(() => shrink({ data, w: 4, h: 2 }, 3)).toThrow(/evenly/);
    expect(() => shrink({ data, w: 4, h: 2 }, 0)).toThrow(/whole/);
  });

  it('accepts a variant within the tolerance and reports the offsets of one that drifted', () => {
    const base = { minX: 100, minY: 50, maxX: 400, maxY: 300 };
    expect(alignment(base, { minX: 102, minY: 48, maxX: 403, maxY: 300 }).ok).toBe(true);
    const bad = alignment(base, { minX: 106, minY: 50, maxX: 406, maxY: 299 });
    expect(bad.ok).toBe(false);
    expect(bad.offsets).toEqual({ left: 6, top: 0, right: 6, bottom: -1 });
    expect(alignment(base, { minX: 106, minY: 50, maxX: 406, maxY: 299 }, 6).ok).toBe(true);
    expect(union([base, { minX: 98, minY: 52, maxX: 401, maxY: 304 }])).toEqual({ minX: 98, minY: 50, maxX: 401, maxY: 304 });
  });

  const manifest = `# Generated creature art

| File | Request | Date | Tool and model | Prompt | Chosen |
| --- | --- | --- | --- | --- | --- |
| glider-base-1.png | R01 | 2026-10-18 | tool | base | |
| glider-base-2.png | R01 | 2026-10-18 | tool | base | yes |
| \`glider-blink-1.png\` | R01 | 2026-10-18 | tool | blink | ✓ |
| glider-happy-1.png | R01 | 2026-10-18 | tool | happy | no |
| sprout-base-1.png | R02 | 2026-10-18 | tool | base | yes |
`;

  it('reads the chosen files of one species from the manifest', () => {
    expect(parseManifest(manifest, 'glider')).toEqual([
      { file: 'glider-base-2.png', asset: 'base' },
      { file: 'glider-blink-1.png', asset: 'blink' },
    ]);
    expect(parseManifest(manifest, 'river')).toEqual([]);
    expect(() => parseManifest(manifest + '| glider-base-3.png | R01 | d | t | p | yes |\n', 'glider')).toThrow(/two chosen/);
    expect(() => parseManifest('no table', 'glider')).toThrow(/File column/);
  });

  it('parses the arguments the README documents', () => {
    const o = parseArgs(['--in', 'a.png', '--out', 'b.png', '--box', '1,2,30,40', '--seed', '5,6', '--hole', '7,8', '--hole', '9,10', '--pad', '4', '--scale', '0.5', '--check']);
    expect(o).toMatchObject({ in: 'a.png', out: 'b.png', box: { x: 1, y: 2, w: 30, h: 40 }, seed: { x: 5, y: 6 }, holes: [{ x: 7, y: 8 }, { x: 9, y: 10 }], pad: 4, scale: 0.5, check: true, bg: 'auto' });
    expect(parseArgs(['--set', 'glider']).set).toBe('glider');
    expect(parseArgs(['--set', 'glider', '--shrink', '2']).shrink).toBe(2);
    expect(() => parseArgs(['--set', 'glider', '--shrink', '1.5'])).toThrow(/whole/);
    expect(() => parseArgs(['--in', 'a.png'])).toThrow(/--out/);
    expect(() => parseArgs(['--set', 'glider', '--in', 'a.png'])).toThrow();
    expect(() => parseArgs(['--in', 'a.png', '--out', 'b.png', '--box', '1,2'])).toThrow(/4 numbers/);
    expect(() => parseArgs(['--in', 'a.png', '--out', 'b.png', '--bg', 'blue'])).toThrow(/--bg/);
  });
});

// ---- End to end, through real PNGs, where a browser is installed. ----

const browser = await chromium.launch().then(async (b) => (await b.close(), true)).catch(() => false);

/** Encodes RGBA as an 8-bit, non-interlaced PNG (filter 0, deflate), enough for the tool to read. */
function encodePng({ w, h, data }) {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  const crc = (buf) => {
    let c = -1;
    for (const b of buf) c = table[(c ^ b) & 255] ^ (c >>> 8);
    return (c ^ -1) >>> 0;
  };
  const chunk = (type, body) => {
    const t = Buffer.from(type, 'latin1');
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const c = Buffer.alloc(4);
    c.writeUInt32BE(crc(Buffer.concat([t, body])));
    return Buffer.concat([len, t, body, c]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) raw.set(data.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
/** Reads a PNG's size from its header. */
const sizeOf = (file) => {
  const b = readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
};

describe.skipIf(!browser)('preparing a set from PNGs on disk', () => {
  const dir = mkdtempSync(join(tmpdir(), 'prepare-sprite-'));
  const gen = join(dir, 'generated');
  const out = join(dir, 'illustrated');
  const previews = join(dir, 'previews');
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  /** A 64 × 48 "generated" image with the creature at (x0, y0), on paper or clear. */
  function picture(x0, y0, clear) {
    const img = image(64, 48, clear ? null : PAPER);
    creature(img, x0, y0, x0 + 23, y0 + 15);
    return encodePng(img);
  }
  const rows = (files) => `| File | Request | Date | Tool and model | Prompt | Chosen |\n| --- | --- | --- | --- | --- | --- |\n` + files.map(([f, c]) => `| ${f} | R01 | d | t | p | ${c} |`).join('\n') + '\n';

  it('refuses a drifted variant with its offsets and writes nothing', async () => {
    mkdirSync(gen, { recursive: true });
    writeFileSync(join(gen, 'README.md'), rows([['testling-base-1.png', 'yes'], ['testling-blink-1.png', 'yes'], ['testling-sad-1.png', 'yes']]));
    writeFileSync(join(gen, 'testling-base-1.png'), picture(20, 16, false));
    writeFileSync(join(gen, 'testling-blink-1.png'), picture(22, 16, false)); // 2 px over: within tolerance
    writeFileSync(join(gen, 'testling-sad-1.png'), picture(26, 17, true)); // 6 px over, and transparent: drifted
    await expect(run(['--set', 'testling', '--generated', gen, '--out-dir', out])).rejects.toThrow(/testling-sad-1\.png: left 6, top 1, right 6, bottom 1/);
    expect(existsSync(out)).toBe(false);
  });

  it('prepares the chosen variants into one shared box, a portrait alone, and previews on request', async () => {
    writeFileSync(join(gen, 'README.md'), rows([['testling-base-1.png', 'yes'], ['testling-blink-1.png', 'yes'], ['testling-sad-1.png', ''], ['testling-portrait-1.png', 'x']]));
    writeFileSync(join(gen, 'testling-portrait-1.png'), picture(4, 4, true));
    const lines = await run(['--set', 'testling', '--generated', gen, '--out-dir', out, '--pad', '2', '--check', '--previews', previews]);
    expect(lines.map((l) => l.asset)).toEqual(['base', 'blink', 'portrait']);
    // Base spans x 20–43, blink 22–45: the shared box is 20–45 (26 px) plus 2 px of padding each side.
    expect(sizeOf(join(out, 'testling-base.png'))).toEqual([30, 20]);
    expect(sizeOf(join(out, 'testling-blink.png'))).toEqual([30, 20]);
    expect(lines[0].origin).toEqual(lines[1].origin);
    expect(lines[0].background).toEqual({ paper: PAPER });
    expect(sizeOf(join(out, 'testling-portrait.png'))).toEqual([28, 20]);
    expect(lines[2].background).toBe('transparent');
    expect(readdirSync(dir).filter((f) => f.startsWith('previews-'))).toHaveLength(9);
  });

  it('cuts one file with a box and a seed and reports its size in units', async () => {
    const img = image(64, 48, PAPER);
    creature(img, 8, 8, 31, 23);
    creature(img, 40, 30, 55, 45); // a second creature the box must not include
    writeFileSync(join(dir, 'sheet.png'), encodePng(img));
    const [line] = await run(['--in', join(dir, 'sheet.png'), '--out', join(dir, 'one.png'), '--box', '0,0,36,28', '--seed', '20,16', '--pad', '1', '--scale', '2']);
    expect(line.size).toEqual([26, 18]);
    expect(line.origin).toEqual([7, 7]);
    expect(line.units).toEqual([52, 36]);
    expect(sizeOf(join(dir, 'one.png'))).toEqual([26, 18]);
  });
});
