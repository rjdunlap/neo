import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { restPoints } from '../../creatures/companion';
import { SPECIES_IDS } from '../../creatures/species';
import { WISHES, wishEnding, bubbleToTap, CLUES, REACTIONS, feelingPlan, CARE_ONLY, CARE_SCENARIOS, choiceToTap, EVENTS, FACE_MAX_GROW, FACE_PARTS, faceFrame, FEELING_PLANS, FEELINGS, feelingRound, HELPERS, LEVELS, NEEDS, playDone, pokeAfter, pokeDone, POKE_TAPS, type Feeling, type PokeStep } from './logic';
import { landing, levelsInOrder, nextLevel } from '../../progress/difficulty';

describe('Feelings Faces questions', () => {
  it('always offer the answer once among distinct choices, without repeating a prompt back to back', () => {
    for (const plan of FEELING_PLANS.filter((p) => p.mode !== 'play')) {
      for (let seed = 1; seed <= 200; seed++) {
        const qs = feelingRound(plan, new Rng(seed));
        expect(qs).toHaveLength(plan.rounds);
        qs.forEach((q, i) => {
          expect(q.options, `${plan.name} seed ${seed}`).toHaveLength(plan.choices);
          expect(new Set(q.options).size).toBe(q.options.length);
          expect(q.options.filter((o) => o === q.answer)).toHaveLength(1);
          if (i > 0) expect(q.prompt).not.toBe(qs[i - 1].prompt);
        });
      }
    }
  });

  it('matches each need and event to one unambiguous answer', () => {
    expect(new Set(Object.values(HELPERS)).size).toBe(NEEDS.length);
    expect(Object.keys(EVENTS)).toHaveLength(8);
    for (const feeling of Object.values(EVENTS)) expect(FEELINGS).toContain(feeling);
    // Every feeling has a happening that causes it, so a round can ask for each.
    for (const feeling of FEELINGS) expect(Object.values(EVENTS)).toContain(feeling);
    const help = feelingRound(FEELING_PLANS.find((p) => p.mode === 'help')!, new Rng(3));
    for (const q of help) expect(q.answer).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
  });

  it('shows four different happenings in a level-6 round, drawn from the whole pool', () => {
    const plan = FEELING_PLANS.find((p) => p.mode === 'why')!;
    const seen = new Set<string>();
    for (let seed = 1; seed <= 200; seed++) {
      const qs = feelingRound(plan, new Rng(seed));
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(4);
      for (const q of qs) expect(q.answer).toBe(EVENTS[q.prompt as keyof typeof EVENTS]);
      qs.forEach((q) => seen.add(q.prompt));
    }
    expect(seen).toEqual(new Set(Object.keys(EVENTS)));
  });

  it('pairs each level-8 happening with a need and its helper, four different happenings a round', () => {
    for (const scenario of Object.values(CARE_SCENARIOS)) expect(HELPERS[scenario.need]).toBe(scenario.helper);
    // Between them the happenings ask for every helper, and the care-only ones never reach level 6.
    expect(new Set(Object.values(CARE_SCENARIOS).map((c) => c.helper))).toEqual(new Set(Object.values(HELPERS)));
    for (const e of CARE_ONLY) expect(Object.keys(EVENTS)).not.toContain(e);
    const plan = FEELING_PLANS.find((p) => p.mode === 'care')!;
    for (let seed = 1; seed <= 200; seed++) {
      const qs = feelingRound(plan, new Rng(seed));
      expect(qs).toHaveLength(4);
      expect(new Set(qs.map((q) => q.prompt)).size).toBe(4);
      // Four different happenings ask for at least three different helpers.
      expect(new Set(qs.map((q) => q.answer)).size).toBeGreaterThanOrEqual(3);
      for (const q of qs) {
        const scenario = CARE_SCENARIOS[q.prompt as keyof typeof CARE_SCENARIOS];
        expect(q.answer).toBe(scenario.helper);
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.options[choiceToTap(q)]).toBe(scenario.helper);
      }
    }
  });

  it('shows every friend a different feeling on the friends level', () => {
    const plan = FEELING_PLANS.find((p) => p.mode === 'friends')!;
    for (const q of feelingRound(plan, new Rng(9))) expect([...q.options].sort()).toEqual([...FEELINGS].sort());
  });

  it("touches the one choice that answers every question, on every level and seed (the demonstration's finger)", () => {
    for (const plan of FEELING_PLANS.filter((p) => p.mode !== 'play')) {
      for (let seed = 1; seed <= 200; seed++) {
        for (const q of feelingRound(plan, new Rng(seed))) {
          const at = choiceToTap(q);
          expect(at, `${plan.name} seed ${seed}`).toBeGreaterThanOrEqual(0);
          expect(q.options[at]).toBe(q.answer);
          // The friends level deals each friend the feeling at their place, so the friend touched shows the one asked for.
          if (plan.mode === 'friends') expect(q.options.filter((o) => o === q.options[at])).toHaveLength(1);
          if (plan.mode === 'help') expect(q.options[at]).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
          if (plan.mode === 'why') expect(q.options[at]).toBe(EVENTS[q.prompt as keyof typeof EVENTS]);
        }
      }
    }
  });

  it('ends free play after every feeling and six taps, or twelve taps of anything', () => {
    expect(playDone(new Set(FEELINGS), 5)).toBe(false);
    expect(playDone(new Set(FEELINGS), 6)).toBe(true);
    expect(playDone(new Set<Feeling>(['happy', 'sad']), 11)).toBe(false);
    expect(playDone(new Set<Feeling>(['happy']), 12)).toBe(true);
  });

  it('plays free play for the demonstration by showing each feeling once, then finishing, with no wasted taps', () => {
    const tried = new Set<Feeling>();
    let taps = 0;
    const order: Feeling[] = [];
    while (!playDone(tried, taps) && taps < 20) {
      const f = bubbleToTap(tried, taps);
      order.push(f);
      tried.add(f);
      taps++;
    }
    expect(playDone(tried, taps)).toBe(true);
    expect(tried.size).toBe(FEELINGS.length);
    expect(taps).toBe(6);
    // The first four taps show four different feelings; only then does it repeat.
    expect(new Set(order.slice(0, 4)).size).toBe(4);
  });
});

