import { describe, expect, it } from 'vitest';
import { RAINBOW } from '../../art/palette';
import { Rng } from '../../engine/random';
import { SCRIPT } from '../../content/voice-script';
import { SCENES } from './scenes';
import {
  DOT_NUMERAL_Y,
  PICTURES,
  PIP_RADIUS,
  SIZE_RATIO,
  LEVELS,
  dicePips,
  dotAsks,
  matchFaces,
  matchPair,
  matchTap,
  partners,
  pictureLine,
  riderFor,
  spawnSize,
  DOT_RADIUS,
  numberDots,
  showsDots,
  bondNumbers,
  bubbleToPop,
  choosePalette,
  clearSpot,
  countRun,
  signFor,
  FRIEND_SOUND,
  FRIENDS,
  inReach,
  openingBubble,
  roomFor,
  spawnBox,
  isRight,
  meant,
  nearestShown,
  PLANS,
  planFor,
  spawnTarget,
  staysPut,
  TAP_REACH,
  type DemoBubble,
} from './logic';

describe('Bubble Pop', () => {
  it('keeps every bubble a big target, and number rounds within what fits on screen', () => {
    for (const plan of PLANS) {
      expect(plan.radius[0] * TAP_REACH * 2).toBeGreaterThanOrEqual(100);
      expect(plan.radius[0]).toBeLessThanOrEqual(plan.radius[1]);
      if (plan.mode === 'count') expect(plan.goal).toBeLessThanOrEqual(plan.most);
      if (plan.mode === 'color') expect(plan.colors).toBeGreaterThanOrEqual(2);
    }
  });

  it('picks distinct colors, and always sends the asked-for color when none is showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      for (const plan of PLANS.filter((p) => p.mode === 'color')) {
        const palette = choosePalette(rng, plan.colors);
        expect(new Set(palette).size).toBe(plan.colors);
        expect(palette.every((c) => RAINBOW.includes(c))).toBe(true);
      }
      // An errorless start, then a target whenever there is none to pop.
      expect(spawnTarget(0, true, rng)).toBe(true);
      expect(spawnTarget(1, true, rng)).toBe(true);
      for (let n = 2; n < 30; n++) expect(spawnTarget(n, false, rng)).toBe(true);
    }
    // Once one is showing, other colors arrive too.
    const rng = new Rng(7);
    const picks = Array.from({ length: 200 }, () => spawnTarget(5, true, rng));
    expect(picks.some((p) => !p)).toBe(true);
    expect(picks.some((p) => p)).toBe(true);
  });

  it('judges pops: anything in free play, the color asked for, then numbers in order', () => {
    expect(isRight('free', { color: 'red' }, null, 1)).toBe(true);
    expect(isRight('color', { color: 'red' }, 'red', 1)).toBe(true);
    expect(isRight('color', { color: 'blue' }, 'red', 1)).toBe(false);
    expect(isRight('count', { color: 'red', number: 2 }, null, 2)).toBe(true);
    expect(isRight('count', { color: 'red', number: 3 }, null, 2)).toBe(false);
  });

  it('gives an overlapping right bubble the tap instead of counting a miss', () => {
    const wrong = { color: 'blue' as const, x: 300, y: 300, r: 60 };
    const right = { color: 'red' as const, x: 360, y: 300, r: 60 };
    const far = { color: 'red' as const, x: 600, y: 300, r: 60 };
    const isRed = (b: { color: string }) => b.color === 'red';
    // A finger between the two lands on both: it meant the red one.
    expect(meant(wrong, [wrong, right, far], { x: 320, y: 300 }, isRed)).toBe(right);
    // Squarely on the blue one, nowhere near a red one: still a miss.
    expect(meant(wrong, [wrong, far], { x: 300, y: 300 }, isRed)).toBe(wrong);
    expect(meant(right, [wrong, right], { x: 330, y: 300 }, isRed)).toBe(right);
  });

  it('bonds levels give every bubble a partner that makes the total', () => {
    for (const plan of PLANS.filter((p) => p.mode === 'bonds')) {
      for (let seed = 1; seed <= 200; seed++) {
        const nums = bondNumbers(plan.sum!, plan.goal, new Rng(seed));
        expect(nums).toHaveLength(plan.goal * 2);
        // Greedy pairing always succeeds, whichever bubble is popped first.
        const left = [...nums];
        while (left.length) {
          const a = left.shift()!;
          const i = left.indexOf(plan.sum! - a);
          expect(i, `${nums}`).toBeGreaterThanOrEqual(0);
          left.splice(i, 1);
        }
        for (const n of nums) (expect(n).toBeGreaterThanOrEqual(1), expect(n).toBeLessThan(plan.sum!));
      }
    }
  });
});

