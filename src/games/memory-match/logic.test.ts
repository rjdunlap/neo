import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { pictureFace } from './art';
import { memoryMatch } from './index';
import { howToFor } from '../../content/howto';
import { PICTURE_POOLS, selectPictures, cardLabel, FRACTIONS, hintPartner, knownMismatch, LEVELS, makeDeck, nextCard, NUMBER_WORDS, numberWord, pictureIdentity, planFor, PLANS } from './logic';

describe('memory matching', () => {
  it('pins the original code-drawn icon and stickers independently of deck content', () => {
    const fingerprint = (node: import('pixi.js').Container): number => {
      const paths: unknown[] = [];
      const visit = (n: import('pixi.js').Container) => {
        paths.push({ x: n.x, y: n.y, rotation: n.rotation, scale: [n.scale.x, n.scale.y] });
        if ('context' in n) for (const i of (n as import('pixi.js').Graphics).context.instructions) {
          if (i.action === 'texture') throw new Error('Memory art stays code-drawn');
          const { texture: _texture, ...style } = i.data.style;
          paths.push({ action: i.action, path: i.data.path.instructions, style });
        }
        n.children.forEach(visit);
      };
      visit(node);
      const hash = [...JSON.stringify(paths)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
      node.destroy({ children: true });
      return hash;
    };
    const original = fingerprint(memoryMatch.sticker(0));
    expect(original).toMatchInlineSnapshot(`1652733104`);
    for (let seed = 1; seed <= 100; seed++) expect(fingerprint(memoryMatch.sticker(seed))).toBe(original);
    expect(fingerprint(memoryMatch.hubIcon())).toMatchInlineSnapshot(`4127882431`);
  });

  it('selects one reproducible picture family with unique partners and accurate speech at every picture level', () => {
    const reached = new Set<string>();
    for (let level = 1; level <= 5; level++) {
      const count = planFor(level).pairs;
      const families = new Set<string>();
      for (let seed = 1; seed <= 100; seed++) {
        const pictures = selectPictures(count, new Rng(seed));
        expect(pictures).toEqual(selectPictures(count, new Rng(seed)));
        expect(pictures).toHaveLength(count);
        expect(new Set(pictures.map(p => p.id)).size).toBe(count);
        expect(new Set(pictures.map(p => p.name)).size).toBe(count);
        expect(new Set(pictures.map(p => p.kind)).size).toBe(1);
        families.add(pictures[0].kind);
        const deck = makeDeck(count, new Rng(seed));
        for (const [pair, picture] of pictures.entries()) {
          reached.add(picture.id);
          const partners = deck.filter(card => card.pair === pair);
          expect(partners).toHaveLength(2);
          expect(partners.map(card => cardLabel('pictures', card, [], pictures))).toEqual([picture.name, picture.name]);
        }
      }
      expect([...families].sort()).toEqual(['friend', 'prop', 'shape']);
    }
    expect([...reached].sort()).toEqual(PICTURE_POOLS.flat().map(p => p.id).sort());
    expect(PICTURE_POOLS.map(pool => pool.length)).toEqual([8, 8, 8]);
  });

  it('keeps every picture inside its card with a readable thumbnail at the smallest picture board', () => {
    for (const picture of PICTURE_POOLS.flat()) {
      const face = pictureFace(picture);
      const b = face.getLocalBounds();
      expect(b.x).toBeGreaterThanOrEqual(-54);
      expect(b.y).toBeGreaterThanOrEqual(-54);
      expect(b.x + b.width).toBeLessThanOrEqual(54);
      expect(b.y + b.height).toBeLessThanOrEqual(54);
      expect(Math.max(b.width, b.height)).toBeGreaterThanOrEqual(picture.kind === 'shape' ? 70 : 105);
      face.destroy({ children: true });
    }
  });

  it('preserves the eleven plans, deck sizes and band windows with scoped instructions', () => {
    expect(PLANS.map(p => p.pairs)).toEqual([2, 3, 4, 6, 8, 4, 8, 8, 8, 10, 3]);
    expect(LEVELS).toEqual({ preschool: { min: 1, max: 5 }, prek: { min: 3, max: 9 }, school: { min: 8, max: 11 } });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(100)).toBe(PLANS[10]);
    for (let level = 1; level <= PLANS.length; level++) {
      const steps = howToFor(memoryMatch, level)!.steps.join(' ');
      expect(steps.includes('A number word matches')).toBe(level === 10);
      expect(steps.includes('A picture of equal parts')).toBe(level === 11);
      expect(steps).toContain('first open card again');
      expect(memoryMatch.describeLevel!(level)).toBe(planFor(level).name);
    }
  });
  it('labels both faces from their actual identity with distinct labels for every pair', () => {
    const letters = 'QAZWSXED'.split('');
    for (const plan of PLANS) {
      const labels = Array.from({ length: plan.pairs }, (_, pair) => {
        const a = cardLabel(plan.mode, { pair, side: 0 }, letters);
        expect(a.length).toBeGreaterThan(0);
        expect(cardLabel(plan.mode, { pair, side: 1 }, letters)).toBe(a);
        return a;
      });
      expect(new Set(labels).size).toBe(plan.pairs);
    }
    expect(cardLabel('letters', { pair: 0, side: 1 }, letters)).toBe('Q');
    expect(cardLabel('attributes', { pair: 1, side: 0 }, letters)).toBe('blue circle');
    for (const mode of ['pictures', 'attributes'] as const) {
      const ids = Array.from({ length: 8 }, (_, pair) => pictureIdentity(mode, pair));
      expect(new Set(ids.map(id => JSON.stringify(id))).size).toBe(8);
    }
  });
  it('keeps the fraction pictures as valid shaded equal parts of the same square', () => {
    expect(FRACTIONS.map(f => [f.numerator, f.denominator])).toEqual([[1, 2], [1, 4], [3, 4]]);
    for (const f of FRACTIONS) {
      const cellW = 64 / 2, cellH = f.denominator === 2 ? 64 : 32;
      expect(cellW * cellH * f.denominator).toBe(64 * 64);
      expect(f.numerator).toBeGreaterThan(0);
      expect(f.numerator).toBeLessThan(f.denominator);
    }
  });
  it('never describes an unseen partner as seen, even after earlier misses', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const cards = makeDeck(3, new Rng(seed));
      for (let mask = 0; mask < 64; mask++) {
        const seen = new Set(cards.map((_, i) => i).filter(i => mask & (1 << i)));
        for (let first = 0; first < cards.length; first++) {
          expect(hintPartner(cards, first, seen, 1)).toBeNull();
          const partner = hintPartner(cards, first, seen, 2);
          const actual = cards.findIndex((c, i) => i !== first && c.pair === cards[first].pair);
          expect(partner).toBe(seen.has(actual) ? actual : null);
        }
      }
    }
  });

  it('has exactly two of every pair after shuffling, at every deck size', () => {
    for (const count of [2, 3, 4, 6, 8]) {
      const deck = makeDeck(count, new Rng(count));
      expect(deck).toHaveLength(count * 2);
      for (let pair = 0; pair < count; pair++) expect(deck.filter((c) => c.pair === pair).map((c) => c.side).sort()).toEqual([0, 1]);
    }
  });
  it('pairs every written number from one through ten with its numeral', () => {
    expect(NUMBER_WORDS).toEqual(['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']);
    expect(NUMBER_WORDS.map((_, pair) => numberWord(pair))).toEqual(NUMBER_WORDS);
    expect(numberWord(-1)).toBe('');
    expect(numberWord(10)).toBe('');
  });
  it('does not count exploration or matches as misses', () => {
    const deck = [{ pair: 0, side: 0 as const }, { pair: 0, side: 1 as const }, { pair: 1, side: 0 as const }, { pair: 1, side: 1 as const }];
    expect(knownMismatch(deck, 0, 2, new Set([0]))).toBe(false);
    expect(knownMismatch(deck, 0, 2, new Set([0, 1]))).toBe(true);
    expect(knownMismatch(deck, 0, 1, new Set([0, 1, 2, 3]))).toBe(false);
  });
  it('has a player who remembers always finish a deck, turning each card a few times at most, and never a matched card', () => {
    for (const pairs of [2, 3, 4, 6, 8, 10]) {
      for (let seed = 1; seed <= 60; seed++) {
        const cards = makeDeck(pairs, new Rng(seed));
        const seen = new Set<number>();
        const done = new Set<number>();
        let first: number | null = null;
        let flips = 0;
        while (done.size < cards.length && flips < pairs * 6) {
          const pick = nextCard(cards, seen, (k) => done.has(k), first);
          expect(pick, `${pairs} pairs seed ${seed}`).toBeGreaterThanOrEqual(0);
          expect(done.has(pick)).toBe(false);
          expect(pick).not.toBe(first);
          flips++;
          if (first === null) {
            first = pick;
            seen.add(pick);
            continue;
          }
          if (cards[first].pair === cards[pick].pair) {
            done.add(first);
            done.add(pick);
          } else {
            // No penalty is ever earned: the second card is a mismatch only when the first one's partner was not known.
            expect(knownMismatch(cards, first, pick, seen)).toBe(false);
          }
          seen.add(pick);
          first = null;
        }
        expect(done.size, `${pairs} pairs seed ${seed}`).toBe(cards.length);
        // Turning a pair takes two flips; a mismatch costs two more, and a remembering player has at most one per pair.
        expect(flips).toBeLessThanOrEqual(pairs * 4);
      }
    }
  });
});