describe('Feelings Faces cards frame the companion’s face (RW05 slice 2)', () => {
  it('grows every species’ face to fill the card, its parts inside the window, without blurring past the cap', () => {
    for (const s of SPECIES_IDS) {
      const points = FACE_PARTS.flatMap((p) => restPoints(s, p));
      expect(points.length, s).toBeGreaterThanOrEqual(5);
      for (const size of [150, 128]) {
        const f = faceFrame(points, size);
        expect(f.scale, s).toBeLessThanOrEqual(FACE_MAX_GROW);
        const on = points.map((p) => ({ x: p.x * f.scale + f.x, y: p.y * f.scale + f.y }));
        // Every part sits well inside the window (the bubble's is a circle of 74).
        for (const p of on) expect(Math.hypot(p.x, p.y), `${s} ${size}`).toBeLessThan(size / 2);
        // The face is at least a third of the card across: the pip's whole-body card gave the river's about 18 units.
        const span = Math.max(Math.max(...on.map((p) => p.x)) - Math.min(...on.map((p) => p.x)), Math.max(...on.map((p) => p.y)) - Math.min(...on.map((p) => p.y)));
        expect(span, `${s} ${size}`).toBeGreaterThan(size / 3);
      }
    }
  });
});

describe('Feelings Faces level 9 Poke a feeling', () => {
  const cycle = (taps: number) => {
    const out: PokeStep[] = [];
    let prev: PokeStep | null = null;
    for (let i = 0; i < taps; i++) out.push((prev = pokeAfter(prev)));
    return out;
  };

  it('shows every feeling within five taps, and the hug follows sad exactly once a cycle', () => {
    expect(new Set(cycle(5).filter((s) => s !== 'hug'))).toEqual(new Set(FEELINGS));
    const long = cycle(40);
    long.forEach((s, i) => expect(s === 'hug').toBe(i > 0 && long[i - 1] === 'sad'));
    // After the hug leaves the pet happy, the next poke changes its face rather than repeating happy.
    long.forEach((s, i) => { if (s === 'hug') expect(long[i + 1] ?? 'surprised').toBe('surprised'); });
  });

  it('ends after six taps with a whole cycle and its hug shown', () => {
    expect(pokeDone(POKE_TAPS - 1)).toBe(false);
    expect(pokeDone(POKE_TAPS)).toBe(true);
    expect(cycle(POKE_TAPS)).toEqual(['happy', 'surprised', 'sleepy', 'sad', 'hug', 'surprised']);
  });

  it('is a question-free plan and lap’s entry, keeping every saved level 1–8', () => {
    expect(FEELING_PLANS[8].mode).toBe('poke');
    expect(feelingRound(FEELING_PLANS[8], new Rng(1))).toEqual([]);
    expect(LEVELS.lap!.order).toEqual([9, 1, 2]);
    expect(levelsInOrder(LEVELS.lap!)).toEqual([9, 1, 2]);
    expect(nextLevel(0, [], LEVELS.lap!)).toBe(9);
    for (const band of ['toddler', 'preschool', 'prek'] as const) expect(landing(9, LEVELS[band]!, [9])).toBe(LEVELS[band]!.min);
    for (const level of [1, 2]) expect(landing(level, LEVELS.lap!, [9])).toBe(level);
  });
});

