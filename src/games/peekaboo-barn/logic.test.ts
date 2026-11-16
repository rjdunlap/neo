import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import {
  ANIMALS,
  STICKER_ANIMALS,
  SCENES,
  roundScene,
  COVER_NAMES,
  FEELINGS,
  FEELING_WORDS,
  FEELING_CHANCE,
  nearestSpot,
  pickFeeling,
  shouldNudge,
  shouldSelfOpen,
  planFor,
  ONE_DOOR_LEVEL,
  SELF_OPEN_SECONDS,
  deal,
  newcomer,
  pickTarget,
  PLANS,
  spotToTap,
  LEVELS,
  PART_IDS,
  CLUE_FEELINGS,
  hasPart,
  factAbout,
  dealClue,
  dealPair,
  hasFeature,
  pairFeedback,
  clueKindFor,
  holders,
  uniqueParts,
  topOf,
  topsDiffer,
  dealTops,
  poolFor,
  NEW_ANIMALS,
  NEWCOMER_LEVEL,
  VOICES,
  applySwaps,
  dealSwaps,
  MAX_SWAPS,
  SWAP_SECONDS,
  SLOW_SWAP_SECONDS,
  type Animal,
  type Feeling,
} from './logic';

describe('Peekaboo Barn', () => {
  it('preserves old sticker choices and supplies a distinct spoken name for each cover', () => {
    expect(STICKER_ANIMALS).toEqual(['cow', 'duck', 'pig', 'cat', 'dog', 'bunny', 'bear']);
    expect(Object.fromEntries(Object.entries(COVER_NAMES).slice(0, 4))).toEqual({
      hay: 'haystack',
      bush: 'bush',
      door: 'door',
      crate: 'crate',
    });
    expect(new Set(Object.values(COVER_NAMES)).size).toBe(16);
    for (const id of ['peek.found', 'peek.yes'] as const) {
      for (const line of SCRIPT[id]) expect(line).toContain('{cover}');
    }
  });

  it('deals named distinct covers in any seeded setting at every level', () => {
    const seen = new Set<string>();
    for (const plan of PLANS)
      for (let seed = 1; seed <= 200; seed++) {
        const scene = roundScene(new Rng(seed), plan.spots);
        expect(scene).toEqual(roundScene(new Rng(seed), plan.spots));
        expect(scene.covers).toHaveLength(plan.spots);
        expect(new Set(scene.covers).size).toBe(plan.spots);
        expect(SCENES[scene.id].length).toBeGreaterThanOrEqual(4);
        for (const cover of scene.covers) expect(COVER_NAMES[cover]).toBeTruthy();
        seen.add(scene.id);
      }
    expect([...seen].sort()).toEqual(['barnyard', 'bedroom', 'beach', 'garden'].sort());
  });

  it('resolves neighboring hit areas to the nearer cover and rejects points outside', () => {
    const spots = [
      { x: 300, y: 700, scale: 1 },
      { x: 532, y: 700, scale: 1 },
    ];
    expect(nearestSpot(415, 590, spots)).toBe(0);
    expect(nearestSpot(417, 590, spots)).toBe(1);
    expect(nearestSpot(416, 590, spots)).toBe(0);
    expect(nearestSpot(100, 590, spots)).toBeNull();
    expect(nearestSpot(300, 350, spots)).toBeNull();
    expect(nearestSpot(300, 711, spots)).toBeNull();
    expect(nearestSpot(405, 590, [{ x: 300, y: 700, scale: 0.8 }])).toBeNull();
  });

  it('nudges only quiet free play after six seconds, with everyone hidden', () => {
    expect(shouldNudge(PLANS[0], 5.99, ['hidden', 'hidden'], false)).toBe(false);
    expect(shouldNudge(PLANS[0], 6, ['hidden', 'hidden'], false)).toBe(true);
    for (const pose of ['out', 'peek'])
      expect(shouldNudge(PLANS[0], 10, ['hidden', pose], false)).toBe(false);
    expect(shouldNudge(PLANS[0], 10, ['hidden'], true)).toBe(false);
    for (const mode of ['find', 'remember'] as const)
      expect(
        shouldNudge(
          PLANS.find((p) => p.mode === mode)!,
          10,
          ['hidden'],
          false,
        ),
      ).toBe(false);
  });

  it('fits every level in four hiding places, with a wrong place to try on question levels', () => {
    for (const plan of PLANS) {
      expect(plan.spots).toBeLessThanOrEqual(4);
      if (plan.mode !== 'free') expect(plan.spots).toBeGreaterThanOrEqual(2);
    }
  });

  it('hides a different animal in each place and asks for one that is there, never twice in a row', () => {
    for (const [i, plan] of PLANS.entries()) {
      if (plan.mode === 'free') continue;
      for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let last: Animal | null = null;
        for (let q = 0; q < plan.goal; q++) {
          const present = deal(rng, plan.spots, poolFor(i + 1));
          expect(new Set(present).size).toBe(plan.spots);
          const target = pickTarget(rng, present, last);
          expect(present).toContain(target);
          expect(target).not.toBe(last);
          last = target;
        }
      }
    }
  });

  it('sends in a newcomer who is not already showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const taken = deal(rng, 4, ANIMALS);
      const who = newcomer(rng, taken, ANIMALS);
      expect(ANIMALS).toContain(who);
      expect(taken).not.toContain(who);
    }
  });

  it("gives the ghost finger's bot only right taps: the hiding place of who was asked for, and in free play a place nobody is out of, going round", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        const rng = new Rng(seed);
        const animals = deal(rng, plan.spots, ANIMALS);
        if (plan.mode !== 'free') {
          const target = pickTarget(rng, animals, null);
          expect(
            animals[
              spotToTap(
                plan,
                animals.map(() => 'hidden'),
                animals,
                target,
                -1,
              )!
            ],
          ).toBe(target);
          expect(
            spotToTap(
              plan,
              animals.map(() => 'hidden'),
              animals,
              null,
              -1,
            ),
          ).toBeNull();
          continue;
        }
        const poses = animals.map(() => 'hidden');
        const visited = new Set<number>();
        let last = -1;
        for (let n = 0; n < plan.goal; n++) {
          const i = spotToTap(plan, poses, animals, null, last)!;
          expect(poses[i]).not.toBe('out');
          if (plan.spots > 1) expect(i).not.toBe(last);
          visited.add(i);
          last = i;
        }
        expect(visited.size).toBe(plan.spots);
        // Everyone out: wait.
        expect(
          spotToTap(
            plan,
            poses.map(() => 'out'),
            animals,
            null,
            last,
          ),
        ).toBeNull();
        // Only one place free: that one, even if it was the last.
        expect(
          spotToTap(
            plan,
            poses.map((_, k) => (k === last ? 'hidden' : 'out')),
            animals,
            null,
            last,
          ),
        ).toBe(last);
      }
    }
  });

  describe('Feelings in free play', () => {
    it('names every feeling it shows, keeps sad out, and the spoken line carries the feeling word', () => {
      expect([...FEELINGS]).not.toContain('sad');
      for (const feeling of FEELINGS) expect(FEELING_WORDS[feeling]).toMatch(/^[a-z]+$/);
      expect(new Set(Object.values(FEELING_WORDS)).size).toBe(FEELINGS.length);
      for (const line of SCRIPT['peek.feel'])
        for (const key of ['{feeling}', '{animal}', '{word}']) expect(line).toContain(key);
      expect(SCRIPT['peek.feel'].some((line) => line.includes('{cover}'))).toBe(true);
    });

    it('shows a feeling on some free-play reveals at levels 1–2 only, every feeling in turn and never the same twice running', () => {
      for (const plan of PLANS.filter((p) => p.mode !== 'free'))
        for (let seed = 1; seed <= 50; seed++) expect(pickFeeling(new Rng(seed), plan, null)).toBeNull();
      for (let seed = 1; seed <= 50; seed++)
        expect(pickFeeling(new Rng(seed), planFor(ONE_DOOR_LEVEL), null)).toBeNull();
      for (const level of [1, 2]) {
        const plan = planFor(level);
        expect(plan.mode).toBe('free');
        const seen = new Set<Feeling>();
        let felt = 0;
        let last: Feeling | null = null;
        for (let seed = 1; seed <= 300; seed++) {
          const feeling = pickFeeling(new Rng(seed), plan, last);
          if (!feeling) continue;
          expect(FEELINGS).toContain(feeling);
          expect(feeling).not.toBe(last);
          seen.add(feeling);
          felt++;
          last = feeling;
        }
        expect(seen.size).toBe(FEELINGS.length);
        expect(felt / 300).toBeGreaterThan(FEELING_CHANCE - 0.1);
        expect(felt / 300).toBeLessThan(FEELING_CHANCE + 0.1);
      }
      // Within one round the stream is seeded, so a replay shows the same faces.
      const a = new Rng(7);
      const b = new Rng(7);
      for (let i = 0; i < 40; i++)
        expect(pickFeeling(a, PLANS[0], null)).toBe(pickFeeling(b, PLANS[0], null));
    });
  });

  describe('One door', () => {
    const door = planFor(ONE_DOOR_LEVEL);
    it('is one free-play house with six reveals, and the original eight levels are unchanged', () => {
      expect(door).toMatchObject({ mode: 'free', spots: 1, goal: 6, door: true });
      for (let level = 1; level <= 8; level++) expect(planFor(level)).toBe(PLANS[level - 1]);
    });
    it('opens by itself only after six quiet seconds, never over an animal already out, and nudges nothing', () => {
      expect(SELF_OPEN_SECONDS).toBeGreaterThanOrEqual(6);
      expect(shouldSelfOpen(door, SELF_OPEN_SECONDS - 0.01, ['hidden'], false)).toBe(false);
      expect(shouldSelfOpen(door, SELF_OPEN_SECONDS, ['hidden'], false)).toBe(true);
      for (const pose of ['out', 'peek']) expect(shouldSelfOpen(door, 10, [pose], false)).toBe(false);
      expect(shouldSelfOpen(door, 10, ['hidden'], true)).toBe(false);
      expect(shouldNudge(door, 10, ['hidden'], false)).toBe(false);
      expect(shouldSelfOpen(PLANS[0], 10, ['hidden', 'hidden', 'hidden'], false)).toBe(false);
    });
    it('cycles animals and never repeats the one that just showed', () => {
      for (let seed = 1; seed <= 20; seed++) {
        const rng = new Rng(seed);
        let who = deal(rng, 1, poolFor(ONE_DOOR_LEVEL))[0];
        for (let i = 0; i < 12; i++) {
          const next = newcomer(rng, [who], poolFor(ONE_DOOR_LEVEL));
          expect(STICKER_ANIMALS).toContain(next);
          expect(next).not.toBe(who);
          who = next;
        }
      }
    });
    it('is reachable by the ghost finger', () => {
      expect(spotToTap(door, ['hidden'], ['cow'], null, -1)).toBe(0);
      expect(spotToTap(door, ['hidden'], ['cow'], null, 0)).toBe(0);
    });
  });
});

