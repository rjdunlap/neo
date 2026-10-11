import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { ODD_CARS, ANIMAL_TRIOS, SHAPE_FAMILIES, buildTrain, CHOICES, NUMBER_CARS, NUMBER_TOP, PAIR_CARS, PAIR_CHOICES, PATTERN_PLANS, TUNNEL_HIDDEN, pieceColor, pieceShape, wantedChoice } from './logic';

/** The shortest repeat that explains every car showing (empty cars are null). */
function shortestRepeat(cars: (number | null)[]): number {
  for (let p = 1; p <= cars.length; p++) {
    const ok = cars.every((c, i) => c === null || cars.every((d, j) => d === null || (i - j) % p !== 0 || c === d));
    if (ok) return p;
  }
  return cars.length;
}

describe('Pattern Train', () => {
  it('shows enough of the pattern that each empty car has exactly one answer', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
        if (plan.numberSteps) {
          const step = sequence[1] - sequence[0];
          expect(plan.numberSteps).toContain(step);
          expect(sequence.every((value, i) => i === 0 || value - sequence[i - 1] === step), plan.name).toBe(true);
          expect(new Set(choices[0]).size, plan.name).toBe(CHOICES);
          continue;
        }
        if (plan.kind === 'pair' || plan.tunnel || plan.odd) continue; // their own tests below
        const showing = sequence.map((v, i) => (targets.includes(i) ? null : v));
        // The visible cars repeat exactly the planned unit, no shorter.
        const p = shortestRepeat(showing);
        expect(p, plan.name).toBe(plan.pattern.length);
        for (const t of targets) {
          // Some visible car sits at the same place in the repeat, and it says what goes here.
          const clue = showing.findIndex((v, i) => v !== null && (i - t) % p === 0);
          expect(clue, plan.name).toBeGreaterThanOrEqual(0);
          expect(sequence[t]).toBe(showing[clue]);
          expect(sequence[t]).toBeLessThan(CHOICES);
        }
        // Different letters of the pattern look (or sound) different.
        const used = new Set(plan.pattern);
        expect(new Set(plan.pattern.map((slot) => sequence[plan.pattern.indexOf(slot)])).size).toBe(used.size);
      }
    }
  });

  it('puts the gap where each level says: the end, the middle, or the last two cars', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets } = buildTrain(plan, new Rng(seed));
        if (plan.numberSteps) {
          expect(sequence).toHaveLength(NUMBER_CARS);
          expect(targets[0]).toBeGreaterThanOrEqual(2);
          continue;
        }
        if (plan.kind === 'pair' || plan.odd) continue;
        if (plan.two) expect(targets).toEqual([sequence.length - 2, sequence.length - 1]);
        else if (plan.missing) {
          // Inside the two repeats, never the first car of one.
          expect(targets[0]).toBeLessThan(plan.pattern.length * 2);
          expect(targets[0] % plan.pattern.length).not.toBe(0);
        } else expect(targets).toEqual([sequence.length - 1]);
      }
    }
  });

  it('fits every train on the track: nine cars at most', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 200; seed++) expect(buildTrain(plan, new Rng(seed)).sequence.length, plan.name).toBeLessThanOrEqual(9);
    }
  });

  it('asks for every place in the repeat, so copying the first car is not the answer', () => {
    PATTERN_PLANS.forEach((plan, i) => {
      if (plan.numberSteps || plan.tunnel || plan.odd) return;
      const unit = plan.pattern.length;
      const slots = new Set<number>();
      let notFirst = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const { sequence, targets } = buildTrain(plan, new Rng(seed));
        slots.add(targets[0] % unit);
        if (targets.some((t) => sequence[t] !== sequence[0])) notFirst++;
      }
      // Two empty cars start at slot 0 or 1 (a start at slot 2 would need a tenth car); a gap is never at a repeat's start.
      const expected = plan.missing ? unit - 1 : plan.two ? 2 : unit;
      expect(slots.size, `level ${i + 1}`).toBe(expected);
      expect(notFirst, `level ${i + 1}`).toBeGreaterThan(200 / 3);
    });
  });

  it('rolls the tunnel train through four to seven hidden cars, and the car that comes out is found by counting', () => {
    const plan = PATTERN_PLANS.find((p) => p.tunnel)!;
    const hiddenSeen = new Set<number>();
    let notBefore = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { sequence, targets, hidden, choices } = buildTrain(plan, new Rng(seed));
      expect(sequence).toHaveLength(7);
      expect(targets).toEqual([6]);
      expect(hidden).toBeGreaterThanOrEqual(TUNNEL_HIDDEN.min);
      expect(hidden).toBeLessThanOrEqual(TUNNEL_HIDDEN.max);
      hiddenSeen.add(hidden!);
      // Six cars show two repeats of the unit; the answer is the place (6 + hidden) mod 3.
      expect(sequence.slice(3, 6)).toEqual(sequence.slice(0, 3));
      expect(sequence[6]).toBe(sequence[(6 + hidden!) % 3]);
      if (sequence[6] !== sequence[5]) notBefore++;
      expect(choices[0]).toEqual([0, 1, 2]);
    }
    expect(hiddenSeen.size).toBe(4);
    expect(notBefore).toBeGreaterThan(100);
  });

  it('makes the numbered train a counting question: varied starts, answers and places, no rule of thumb', () => {
    const plan = PATTERN_PLANS.find((p) => p.numberSteps)!;
    const answers = new Set<number>();
    const places = new Set<number>();
    let smallest = 0, largest = 0, notStep = 0;
    for (let seed = 1; seed <= 200; seed++) {
      const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
      const step = sequence[1] - sequence[0];
      const answer = sequence[targets[0]];
      expect(sequence.every((v, i) => v === sequence[0] + step * i)).toBe(true);
      expect(sequence[0] % step).toBe(0);
      expect(Math.max(...sequence, ...choices[0])).toBeLessThanOrEqual(NUMBER_TOP);
      expect(Math.min(...choices[0])).toBeGreaterThan(0);
      expect(choices[0].filter((c) => c === answer)).toHaveLength(1);
      expect(new Set(choices[0]).size).toBe(CHOICES);
      if (sequence[0] !== step) notStep++;
      answers.add(answer);
      places.add(choices[0].indexOf(answer));
      if (answer === Math.min(...choices[0])) smallest++;
      if (answer === Math.max(...choices[0])) largest++;
    }
    expect(notStep).toBe(200);
    expect(answers.size).toBeGreaterThanOrEqual(20);
    expect(places.size).toBe(CHOICES);
    expect(smallest).toBeGreaterThan(0);
    expect(smallest).toBeLessThan(110);
    expect(largest).toBeGreaterThan(0);
    expect(largest).toBeLessThan(110);
  });

  it('offers every piece on the train, so the near miss is always a choice', () => {
    for (const plan of PATTERN_PLANS.filter((p) => !p.numberSteps && p.kind !== 'pair')) {
      const { sequence, choices } = buildTrain(plan, new Rng(5));
      for (const options of choices) for (const piece of sequence) expect(options).toContain(piece);
      for (const options of choices) expect(options).toEqual([0, 1, 2]);
    }
  });

  it('gives color and shape their own cycles, with the half-right pieces on offer', () => {
    const plan = PATTERN_PLANS.find((p) => p.kind === 'pair')!;
    const places = new Set<number>(), spots = new Set<number>(), looks = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const { sequence, targets, choices, look } = buildTrain(plan, new Rng(seed));
      expect(sequence).toHaveLength(PAIR_CARS);
      expect(look).toBeDefined();
      expect(new Set(look!.colors).size).toBe(2);
      expect(new Set(look!.shapes).size).toBe(2);
      looks.add(look!.colors.join() + look!.shapes.join());
      // The two attributes run on different periods: color alternates, shape holds for two cars.
      const colors = sequence.map(pieceColor), shapes = sequence.map(pieceShape);
      expect(colors.every((c, i) => i < 2 || c === colors[i - 2])).toBe(true);
      expect(colors.some((c, i) => i > 0 && c === colors[i - 1])).toBe(false);
      expect(shapes.every((s, i) => i < 4 || s === shapes[i - 4])).toBe(true);
      expect(shapes.some((s, i) => i > 0 && s === shapes[i - 1])).toBe(true);
      const t = targets[0], answer = sequence[t];
      // A car four places away shows the whole answer, and the gap is never the first car.
      expect(t).toBeGreaterThanOrEqual(1);
      expect(sequence[t - 4] ?? sequence[t + 4]).toBe(answer);
      // Four choices: the answer, same color other shape, same shape other color, and neither.
      expect(choices[0]).toHaveLength(PAIR_CHOICES);
      expect(new Set(choices[0]).size).toBe(PAIR_CHOICES);
      const rest = choices[0].filter((c) => c !== answer);
      expect(rest.filter((c) => pieceColor(c) === pieceColor(answer) && pieceShape(c) !== pieceShape(answer))).toHaveLength(1);
      expect(rest.filter((c) => pieceShape(c) === pieceShape(answer) && pieceColor(c) !== pieceColor(answer))).toHaveLength(1);
      expect(rest.filter((c) => pieceColor(c) !== pieceColor(answer) && pieceShape(c) !== pieceShape(answer))).toHaveLength(1);
      places.add(t % 4); spots.add(choices[0].indexOf(answer));
    }
    expect(places.size).toBe(4);
    expect(spots.size).toBe(PAIR_CHOICES);
    expect(looks.size).toBeGreaterThan(10);
  });

  it('makes each round of shapes or animals from one family of things, and every family turns up', () => {
    for (const trio of ANIMAL_TRIOS) expect(new Set(trio).size).toBe(3);
    expect(new Set(ANIMAL_TRIOS.map((t) => [...t].sort().join())).size).toBe(ANIMAL_TRIOS.length);
    for (const plan of PATTERN_PLANS) {
      const seen = new Set<number | undefined>();
      for (let seed = 1; seed <= 200; seed++) seen.add(buildTrain(plan, new Rng(seed)).family);
      const count = plan.kind === 'shape' ? SHAPE_FAMILIES.length : plan.kind === 'animal' ? ANIMAL_TRIOS.length : 0;
      expect(seen.size, plan.name).toBe(Math.max(count, 1));
      if (!count) expect(seen.has(undefined), plan.name).toBe(true);
    }
  });

  it('builds the same train and family for the same seed', () => {
    const plan = PATTERN_PLANS[3];
    const a = buildTrain(plan, new Rng(9)), b = buildTrain(plan, new Rng(9));
    expect(a).toEqual(b);
  });

  it('hides one wrong car in the spot-the-mistake trains, and the mended train is a perfect pattern', () => {
    const extra = PATTERN_PLANS.find((p) => p.odd === 'extra')!, swap = PATTERN_PLANS.find((p) => p.odd === 'swap')!;
    const extraAt = new Set<number>(), swapAt = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const a = buildTrain(extra, new Rng(seed));
      expect(a.sequence).toHaveLength(ODD_CARS.extra);
      const at = a.targets[0];
      // The extra car is the one piece that shows once, and without it the train is exactly the unit repeated.
      expect(a.sequence.filter((v) => v === a.sequence[at])).toHaveLength(1);
      const mended = a.sequence.filter((_, i) => i !== at);
      expect(shortestRepeat(mended)).toBe(2);
      expect(mended.every((v, i) => v === mended[i % 2])).toBe(true);
      expect(at).toBeGreaterThan(0);
      expect(at).toBeLessThan(a.sequence.length - 1);
      extraAt.add(at);

      const b = buildTrain(swap, new Rng(seed));
      expect(b.sequence).toHaveLength(ODD_CARS.swap);
      expect(b.shown).toBeDefined();
      const wrong = b.shown!.map((v, i) => (v !== b.sequence[i] ? i : -1)).filter((i) => i >= 0);
      expect(wrong).toEqual(b.targets);
      expect(shortestRepeat(b.sequence)).toBe(3);
      // The other cars show every place of the unit at least twice, so the right piece is certain.
      for (let slot = 0; slot < 3; slot++) expect(b.shown!.filter((v, i) => i % 3 === slot && i !== b.targets[0] && v === b.sequence[slot])).toHaveLength(slot === b.targets[0] % 3 ? 2 : 3);
      expect(b.choices[0]).toEqual([0, 1, 2]);
      expect(wantedChoice(b.sequence, b.targets, b.choices, 0)).toBe(b.choices[0].indexOf(b.sequence[b.targets[0]]));
      swapAt.add(b.targets[0]);
    }
    expect(extraAt.size).toBe(ODD_CARS.extra - 2);
    expect(swapAt.size).toBe(ODD_CARS.swap);
  });

  it('has a choice on offer for every empty car, in order, that fits the pattern', () => {
    for (const plan of PATTERN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
        targets.forEach((t, k) => {
          const want = wantedChoice(sequence, targets, choices, k);
          expect(want).toBeGreaterThanOrEqual(0);
          expect(want).toBeLessThan(choices[k].length);
          expect(choices[k][want]).toBe(sequence[t]);
        });
      }
    }
  });
});