describe('bubbles she needs', () => {
  it('stay on the screen in every mode that needs a particular one', () => {
    // The next number and a partner are laid out whole at the start, so they drift in place instead of floating off.
    expect(staysPut('count')).toBe(true);
    expect(staysPut('bonds')).toBe(true);
    // Free and color bubbles rise and leave; color mode makes up for it by sending the asked-for color when none shows.
    expect(staysPut('free')).toBe(false);
    expect(staysPut('color')).toBe(false);
    // Size bubbles rise and leave like colors, and the asked-for size is sent again when none shows; dot bubbles stay.
    expect(staysPut('size')).toBe(false);
    expect(staysPut('dots')).toBe(true);
    for (const plan of PLANS.filter((p) => staysPut(p.mode))) {
      const bubbles = plan.mode === 'bonds' ? plan.goal * 2 : plan.mode === 'dots' ? plan.dotsTo! : plan.goal;
      expect(bubbles, `${plan.mode} ${plan.goal}`).toBeLessThanOrEqual(plan.most);
    }
  });
});

describe('the friends in the bubbles', () => {
  it('stay exactly these seven in this order, because the sticker draws from the list', () => {
    expect([...FRIENDS]).toEqual(['duck', 'pig', 'cat', 'bunny', 'cow', 'bear', 'dog']);
  });

  it('each have an animal voice of their own to say hello with', () => {
    expect(Object.keys(FRIEND_SOUND).sort()).toEqual([...FRIENDS].sort());
    expect(new Set(Object.values(FRIEND_SOUND)).size).toBe(FRIENDS.length);
  });
});

