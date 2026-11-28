import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { buildMatch, MATCH_CARS, MATCH_UNITS, structure, validPieces } from './logic';
import {
  addToUnit,
  canGo,
  LEVELS,
  madeList,
  MAKE_REPEATS,
  MAKE_UNIT_MAX,
  makeTrain,
  patternPlan,
  removeFromUnit,
  ODD_CARS,
  STACK_MAX,
  STACK_TOP,
  stepWords,
  STAIR_CARS,
  STAIR_START,
  ANIMAL_TRIOS,
  SHAPE_FAMILIES,
  buildTrain,
  CHOICES,
  NUMBER_CARS,
  START_CARS,
  NUMBER_TOP,
  PAIR_CARS,
  PAIR_CHOICES,
  PATTERN_PLANS,
  TUNNEL_HIDDEN,
  TUNNEL_SIZE,
  patternSaid,
  pieceColor,
  pieceName,
  pieceShape,
  wantedChoice,
  ADD_CARS,
  countOn,
} from './logic';
import { SCRIPT } from '../../content/voice-script';

/** The plans that are a train to finish, mend or match: level 17 makes its own unit, so it has no train to build, and level 18's stacks have their own tests. */
const TRAIN_PLANS = PATTERN_PLANS.filter((p) => !p.make && !p.stairs);

/** The shortest repeat that explains every car showing (empty cars are null). */
function shortestRepeat(cars: (number | null)[]): number {
  for (let p = 1; p <= cars.length; p++) {
    const ok = cars.every(
      (c, i) => c === null || cars.every((d, j) => d === null || (i - j) % p !== 0 || c === d),
    );
    if (ok) return p;
  }
  return cars.length;
}

