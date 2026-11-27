import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  CLUES,
  FITS,
  PICTURES,
  VALID_DEALS,
  dealRound,
  fittingPairs,
  fits,
  hintAction,
  petPick,
  petPoint,
  revealKind,
  validDeal,
  visible,
  type Deal,
  type State,
} from './logic';

describe('the fit table', () => {
  it('has every picture fit exactly 3 clues and every clue exactly 3 pictures, with distinct names', () => {
    for (const row of FITS) expect(new Set(row).size).toBe(3);
    for (let c = 0; c < 6; c++) expect(PICTURES.filter((_, p) => fits(p, c))).toHaveLength(3);
    expect(new Set(PICTURES).size).toBe(6);
    expect(new Set(CLUES).size).toBe(6);
  });
});

describe('the deals', () => {
  it('has 28 valid deals out of 400, 26 with 6 fitting pairs and 2 with 7', () => {
    expect(VALID_DEALS).toHaveLength(28);
    const counts = VALID_DEALS.map((d) => fittingPairs(d).length);
    expect(counts.filter((n) => n === 6)).toHaveLength(26);
    expect(counts.filter((n) => n === 7)).toHaveLength(2);
  });

  it('never has a dealt clue that fits fewer than two dealt pictures, or a picture with no fitting clue', () => {
    for (const d of VALID_DEALS) {
      for (const c of d.clues) expect(d.pictures.filter((p) => fits(p, c)).length).toBeGreaterThanOrEqual(2);
      for (const p of d.pictures) expect(d.clues.some((c) => fits(p, c))).toBe(true);
    }
  });

  it('deals a valid, distinct deal over 200 seeds, and the pet pick is a fitting pair that rotates', () => {
    const pictures = new Set<number>();
    for (let seed = 1; seed <= 200; seed++) {
      const d = dealRound(new Rng(seed));
      expect(validDeal(d)).toBe(true);
      expect(new Set(d.pictures).size).toBe(3);
      expect(new Set(d.clues).size).toBe(3);
      const pick = petPick(d, seed);
      expect(fittingPairs(d)).toContainEqual(pick);
      expect(fits(petPoint(d, pick.clue, seed), pick.clue)).toBe(true);
      pictures.add(pick.picture);
    }
    expect(pictures.size).toBeGreaterThan(3);
  });
});

const sample = (): Deal => VALID_DEALS[0];

describe('revealKind', () => {
  it('is total over every giver pick, clue and listener pick, and is "same" exactly when the picks match', () => {
    for (const d of VALID_DEALS) {
      for (const g of d.pictures)
        for (const c of d.clues)
          for (const l of d.pictures) {
            const k = revealKind(g, c, l);
            expect(['same', 'both-fit', 'new-view']).toContain(k);
            expect(k === 'same').toBe(g === l);
            if (k === 'both-fit') expect(fits(g, c) && fits(l, c)).toBe(true);
          }
    }
  });
});

describe('no wrong choice', () => {
  it('lets any pick and any point reach the reveal, and the hint never names the giver’s picture', () => {
    for (const d of VALID_DEALS) {
      for (const g of d.pictures)
        for (const c of d.clues) {
          const s: State = { phase: 'point', deal: d, giverPick: g, clue: c };
          const h = hintAction(s);
          if (h) expect(h.kind === 'picture' && h.picture === g).toBe(false);
          if (h?.kind === 'picture') expect(fits(h.picture, c)).toBe(true);
        }
    }
  });

  it('hints a fitting clue for the picked picture on the giver’s turn, and nothing before a pick', () => {
    const d = sample();
    expect(hintAction({ phase: 'choose', deal: d, giverPick: null, clue: null })).toBeNull();
    const h = hintAction({ phase: 'choose', deal: d, giverPick: d.pictures[0], clue: null });
    expect(h?.kind).toBe('clue');
    if (h?.kind === 'clue') expect(fits(d.pictures[0], h.clue)).toBe(true);
  });
});

describe('the privacy rule', () => {
  it('shows nothing of the giver’s pick before the reveal', () => {
    const d = sample();
    const base = { deal: d, giverPick: d.pictures[1], clue: d.clues[0] };
    for (const phase of ['choose', 'cover', 'point'] as const) {
      const v = visible({ ...base, phase });
      expect(v.revealed).toBeNull();
      expect(JSON.stringify(v)).toEqual(
        JSON.stringify(visible({ ...base, giverPick: d.pictures[2], phase })),
      );
    }
    expect(visible({ ...base, phase: 'reveal' }).revealed).toBe(d.pictures[1]);
  });
});
