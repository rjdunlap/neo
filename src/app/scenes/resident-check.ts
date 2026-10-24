import { Texture } from 'pixi.js';
import type { CastId } from '../../art/creatures/cast';
import { sameArt } from '../../art/creatures/illustrated';
import { LAND_SPOTS, landFor, landLayout, overlaps, spotRect, type LandArrows, type LandId, type Rect } from '../../content/lands';
import { Resident, RESIDENTS } from '../../creatures/resident';
import { computeView } from '../../engine/view';
import { hostScale } from './LandScene';
import { meadowKeepOut } from './meadow';

/**
 * The clearance check the six locations' tests make of their second-wave resident (RW14 slice 2, after `peaks.test.ts`):
 * in every layout the capacity sweep (`landLayouts`) gives, in four views, its touch circle is at least 100 units across, and
 * everything it covers at rest over five seconds, poked over its reaction, stays inside its own spot, so it clears every
 * game, the signpost, the guide corner, the corner buttons and the heading. Returns what is wrong; nothing when it fits.
 * Vitest-free, so a test asserts on the list.
 */

export const VIEWS = {
  landscape: computeView(1024, 768),
  portrait: computeView(768, 1024),
  phone: computeView(844, 390),
  notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
};

/** Which arrows a page can show: none (a land that fits), on only (a first page), both (a middle page), back only (a last page). */
const ARROWS: LandArrows[] = [
  { prev: false, next: false },
  { prev: false, next: true },
  { prev: true, next: true },
  { prev: true, next: false },
];

/**
 * Every layout a land screen can need, not only what today's catalog asks for: in every view, with and without the
 * signpost and with each set of page arrows, every game count the `LAND_SPOTS` budget allows. A location's scenery that
 * passes this never breaks when a game is added (a full land pages instead).
 */
export function* landLayouts(id: LandId) {
  const land = landFor(id);
  for (const [name, view] of Object.entries(VIEWS)) {
    const ground = view.h * land.backdrop.horizon;
    for (const sign of [false, true]) {
      for (const arrows of ARROWS) {
        const fixed = 1 + (sign ? 1 : 0) + (arrows.prev ? 1 : 0) + (arrows.next ? 1 : 0);
        for (let n = 1; n + fixed <= LAND_SPOTS; n++) {
          const layout = landLayout(n, sign, view, ground, arrows)!;
          yield { view, ground, layout, where: `${name} n=${n}${sign ? ' sign' : ''}${arrows.prev ? ' prev' : ''}${arrows.next ? ' next' : ''}` };
        }
      }
    }
  }
}

interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

/** Everything the resident covers, in its own units, over `frames` sixtieths of a second (poked first if asked), at one clock phase. */
function span(species: CastId, poked: boolean, frames: number, phase: number): Box {
  const random = Math.random;
  Math.random = () => phase;
  let r: Resident;
  try {
    r = new Resident(species, sameArt(Texture.WHITE));
  } finally {
    Math.random = random;
  }
  if (poked) r.poke();
  const b0 = r.getLocalBounds();
  const box = { minX: b0.minX, maxX: b0.maxX, minY: b0.minY, maxY: b0.maxY };
  for (let i = 0; i < frames; i++) {
    r.update(1 / 60);
    const b = r.getLocalBounds();
    box.minX = Math.min(box.minX, b.minX);
    box.maxX = Math.max(box.maxX, b.maxX);
    box.minY = Math.min(box.minY, b.minY);
    box.maxY = Math.max(box.maxY, b.maxY);
  }
  r.destroy({ children: true });
  return box;
}

export function residentProblems(species: CastId): string[] {
  const problems: string[] = [];
  const id = RESIDENTS[species].land;
  const at = (b: Box, x: number, y: number, s: number): Rect => ({ x: x + b.minX * s, y: y + b.minY * s, w: (b.maxX - b.minX) * s, h: (b.maxY - b.minY) * s });
  const inside = (r: Rect, k: Rect) => r.x >= k.x && r.y >= k.y && r.x + r.w <= k.x + k.w && r.y + r.h <= k.y + k.h;
  // Sweep the randomized clock: sparse layouts must fit the idle motion at its widest phases too.
  for (const phase of Array.from({ length: 11 }, (_, i) => i / 11)) {
    const rest = span(species, false, 300, phase);
    const reaction = span(species, true, 90, phase);
    // The whole picture is drawn: the box is at least as wide as the art.
    const size = Resident.size(species);
    if (rest.maxX - rest.minX < size.w * 0.95) problems.push(`${species} draws smaller than its art at phase ${phase}`);
    const r0 = new Resident(species, sameArt(Texture.WHITE));
    const hit = r0.touchArea(10);
    r0.destroy({ children: true });
    for (const { view, layout, where } of landLayouts(id)) {
      const s = hostScale(layout.box);
      const { x, y } = layout.host;
      const body = at(rest, x, y, s);
      const touch: Rect = { x: x + (hit.x - hit.radius) * s, y: y + (hit.y - hit.radius) * s, w: hit.radius * 2 * s, h: hit.radius * 2 * s };
      if (hit.radius * 2 * s < 100) problems.push(`${species} touch circle ${Math.round(hit.radius * 2 * s)} across: ${where}`);
      const own = spotRect(layout.host, layout.box);
      const others = meadowKeepOut(layout, view).filter((k) => k.x !== own.x || k.y !== own.y);
      for (const [name, r] of [['body', body], ['touch', touch]] as const) {
        if (!inside(r, own)) problems.push(`${species} ${name} leaves its spot (${JSON.stringify(r)} in ${JSON.stringify(own)}): ${where}, phase ${phase}`);
        for (const k of others) if (overlaps(r, k)) problems.push(`${species} ${name} covers ${JSON.stringify(k)}: ${where}, phase ${phase}`);
      }
      const moved = at(reaction, x, y, s);
      if (moved.x < 0 || moved.y < 0 || moved.x + moved.w > view.w || moved.y + moved.h > view.h) problems.push(`${species} reaction leaves the screen: ${where}, phase ${phase}`);
      for (const k of others) if (overlaps(moved, k) && (k.w !== 380 || k.h !== 90)) problems.push(`${species} reaction covers ${JSON.stringify(k)}: ${where}, phase ${phase}`);
    }
    if (problems.length > 8) break;
  }
  return [...new Set(problems)].slice(0, 8);
}