describe('Peekaboo Barn level 9, Who has…?', () => {
  const plan = planFor(9);

  it('is three animals and five clue questions, opening the school window without moving a saved level', () => {
    expect(plan).toEqual({ mode: 'clue', spots: 3, goal: 5 });
    expect(PLANS[8]).toEqual(plan);
    expect(LEVELS.preschool).toEqual({ min: 4, max: 8 });
  });

  it('reads every part word from the drawn critters, and every animal has something true to say back', () => {
    for (const id of PART_IDS)
      expect(
        ANIMALS.some((a) => hasPart(a, id)),
        id,
      ).toBe(true);
    expect(hasPart('cow', 'spots')).toBe(true);
    expect(hasPart('bunny', 'long')).toBe(true);
    expect(hasPart('duck', 'bill')).toBe(true);
    expect(hasPart('bear', 'spots')).toBe(false);
    for (const a of ANIMALS) expect(hasPart(a, factAbout(a))).toBe(true);
    // Surprised is how every critter pops up, so it can never pick out one.
    expect(CLUE_FEELINGS).not.toContain('surprised');
  });

  it('gives every clue exactly one holder among the animals dealt, never the last answer, over many seeds', () => {
    const kinds = new Set<string>();
    const parts = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      const rng = new Rng(seed);
      let last: Animal | null = null;
      for (let q = 0; q < plan.goal; q++) {
        const d = dealClue(rng, plan.spots, clueKindFor(q), last, poolFor(9));
        expect(d.clue.kind).toBe(clueKindFor(q));
        expect(new Set(d.animals).size).toBe(plan.spots);
        expect(d.animals).toContain(d.answer);
        expect(d.answer).not.toBe(last);
        const feelingOf = d.clue.kind === 'feeling' ? d.answer : null;
        expect(holders(d.clue, d.animals, feelingOf)).toEqual([d.answer]);
        if (d.clue.kind === 'part') {
          expect(uniqueParts(d.animals)).toContain(d.clue.part);
          parts.add(d.clue.part);
          // A wrong animal's fact is never the clue itself.
          for (const other of d.animals.filter((a) => a !== d.answer))
            expect(factAbout(other)).not.toBe(d.clue.part);
        } else expect(CLUE_FEELINGS).toContain(d.clue.feeling);
        kinds.add(d.clue.kind);
        last = d.answer;
      }
    }
    expect([...kinds].sort()).toEqual(['feeling', 'part']);
    expect([...parts].sort()).toEqual([...PART_IDS].sort());
  });

  it('starts with a feeling, then mixes parts in', () => {
    expect([0, 1, 2, 3, 4].map(clueKindFor)).toEqual(['feeling', 'part', 'part', 'feeling', 'part']);
  });

  it('never names the answer in an ask, and says the clue word back in a miss', () => {
    for (const id of ['peek.whohas', 'peek.whofeels'] as const)
      for (const line of SCRIPT[id]) expect(line).not.toContain('{animal}');
    for (const line of SCRIPT['peek.whohas']) expect(line).toContain('{part}');
    for (const line of SCRIPT['peek.whofeels']) expect(line).toContain('{feeling}');
    for (const line of SCRIPT['peek.nothas']) expect(line).toMatch(/\{fact\}.*\{part\}/);
    for (const line of SCRIPT['peek.notfeel']) expect(line).toContain('{feeling}');
  });

  it("points the ghost finger's bot at the clue's holder", () => {
    const d = dealClue(new Rng(7), plan.spots, 'part', null, poolFor(9));
    const poses = d.animals.map(() => 'out');
    expect(spotToTap(plan, poses, d.animals, d.answer, -1)).toBe(d.animals.indexOf(d.answer));
  });
});