describe('the bubble the ghost finger pops', () => {
  const at = (x: number, y: number, extra: Partial<DemoBubble> = {}): DemoBubble => ({
    x,
    y,
    r: 60,
    color: null,
    ...extra,
  });

  it('only counts a bubble whose middle is on the screen, and leaves one still below it or about to float off', () => {
    expect(inReach(at(500, 400), 1024, 768)).toBe(true);
    expect(inReach(at(500, 730), 1024, 768)).toBe(true); // rising in: its middle is showing
    expect(inReach(at(500, 790), 1024, 768)).toBe(false);
    expect(inReach(at(500, 20), 1024, 768)).toBe(false);
    expect(inReach(at(10, 400), 1024, 768)).toBe(false);
  });

  it('always chooses a right bubble when there is one, at every level, and never the rainbow', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      for (const plan of PLANS) {
        const palette = choosePalette(rng, plan.colors);
        const target = plan.mode === 'color' ? palette[0] : null;
        let shown: DemoBubble[] = [];
        let next = 1;
        // The real game keeps sending bubbles; here there are enough on the screen to finish the round.
        if (plan.mode === 'color')
          shown = Array.from({ length: plan.goal * plan.colors }, (_, i) =>
            at(120 + (i % 6) * 140, 200 + i * 5, { color: palette[i % palette.length] }),
          );
        if (plan.mode === 'free')
          shown = Array.from({ length: plan.goal + 2 }, (_, i) => at(120 + (i % 6) * 140, 200 + i * 6));
        if (plan.mode === 'count')
          shown = Array.from({ length: plan.goal }, (_, i) => at(100 + i * 80, 300, { number: i + 1 }));
        if (plan.mode === 'size')
          shown = Array.from({ length: plan.goal * 2 }, (_, i) =>
            at(120 + (i % 6) * 140, 200 + i * 5, { size: i % 2 ? 'little' : 'big' }),
          );
        const asks = plan.mode === 'dots' ? dotAsks(plan, rng) : [];
        if (plan.mode === 'dots') {
          shown = Array.from({ length: plan.dotsTo! }, (_, i) => at(100 + i * 160, 300, { number: i + 1 }));
          next = asks[0];
        }
        if (plan.mode === 'bonds')
          shown = bondNumbers(plan.sum!, plan.goal, rng).map((n, i) => at(100 + i * 90, 300, { number: n }));
        if (plan.mode === 'match')
          shown = matchFaces(plan, rng).map((f, i) =>
            at(100 + i * 90, 300, { number: f.number, pips: f.pips }),
          );
        shown.push(at(500, 300, { rainbow: true, number: 99 }));
        // Pop a whole round the way the bot would, and the round must finish with no wrong tap.
        let held: DemoBubble | null = null;
        let pops = 0;
        for (let guard = 0; guard < 80 && pops < plan.goal; guard++) {
          const pick: DemoBubble | null = bubbleToPop(plan.mode, shown, target, next, plan.sum, held, 'big');
          expect(pick, `${plan.mode} seed ${seed}`).not.toBeNull();
          expect(pick!.rainbow).toBeFalsy();
          if (plan.mode === 'match') {
            if (!held) held = pick;
            else {
              expect(matchTap(held, pick!)).toBe('match');
              // The pair is replaced by a new pair of the same count, so every bubble still has a partner showing.
              const { number } = pick!;
              shown = shown.filter((b) => b !== held && b !== pick);
              shown.push(at(150, 400, { number, pips: false }), at(650, 400, { number, pips: true }));
              held = null;
              pops++;
            }
            continue;
          }
          if (plan.mode === 'bonds') {
            if (!held) held = pick;
            else {
              expect(held.number! + pick!.number!).toBe(plan.sum);
              shown = shown.filter((b) => b !== held && b !== pick);
              held = null;
              pops++;
            }
            continue;
          }
          expect(isRight(plan.mode, pick!, target, next, 'big')).toBe(true);
          // A popped dot bubble is replaced by one with as many dots, so it stays in the list.
          if (plan.mode !== 'dots') shown = shown.filter((b) => b !== pick);
          pops++;
          if (plan.mode === 'count') next++;
          if (plan.mode === 'dots') next = asks[Math.min(pops, asks.length - 1)];
        }
        expect(pops, `${plan.mode} seed ${seed}`).toBe(plan.goal);
      }
    }
  });

  it('takes the highest settled bubble in free play, and waits when nothing right is showing', () => {
    expect(bubbleToPop('free', [at(100, 300), at(300, 600), at(500, 200)], null, 1, undefined, null)?.y).toBe(
      200,
    );
    expect(bubbleToPop('free', [at(100, 300), at(500, 60)], null, 1, undefined, null)?.y).toBe(300); // one by the top edge is about to leave
    expect(bubbleToPop('color', [at(100, 300, { color: 'blue' })], 'red', 1, undefined, null)).toBeNull();
    expect(bubbleToPop('count', [at(100, 300, { number: 3 })], null, 2, undefined, null)).toBeNull();
    expect(planFor(11).mode).toBe('bonds');
  });
});

