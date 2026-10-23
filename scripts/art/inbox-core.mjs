// The rules behind `scripts/art/import-inbox.mjs`: which generated files the inbox accepts, where each
// one goes, and how the manifest changes. Pure functions, so vitest checks them without images
// (`inbox-core.test.mjs`). The pipeline is described in docs/rework/art-requests/IMPORT.md.

/** Short backdrop names used by the art queue (R23, R26) → the land ID the game knows. */
export const BACKDROPS = {
  meadow: 'rainbow-meadow',
  cove: 'counting-cove',
  peaks: 'puzzle-peaks',
  beach: 'bubble-beach',
  music: 'music-mountain',
  canyon: 'treehouse',
  village: 'cozy-village',
  grove: 'story-grove',
  tinker: 'tinker-lab',
  barnyard: 'barnyard',
  lake: 'lantern-lake',
};

/** Species the companion rigs use, and the folder `prepare-sprite.mjs --set` writes each into. */
export const SPECIES = {
  sprout: 'src/art/creatures/illustrated',
  river: 'src/art/creatures/illustrated',
  glider: 'src/art/creatures/illustrated',
  tote: 'src/art/creatures/cast',
  trill: 'src/art/creatures/cast',
  dapple: 'src/art/creatures/cast',
  bramble: 'src/art/creatures/cast',
  mossback: 'src/art/creatures/cast',
  lumen: 'src/art/creatures/cast',
};

/** Friends (R22 and later): code-drawn in the games today; their prepared sprites go here. */
export const FRIENDS = { duck: 'src/art/friends' };

const SPECIES_ASSETS = ['base', 'blink', 'happy', 'surprised', 'sleepy', 'sad', 'portrait', 'alt', 'nohead', 'noarms'];
const FRIEND_ASSETS = ['base', 'portrait'];

/** The smallest image each kind accepts (the art bible's sizes; larger is fine, smaller is refused). */
export const MIN_SIZE = {
  backdrop: { w: 1536, h: 1024 },
  sprite: { long: 1536, short: 1024 },
  square: { w: 1024, h: 1024 },
};

/**
 * Reads a dropped file's name. Accepts `land-meadow.png`, `land-meadow-2.png`, `land-meadow-b.png`
 * and a browser's duplicate `land-meadow (1).png`; the suffix only tells candidates apart and is
 * replaced by the next free candidate number. Returns null for a name the queue does not list.
 */
export function parseName(file) {
  const m = /^([a-z]+(?:-[a-z]+)*?)(?:-(?:\d+|[a-z]))?(?: ?\(\d+\))?\.png$/i.exec(file.trim());
  if (!m) return null;
  const stem = m[1].toLowerCase();
  const [head, ...rest] = stem.split('-');
  const asset = rest.join('-');
  if (head === 'land' && BACKDROPS[asset]) {
    return { stem, kind: 'backdrop', group: asset, asset, landId: BACKDROPS[asset], request: asset === 'meadow' ? 'R23' : 'R26' };
  }
  if (SPECIES[head] && SPECIES_ASSETS.includes(asset)) {
    return { stem, kind: 'creature', group: head, asset, outDir: SPECIES[head], request: null };
  }
  if (FRIENDS[head] && FRIEND_ASSETS.includes(asset)) {
    return { stem, kind: 'friend', group: head, asset, outDir: FRIENDS[head], request: head === 'duck' ? 'R22' : null };
  }
  return null;
}

/** Is the image big enough for its kind? Returns a reason when it is not. */
export function sizeProblem(info, { w, h }) {
  if (info.kind === 'backdrop') {
    if (w < MIN_SIZE.backdrop.w || h < MIN_SIZE.backdrop.h) return `a backdrop must be at least 1536 × 1024 (got ${w} × ${h})`;
    if (w <= h) return `a backdrop must be landscape (got ${w} × ${h})`;
    return null;
  }
  if (info.asset === 'portrait') {
    if (w < MIN_SIZE.square.w || h < MIN_SIZE.square.h) return `a portrait must be at least 1024 × 1024 (got ${w} × ${h})`;
    return null;
  }
  const long = Math.max(w, h), short = Math.min(w, h);
  if (long < MIN_SIZE.sprite.long || short < MIN_SIZE.sprite.short) return `a creature image must be at least 1536 × 1024 (got ${w} × ${h})`;
  return null;
}