describe('Peekaboo Barn levels 10–11, Whose ears?', () => {
  it('is three tops and five questions, then four tops and six, without moving a saved level', () => {
    expect(planFor(10)).toEqual({ mode: 'top', spots: 3, goal: 5 });
    expect(planFor(11)).toEqual({ mode: 'top', spots: 4, goal: 6 });
    expect(planFor(ONE_DOOR_LEVEL).door).toBe(true);
    expect(LEVELS.preschool).toEqual({ min: 4, max: 8 });
    expect(LEVELS.lap).toEqual({ min: 1, max: 16, order: [16, 1, 2] });
  });

  it('gives every animal a top no other animal shares, so every deal of three or four can be told apart', () => {
    expect(new Set(ANIMALS.map(topOf)).size).toBe(ANIMALS.length);
    // The pointy ears of pig and cat differ by colour; the floppy ears of cow and dog by colour too.
    expect(topOf('pig')).not.toBe(topOf('cat'));
    expect(topOf('cow')).not.toBe(topOf('dog'));
    expect(topOf('bunny')).toContain('long');
    const all = (n: number, from: readonly Animal[] = ANIMALS): Animal[][] =>
      n === 0 ? [[]] : from.flatMap((a, i) => all(n - 1, from.slice(i + 1)).map((rest) => [a, ...rest]));
    for (const n of [3, 4]) for (const set of all(n)) expect(topsDiffer(set), set.join()).toBe(true);
    // A lookalike would be caught: two brown, floppy-eared, orange-eared dogs are one top.
    expect(topsDiffer(['dog', 'dog'])).toBe(false);
  });

  it('deals different animals with different tops and asks for one present, never the same twice running', () => {
    for (const level of [10, 11]) {
      const plan = planFor(level);
      const asked = new Set<Animal>();
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        let last: Animal | null = null;
        for (let q = 0; q < plan.goal; q++) {
          const animals = dealTops(rng, plan.spots, poolFor(level));
          expect(new Set(animals).size).toBe(plan.spots);
          expect(topsDiffer(animals)).toBe(true);
          const target = pickTarget(rng, animals, last);
          expect(animals).toContain(target);
          expect(target).not.toBe(last);
          asked.add(target);
          last = target;
        }
      }
      expect([...asked].sort()).toEqual([...ANIMALS].sort());
    }
  });

  it("points the ghost finger's bot at the asked animal's place", () => {
    const plan = planFor(11);
    const animals = dealTops(new Rng(5), plan.spots, poolFor(11));
    const poses = animals.map(() => 'top');
    expect(spotToTap(plan, poses, animals, animals[2], -1)).toBe(2);
  });
});

