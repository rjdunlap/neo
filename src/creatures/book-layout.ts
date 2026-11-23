import { safeArea, type View } from '../engine/view';
import type { Individual, SaveData } from '../progress/save';
import { GOALS, type Goal } from '../content/goals';
import { mixedColors } from '../content/journal';
import { welcomeFriend } from '../content/welcome';
import type { MixedColor } from '../content/world';
import { BACK, CARD, PER_PAGE } from './friends-layout';
import { CORNER_RADIUS, HOME_BUTTON } from './home-layout';
import { SPECIES_IDS, type SpeciesId } from './species';

export type BookPage =
  | { kind: 'goals'; goal: Goal }
  | { kind: 'friends'; species?: SpeciesId; friends: Individual[] }
  | { kind: 'things'; bed: boolean; colours: MixedColor[] };

/**
 * The book's pages in order: one page per goal (the chosen one first), her friends by species, then her things. A
 * colour goal shows whenever its path is built for her band, done or not, since a mixed colour stays hers to see as a
 * full jar; the friend goal shows while its project is open, and done only on the return from adopting (`showJoined`).
 */

export function bookPages(save: SaveData, showJoined = false): BookPage[] {
  const pages: BookPage[] = [];
  const band = save.profile.band;
  const goals = GOALS.filter((goal) =>
    goal.kind === 'colour'
      ? goal.reachable(save, band)
      : goal.done(save)
        ? showJoined
        : goal.reachable(save, band),
  ).sort((a, b) => Number(b.id === save.book.goal) - Number(a.id === save.book.goal));
  for (const goal of goals) pages.push({ kind: 'goals', goal });
  for (const species of SPECIES_IDS) {
    const friends = save.creatures.owned.filter((who) => who.species === species);
    for (let i = 0; i < friends.length; i += PER_PAGE)
      pages.push({ kind: 'friends', species, friends: friends.slice(i, i + PER_PAGE) });
  }
  if (!pages.some((page) => page.kind === 'friends')) pages.push({ kind: 'friends', friends: [] });
  const bed = welcomeFriend(save.creatures.owned) !== null;
  const colours = mixedColors(save.journal);
  const first = PER_PAGE - Number(bed);
  pages.push({ kind: 'things', bed, colours: colours.slice(0, first) });
  for (let i = first; i < colours.length; i += PER_PAGE)
    pages.push({ kind: 'things', bed: false, colours: colours.slice(i, i + PER_PAGE) });
  return pages;
}

/** How many cards a page lays out in the grid (a goal's own card has its own spot). */
export const pageCards = (page: BookPage) =>
  page.kind === 'friends'
    ? page.friends.length
    : page.kind === 'things'
      ? Number(page.bed) + page.colours.length
      : 0;

const DOT_STEP = 24;
/** The page dots' spacing: 24 units, closed up on a long book so the row stays between the held arrows. */
export const dotStep = (pages: number) => Math.min(DOT_STEP, 300 / Math.max(1, pages - 1));

export const BOOK_ARROW_RADIUS = 50;
export const BOOK_HEADING = { w: 300, h: 100 };
const GAP = 32;

/** One two-row page fits the design area, with separate space for the heading, actions and held arrows. */
export function bookLayout(view: View, count: number) {
  const area = safeArea(view);
  const mid = area.x + area.w / 2;
  const top = area.y;
  const center = top + area.h / 2;
  const rows = Math.ceil(count / 3);
  const step = CARD + GAP;
  const cards = Array.from({ length: count }, (_, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const inRow = Math.min(3, count - 3 * row);
    return { x: mid + (col - (inRow - 1) / 2) * step, y: center + (row - (rows - 1) / 2) * step };
  });
  return {
    back: { x: BACK.x, y: BACK.y, r: CORNER_RADIUS },
    home: { x: HOME_BUTTON.x, y: HOME_BUTTON.y, r: CORNER_RADIUS },
    heading: { x: mid, y: top + (view.upright ? 180 : 156) },
    cards,
    goalArt: { x: mid, y: center - 70 },
    star: { x: mid - 83, y: center + 108 },
    path: { x: mid + 83, y: center + 108 },
    previous: { x: mid - 235, y: top + area.h - 72 },
    next: { x: mid + 235, y: top + area.h - 72 },
    dots: { x: mid, y: top + area.h - 72 },
  };
}
