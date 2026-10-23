// Re-encodes prepared sprites as lossy WebP for the production build (RW14 slice 2,
// docs/rework/POLISH.md#slice-2-residents-in-six-locations-and-her-own-friend-at-home).
//
//   node scripts/creature-art/to-webp.mjs [--quality 82] [--effort 6] <png>…
//
// Each `<name>.png` becomes `<name>.webp` beside it, alpha kept, same pixel size, so a rig's
// `*_ART` table (sprite pixels) needs no change. `sharp` arrives with `@vite-pwa/assets-generator`,
// so the command runs after `npm ci`. Prints each file's size and the total.
import { statSync } from 'node:fs';
import sharp from 'sharp';

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return fallback;
  const v = Number(args[i + 1]);
  if (!Number.isFinite(v)) throw new Error(`--${name} needs a number`);
  args.splice(i, 2);
  return v;
};
const quality = opt('quality', 82);
const effort = opt('effort', 6);
if (!args.length) throw new Error('give the PNGs to convert');
let total = 0;
for (const file of args) {
  if (!file.endsWith('.png')) throw new Error(`${file}: expected a .png`);
  const out = file.slice(0, -4) + '.webp';
  await sharp(file).webp({ quality, effort, alphaQuality: 90 }).toFile(out);
  const bytes = statSync(out).size;
  total += bytes;
  console.log(`${out}\t${(bytes / 1024).toFixed(0)} KB`);
}
console.log(`total\t${(total / 1024).toFixed(0)} KB over ${args.length} files`);