describe('Peekaboo Barn, more animals', () => {
  it('keeps the first seven words below level 4 and in One door, and adds the farm four from level 4', () => {
    expect(NEW_ANIMALS).toEqual(['sheep', 'horse', 'hen', 'mouse']);
    expect(NEWCOMER_LEVEL).toBe(4);
    for (const level of [1, 2, 3, ONE_DOOR_LEVEL]) expect(poolFor(level)).toEqual(STICKER_ANIMALS);
    for (let level = 4; level <= PLANS.length; level++) expect(poolFor(level)).toEqual(ANIMALS);
    expect(ANIMALS).toHaveLength(11);
  });

  it("gives every level's pool more animals than its places, so a newcomer can always sneak in", () => {
    for (const level of [...PLANS.keys()].map((i) => i + 1).concat(ONE_DOOR_LEVEL))
      expect(poolFor(level).length).toBeGreaterThan(planFor(level).spots);
  });

  it('gives every animal its own sound and a word to say for it', () => {
    for (const a of ANIMALS) {
      expect(VOICES[a].word.length, a).toBeGreaterThan(0);
    }
    expect(new Set(ANIMALS.map((a) => VOICES[a].sound)).size).toBe(ANIMALS.length);
    expect(VOICES.sheep.sound).toBe('baa');
    expect(VOICES.horse.sound).toBe('neigh');
    expect(VOICES.hen.sound).toBe('cluck');
    expect(VOICES.mouse.sound).toBe('squeak');
  });

  it('deals the farm four only from level 4, and every one of them turns up there', () => {
    for (let level = 1; level <= PLANS.length; level++) {
      const plan = planFor(level);
      const seen = new Set<Animal>();
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const animals =
          plan.mode === 'top'
            ? dealTops(rng, plan.spots, poolFor(level))
            : plan.mode === 'clue'
              ? dealClue(rng, plan.spots, 'part', null, poolFor(level)).animals
              : deal(rng, plan.spots, poolFor(level));
        animals.forEach((a) => seen.add(a));
      }
      const farm = NEW_ANIMALS.filter((a) => seen.has(a));
      expect(farm, `level ${level}`).toEqual(level >= NEWCOMER_LEVEL ? [...NEW_ANIMALS] : []);
    }
  });

  it('deals levels 1–3 exactly as before the farm four joined', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const before = new Rng(seed).shuffle([...STICKER_ANIMALS]).slice(0, 3);
      expect(deal(new Rng(seed), 3, poolFor(3))).toEqual(before);
    }
  });

  it('lets each of the farm four be the answer to a level 9 clue, with something true to say when it is not', () => {
    const answers = new Set<Animal>();
    for (let seed = 1; seed <= 400; seed++) {
      const rng = new Rng(seed);
      for (let q = 0; q < 5; q++) answers.add(dealClue(rng, 3, clueKindFor(q), null, poolFor(9)).answer);
    }
    for (const a of NEW_ANIMALS) {
      expect(answers.has(a), a).toBe(true);
      expect(hasPart(a, factAbout(a))).toBe(true);
    }
    // The mouse's big ears are round ones too, so a bear and a mouse never make "round ears" a single answer.
    expect(hasPart('mouse', 'round')).toBe(true);
    expect(uniqueParts(['bear', 'mouse', 'cow'])).not.toContain('round');
    expect(hasPart('horse', 'mane')).toBe(true);
    expect(hasPart('hen', 'comb')).toBe(true);
    expect(hasPart('sheep', 'wool')).toBe(true);
  });

  it('keeps the first seven facts unchanged now that the farm parts come after them', () => {
    expect(STICKER_ANIMALS.map(factAbout)).toEqual([
      'spots',
      'wings',
      'snout',
      'whiskers',
      'floppy',
      'whiskers',
      'round',
    ]);
  });
});