describe('Helping and explaining happenings batch', () => {
  it('keeps cold out of the two-choice toddler entry, and practices every other need', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const qs = feelingRound(feelingPlan(10), new Rng(seed));
      expect(new Set(qs.map((q) => q.prompt))).toEqual(new Set(['sad', 'sleepy', 'hungry']));
      for (const q of qs) {
        seen.add(q.prompt);
        expect(q.options).toHaveLength(2);
        expect(q.answer).toBe(HELPERS[q.prompt as keyof typeof HELPERS]);
      }
    }
    expect(seen.has('cold')).toBe(false);
    expect(levelsInOrder(LEVELS.toddler!)).toEqual([2, 10, 3, 4]);
  });

  it('asks about both friends for each happening, showing different reactions to the same thing', () => {
    const seen = new Set<string>();
    for (const pair of Object.values(REACTIONS)) expect(pair[0]).not.toBe(pair[1]);
    for (let seed = 1; seed <= 100; seed++) {
      const qs = feelingRound(feelingPlan(11), new Rng(seed));
      for (const offset of [0, 2]) {
        const [first, second] = qs.slice(offset, offset + 2);
        expect(first.event).toBe(second.event);
        expect([first.friend, second.friend]).toEqual([0, 1]);
        expect(first.answer).not.toBe(second.answer);
        for (const q of [first, second]) {
          seen.add(q.event!);
          expect(q.answer).toBe(REACTIONS[q.event!][q.friend!]);
          expect(q.options[choiceToTap(q)]).toBe(q.answer);
        }
      }
      expect(qs[0].event).not.toBe(qs[2].event);
    }
    expect(seen).toEqual(new Set(Object.keys(REACTIONS)));
  });

  it('uses a unique clue for every happening, including the two sad faces, and deals all four', () => {
    expect(new Set(Object.values(CLUES)).size).toBe(Object.keys(CLUES).length);
    expect(EVENTS.balloon).toBe(EVENTS.rain);
    expect(CLUES.balloon).not.toBe(CLUES.rain);
    for (let seed = 1; seed <= 100; seed++) {
      const qs = feelingRound(feelingPlan(13), new Rng(seed));
      expect(new Set(qs.map((q) => q.prompt))).toEqual(new Set(Object.keys(CLUES)));
      for (const q of qs) {
        expect(q.answer).toBe(q.prompt);
        expect(new Set(q.options.map((o) => CLUES[o as keyof typeof CLUES])).size).toBe(3);
      }
    }
  });

  it('keeps old IDs and pins with Ask first between the school levels', () => {
    expect(levelsInOrder(LEVELS.prek!)).toEqual([5, 6, 7, 8, 11]);
    expect(levelsInOrder(LEVELS.school!)).toEqual([11, 12, 13]);
    expect(feelingPlan(13).mode).toBe('clue');
    for (const level of [5, 6, 7, 8]) expect(landing(level, LEVELS.prek!, [9])).toBe(level);
    expect(landing(3, LEVELS.toddler!, [9])).toBe(3);
    expect(feelingPlan(12).mode).toBe('ask');
  });
});


describe('Ask first', () => {
  it('offers every stated wish once in four questions, including quiet space, for every seeded round', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const qs = feelingRound(feelingPlan(12), new Rng(seed));
      expect(qs).toHaveLength(4);
      expect(new Set(qs.map((q) => q.answer))).toEqual(new Set(WISHES));
      expect(qs.filter((q) => q.answer === 'quiet')).toHaveLength(1);
      for (const q of qs) {
        expect(q.answer).toBe(q.prompt);
        expect(new Set(q.options)).toEqual(new Set(WISHES));
        expect(q.options[choiceToTap(q)]).toBe(q.prompt);
      }
    }
  });
  it('accepts calm after quiet space, a hug or a grown-up; a game may end happy', () => {
    for (const wish of WISHES) expect(wishEnding(wish)).toBe(wish === 'game' ? 'happy' : 'calm');
  });
});
