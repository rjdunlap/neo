// Cuts a generated creature image into a transparent, trimmed, padded sprite for the mesh rigs
// (docs/rework/ART-BIBLE.md, process step 5; src/art/creatures/illustrated/README.md documents the
// arguments). The pixel rules are in `sprite-core.mjs`; this file reads the arguments and uses a
// headless Chromium canvas (the repository's Playwright) only to decode and encode PNGs.
//
//   node scripts/creature-art/prepare-sprite.mjs --in <png> --out <png> [options]
//   node scripts/creature-art/prepare-sprite.mjs --set <species> [options]
//
// Options
//   --box x,y,w,h      the part of the image to cut (default: the whole image); the sprite is then
//                      trimmed to the creature inside it
//   --seed x,y         a pixel on the creature, in the image's pixels; only the shape holding it is
//                      kept (default: everything that is not background)
//   --bg auto|paper|transparent
//                      what the background is (default auto: a mostly clear border means transparent)
//   --pad <px>         clear pixels round the trimmed creature, in the sprite's pixels (default 8)
//   --shrink <n>       write the sprite at 1/n size (a whole number; default 1): the creature is keyed
//                      out at full size, then each n × n block is averaged in premultiplied alpha
//   --scale <units>    creature units per sprite pixel, reported with the sprite's size in units
//   --tolerance <px>   how far a set's variant may differ from its base before refusing (default 4)
//   --check            also write light, dark and checkerboard previews at 2× into test-results/
//   --previews <path>  the previews' path prefix (default test-results/<out name>; a set adds -<asset>)
//   --generated <dir>  where `--set` reads originals and README.md (default docs/rework/concepts/generated)
//   --out-dir <dir>    where `--set` writes sprites (default src/art/creatures/illustrated)
//
// `--set` prepares every `<species>-<asset>-<n>.png` the manifest marks chosen into
// `<out-dir>/<species>-<asset>.png`. The expression variants (base, blink, happy, surprised, sleepy,
// sad) share one box, the union of their trimmed bounds, so they stay aligned under the mesh; a
// variant whose bounds differ from the base's by more than the tolerance stops the run, with the
// offsets printed, and nothing is written. Portraits and alt poses are cut on their own.
import { chromium } from 'playwright';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ALIGNED, alignment, cut, keyOut, parseManifest, shrink, TOLERANCE, union } from './sprite-core.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

export function parseArgs(argv) {
  const o = { bg: 'auto', pad: 8, shrink: 1, tolerance: TOLERANCE, check: false, generated: 'docs/rework/concepts/generated', outDir: 'src/art/creatures/illustrated' };
  const num = (s, name) => {
    const v = Number(s);
    if (!Number.isFinite(v)) throw new Error(`--${name} needs a number, got ${s}`);
    return v;
  };
  const list = (s, name, count) => {
    const v = String(s).split(',').map((p) => num(p.trim(), name));
    if (v.length !== count) throw new Error(`--${name} needs ${count} numbers, got ${s}`);
    return v;
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`${a} needs a value`);
      return argv[++i];
    };
    if (a === '--check') o.check = true;
    else if (a === '--in') o.in = next();
    else if (a === '--out') o.out = next();
    else if (a === '--set') o.set = next();
    else if (a === '--box') {
      const [x, y, w, h] = list(next(), 'box', 4);
      o.box = { x, y, w, h };
    } else if (a === '--seed') {
      const [x, y] = list(next(), 'seed', 2);
      o.seed = { x, y };
    } else if (a === '--bg') {
      o.bg = next();
      if (!['auto', 'paper', 'transparent'].includes(o.bg)) throw new Error(`--bg is auto, paper or transparent, not ${o.bg}`);
    } else if (a === '--pad') o.pad = num(next(), 'pad');
    else if (a === '--shrink') {
      o.shrink = num(next(), 'shrink');
      if (!Number.isInteger(o.shrink) || o.shrink < 1) throw new Error(`--shrink wants a whole number of 1 or more, got ${o.shrink}`);
    }    else if (a === '--scale') o.scale = num(next(), 'scale');
    else if (a === '--tolerance') o.tolerance = num(next(), 'tolerance');
    else if (a === '--previews') o.previews = next();
    else if (a === '--generated') o.generated = next();
    else if (a === '--out-dir') o.outDir = next();
    else throw new Error(`unknown argument ${a}`);
  }
  if (o.set ? o.in || o.out : !o.in || !o.out) throw new Error('give --in <png> and --out <png>, or --set <species>');
  if (!/^[a-z]+$/.test(o.set ?? 'a')) throw new Error(`--set wants a species name such as glider, not ${o.set}`);
  return o;
}

