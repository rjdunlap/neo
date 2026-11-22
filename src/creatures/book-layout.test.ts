import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { computeView } from '../engine/view';
import { UPRIGHT_SCREENS } from '../games/upright-check';
import { defaults, MAX_CREATURES, meetIn } from '../progress/save';
import { WELCOME_MET_AT } from '../content/welcome';
import { BOOK_ARROW_RADIUS, BOOK_HEADING, bookLayout, bookPages } from './book-layout';
import { CARD, PER_PAGE } from './friends-layout';

describe('collection-book paging', () => {
  const collection = () => {
    const save = defaults();
    for (let i = 0; i < MAX_CREATURES; i++)
      meetIn(
        save.creatures,
        i === 22 ? 'river' : i === 23 ? 'glider' : 'sprout',
        'Pip',
        'teal',
        `test:${i}`,
        () => `test${i}`,
      );
    return save;
  };

  it('keeps each friend on a single-species page, with six pages in the most uneven full collection', () => {
    const save = collection();
    const pages = bookPages(save).flatMap((page) => (page.kind === 'friends' ? [page] : []));
    expect(pages.map((page) => page.friends.length)).toEqual([6, 6, 6, 4, 1, 1]);
    expect(pages.flatMap((page) => page.friends)).toEqual(save.creatures.owned);
    for (const page of pages) {
      expect(page.friends.length).toBeLessThanOrEqual(PER_PAGE);
      expect(page.friends.every((who) => who.species === page.species)).toBe(true);
    }
  });

  it('offers a pending path at its bands, shows the joined friend on return and keeps the bed', () => {
    const save = defaults();
    for (const { id } of BANDS) {
      save.profile.band = id;
      expect(bookPages(save).map((page) => page.kind)).toEqual(
        id === 'prek' || id === 'preschool' ? ['goals', 'friends', 'things'] : ['friends', 'things'],
      );
    }
    save.profile.band = 'prek';
    meetIn(save.creatures, 'river', 'Ripple', 'orange', WELCOME_MET_AT, () => 'rivr');
    expect(bookPages(save).map((page) => page.kind)).toEqual(['friends', 'things']);
    expect(bookPages(save)[1]).toEqual({ kind: 'things', bed: true });
    expect(bookPages(save, true)[0].kind).toBe('goals');
  });

  it('keeps the full-size hit areas disjoint and visible on every page across supported views', () => {
    const views = [computeView(1024, 768), computeView(768, 1024), ...Object.values(UPRIGHT_SCREENS)];
    const save = collection();
    for (const view of views) {
      for (const { id } of BANDS) {
        save.profile.band = id;
        for (const page of [...bookPages(save), { kind: 'goals' } as const]) {
          const l = bookLayout(
            view,
            page.kind === 'friends' ? page.friends.length : page.kind === 'things' ? 1 : 0,
          );
          const box = (p: { x: number; y: number }, w: number, h = w) => ({
            left: p.x - w / 2,
            right: p.x + w / 2,
            top: p.y - h / 2,
            bottom: p.y + h / 2,
          });
          const arrow = 2 * (BOOK_ARROW_RADIUS + 14);
          const boxes = [
            box(l.back, 2 * (l.back.r + 8)),
            box(l.home, 2 * (l.home.r + 8)),
            box(l.heading, BOOK_HEADING.w, BOOK_HEADING.h),
            box(l.previous, arrow),
            box(l.next, arrow),
            ...l.cards.map((p) => box(p, CARD)),
          ];
          if (page.kind === 'goals') boxes.push(box(l.goalArt, CARD), box(l.star, 116), box(l.path, 116));
          for (const [i, a] of boxes.entries()) {
            expect(a.right - a.left).toBeGreaterThanOrEqual(100);
            expect(a.bottom - a.top).toBeGreaterThanOrEqual(100);
            expect(a.left).toBeGreaterThanOrEqual(0);
            expect(a.top).toBeGreaterThanOrEqual(0);
            expect(a.right).toBeLessThanOrEqual(view.w);
            expect(a.bottom).toBeLessThanOrEqual(view.h);
            for (const b of boxes.slice(i + 1))
              expect(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom).toBe(
                true,
              );
          }
        }
      }
    }
  });
});