describe('quantity support', () => {
  it('shows exactly the quantity in distinct, countable dots inside the bubble below the numeral', () => {
    for (let n = 1; n <= 10; n++) {
      const dots = numberDots(n);
      expect(dots).toHaveLength(n);
      for (const dot of dots) {
        expect(Math.hypot(dot.x, dot.y) + DOT_RADIUS).toBeLessThan(0.9);
        // The unchanged 1.05-radius numeral reserves a 1.3-radius-high box.
        expect(dot.y - DOT_RADIUS).toBeGreaterThan(DOT_NUMERAL_Y + 0.65);
        for (const other of dots)
          if (other !== dot)
            expect(Math.hypot(dot.x - other.x, dot.y - other.y)).toBeGreaterThan(DOT_RADIUS * 2);
      }
      expect(numberDots(n)).toEqual(dots);
      if (n > 6) expect(dots.filter((d) => d.y === 0.49)).toHaveLength(5);
    }
    for (const n of [0, 11, -1, 1.5, NaN]) expect(numberDots(n)).toEqual([]);
  });

  it('supports the first number rounds and bonds to five, then fades without changing their rules', () => {
    expect(PLANS.map((_, i) => i + 1).filter(showsDots)).toEqual([7, 8, 10]);
    for (const level of [7, 8, 10]) {
      const plan = planFor(level);
      const numbers =
        plan.mode === 'count'
          ? Array.from({ length: plan.goal }, (_, i) => i + 1)
          : bondNumbers(plan.sum!, plan.goal, new Rng(4));
      for (const n of numbers) expect(numberDots(n)).toHaveLength(n);
    }
  });
});

describe('counting runs', () => {
  const counts = PLANS.map((plan, i) => ({ plan, level: i + 1 })).filter(({ plan }) => plan.mode === 'count');

  it("count levels 7 to 9 are still 1, 2, 3 … with no draw from the round's random numbers", () => {
    for (const { plan, level } of counts.filter((c) => c.level <= 9)) {
      const rng = new Rng(5);
      expect(countRun(plan, rng)).toEqual(Array.from({ length: plan.goal }, (_, i) => i + 1));
      expect(rng.next()).toBe(new Rng(5).next());
      expect(signFor(plan, level, countRun(plan, new Rng(1)))).toBeNull();
    }
  });

  it('level 12 starts at a number above 1 and keeps every number small enough for a pre-K player', () => {
    const plan = planFor(12);
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      expect(run[0]).toBeGreaterThanOrEqual(2);
      expect(run).toHaveLength(plan.goal);
      expect(run.every((n, i) => n === run[0] + i)).toBe(true);
      expect(Math.max(...run)).toBeLessThanOrEqual(12);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 12, run)).toEqual({ kind: 'start', n: run[0], dots: false });
    }
  });

  it('level 13 counts back one at a time and ends at 1, never below', () => {
    const plan = planFor(13);
    const seen = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      seen.add(run[0]);
      expect(run[0]).toBeGreaterThanOrEqual(4);
      expect(run.at(-1)).toBe(1);
      expect(Math.min(...run)).toBeGreaterThanOrEqual(1);
      expect(run.every((n, i) => n === run[0] - i)).toBe(true);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 13, run)).toEqual({ kind: 'back', n: run[0], dots: false });
    }
    expect(seen.size).toBeGreaterThan(3);
  });

  it('level 14 counts by tens and by fives, every number a multiple of the step and two digits', () => {
    const plan = planFor(14);
    const steps = new Set<number>();
    for (let seed = 1; seed <= 300; seed++) {
      const run = countRun(plan, new Rng(seed));
      const step = run[1] - run[0];
      steps.add(step);
      expect(plan.steps).toContain(step);
      expect(run).toHaveLength(plan.goal);
      expect(run.every((n, i) => n % step === 0 && n === run[0] + i * step)).toBe(true);
      expect(run[0]).toBeGreaterThanOrEqual(step);
      expect(Math.max(...run)).toBeLessThanOrEqual(99);
      expect(run.length).toBeLessThanOrEqual(plan.most);
      expect(signFor(plan, 14, run)).toEqual({ kind: 'by', n: step, dots: false });
    }
    expect([...steps].sort((a, b) => a - b)).toEqual([5, 10]);
  });

  it('a count run is always drawn whole and stays on the screen until it is popped', () => {
    for (const { plan } of counts) expect(plan.goal).toBeLessThanOrEqual(plan.most);
    expect(staysPut('count')).toBe(true);
  });
});