describe('Peekaboo Barn levels 12–14, Switcheroo', () => {
  it('is one swap of three houses, then two, then three swaps of four, with the three-swap level exclusive to school', () => {
    expect(planFor(12)).toEqual({ mode: 'swap', spots: 3, goal: 5, swaps: 1 });
    expect(planFor(13)).toEqual({ mode: 'swap', spots: 3, goal: 5, swaps: 2 });
    expect(planFor(14)).toEqual({ mode: 'swap', spots: 4, goal: 5, swaps: 3 });
    expect(LEVELS.prek).toEqual({ min: 6, max: 13 });
    expect(LEVELS.school!.max).toBeGreaterThanOrEqual(14);
    expect(LEVELS.preschool).toEqual({ min: 4, max: 8 });
    expect(LEVELS.toddler).toEqual({ min: 1, max: 5 });
    expect(LEVELS.lap).toEqual({ min: 1, max: 16, order: [16, 1, 2] });
    expect(planFor(ONE_DOOR_LEVEL).door).toBe(true);
    // Never more than four places, nothing faster than the dive's 0.9 s, and the hint is slower still.
    for (const level of [12, 13, 14]) {
      expect(planFor(level).spots).toBeLessThanOrEqual(4);
      expect(planFor(level).swaps).toBeLessThanOrEqual(MAX_SWAPS);
    }
    expect(SWAP_SECONDS).toBeGreaterThanOrEqual(0.9);
    expect(SLOW_SWAP_SECONDS).toBeGreaterThan(SWAP_SECONDS);
  });

  it('moves houses by a permutation, so who is behind each house is kept', () => {
    expect(applySwaps(['cow', 'pig', 'cat'], [[0, 1]])).toEqual(['pig', 'cow', 'cat']);
    expect(
      applySwaps(
        ['cow', 'pig', 'cat', 'dog'],
        [
          [0, 3],
          [1, 2],
        ],
      ),
    ).toEqual(['dog', 'cat', 'pig', 'cow']);
  });

  it('deals swaps of two different houses, never the same pair twice running, whose answer ends somewhere new', () => {
    for (const level of [12, 13, 14]) {
      const plan = planFor(level);
      let last: Animal | null = null;
      for (let seed = 1; seed <= 400; seed++) {
        const rng = new Rng(seed);
        const animals = deal(rng, plan.spots, poolFor(level));
        const d = dealSwaps(rng, animals, plan.swaps!, last);
        expect(d.swaps).toHaveLength(plan.swaps!);
        d.swaps.forEach(([a, b], i) => {
          expect(a).not.toBe(b);
          for (const x of [a, b]) expect(x >= 0 && x < plan.spots).toBe(true);
          const prev = d.swaps[i - 1];
          if (prev) expect([a, b]).not.toEqual([...prev]);
        });
        const after = applySwaps(animals, d.swaps);
        expect([...after].sort()).toEqual([...animals].sort());
        expect(animals).toContain(d.answer);
        expect(after[d.finalIndex]).toBe(d.answer);
        expect(after.filter((a) => a === d.answer)).toHaveLength(1);
        // Its house really moved, so following the swap is the whole point.
        expect(animals.indexOf(d.answer)).not.toBe(d.finalIndex);
        // A different friend from last time, whenever another house moved too (one swap always moves two).
        expect(d.answer).not.toBe(last);
        last = d.answer;
      }
    }
  });

  it('is deterministic, and the ghost finger taps the house the answer ends behind', () => {
    const plan = planFor(13);
    const animals = deal(new Rng(9), plan.spots, poolFor(13));
    const d = dealSwaps(new Rng(9), animals, 2, null);
    expect(dealSwaps(new Rng(9), animals, 2, null)).toEqual(d);
    const after = applySwaps(animals, d.swaps);
    const poses = after.map(() => 'hidden');
    expect(spotToTap(plan, poses, after, d.answer, -1)).toBe(d.finalIndex);
    // The hint replays the same swaps from the start, so it ends in the same place.
    expect(applySwaps(animals, d.swaps)).toEqual(after);
  });

  it('says "Switch!" in the script', () => {
    expect(SCRIPT['peek.switch'].length).toBeGreaterThan(0);
    expect(SCRIPT['peek.watch'].every((l) => l.includes('{animal}'))).toBe(true);
  });
});

