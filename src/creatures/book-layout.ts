import { safeArea, type View } from '../engine/view';
import type { Individual, SaveData } from '../progress/save';
import { GOALS, type Goal } from '../content/goals';
import { welcomeFriend } from '../content/welcome';
import { BACK, CARD, PER_PAGE } from './friends-layout';
import { CORNER_RADIUS, HOME_BUTTON } from './home-layout';
import { SPECIES_IDS, type SpeciesId } from './species';

export type BookPage =
  | { kind: 'goals'; goals: Goal[] }
  | { kind: 'friends'; species?: SpeciesId; friends: Individual[] }
  | { kind: 'things'; bed: boolean };

export function bookPages(save: SaveData, showJoined = false): BookPage[] {
  const pages: BookPage[] = [];
  const goals = GOALS.filter((goal) =>
    goal.done(save) ? showJoined : goal.reachable(save, save.profile.band),
  ).sort((a, b) => Number(b.id === save.book.goal) - Number(a.id === save.book.goal));
  if (goals.length) pages.push({ kind: 'goals', goals });
  for (const species of SPECIES_IDS) {
    const friends = save.creatures.owned.filter((who) => who.species === species);
    for (let i = 0; i < friends.length; i += PER_PAGE)
      pages.push({ kind: 'friends', species, friends: friends.slice(i, i + PER_PAGE) });
  }
  if (!pages.some((page) => page.kind === 'friends')) pages.push({ kind: 'friends', friends: [] });
  pages.push({ kind: 'things', bed: welcomeFriend(save.creatures.owned) !== null });
  return pages;
}

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
    heading: { x: mid, y: top + 156 },
    cards,
    goalArt: { x: mid, y: center - 70 },
    star: { x: mid - 83, y: center + 108 },
    path: { x: mid + 83, y: center + 108 },
    previous: { x: mid - 235, y: top + area.h - 72 },
    next: { x: mid + 235, y: top + area.h - 72 },
    dots: { x: mid, y: top + area.h - 72 },
  };
}