describe('the sign at the top', () => {
  it('shows the total on both bonds levels, with dots only where the bubbles carry dots', () => {
    expect(signFor(planFor(10), 10, [])).toEqual({ kind: 'bond', n: 5, dots: true });
    expect(signFor(planFor(11), 11, [])).toEqual({ kind: 'bond', n: 10, dots: false });
  });

  it('is not shown for free play, colors or counting from 1', () => {
    for (const level of [1, 2, 3, 4, 5, 6]) expect(signFor(planFor(level), level, [])).toBeNull();
  });
});

describe("pop anywhere (level 15, lap's first level)", () => {
  const plan = planFor(15);
  const at = (x: number, y: number, extra: Partial<DemoBubble> = {}): DemoBubble => ({
    x,
    y,
    r: 100,
    color: null,
    ...extra,
  });

  it('is a free-popping round that takes a touch anywhere, with only big, slow, few bubbles', () => {
    expect(plan.mode).toBe('free');
    expect(plan.anywhere).toBe(true);
    expect(PLANS.filter((p) => p.anywhere)).toHaveLength(1);
    expect(plan.radius[0] * 2).toBeGreaterThanOrEqual(173);
    expect(plan.most).toBeLessThan(planFor(1).most);
    expect(plan.speed).toBeLessThan(planFor(1).speed);
    expect(plan.goal).toBeLessThan(planFor(1).goal);
  });

  it('pops the nearest bubble for every point of the screen while one is showing, and never none', () => {
    const shown = [at(200, 300), at(700, 250), at(500, 600)];
    for (let x = 0; x <= 1024; x += 32) {
      for (let y = 0; y <= 768; y += 32) {
        const pick = nearestShown(shown, { x, y })!;
        expect(pick).toBeTruthy();
        const d = (b: DemoBubble) => Math.hypot(b.x - x, b.y - y);
        for (const other of shown) expect(d(pick)).toBeLessThanOrEqual(d(other));
      }
    }
  });

  it('opens with one large bubble already in reach, bigger than any that rises, clear of the left column and top bar', () => {
    for (const [w, h] of [
      [1024, 768],
      [768, 1024],
      [1366, 768],
    ]) {
      const o = openingBubble(plan, w, h);
      expect(inReach(at(o.x, o.y, { r: o.r }), w, h)).toBe(true);
      expect(o.r).toBeGreaterThan(plan.radius[1]);
      expect(o.x - o.r).toBeGreaterThanOrEqual(150);
      expect(o.y - o.r).toBeGreaterThanOrEqual(130);
      expect(o.x + o.r).toBeLessThanOrEqual(w - 50);
      expect(o.y + o.r).toBeLessThanOrEqual(h - 60);
      // With it standing, every touch on the screen pops something.
      expect(nearestShown([at(o.x, o.y, { r: o.r })], { x: 0, y: h })).toBeTruthy();
    }
  });

  it('lets bubbles rise in only after her pops, one more per pop up to the most, and every other level fills at once', () => {
    expect(roomFor(plan, 0)).toBe(1); // the opening bubble alone
    expect(roomFor(plan, 1)).toBe(2);
    expect(roomFor(plan, 2)).toBe(3);
    expect(roomFor(plan, 3)).toBe(plan.most);
    expect(roomFor(plan, 50)).toBe(plan.most);
    for (const level of [1, 2, 4, 7, 10, 14]) expect(roomFor(planFor(level), 0)).toBe(planFor(level).most);
  });

  it('starts a rising bubble already in reach, so a touch after a pop never meets an empty screen', () => {
    for (const r of plan.radius) {
      const box = spawnBox(1024, 768, r, false, true);
      expect(inReach(at(box.x[0], box.y[0], { r }), 1024, 768)).toBe(true);
    }
    // Other free levels still rise in from below the screen.
    const below = spawnBox(1024, 768, 80, false);
    expect(inReach(at(below.x[0], below.y[0], { r: 80 }), 1024, 768)).toBe(false);
  });

  it('does nothing when no bubble is showing', () => {
    expect(nearestShown([], { x: 500, y: 400 })).toBeNull();
  });

  it('counts every touch as right: free play has no wrong bubble, so no misses', () => {
    expect(isRight('free', { color: null }, null, 1)).toBe(true);
  });

  it('is found through the ghost finger like level 1: the bot always has a bubble to pop', () => {
    const shown = Array.from({ length: plan.goal }, (_, i) => at(150 + i * 110, 300 + i * 8));
    expect(bubbleToPop(plan.mode, shown, null, 1, undefined, null)).not.toBeNull();
  });
});

