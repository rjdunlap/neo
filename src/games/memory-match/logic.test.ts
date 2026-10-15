import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';
import { nextLevelOffer, stepLevel, nextLevel } from '../../progress/difficulty';
import { Rng } from '../../engine/random';
import { fractionFace, pictureFace } from './art';
import { memoryMatch } from './index';
import { howToFor } from '../../content/howto';
import { selectFractionSquares, clockDrawing, clockLabel, digitalTime, selectTimes, PICTURE_POOLS, selectPictures, cardLabel, FRACTIONS, hintPartner, knownMismatch, LEVELS, makeDeck, nextCard, NUMBER_WORDS, numberWord, pictureIdentity, planFor, PLANS, DOT_GAP, DOT_REACH, dotLayouts, selectDotLayouts } from './logic';

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
      expect([...families].sort()).toEqual(['friend', 'prop', 'shape', 'vehicle']);
    }
    expect([...reached].sort()).toEqual(PICTURE_POOLS.flat().map(p => p.id).sort());
    expect(PICTURE_POOLS.map(pool => pool.length)).toEqual([8, 8, 8, 8]);
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

  it('preserves existing plans and IDs, inserting the clock bridge in the school order, deck sizes and band windows with scoped instructions', () => {
    expect(PLANS.map(p => p.pairs)).toEqual([2, 3, 4, 6, 8, 4, 8, 8, 8, 10, 3, 3]);
    expect(LEVELS).toEqual({ preschool: { min: 1, max: 5 }, prek: { min: 3, max: 9 }, school: { min: 8, max: 12, order: [8, 12, 9, 10, 11] } });
    expect(planFor(0)).toBe(PLANS[0]);
    expect(planFor(100)).toBe(PLANS[11]);
    for (let level = 1; level <= PLANS.length; level++) {
      const steps = howToFor(memoryMatch, level)!.steps.join(' ');
      expect(steps.includes('A number word matches')).toBe(level === 10);
      expect(steps.includes('A picture of equal parts')).toBe(level === 11);
      expect(steps.includes('digital time')).toBe(level === 12);
      expect(steps).toContain('first open card again');
      expect(memoryMatch.describeLevel!(level)).toBe(planFor(level).name);
    }
  });
  it('labels both faces from their actual identity with distinct labels for every pair', () => {
    const letters = 'QAZWSXED'.split('');
    for (const plan of PLANS) {
      const labels = Array.from({ length: plan.pairs }, (_, pair) => {
        const times = [120, 270, 420];
        const a = cardLabel(plan.mode, { pair, side: 0 }, letters, undefined, times);
        expect(a.length).toBeGreaterThan(0);
        expect(cardLabel(plan.mode, { pair, side: 1 }, letters, undefined, times)).toBe(a);
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
  it('varies seeded square orientation and shading while preserving exact equal-area fraction pairs', () => {
    expect(FRACTIONS.map(f => [f.numerator, f.denominator])).toEqual([[1, 2], [1, 4], [3, 4]]);
    const rotations = FRACTIONS.map(() => new Set<number>());
    const masks = FRACTIONS.map(() => new Set<string>());
    for (let seed = 1; seed <= 200; seed++) {
      const squares = selectFractionSquares(new Rng(seed));
      expect(squares).toEqual(selectFractionSquares(new Rng(seed)));
      expect(squares).toHaveLength(3);
      const deck = makeDeck(planFor(11).pairs, new Rng(seed));
      expect(deck).toHaveLength(6);
      squares.forEach((square, pair) => {
        const f = FRACTIONS[pair];
        expect(deck.filter(c => c.pair === pair).map(c => c.side).sort()).toEqual([0, 1]);
        for (const card of deck.filter(c => c.pair === pair)) expect(cardLabel('fractions', card, [])).toBe(f.name);
        expect(square.parts).toHaveLength(f.denominator);
        expect(square.parts.filter(p => p.shaded)).toHaveLength(f.numerator);
        // Every part tiles the same whole without overlaps; shaded area is the named share.
        let shadedArea = 0;
        for (const [i, part] of square.parts.entries()) {
          expect(part.width * part.height).toBe(64 * 64 / f.denominator);
          expect(part.x).toBeGreaterThanOrEqual(-32);
          expect(part.y).toBeGreaterThanOrEqual(-32);
          expect(part.x + part.width).toBeLessThanOrEqual(32);
          expect(part.y + part.height).toBeLessThanOrEqual(32);
          if (part.shaded) shadedArea += part.width * part.height;
          for (const other of square.parts.slice(i + 1)) {
            expect(part.x + part.width <= other.x || other.x + other.width <= part.x ||
              part.y + part.height <= other.y || other.y + other.height <= part.y).toBe(true);
          }
        }
        expect(shadedArea / (64 * 64)).toBe(f.numerator / f.denominator);
        rotations[pair].add(Math.round(square.rotation / (Math.PI / 4)));
        masks[pair].add(square.parts.map(p => Number(p.shaded)).join(''));
        // The actual rotated drawing, including its stroke, stays well inside the 140-unit face.
        const parent = new Container();
        const face = fractionFace(square);
        parent.addChild(face);
        const bounds = parent.getLocalBounds();
        expect(Math.max(Math.abs(bounds.x), Math.abs(bounds.y), Math.abs(bounds.x + bounds.width), Math.abs(bounds.y + bounds.height))).toBeLessThan(48);
        parent.destroy({ children: true });
      });
    }
    rotations.forEach(values => expect([...values].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]));
    expect(masks.map(values => values.size)).toEqual([2, 4, 4]);
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

  it('shows every quantity 1–8 in several valid arrangements', () => {
    for (let n = 1; n <= 8; n++) {
      const layouts = dotLayouts(n);
      expect(layouts.length, `n=${n}`).toBeGreaterThanOrEqual(n === 1 ? 1 : 3);
      for (const dots of layouts) {
        expect(dots).toHaveLength(n);
        for (const d of dots) {
          expect(Math.abs(d.x)).toBeLessThanOrEqual(DOT_REACH.x);
          expect(Math.abs(d.y)).toBeLessThanOrEqual(DOT_REACH.y);
        }
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
          expect(Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y)).toBeGreaterThanOrEqual(DOT_GAP);
        }
      }
    }
  });

  it('draws one layout per quantity from the seed and reaches every arrangement', () => {
    expect(selectDotLayouts(8, new Rng(3)).map(l => l.length)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(selectDotLayouts(8, new Rng(3))).toEqual(selectDotLayouts(8, new Rng(3)));
    for (const n of [3, 8]) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 60; seed++) seen.add(JSON.stringify(selectDotLayouts(8, new Rng(seed))[n - 1]));
      expect(seen.size).toBe(dotLayouts(n).length);
    }
  });
});


describe('Same time bridge', () => {
  it('keeps old saved IDs and pins valid while stepping through the easier bridge', () => {
    const range = LEVELS.school!;
    expect(nextLevelOffer(8, range)).toBe(12);
    expect(nextLevelOffer(12, range)).toBe(9);
    expect(stepLevel(9, -1, range)).toBe(12);
    expect(stepLevel(12, -1, range)).toBe(8);
    expect(nextLevelOffer(11, range)).toBeNull();
    for (const id of [8, 9, 10, 11, 12]) expect(nextLevel(id, [], range)).toBe(id);
  });
  it('selects reproducible mixed boards with three distinct hours and one opposite-side partner', () => {
    const reached = new Set<number>(), patterns = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed), times = selectTimes(rng), deck = makeDeck(3, rng);
      const repeat = new Rng(seed);
      expect(selectTimes(repeat)).toEqual(times);
      expect(makeDeck(3, repeat)).toEqual(deck);
      expect(times).toHaveLength(3);
      expect(new Set(times.map(t => Math.floor(t / 60))).size).toBe(3);
      expect(new Set(times.map(t => t % 60))).toEqual(new Set([0, 30]));
      patterns.add(times.map(t => t % 60).sort((a, b) => a - b).join(','));
      times.forEach(t => reached.add(t));
      expect(deck).toHaveLength(6);
      for (const [a, card] of deck.entries()) {
        let partners = 0;
        for (const [b, other] of deck.entries()) {
          const expected = a !== b && times[card.pair] === times[other.pair] && card.side !== other.side;
          expect(a !== b && card.pair === other.pair).toBe(expected);
          if (expected) partners++;
          expect(expected).toBe(b !== a && times[other.pair] === times[card.pair] && other.side !== card.side);
        }
        expect(partners).toBe(1);
        expect(cardLabel('clocks', card, [], [], times)).toBe(clockLabel(times[card.pair]));
      }
    }
    expect([...reached].sort((a, b) => a - b)).toEqual(Array.from({ length: 24 }, (_, i) => i * 30));
    expect(patterns).toEqual(new Set(['0,0,30', '0,30,30']));
  });
  it('uses continuous hour angles and bounded, upright geometry for all 24 times', () => {
    for (let time = 0; time < 720; time += 30) {
      const data = clockDrawing(time), minute = time % 60, hour = Math.floor(time / 60);
      expect(data.hour.degrees).toBe(hour * 30 + minute * 0.5);
      expect(data.minute.degrees).toBe(minute * 6);
      expect(data.hour.length).toBeLessThan(data.minute.length);
      expect(data.hour.width).toBeGreaterThan(data.minute.width);
      expect(data.minute.length + data.minute.width / 2).toBeLessThan(45 - data.numeralSize / 2);
      expect(data.numerals.map(n => n.text)).toEqual(Array.from({ length: 12 }, (_, i) => String(i + 1)));
      expect(data.numerals[11].x).toBeCloseTo(0);
      expect(data.numerals[11].y).toBe(-45);
      expect(digitalTime(time)).toBe(`${hour || 12}:${minute === 0 ? '00' : '30'}`);
      expect(clockLabel(time)).toMatch(minute === 0 ? /o'clock$/ : /^half past /);
    }
    expect(clockDrawing(270).hour.degrees).toBe(135);
    expect(clockDrawing(30).hour.degrees).toBe(15);
    expect(clockDrawing(690).hour.degrees).toBe(345);
    expect(clockLabel(0)).toBe("twelve o'clock");
    expect(clockLabel(30)).toBe('half past twelve');
  });
});