describe('Peekaboo Barn level 15, Guess who!', () => {
  it('asks five two-clue questions at school and preserves the lap entry', () => {
    expect(planFor(15)).toEqual({ mode: 'pair', spots: 4, goal: 5 });
    expect(LEVELS.school).toEqual({ min: 9, max: 15 });
    expect(LEVELS.prek).toEqual({ min: 6, max: 13 });
    expect(planFor(16).door).toBe(true);
  });

  it('deals one answer, one decoy per clue, and one that matches neither, with truthful feedback', () => {
    const answers = new Set();
    const pairs = new Set();
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let last = null;
      for (let q = 0; q < planFor(15).goal; q++) {
        const { pair, answer, animals } = dealPair(rng, last);
        const [first, second] = pair;
        expect(answer).not.toBe(last);
        last = answer;
        answers.add(answer);
        pairs.add(pair.join('/'));
        expect(new Set(animals).size).toBe(4);
        expect(animals.filter((a) => hasFeature(a, first) && hasFeature(a, second))).toEqual([answer]);
        expect(animals.filter((a) => hasFeature(a, first))).toHaveLength(2);
        expect(animals.filter((a) => hasFeature(a, second))).toHaveLength(2);
        for (const animal of animals.filter((a) => a !== answer)) {
          const feedback = pairFeedback(animal, pair);
          if (feedback) {
            expect(hasFeature(animal, feedback.fact)).toBe(true);
            expect(hasFeature(animal, feedback.missing)).toBe(false);
          } else {
            expect(hasFeature(animal, first) || hasFeature(animal, second)).toBe(false);
          }
        }
      }
    }
    expect(answers.size).toBeGreaterThan(1);
    expect(pairs.size).toBeGreaterThan(1);
  });

  it('uses the drawn coat colors, including the mouse’s grey override', () => {
    expect(hasFeature('mouse', 'white')).toBe(false);
    expect(hasFeature('sheep', 'white')).toBe(true);
    expect(hasFeature('horse', 'brown')).toBe(true);
  });
});