describe('big and little (level 16, toddler, between 3 and 4)', () => {
  const plan = planFor(16);

  it('is played by toddlers after free popping and before two colors, and by no other band', () => {
    expect(LEVELS.toddler!.order).toEqual([1, 2, 3, 16, 4, 5, 6]);
    for (const band of ['lap', 'preschool', 'prek', 'school'] as const)
      expect(LEVELS[band]!.order ?? [], band).not.toContain(16);
  });

  it('has two sizes that differ at a glance, the little one still a 100-unit target, and nothing faster than level 3', () => {
    const { little, big } = plan.sizes!;
    expect(big[0] / little[1]).toBeGreaterThanOrEqual(SIZE_RATIO);
    expect(little[0] * TAP_REACH * 2).toBeGreaterThanOrEqual(100);
    expect(plan.radius).toEqual([little[0], big[1]]);
    expect(plan.speed).toBeLessThanOrEqual(planFor(3).speed);
    expect(plan.most).toBeLessThanOrEqual(planFor(3).most);
  });

  it('judges by size alone, whichever size the round asks for', () => {
    for (const want of ['big', 'little'] as const) {
      expect(isRight('size', { color: null, size: want }, null, 1, want)).toBe(true);
      expect(isRight('size', { color: null, size: want === 'big' ? 'little' : 'big' }, null, 1, want)).toBe(
        false,
      );
    }
  });

  it('opens with two of the asked-for size, always sends one when none is showing, and sends the other size too', () => {
    for (const want of ['big', 'little'] as const) {
      const rng = new Rng(7);
      expect(spawnSize(0, false, want, rng)).toBe(want);
      expect(spawnSize(1, true, want, rng)).toBe(want);
      for (let i = 0; i < 50; i++) expect(spawnSize(5, false, want, rng)).toBe(want);
      const later = Array.from({ length: 200 }, () => spawnSize(5, true, want, rng));
      expect(later).toContain('big');
      expect(later).toContain('little');
    }
  });

  it('the ghost finger pops only the size asked for, and waits when none is showing', () => {
    const at = (x: number, y: number, size: 'big' | 'little'): DemoBubble => ({
      x,
      y,
      r: 60,
      color: null,
      size,
    });
    const shown = [at(300, 300, 'little'), at(500, 320, 'big')];
    expect(bubbleToPop('size', shown, null, 1, undefined, null, 'big')).toBe(shown[1]);
    expect(bubbleToPop('size', shown, null, 1, undefined, null, 'little')).toBe(shown[0]);
    expect(bubbleToPop('size', [shown[0]], null, 1, undefined, null, 'big')).toBeNull();
  });
});

