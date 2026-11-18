import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView, NO_INSETS, type View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { uprightProblems, UPRIGHT_VIEWS, type Target } from '../upright-check';
import {
  asking,
  CARD_HIT,
  centre,
  inTray,
  LEVELS,
  lineLayout,
  nextCard,
  place,
  proofLayout,
  roundFor,
  validGaps,
  type Rect,
} from './logic';

/**
 * Timeline Trail held upright (chunk 31, docs/definitions/phone-portrait.md): every level of every band, in every line
 * state from the first card to the full line, on the upright phone views and a short one. The boxes come from the
 * layout functions the scene places them with (`lineLayout`, `proofLayout`). What she picks up (the tray's cards, level
 * 5's chips) and what she lets go on (the gaps, level 1's posts, level 5's ribbon) are two kinds of target, each checked
 * as its own group and then against the other, since a tray card must not cover a gap either; level 7's big picture and
 * the card before it stand over the dimmed line, so they are a group of their own, as are the spots on the picture.
 */
const views = { ...UPRIGHT_VIEWS, short: computeView(375, 601, NO_INSETS, true) };
/** A corner-anchored box as a target, trimmed by a hair so boxes that only touch are not read as overlapping. */
const rect = (what: string, r: Rect): Target => ({ what, ...centre(r), w: r.w - 1e-7, h: r.h - 1e-7 });
/** A picked-up thing's touch box: its rectangle and the rim the scene's hit area adds. */
const held = (what: string, r: Rect): Target => ({ what, ...centre(r), w: CARD_HIT, h: CARD_HIT });
const top = Math.max(...(['preschool', 'prek', 'school'] as const).map((b) => rangeFor(LEVELS, b).max));
const levels = Array.from({ length: top }, (_, i) => i + 1);

function check(v: View, targets: Target[], where: string) {
  expect(uprightProblems(v, targets), `${where} at ${Math.round(v.w)} x ${Math.round(v.h)}`).toEqual([]);
}

describe.each(Object.entries(views))('Timeline Trail upright on %s', (_, v) => {
  it('lists every level of every band', () => {
    expect(levels).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(v.h).toBeGreaterThan(v.w);
  });

  it.each(levels)(
    'level %i: the tray, the gaps and the question stand apart in every line state',
    (level) => {
      for (let seed = 0; seed < 30; seed++) {
        const r = roundFor(level, new Rng(seed));
        let line: number[] = [...r.hung];
        let loose = [...r.loose];
        for (;;) {
          const where = `level ${level} seed ${seed} hung ${line.length}`;
          const tray = inTray(r, loose);
          const l = lineLayout(r, line, tray.length, v);
          expect(l, where).not.toBeNull();
          if (!l) break;
          expect(l.tray, where).toHaveLength(tray.length);
          expect(l.chips, where).toHaveLength(asking(r, line) ? 3 : 0);
          const picked = [...l.tray.map((t) => held('tray card', t)), ...l.chips.map((c) => held('chip', c))];
          // A full line's gaps are drawn but take nothing (levels 5 and 7 swap them for the ribbon or the question).
          const drops = [
            ...(loose.length ? l.gaps.map((g) => rect('gap', g)) : []),
            ...(l.ribbon ? [rect('ribbon', l.ribbon)] : []),
          ];
          if (loose.length) expect(drops.length, where).toBeGreaterThan(0);
          check(v, picked, where);
          check(v, drops, where);
          check(v, [...picked, ...drops], where);
          // The hung cards are not targets, but nothing she touches may sit on one.
          const hung = l.cards.map((c) => rect('hung card', c));
          for (const t of [...picked, ...drops])
            expect(
              uprightProblems(v, [t, ...hung]).filter((p) => p.startsWith(t.what)),
              where,
            ).toEqual([]);
          if (!loose.length) break;
          const stage = nextCard(r, loose)!;
          line = (place(r, line, stage, validGaps(r, line, stage)[0]) as { line: number[] }).line;
          loose = loose.filter((s) => s !== stage);
          if (level === 1) {
            line = [...r.cards];
            loose = [];
          }
        }
        if (r.ask === undefined) continue;
        // Level 7's question: the big picture, the card before it, and the spots on the picture.
        const p = proofLayout(r, v);
        expect(p, `level ${level} seed ${seed} question`).not.toBeNull();
        if (!p) continue;
        check(
          v,
          [rect('big picture', p.frame), rect('card before', p.before)],
          `level ${level} seed ${seed} question`,
        );
        expect(p.spots.length).toBeGreaterThan(0);
        check(
          v,
          p.spots.map((s) => rect(`spot ${s.element}`, s)),
          `level ${level} seed ${seed} spots`,
        );
      }
    },
  );
});
