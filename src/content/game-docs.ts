// The game inventory docs, generated from the registry: each game's page in docs/games/<id>.md (a marked block at its
// top), the README's two inventory tables and their counts, and the GAMES.md index. Everything outside the marks is
// written by hand: a page's "Starts as" and "Grows into" lines and its design notes. `game-docs.test.ts` fails when a
// file is stale; `npm run game-docs` rewrites them (codebase review item 3, docs/CODEBASE-REVIEW-2026-11-07.md).
import type { GameModule } from '../games/types';
import type { Land } from './lands';
import { BANDS, bandRank, type Band } from '../progress/bands';
import { levelsInOrder } from '../progress/difficulty';

export const BEGIN = (what: string) => `<!-- generated: ${what} (npm run game-docs) -->`;
export const END = '<!-- end generated -->';

const BAND_WORD: Record<Band, string> = { lap: 'lap', toddler: 'toddler', preschool: 'preschool', prek: 'pre-K', school: 'school', grownup: 'grown-up' };

/** "lap–school", or runs joined by commas when a band is skipped. */
export function ages(bands: readonly Band[]): string {
  const ranks = [...new Set(bands.map(bandRank))].sort((a, b) => a - b);
  const runs: number[][] = [];
  for (const r of ranks) {
    const last = runs[runs.length - 1];
    if (last && r === last[last.length - 1] + 1) last.push(r);
    else runs.push([r]);
  }
  const word = (r: number) => BAND_WORD[BANDS[r].id];
  return runs.map((run) => (run.length === 1 ? word(run[0]) : `${word(run[0])}–${word(run[run.length - 1])}`)).join(', ');
}

/** Every level ID any band plays, plus entry levels, in ID order. */
export function allLevels(g: GameModule): number[] {
  const ids = new Set<number>(g.entryLevels ?? []);
  for (const b of g.bands) for (const l of levelsInOrder(g.levels(b))) ids.add(l);
  return [...ids].sort((a, b) => a - b);
}

/** "3–7", or the play order when it is not simply min..max. */
function bandLevels(g: GameModule, band: Band): string {
  const r = g.levels(band);
  if (!r.order) return r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`;
  return r.order.join(', ');
}

const cell = (s: string) => s.replace(/\|/g, '\\|').replace(/\s*\n\s*/g, ' ');

/** Grown-up puzzles: the games in Lantern Lake and the ones only the grown-up band plays. */
export const isGrownUpPuzzle = (g: GameModule, landId: string | undefined) => landId === 'lantern-lake' || (g.bands.length === 1 && g.bands[0] === 'grownup');

export function pageBlock(g: GameModule, land: Land | undefined): string {
  const inputs = g.inputs ?? ['touch'];
  const facts = [
    `**ID:** \`${g.id}\``,
    `**Land:** ${land?.name ?? 'none'}`,
    `**Ages:** ${ages(g.bands)}`,
    g.challenge ? `**Challenge:** ${g.challenge}` : null,
    `**Plays by:** ${inputs.join(' and ')}${g.upright ? ', upright on a phone' : ''}`,
    g.touchDemo ? '**Ghost finger:** yes' : null,
  ].filter(Boolean);
  const out = [
    BEGIN(`from src/games/${g.id}; edit the text below the end mark`),
    '',
    facts.join(' · '),
    '',
    `**Skills:** ${g.skills.join(', ')}`,
    '',
    '| Band | Levels, easiest first |',
    '| --- | --- |',
    ...g.bands.map((b) => `| ${BAND_WORD[b]} | ${bandLevels(g, b)} |`),
    '',
    '| Level | Plays like |',
    '| --- | --- |',
    ...allLevels(g).map((l) => `| ${l} | ${cell(g.describeLevel(l))} |`),
    '',
    END,
  ];
  return out.join('\n');
}

export const emptyPage = (g: GameModule) => `# ${g.name}\n\n${END}\n\n**Starts as:** \n\n**Grows into:** \n\n## Design notes\n`;

/** A page with its generated block replaced (the title line is generated too). */
export function renderPage(existing: string, g: GameModule, land: Land | undefined): string {
  const end = existing.indexOf(END);
  if (end < 0) throw new Error(`docs/games/${g.id}.md has no "${END}" mark`);
  return `# ${g.name}\n\n${pageBlock(g, land)}${existing.slice(end + END.length)}`;
}

/** The hand-written "**Starts as:** …" line of a page. */
export const handLine = (page: string, label: 'Starts as' | 'Grows into') => new RegExp(`^\\*\\*${label}:\\*\\* ?(.*)$`, 'm').exec(page)?.[1].trim() ?? '';