describe('which one has the dots (level 17, preschool, between 6 and 7)', () => {
  const plan = planFor(17);

  it('is played by preschoolers after the colors and before the numerals, and by no other band', () => {
    expect(LEVELS.preschool!.order).toEqual([4, 5, 6, 17, 7, 18, 8, 9]);
    for (const band of ['lap', 'toddler', 'prek', 'school'] as const)
      expect(LEVELS[band]!.order ?? [], band).not.toContain(17);
  });

  it('shows one bubble of each count from 1 to 4, all on the screen at once, with no numeral support switched on', () => {
    expect(plan.dotsTo).toBe(4);
    expect(plan.most).toBe(plan.dotsTo);
    expect(showsDots(17)).toBe(false);
    expect(signFor(plan, 17, dotAsks(plan, new Rng(1)))).toBeNull();
  });

  it('asks for every count once before any repeats, never the same count twice running, always one that is showing', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const asks = dotAsks(plan, new Rng(seed));
      expect(asks.length).toBe(plan.goal);
      expect([...asks.slice(0, 4)].sort()).toEqual([1, 2, 3, 4]);
      asks.forEach((n, i) => {
        expect(n).toBeGreaterThanOrEqual(1);
        expect(n).toBeLessThanOrEqual(plan.dotsTo!);
        if (i) expect(n, `seed ${seed}`).not.toBe(asks[i - 1]);
      });
    }
  });

  it('with one bubble per count showing, exactly one is right for any ask', () => {
    const shown = [1, 2, 3, 4].map((n) => ({ color: null, number: n }));
    for (let ask = 1; ask <= 4; ask++)
      expect(shown.filter((b) => isRight('dots', b, null, ask)).length).toBe(1);
  });

  it('draws every count 1 to 6 as a fixed dice face: that many pips, apart from each other and inside the bubble', () => {
    for (let n = 1; n <= 6; n++) {
      const pips = dicePips(n);
      expect(pips).toEqual(dicePips(n));
      expect(pips.length).toBe(n);
      pips.forEach((a, i) => {
        expect(Math.hypot(a.x, a.y) + PIP_RADIUS).toBeLessThan(0.7);
        for (const b of pips.slice(i + 1))
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(PIP_RADIUS * 2.4);
      });
    }
    expect(dicePips(0)).toEqual([]);
    expect(dicePips(7)).toEqual([]);
  });
});

describe('where a still bubble starts', () => {
  it('starts clear of the bubbles already there whenever the screen has room, and never outside its box', () => {
    for (const level of [9, 17, 18]) {
      const plan = planFor(level);
      for (let seed = 1; seed <= 50; seed++) {
        const rng = new Rng(seed);
        const placed: { x: number; y: number; r: number }[] = [];
        for (let i = 0; i < plan.most; i++) {
          const r = plan.radius[1];
          const box = spawnBox(768, 1662, r, true);
          const at = clearSpot(box, r, placed, rng);
          expect(at.x).toBeGreaterThanOrEqual(box.x[0]);
          expect(at.x).toBeLessThanOrEqual(box.x[1]);
          expect(at.y).toBeGreaterThanOrEqual(box.y[0]);
          expect(at.y).toBeLessThanOrEqual(box.y[1]);
          for (const o of placed)
            expect(Math.hypot(o.x - at.x, o.y - at.y), `level ${level} seed ${seed}`).toBeGreaterThan(
              o.r + r,
            );
          placed.push({ ...at, r });
        }
      }
    }
  });
});