/** Decodes a PNG's `box` (or all of it) in the page. Returns 8-bit RGBA pixels and the box actually read. */
async function decode(page, file, box) {
  const url = 'data:image/png;base64,' + readFileSync(file).toString('base64');
  const r = await page.evaluate(async ({ url, box }) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const b = box ? { ...box } : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };
    // Clamp the box to the image.
    const x1 = Math.min(img.naturalWidth, b.x + b.w);
    const y1 = Math.min(img.naturalHeight, b.y + b.h);
    b.x = Math.max(0, b.x);
    b.y = Math.max(0, b.y);
    b.w = x1 - b.x;
    b.h = y1 - b.y;
    if (b.w <= 0 || b.h <= 0) throw new Error(`box lies outside the ${img.naturalWidth} × ${img.naturalHeight} image`);
    const c = document.createElement('canvas');
    c.width = b.w;
    c.height = b.h;
    const g = c.getContext('2d', { willReadFrequently: true });
    g.drawImage(img, b.x, b.y, b.w, b.h, 0, 0, b.w, b.h);
    const d = g.getImageData(0, 0, b.w, b.h).data;
    let s = '';
    for (let i = 0; i < d.length; i += 0x8000) s += String.fromCharCode.apply(null, d.subarray(i, i + 0x8000));
    return { pixels: btoa(s), box: b, image: [img.naturalWidth, img.naturalHeight] };
  }, { url, box: box ?? null });
  return { data: new Uint8ClampedArray(Buffer.from(r.pixels, 'base64')), w: r.box.w, h: r.box.h, box: r.box, image: r.image };
}