const link = (g: GameModule, from: 'readme' | 'games') => `[${g.name}](${from === 'readme' ? 'docs/' : ''}games/${g.id}.md)`;

export interface Entry {
  game: GameModule;
  land: Land | undefined;
  page: string;
}

/** Replace the text between `BEGIN(what)` and the next END in `doc`. */
export function replaceBlock(doc: string, what: string, body: string): string {
  const begin = BEGIN(what);
  const at = doc.indexOf(begin);
  const end = at < 0 ? -1 : doc.indexOf(END, at);
  if (at < 0 || end < 0) throw new Error(`no "${begin}" … "${END}" block`);
  return `${doc.slice(0, at)}${begin}\n\n${body.trim()}\n\n${doc.slice(end)}`;
}

export function readmeBlocks(entries: readonly Entry[], lands: readonly Land[]): Record<string, string> {
  const child = entries.filter((e) => !isGrownUpPuzzle(e.game, e.land?.id));
  const grown = entries.filter((e) => isGrownUpPuzzle(e.game, e.land?.id));
  const landList = lands.filter((l) => entries.some((e) => e.land === l));
  const count = (l: Land) => entries.filter((e) => e.land === l).length;
  const lantern = lands.find((l) => l.id === 'lantern-lake');
  const named = landList.map((l) => (l === lantern ? `**${l.name}** (${count(l)}, grown-up puzzles, shown to a child behind its signpost)` : `**${l.name}** (${count(l)})`));
  const school = entries.filter((e) => e.game.bands.includes('school')).length;
  const grownBand = entries.filter((e) => e.game.bands.includes('grownup'));
  const where = (es: readonly Entry[]) => {
    const by = landList.map((l) => [l, es.filter((e) => e.land === l)] as const).filter(([, es]) => es.length);
    const parts = by.map(([l, es]) => (es.length === 1 ? `${es[0].game.name} in ${l.name}` : `${es.length} in ${l.name}`));
    return parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts.join('');
  };
  const controller = grown.filter((e) => e.game.inputs?.includes('controller')).length;
  const table = (es: readonly Entry[], withAges: boolean) =>
    [
      withAges ? '| Game | Ages | Land | Levels | Starts as |' : '| Game | Land | Levels | Starts as |',
      withAges ? '| --- | --- | --- | --- | --- |' : '| --- | --- | --- | --- |',
      ...es.map((e) => {
        const cells = [link(e.game, 'readme'), ...(withAges ? [ages(e.game.bands)] : []), e.land?.name ?? '', `${allLevels(e.game).length}`, cell(handLine(e.page, 'Starts as'))];
        return `| ${cells.join(' | ')} |`;
      }),
    ].join('\n');
  return {
    'land counts': `The island is a world of **${landList.length} themed lands**: ${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}.`,
    'game counts': `There are ${entries.length} games; the ${child.length} child games are listed below and the ${grown.length} grown-up puzzles in their own table. "Ages" lists the bands each game has levels for; a person younger or older than those still finds it in its land (behind the signpost if it is for bigger kids) and plays its nearest band. "school" is the early-school band (ages 6–12, made for 6 to 8), where ${school} games play their most demanding levels, and "grown-up" (13 and up) is played by ${grownBand.length} games: the ${grown.length} grown-up puzzles and ${grownBand.length - grown.filter((e) => e.game.bands.includes('grownup')).length} child games that grow up to it. Each name links to the game's page: its levels, what it starts as and grows into, and its design notes.`,
    'child games': table(child, true),
    'grown-up count': `These ${grown.length} are island games for the grown-up band: ${where(grown)}. All play by touch on the island; ${grown.length - controller} are touch-only, and ${controller} also play with a controller on the couch.`,
    'grown-up games': table(grown, false),
  };
}

export function gamesIndex(entries: readonly Entry[], lands: readonly Land[]): string {
  const out: string[] = [];
  const groups: [string, Entry[]][] = lands.map((l) => [l.name, entries.filter((e) => e.land === l)]);
  const loose = entries.filter((e) => !e.land);
  if (loose.length) groups.push(['In no land', loose]);
  for (const [name, es] of groups) {
    if (!es.length) continue;
    out.push(`## ${name}`, '');
    for (const e of es) out.push(`### ${e.game.name}`, '', `*${ages(e.game.bands)}* · ${link(e.game, 'games')}`, '');
  }
  return out.join('\n');
}