describe('Pattern Train', () => {
  it('shows enough of the pattern that each empty car has exactly one answer', () => {
    for (const plan of TRAIN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets, choices } = buildTrain(plan, new Rng(seed));
        if (plan.numberSteps) {
          const step = sequence[1] - sequence[0];
          expect(plan.numberSteps).toContain(step);
          expect(
            sequence.every((value, i) => i === 0 || value - sequence[i - 1] === step),
            plan.name,
          ).toBe(true);
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
        expect(new Set(plan.pattern.map((slot) => sequence[plan.pattern.indexOf(slot)])).size).toBe(
          used.size,
        );
      }
    }
  });

  it('puts the gap where each level says: the end, the middle, or the last two cars', () => {
    for (const plan of TRAIN_PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const { sequence, targets } = buildTrain(plan, new Rng(seed));
        if (plan.numberSteps) {
          expect(sequence).toHaveLength(plan.startAnywhere || plan.addRule ? START_CARS : NUMBER_CARS);
          expect(targets[0]).toBeGreaterThanOrEqual(plan.startAnywhere ? 1 : 2);
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
    for (const plan of TRAIN_PLANS) {
      for (let seed = 1; seed <= 200; seed++)
        expect(buildTrain(plan, new Rng(seed)).sequence.length, plan.name).toBeLessThanOrEqual(9);
    }
  });

  it('asks for every place in the repeat, so copying the first car is not the answer', () => {
    TRAIN_PLANS.forEach((plan, i) => {
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

  it('draws the tunnel as a full-size target, since tapping it says the count again', () => {
    expect(Math.min(TUNNEL_SIZE.w, TUNNEL_SIZE.h)).toBeGreaterThanOrEqual(100);
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
    let smallest = 0,
      largest = 0,
      notStep = 0;
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
    for (const plan of TRAIN_PLANS.filter((p) => !p.numberSteps && p.kind !== 'pair')) {
      const { sequence, choices } = buildTrain(plan, new Rng(5));
      for (const options of choices) for (const piece of sequence) expect(options).toContain(piece);
      for (const options of choices) expect(options).toEqual([0, 1, 2]);
    }
  });

  it('gives color and shape their own cycles, with the half-right pieces on offer', () => {
    const plan = PATTERN_PLANS.find((p) => p.kind === 'pair')!;
    const places = new Set<number>(),
      spots = new Set<number>(),
      looks = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const { sequence, targets, choices, look } = buildTrain(plan, new Rng(seed));
      expect(sequence).toHaveLength(PAIR_CARS);
      expect(look).toBeDefined();
      expect(new Set(look!.colors).size).toBe(2);
      expect(new Set(look!.shapes).size).toBe(2);
      looks.add(look!.colors.join() + look!.shapes.join());
      // The two attributes run on different periods: color alternates, shape holds for two cars.
      const colors = sequence.map(pieceColor),
        shapes = sequence.map(pieceShape);
      expect(colors.every((c, i) => i < 2 || c === colors[i - 2])).toBe(true);
      expect(colors.some((c, i) => i > 0 && c === colors[i - 1])).toBe(false);
      expect(shapes.every((s, i) => i < 4 || s === shapes[i - 4])).toBe(true);
      expect(shapes.some((s, i) => i > 0 && s === shapes[i - 1])).toBe(true);
      const t = targets[0],
        answer = sequence[t];
      // A car four places away shows the whole answer, and the gap is never the first car.
      expect(t).toBeGreaterThanOrEqual(1);
      expect(sequence[t - 4] ?? sequence[t + 4]).toBe(answer);
      // Four choices: the answer, same color other shape, same shape other color, and neither.
      expect(choices[0]).toHaveLength(PAIR_CHOICES);
      expect(new Set(choices[0]).size).toBe(PAIR_CHOICES);
      const rest = choices[0].filter((c) => c !== answer);
      expect(
        rest.filter((c) => pieceColor(c) === pieceColor(answer) && pieceShape(c) !== pieceShape(answer)),
      ).toHaveLength(1);
      expect(
        rest.filter((c) => pieceShape(c) === pieceShape(answer) && pieceColor(c) !== pieceColor(answer)),
      ).toHaveLength(1);
      expect(
        rest.filter((c) => pieceColor(c) !== pieceColor(answer) && pieceShape(c) !== pieceShape(answer)),
      ).toHaveLength(1);
      places.add(t % 4);
      spots.add(choices[0].indexOf(answer));
    }
    expect(places.size).toBe(4);
    expect(spots.size).toBe(PAIR_CHOICES);
    expect(looks.size).toBeGreaterThan(10);
  });

  it('makes each round of shapes or animals from one family of things, and every family turns up', () => {
    for (const trio of ANIMAL_TRIOS) expect(new Set(trio).size).toBe(3);
    expect(new Set(ANIMAL_TRIOS.map((t) => [...t].sort().join())).size).toBe(ANIMAL_TRIOS.length);
    for (const plan of TRAIN_PLANS) {
      const seen = new Set<number | undefined>();
      for (let seed = 1; seed <= 200; seed++) seen.add(buildTrain(plan, new Rng(seed)).family);
      const count =
        plan.kind === 'shape' ? SHAPE_FAMILIES.length : plan.kind === 'animal' ? ANIMAL_TRIOS.length : 0;
      expect(seen.size, plan.name).toBe(Math.max(count, 1));
      if (!count) expect(seen.has(undefined), plan.name).toBe(true);
    }
  });

  it('builds the same train and family for the same seed', () => {
    const plan = TRAIN_PLANS[3];
    const a = buildTrain(plan, new Rng(9)),
      b = buildTrain(plan, new Rng(9));
    expect(a).toEqual(b);
  });

  it('hides one wrong car in the spot-the-mistake trains, and the mended train is a perfect pattern', () => {
    const extra = PATTERN_PLANS.find((p) => p.odd === 'extra')!,
      swap = PATTERN_PLANS.find((p) => p.odd === 'swap')!;
    const extraAt = new Set<number>(),
      swapAt = new Set<number>();
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
      for (let slot = 0; slot < 3; slot++)
        expect(
          b.shown!.filter((v, i) => i % 3 === slot && i !== b.targets[0] && v === b.sequence[slot]),
        ).toHaveLength(slot === b.targets[0] % 3 ? 2 : 3);
      expect(b.choices[0]).toEqual([0, 1, 2]);
      expect(wantedChoice(b.sequence, b.targets, b.choices, 0)).toBe(
        b.choices[0].indexOf(b.sequence[b.targets[0]]),
      );
      swapAt.add(b.targets[0]);
    }
    expect(extraAt.size).toBe(ODD_CARS.extra - 2);
    expect(swapAt.size).toBe(ODD_CARS.swap);
  });

  it('names structures by their shape, not their pieces', () => {
    expect(structure([2, 2, 0, 2, 2, 0])).toBe(structure([1, 1, 2, 1, 1, 2]));
    expect(structure([0, 0, 1, 0, 0, 1])).not.toBe(structure([0, 1, 1, 0, 1, 1]));
  });

  it('gives the row level exactly one row that repeats the model, the others other structures', () => {
    const answers = new Set<number>(),
      units = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const r = buildMatch(new Rng(seed));
      expect(r.model).toHaveLength(MATCH_CARS);
      expect(r.rows).toHaveLength(3);
      r.rows.forEach((row) => {
        expect(row).toHaveLength(MATCH_CARS);
        expect(row.every((p) => p >= 0 && p < 3)).toBe(true);
      });
      const same = r.rows
        .map((row, i) => (structure(row) === structure(r.model) ? i : -1))
        .filter((i) => i >= 0);
      expect(same).toEqual([r.answer]);
      expect(new Set(r.rows.map(structure)).size).toBe(3);
      expect(
        MATCH_UNITS.some(
          (u) =>
            structure(Array.from({ length: MATCH_CARS }, (_, i) => u[i % u.length])) === structure(r.model),
        ),
      ).toBe(true);
      answers.add(r.answer);
      units.add(structure(r.model));
    }
    expect(answers.size).toBe(3);
    expect(units.size).toBe(MATCH_UNITS.length);
  });

  it('lets a build use any animals that keep the model structure, and always has one that fits', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { model } = buildMatch(new Rng(seed));
      // Every way of filling the cars left to right, always choosing among the valid pieces, copies the model's structure.
      const rng = new Rng(seed + 1000);
      const placed: number[] = [];
      while (placed.length < MATCH_CARS) {
        const valid = validPieces(model, placed);
        expect(valid.length).toBeGreaterThan(0);
        placed.push(rng.pick(valid));
      }
      expect(structure(placed)).toBe(structure(model));
    }
    // The first car takes any piece; a repeated car must match, a new one must differ.
    expect(validPieces([0, 0, 1], [])).toEqual([0, 1, 2]);
    expect(validPieces([0, 0, 1], [2])).toEqual([2]);
    expect(validPieces([0, 1, 1], [2])).toEqual([0, 1]);
    expect(validPieces([0, 0, 1], [2, 2])).toEqual([0, 1]);
  });

  it('has a choice on offer for every empty car, in order, that fits the pattern', () => {
    for (const plan of TRAIN_PLANS) {
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

  describe('says the rule back after the answer that ends the round (TotoLogic P7)', () => {
    const plain = TRAIN_PLANS.filter((p) => !p.match && !p.numberSteps && p.kind !== 'pair');

    it("says the finished train's repeating unit once, in the order the train shows it, with the extra car left out", () => {
      for (const plan of plain) {
        for (let seed = 1; seed <= 80; seed++) {
          const train = buildTrain(plan, new Rng(seed));
          const said = patternSaid(plan, train);
          const unit = plan.pattern.length;
          const clean = train.sequence.filter((_, i) => plan.odd !== 'extra' || i !== train.targets[0]);
          const names = said.vars.list.toString().split(', ');
          expect(names, plan.name).toHaveLength(unit);
          // What is said is the train itself: each name is the piece at that place on the finished train, and every
          // later car repeats it (a tunnel's last car comes out after the hidden ones, so it is not in step).
          (plan.tunnel ? clean.slice(0, -1) : clean).forEach((piece, i) =>
            expect(pieceName(plan.kind, train.family, piece), plan.name).toBe(names[i % unit]),
          );
          // Different pieces get different names, so the pattern can be heard.
          const distinct = new Set(plan.pattern).size;
          expect(new Set(names).size, plan.name).toBe(distinct);
          if (plan.odd === 'extra') {
            expect(said.key).toBe('pattern.oddWhy');
            expect(said.vars.piece).toBe(
              pieceName(plan.kind, train.family, train.sequence[train.targets[0]]),
            );
            expect(names).not.toContain(said.vars.piece);
          } else expect(said.key).toBe(plan.kind === 'bell' ? 'pattern.whyBells' : 'pattern.why');
        }
      }
    });

    it("names the step of a numbered train and a color-and-shape train's two cycles", () => {
      const number = PATTERN_PLANS.find((p) => p.numberSteps)!;
      const pair = PATTERN_PLANS.find((p) => p.kind === 'pair')!;
      for (let seed = 1; seed <= 60; seed++) {
        const n = buildTrain(number, new Rng(seed));
        const saidN = patternSaid(number, n);
        expect(saidN.key).toBe('pattern.whyNumber');
        expect(number.numberSteps).toContain(saidN.vars.step);
        expect(saidN.vars.list).toBe(n.sequence.slice(0, 4).join(', '));
        const p = buildTrain(pair, new Rng(seed));
        const saidP = patternSaid(pair, p);
        expect(saidP.key).toBe('pattern.whyPair');
        const colors = saidP.vars.colors.toString().split(', ');
        const shapes = saidP.vars.shapes.toString().split(', ');
        // The color alternates; the shape holds for two cars.
        expect(colors[0]).toBe(colors[2]);
        expect(colors[0]).not.toBe(colors[1]);
        expect(shapes[0]).toBe(shapes[1]);
        expect(shapes[2]).toBe(shapes[3]);
        expect(shapes[1]).not.toBe(shapes[2]);
      }
    });

    it('has a line for every key it can say, each with the slots it fills', () => {
      for (const [key, slots] of [
        ['pattern.why', ['list']],
        ['pattern.whyBells', ['list']],
        ['pattern.whyNumber', ['step', 'list']],
        ['pattern.whyPair', ['colors', 'shapes']],
        ['pattern.oddWhy', ['piece', 'list']],
      ] as const) {
        for (const slot of slots) expect(SCRIPT[key][0], key).toContain(`{${slot}}`);
      }
    });
  });
});

describe('Pattern Train Make your own (level 17)', () => {
  const units: number[][] = [];
  for (let a = 0; a < CHOICES; a++) {
    units.push([a]);
    for (let b = 0; b < CHOICES; b++) {
      units.push([a, b]);
      for (let c = 0; c < CHOICES; c++) units.push([a, b, c]);
    }
  }

  it('is the school level after 16, a plan of its own with no train to build', () => {
    expect(PATTERN_PLANS.slice(0, 17)).toHaveLength(17);
    expect(patternPlan(17).make).toBe(true);
    expect(PATTERN_PLANS.filter((p) => p.make)).toHaveLength(1);
    expect(LEVELS.school?.min).toBe(8);
    expect(LEVELS.prek?.max).toBe(9);
    expect(LEVELS.preschool?.max).toBe(6);
  });

  it('takes one to three pieces and never more; a full unit ignores the next tap', () => {
    let unit: number[] = [];
    for (const p of [2, 0, 1, 2, 0]) unit = addToUnit(unit, p);
    expect(unit).toEqual([2, 0, 1]);
    expect(unit).toHaveLength(MAKE_UNIT_MAX);
    expect(addToUnit([], 3)).toEqual([]);
    expect(addToUnit([], -1)).toEqual([]);
  });

  it('lets her take a car back out, and Go needs at least one piece', () => {
    expect(removeFromUnit([0, 1, 2], 1)).toEqual([0, 2]);
    expect(removeFromUnit([1], 0)).toEqual([]);
    expect(canGo([])).toBe(false);
    for (const unit of units) expect(canGo(unit)).toBe(true);
    expect(canGo([0, 1, 2, 0])).toBe(false);
  });

  it('runs every unit she can choose round exactly three times, in at most nine cars', () => {
    expect(units).toHaveLength(3 + 9 + 27);
    for (const unit of units) {
      const train = makeTrain(unit);
      expect(train).toHaveLength(unit.length * MAKE_REPEATS);
      expect(train.length).toBeLessThanOrEqual(9);
      for (let r = 0; r < MAKE_REPEATS; r++)
        expect(train.slice(r * unit.length, (r + 1) * unit.length)).toEqual(unit);
    }
  });

  it('says her unit by name for every family, so the line has no empty slot', () => {
    for (let family = 0; family < SHAPE_FAMILIES.length; family++) {
      expect(madeList(family, [0, 0, 2])).toBe(
        [0, 0, 2].map((p) => pieceName('shape', family, p)).join(', '),
      );
      for (const unit of units) expect(madeList(family, unit)).not.toMatch(/undefined|NaN|^$/);
    }
    expect(SCRIPT['pattern.made'][0]).toContain('{list}');
    expect(SCRIPT['pattern.make'][0]).toContain('{name}');
  });
});

describe('Pattern Train Stairs (level 18)', () => {
  const plan = patternPlan(18);
  const rounds = Array.from({ length: 300 }, (_, i) => buildTrain(plan, new Rng(i + 1)));

  it('is the school level after 17, and still only grows by one', () => {
    expect(plan.stairs).toBe(true);
    expect(plan.kind).toBe('stack');
    expect(plan.stackSteps).toBeUndefined();
  });

  it('grows strictly by one and the empty car is the last, one more than the car before', () => {
    for (const { sequence, targets } of rounds) {
      expect(sequence).toHaveLength(STAIR_CARS);
      expect(targets).toEqual([STAIR_CARS - 1]);
      sequence.forEach((n, i) => expect(n).toBe(sequence[0] + i));
      expect(sequence[0]).toBeGreaterThanOrEqual(STAIR_START.min);
      expect(sequence[0]).toBeLessThanOrEqual(STAIR_START.max);
    }
  });

  it('offers the answer, no growth and one too many, never more than nine counters', () => {
    for (const { sequence, choices } of rounds) {
      const answer = sequence[STAIR_CARS - 1];
      expect([...choices[0]].sort((a, b) => a - b)).toEqual([answer - 1, answer, answer + 1]);
      expect(choices[0]).toContain(sequence[STAIR_CARS - 2]);
      expect(Math.max(...choices[0], ...sequence)).toBeLessThanOrEqual(STACK_MAX);
      expect(Math.min(...choices[0])).toBeGreaterThanOrEqual(1);
    }
  });

  it('puts the answer first, middle and last about equally often, and wantedChoice finds it', () => {
    const at = [0, 0, 0];
    for (const { sequence, targets, choices } of rounds) {
      const want = wantedChoice(sequence, targets, choices, 0);
      expect(choices[0][want]).toBe(sequence[targets[0]]);
      at[want]++;
    }
    for (const n of at) expect(n).toBeGreaterThan(60);
  });

  it('says the rule back with the counts, and its lines have their slots', () => {
    const { sequence, targets } = rounds[0];
    const said = patternSaid(plan, { sequence, targets });
    expect(said.key).toBe('pattern.whyStack');
    expect(said.vars.list).toBe(sequence.join(', '));
    expect(SCRIPT['pattern.whyStack'][0]).toContain('{list}');
    expect(SCRIPT['pattern.count'][0]).toContain('{n}');
    expect(SCRIPT['pattern.stairs'][0]).toContain('{name}');
  });
});

describe('Pattern Train Up and down (level 19)', () => {
  const plan = patternPlan(19);
  const rounds = Array.from({ length: 400 }, (_, i) => buildTrain(plan, new Rng(i + 1)));
  const stepOf = (seq: readonly number[]) => seq[1] - seq[0];

  it('is the school level after 18, and the ladder ends there', () => {
    expect(plan.kind).toBe('stack');
    expect(plan.stackSteps).toEqual([-2, -1, 1, 2]);
    expect(PATTERN_PLANS.length).toBeGreaterThanOrEqual(19);
    expect(LEVELS.school?.min).toBe(8);
  });

  it('steps exactly by one or two, up or down, all four kinds, every stack 1 to 10', () => {
    const kinds = new Set<number>();
    for (const { sequence, targets } of rounds) {
      expect(sequence).toHaveLength(STAIR_CARS);
      expect(targets).toEqual([STAIR_CARS - 1]);
      const step = stepOf(sequence);
      kinds.add(step);
      expect([-2, -1, 1, 2]).toContain(step);
      sequence.forEach((n, i) => expect(n).toBe(sequence[0] + i * step));
      expect(Math.min(...sequence)).toBeGreaterThanOrEqual(1);
      expect(Math.max(...sequence)).toBeLessThanOrEqual(STACK_TOP);
    }
    expect([...kinds].sort((a, b) => a - b)).toEqual([-2, -1, 1, 2]);
  });

  it('offers the answer, the step the other way and one off, all different and in range', () => {
    for (const { sequence, choices } of rounds) {
      const answer = sequence[STAIR_CARS - 1];
      const [c] = choices;
      expect(new Set(c).size).toBe(3);
      expect(c).toContain(answer);
      expect(c).toContain(sequence[STAIR_CARS - 3]);
      expect(c.filter((n) => Math.abs(n - answer) === 1)).toHaveLength(1);
      for (const n of c) {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(STACK_TOP);
      }
    }
  });

  it('puts the answer first, middle and last about equally often, and wantedChoice finds it', () => {
    const at = [0, 0, 0];
    for (const { sequence, targets, choices } of rounds) {
      const want = wantedChoice(sequence, targets, choices, 0);
      expect(choices[0][want]).toBe(sequence[targets[0]]);
      at[want]++;
    }
    for (const n of at) expect(n).toBeGreaterThan(80);
  });

  it('says the step back, up or down, and its lines have their slots', () => {
    expect(stepWords(1)).toBe('one more');
    expect(stepWords(-2)).toBe('two fewer');
    const { sequence, targets } = rounds.find((r) => stepOf(r.sequence) === -2)!;
    const said = patternSaid(plan, { sequence, targets });
    expect(said.key).toBe('pattern.whyStep');
    expect(said.vars.how).toBe('two fewer');
    expect(said.vars.list).toBe(sequence.join(', '));
    expect(SCRIPT['pattern.whyStep'][0]).toContain('{how}');
    expect(SCRIPT['pattern.steps'][0]).toContain('{name}');
  });
});

describe('Pattern Train Start anywhere (level 20)', () => {
  const plan = patternPlan(20);
  const rounds = Array.from({ length: 400 }, (_, i) => buildTrain(plan, new Rng(i + 1)));

  it('is a school level, a numbered train that is not the level 12 one', () => {
    expect(plan.startAnywhere).toBe(true);
    expect(plan.kind).toBe('number');
    expect(LEVELS.school?.max).toBeGreaterThanOrEqual(20);
    expect(patternPlan(12).startAnywhere).toBeUndefined();
  });

  it('counts exactly by its step from a first car that is not a multiple, within 1 to 100', () => {
    const steps = new Set<number>();
    for (const { sequence, choices } of rounds) {
      expect(sequence).toHaveLength(START_CARS);
      const step = sequence[1] - sequence[0];
      steps.add(step);
      expect(plan.numberSteps).toContain(step);
      sequence.forEach((n, i) => expect(n).toBe(sequence[0] + i * step));
      expect(sequence[0] % step).not.toBe(0);
      expect(sequence[0]).toBeGreaterThanOrEqual(1);
      expect(Math.max(...sequence, ...choices[0])).toBeLessThanOrEqual(NUMBER_TOP);
      expect(Math.min(...choices[0])).toBeGreaterThanOrEqual(1);
    }
    expect([...steps].sort((a, b) => a - b)).toEqual([2, 3, 4, 5, 10]);
  });

  it('leaves any car but the first empty, and offers one answer among distinct near misses', () => {
    const places = new Set<number>();
    let smallest = 0;
    let largest = 0;
    for (const { sequence, targets, choices } of rounds) {
      const t = targets[0];
      places.add(t);
      expect(targets).toHaveLength(1);
      expect(t).toBeGreaterThanOrEqual(1);
      const answer = sequence[t];
      const [c] = choices;
      expect(c).toHaveLength(CHOICES);
      expect(new Set(c).size).toBe(CHOICES);
      expect(c.filter((n) => n === answer)).toHaveLength(1);
      // Every wrong choice is the car before, or within a step and one of the answer: a plausible slip.
      const step = sequence[1] - sequence[0];
      for (const n of c.filter((v) => v !== answer)) {
        expect(Math.abs(n - answer) <= step + 1).toBe(true);
      }
      if (answer === Math.min(...c)) smallest++;
      if (answer === Math.max(...c)) largest++;
    }
    expect([...places].sort()).toEqual([1, 2, 3, 4, 5]);
    expect(smallest).toBeGreaterThan(40);
    expect(largest).toBeGreaterThan(40);
    expect(smallest + largest).toBeLessThan(rounds.length);
  });

  it('is found by counting: wantedChoice finds the answer and the "say why" line has its slots', () => {
    for (const { sequence, targets, choices } of rounds.slice(0, 100)) {
      const want = wantedChoice(sequence, targets, choices, 0);
      expect(choices[0][want]).toBe(sequence[targets[0]]);
    }
    const { sequence, targets } = rounds[0];
    const said = patternSaid(plan, { sequence, targets });
    expect(said.key).toBe('pattern.whyNumber');
    expect(said.vars.step).toBe(sequence[1] - sequence[0]);
  });
});

describe('Pattern Train Add three, add four (level 21)', () => {
  const plan = patternPlan(21);
  const rounds = Array.from({ length: 400 }, (_, i) => buildTrain(plan, new Rng(i + 1)));

  it('is the top school level, and the only level that asks for the rule', () => {
    expect(plan.addRule).toBe(true);
    expect(PATTERN_PLANS).toHaveLength(21);
    expect(LEVELS.school).toEqual({ min: 8, max: 21 });
    for (const r of rounds) expect(r.rule).toBeDefined();
    for (let level = 1; level <= 20; level++) {
      const p = patternPlan(level);
      if (p.make || p.match) continue; // their own rounds, never through buildTrain
      for (let seed = 1; seed <= 40; seed++)
        expect(buildTrain(p, new Rng(seed)).rule, p.name).toBeUndefined();
    }
  });

  it('counts exactly by 3 or 4 from a start of 1 to 20, the last car empty, every car 1 to 40', () => {
    const steps = new Set<number>();
    for (const { sequence, targets, rule } of rounds) {
      expect(sequence).toHaveLength(ADD_CARS);
      expect(targets).toEqual([ADD_CARS - 1]);
      const step = rule!.step;
      steps.add(step);
      sequence.forEach((n, i) => i > 0 && expect(n - sequence[i - 1]).toBe(step));
      expect(sequence[0]).toBeGreaterThanOrEqual(1);
      expect(sequence[0]).toBeLessThanOrEqual(20);
      expect(Math.max(...sequence)).toBeLessThanOrEqual(40);
    }
    expect([...steps].sort()).toEqual([3, 4]);
  });

  it('always offers +3 and +4, a third chip of 2 or 5, and the right chip in every place', () => {
    const thirds = new Set<number>();
    const places = new Set<number>();
    for (const { rule } of rounds) {
      const { choices, step } = rule!;
      expect(choices).toHaveLength(3);
      expect(choices).toContain(3);
      expect(choices).toContain(4);
      const third = choices.find((c) => c !== 3 && c !== 4)!;
      expect([2, 5]).toContain(third);
      thirds.add(third);
      places.add(choices.indexOf(step));
    }
    expect([...thirds].sort()).toEqual([2, 5]);
    expect([...places].sort()).toEqual([0, 1, 2]);
  });

  it('offers three distinct numbers: the answer once, the wrong-step slip always, the answer in every order', () => {
    let smallest = 0;
    let middle = 0;
    let largest = 0;
    for (const { sequence, choices, rule } of rounds) {
      const [c] = choices;
      const answer = sequence[ADD_CARS - 1];
      const last = sequence[ADD_CARS - 2];
      expect(c).toHaveLength(CHOICES);
      expect(new Set(c).size).toBe(CHOICES);
      expect(c.filter((n) => n === answer)).toHaveLength(1);
      expect(c).toContain(last + (7 - rule!.step));
      expect(Math.min(...c)).toBeGreaterThan(0);
      const sorted = [...c].sort((a, b) => a - b);
      if (sorted[0] === answer) smallest++;
      else if (sorted[1] === answer) middle++;
      else largest++;
    }
    expect(smallest).toBeGreaterThan(0);
    expect(middle).toBeGreaterThan(0);
    expect(largest).toBeGreaterThan(0);
  });

  it('gives hints that lead somewhere and says the rule back with its slots', () => {
    for (const { sequence, targets, choices, rule } of rounds.slice(0, 100)) {
      const list = countOn(sequence[0], rule!.step);
      expect(list).toHaveLength(rule!.step);
      expect(list[list.length - 1]).toBe(sequence[1]);
      expect(choices[0][wantedChoice(sequence, targets, choices, 0)]).toBe(sequence[ADD_CARS - 1]);
      const said = patternSaid(plan, { sequence, targets });
      expect(said.key).toBe('pattern.whyAdd');
      expect(said.vars.step).toBe(rule!.step);
      expect(said.vars.list).toBe(sequence.join(', '));
    }
    expect(SCRIPT['pattern.whyAdd'][0]).toContain('{step}');
    expect(SCRIPT['pattern.whyAdd'][0]).toContain('{list}');
    for (const slot of ['from', 'list', 'step']) expect(SCRIPT['pattern.ruleHint'][0]).toContain(`{${slot}}`);
    expect(SCRIPT['pattern.addWrong'][0]).toContain('{last}');
    expect(SCRIPT['pattern.ruleRight'][0]).toContain('{step}');
    expect(SCRIPT['pattern.rule'][0]).toContain('{name}');
  });

  it('describes level 21 by its plan name', () => {
    expect(plan.name).toBe('Add three, add four: find the rule, then the next number');
  });
});