describe('dots and numbers together (level 18, preschool, between 7 and 8)', () => {
  const plan = planFor(18);

  it('comes after level 7, where numerals first appear, and is played by no band but preschool', () => {
    const order = LEVELS.preschool!.order!;
    expect(order.indexOf(18)).toBe(order.indexOf(7) + 1);
    expect(LEVELS.preschool!.max).toBe(18);
    for (const band of ['lap', 'toddler', 'prek', 'school'] as const)
      expect(LEVELS[band]!.order ?? [], band).not.toContain(18);
    expect(plan.mode).toBe('match');
    expect(signFor(plan, 18, [])).toBeNull();
    expect(showsDots(18)).toBe(false);
  });

  it('opens with exactly one numeral and one dot bubble for each count 1 to 4, filling the screen and no more', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const faces = matchFaces(plan, new Rng(seed));
      expect(faces.length).toBe(plan.most);
      for (let n = 1; n <= plan.dotsTo!; n++) {
        expect(faces.filter((f) => f.number === n && f.pips).length).toBe(1);
        expect(faces.filter((f) => f.number === n && !f.pips).length).toBe(1);
      }
      // So every bubble has exactly one partner.
      for (const f of faces) expect(faces.filter((o) => partners(f, o)).length).toBe(1);
    }
  });

  it('never colors a pair alike, at the start or in a replacement, so the color never gives the match away', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const faces = matchFaces(plan, rng);
      for (const f of faces) {
        const partner = faces.find((o) => partners(f, o))!;
        expect(partner.color, `seed ${seed}`).not.toBe(f.color);
      }
      for (let n = 1; n <= 4; n++) {
        const [a, b] = matchPair(n, rng);
        expect(a.color).not.toBe(b.color);
        expect(partners(a, b)).toBe(true);
        expect(RAINBOW).toContain(a.color);
      }
    }
  });

  it('a partner is the same number the other way; the same kind moves the hold and is never a miss', () => {
    const num = (n: number) => ({ color: null, number: n, pips: false });
    const dots = (n: number) => ({ color: null, number: n, pips: true });
    const three = num(3);
    expect(matchTap(three, dots(3))).toBe('match');
    expect(matchTap(dots(3), three)).toBe('match');
    expect(matchTap(three, three)).toBe('release');
    expect(matchTap(three, num(2))).toBe('switch');
    expect(matchTap(dots(1), dots(4))).toBe('switch');
    expect(matchTap(three, dots(2))).toBe('miss');
    expect(matchTap(dots(4), num(1))).toBe('miss');
    expect(partners(three, num(3))).toBe(false);
  });

  it('the ghost finger takes dots first, then the numeral that matches them, and never a wrong partner', () => {
    const at = (x: number, n: number, pips: boolean): DemoBubble => ({
      x,
      y: 300,
      r: 64,
      color: null,
      number: n,
      pips,
    });
    const shown = [at(200, 2, false), at(300, 3, true), at(400, 2, true), at(500, 3, false)];
    const first = bubbleToPop('match', shown, null, 0, undefined, null)!;
    expect(first.pips).toBe(true);
    const second = bubbleToPop('match', shown, null, 0, undefined, first)!;
    expect(matchTap(first, second)).toBe('match');
    // Holding one whose partner is not showing yet: wait.
    expect(bubbleToPop('match', [shown[0], shown[1]], null, 0, undefined, shown[0])).toBeNull();
  });
});

describe('pictures in the bubbles', () => {
  it('are two for every scene a round can float in, each named once and each with a line of its own', () => {
    expect(Object.keys(PICTURES).sort()).toEqual([...SCENES].sort());
    const all = Object.values(PICTURES).flat();
    expect(new Set(all).size).toBe(all.length);
    for (const names of Object.values(PICTURES)) expect(names.length).toBe(2);
    for (const name of all) expect(SCRIPT[pictureLine(name)], name).toBeDefined();
  });

  it('are not friends, so the sticker pool is untouched', () => {
    const all: string[] = Object.values(PICTURES).flat();
    for (const friend of FRIENDS) expect(all).not.toContain(friend);
  });

  it("ride only in a bubble with no friend, come from the round's own scene, and leave most bubbles empty", () => {
    for (const scene of SCENES) {
      const rng = new Rng(11);
      const riders = Array.from({ length: 600 }, () => riderFor(rng, scene));
      for (const r of riders) {
        expect(r.friend && r.picture).toBeFalsy();
        if (r.picture) expect(PICTURES[scene] as readonly string[]).toContain(r.picture);
      }
      const count = (key: 'friend' | 'picture') => riders.filter((r) => r[key]).length;
      expect(count('friend')).toBeGreaterThan(120);
      expect(count('picture')).toBeGreaterThan(40);
      expect(count('friend') + count('picture')).toBeLessThan(330);
      for (const name of PICTURES[scene]) expect(riders.some((r) => r.picture === name)).toBe(true);
    }
  });
});