/** The next free candidate number for a stem, given the files already in the generated folder. */
export function nextCandidate(existing, stem) {
  let n = 0;
  const re = new RegExp(`^${stem}-(\\d+)\\.png$`);
  for (const f of existing) {
    const m = re.exec(f);
    if (m) n = Math.max(n, Number(m[1]));
  }
  return n + 1;
}

/** One manifest row, in the generated README's column order. */
export function manifestRow({ file, request, date, tool, prompt, chosen }) {
  return `| ${file} | ${request ?? '—'} | ${date} | ${tool} | ${prompt} | ${chosen ? 'yes' : 'no'} |`;
}

/** Inserts rows at the end of the manifest's first table (the one that starts with `| File |`). */
export function insertRows(text, rows) {
  if (!rows.length) return text;
  const lines = text.split('\n');
  const head = lines.findIndex((l) => l.startsWith('| File |'));
  if (head < 0) throw new Error('the manifest has no "| File |" table');
  let end = head + 1;
  while (end < lines.length && lines[end].startsWith('|')) end++;
  lines.splice(end, 0, ...rows);
  return lines.join('\n');
}

/** The chosen flag of every row for a file stem: `yes` for `file`, `no` for its other candidates. */
export function setChosen(text, file) {
  const m = /^(.*)-(\d+)\.png$/.exec(file);
  if (!m) throw new Error(`${file} is not a candidate file name (<stem>-<n>.png)`);
  const stem = m[1];
  let found = false;
  const out = text.split('\n').map((line) => {
    const cells = line.split('|');
    if (cells.length < 8) return line;
    const name = cells[1].trim();
    if (!new RegExp(`^${stem}-\\d+\\.png$`).test(name)) return line;
    if (name === file) found = true;
    cells[6] = ` ${name === file ? 'yes' : 'no'} `;
    return cells.join('|');
  });
  if (!found) throw new Error(`the manifest has no row for ${file}`);
  return out.join('\n');
}

/** Files the manifest marks chosen for a stem. */
export function chosenFor(text, stem) {
  const re = new RegExp(`^\\|\\s*(${stem}-\\d+\\.png)\\s*\\|.*\\|\\s*(yes|x|✓|chosen)\\s*\\|\\s*$`, 'i');
  return text.split('\n').flatMap((l) => {
    const m = re.exec(l);
    return m ? [m[1]] : [];
  });
}

/**
 * The import plan for a batch of dropped files: where each original goes, its manifest row, and
 * whether it is chosen. A stem with one candidate and nothing chosen yet is chosen automatically;
 * a stem with several waits for `--choose`. Unknown names and refused sizes stay in the inbox.
 */
export function plan(drops, { existing, manifest, date, tool, prompts }) {
  const taken = [...existing];
  const moves = [], refused = [];
  for (const d of drops) {
    const info = parseName(d.file);
    if (!info && /\.(jpe?g|webp|gif|heic)$/i.test(d.file)) { refused.push({ file: d.file, reason: 'only PNG is accepted: download the PNG from ChatGPT' }); continue; }
    if (!info) { refused.push({ file: d.file, reason: 'not a name the art queue lists (see IMPORT.md)' }); continue; }
    const problem = d.size ? sizeProblem(info, d.size) : null;
    if (problem) { refused.push({ file: d.file, reason: problem }); continue; }
    const n = nextCandidate(taken, info.stem);
    const to = `${info.stem}-${n}.png`;
    taken.push(to);
    moves.push({ from: d.file, to, info });
  }
  const byStem = new Map();
  for (const m of moves) byStem.set(m.info.stem, [...(byStem.get(m.info.stem) ?? []), m]);
  const rows = [], waiting = [];
  for (const [stem, group] of byStem) {
    const auto = group.length === 1 && chosenFor(manifest, stem).length === 0;
    for (const m of group) {
      m.chosen = auto;
      rows.push(manifestRow({ file: m.to, request: m.info.request, date, tool, prompt: prompts?.[stem] ?? '[ChatGPT batch](../../art-requests/CHATGPT-BATCH.md)', chosen: auto }));
    }
    if (!auto) waiting.push({ stem, files: group.map((m) => m.to) });
  }
  return { moves, refused, rows, waiting };
}