/** Encodes RGBA pixels as a PNG in the page; with `check`, also the three previews at 2×. */
async function encode(page, { data, w, h }, check) {
  const r = await page.evaluate(({ pixels, w, h, check }) => {
    const bin = atob(pixels);
    const px = new ImageData(w, h);
    for (let i = 0; i < bin.length; i++) px.data[i] = bin.charCodeAt(i);
    const out = document.createElement('canvas');
    out.width = w;
    out.height = h;
    out.getContext('2d').putImageData(px, 0, 0);
    const previews = [];
    if (check) {
      for (const fill of ['#fff8ec', '#2b2340', 'checker']) {
        const p = document.createElement('canvas');
        p.width = w * 2;
        p.height = h * 2;
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
    return { png: out.toDataURL('image/png'), previews };
  }, { pixels: Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('base64'), w, h, check });
  const bytes = (url) => Buffer.from(url.split(',')[1], 'base64');
  return { png: bytes(r.png), previews: r.previews.map(bytes) };
}

/** Writes one sprite and its previews; returns the summary line. */
async function emit(page, o, job) {
  const { pixels, box, bounds, outPath, previews, mode, paper, source } = job;
  // The box grows to a multiple of the shrink factor (to the right and down, into clear or paper
  // pixels) and the padding is counted in output pixels, so the sprite shrinks evenly.
  const n = o.shrink;
  const bw = Math.ceil((box.maxX - box.minX + 1) / n) * n;
  const bh = Math.ceil((box.maxY - box.minY + 1) / n) * n;
  const sprite = shrink(cut(pixels.data, pixels.w, pixels.h, { x: box.minX, y: box.minY, w: bw, h: bh }, o.pad * n), n);
  const { png, previews: pv } = await encode(page, sprite, o.check);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  if (o.check) {
    mkdirSync(dirname(previews), { recursive: true });
    ['light', 'dark', 'checker'].forEach((n, i) => writeFileSync(`${previews}-${n}.png`, pv[i]));
  }
  const line = {
    in: relative(root, source),
    out: relative(root, outPath),
    size: [sprite.w, sprite.h],
    // The source pixel under the sprite's top-left corner, padding included.
    origin: [pixels.box.x + box.minX - o.pad * n, pixels.box.y + box.minY - o.pad * n],
    bounds: [pixels.box.x + bounds.minX, pixels.box.y + bounds.minY, bounds.maxX - bounds.minX + 1, bounds.maxY - bounds.minY + 1],
    background: mode === 'paper' ? { paper } : 'transparent',
  };
  if (n > 1) line.shrink = n;
  if (o.scale) line.units = [Math.round(sprite.w * o.scale), Math.round(sprite.h * o.scale)];
  return line;
}

/** Reads an image's box, keys it out and measures the creature. */
async function analyse(page, o, file) {
  const pixels = await decode(page, file, o.box);
  const seed = o.seed ? { x: o.seed.x - pixels.box.x, y: o.seed.y - pixels.box.y } : null;
  const { mode, paper, bounds } = keyOut(pixels.data, pixels.w, pixels.h, { mode: o.bg, seed });
  if (!bounds) throw new Error(`${relative(root, file)}: nothing but background in the box`);
  return { pixels, mode, paper, bounds, source: file };
}

export async function run(argv) {
  const o = parseArgs(argv);
  const at = (p) => resolve(root, p);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const lines = [];
  try {
    if (!o.set) {
      const a = await analyse(page, o, at(o.in));
      const outPath = at(o.out);
      lines.push(await emit(page, o, { ...a, box: a.bounds, outPath, previews: o.previews ? at(o.previews) : at(join('test-results', basename(o.out, '.png'))) }));
    } else {
      const dir = at(o.generated);
      const manifest = join(dir, 'README.md');
      if (!existsSync(manifest)) throw new Error(`no manifest at ${relative(root, manifest)}`);
      const chosen = parseManifest(readFileSync(manifest, 'utf8'), o.set);
      if (!chosen.length) throw new Error(`the manifest marks no ${o.set} file chosen`);
      for (const c of chosen) if (!existsSync(join(dir, c.file))) throw new Error(`${c.file} is marked chosen but is not in ${relative(root, dir)}`);
      const jobs = [];
      for (const c of chosen) jobs.push({ ...c, ...(await analyse(page, o, join(dir, c.file))) });
      const aligned = jobs.filter((j) => ALIGNED.includes(j.asset));
      const base = aligned.find((j) => j.asset === 'base');
      if (aligned.length && !base) throw new Error(`${o.set} has expression variants chosen but no base`);
      const drift = [];
      for (const j of aligned) {
        const { offsets, ok } = alignment(base.bounds, j.bounds, o.tolerance);
        if (!ok) drift.push(`  ${j.file}: left ${offsets.left}, top ${offsets.top}, right ${offsets.right}, bottom ${offsets.bottom}`);
      }
      if (drift.length) throw new Error(`variants do not line up with ${base.file} (more than ${o.tolerance} px; nothing written):\n${drift.join('\n')}`);
      const shared = aligned.length ? union(aligned.map((j) => j.bounds)) : null;
      for (const j of jobs) {
        const outPath = at(join(o.outDir, `${o.set}-${j.asset}.png`));
        const previews = `${o.previews ? at(o.previews) : at(join('test-results', o.set))}-${j.asset}`;
        const line = await emit(page, o, { ...j, box: ALIGNED.includes(j.asset) ? shared : j.bounds, outPath, previews });
        line.asset = j.asset;
        if (ALIGNED.includes(j.asset)) line.sharedBox = true;
        lines.push(line);
      }
    }
  } finally {
    await browser.close();
  }
  for (const l of lines) console.log(JSON.stringify(l));
  return lines;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv.slice(2)).catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
}
