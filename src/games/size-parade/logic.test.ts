import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  askRank, BIG_LITTLE, DARKEST_FIRST, fromHsl, gapMids, insertAsks, insertGap, insertGapFor, insertLayout, insertLine, insertWhy, luminance, SHADE_COLORS, SHADE_LIGHTNESS, SHADE_STEP, shades, WHERE_DOES_IT_GO, BIG_LITTLE_ASKS, CRITTER_H, CYCLE, CYCLE_SCALE, CYCLE_TAPS, cycleAt, dealSteps, dropSpot, FIT_PROPS, fitAsks, fitTry, FLAG_COLORS, FRIEND_SCALE, FRIENDS, middleAsks, MIDDLE_ONE, MIN_RATIO, paradeLayout,
  BOOT_COLORS, HIDDEN_HEIGHTS, HIDDEN_LINES, hiddenStart, inversions, isSorted, mixedPair, pairTest, SWEEP_START, sweepAfter, sweepNext, type Sweep,
  pickRounds, propSize, SIZE_CYCLE, SIZE_PLANS, sizeBell, sizeOrder, sizePlan, sizeScale, sizeTouch, sizeWord, stepBell, STEPS, stepScale, TARGET, TWO_IN_A_LINE, WHO_FITS,
} from './logic';
import { fitPose } from './props';
import { sizeParade } from './index';

/** An iPad sideways and upright, and a phone sideways: the logical width is never below the 1024 design width. */
const VIEWS = [computeView(1024, 768), computeView(768, 1024), computeView(844, 390)];

/** Smallest acceptable WCAG contrast ratio between neighbouring shades. */
const CONTRAST_FLOOR = 1.35; // measured minimum neighbour ratio is 1.381 (purple's darkest step)

describe('Size Parade', () => {
  it('orders ranks from smallest or biggest, and bigger ranks are bigger', () => {
    expect(sizeOrder(3, 'small')).toEqual([0, 1, 2]);
    expect(sizeOrder(3, 'big')).toEqual([2, 1, 0]);
    for (let n = 2; n <= 5; n++) for (let r = 1; r < n; r++) expect(sizeScale(r, n)).toBeGreaterThan(sizeScale(r - 1, n));
  });

  it('the ghost finger finds the biggest or smallest friend, and lines every level up in order, touching no wrong friend', () => {
    for (const plan of SIZE_PLANS) {
      for (let seed = 1; seed <= 40; seed++) {
        const rng = new Rng(seed);
        const order = sizeOrder(plan.count, plan.order);
        // The friends in the row are shuffled; the pick levels deal four of them, the line levels one row.
        const rows = plan.mode === 'pick' ? 4 : 1;
        for (let row = 0; row < rows; row++) {
          const friends = rng.shuffle([...order]).map((rank) => ({ rank, placed: false }));
          let step = 0;
          while (step < (plan.mode === 'pick' ? 1 : order.length)) {
            const i = sizeTouch(order, step, friends);
            expect(i, `${plan.name}: a friend to touch`).not.toBeNull();
            expect(friends[i!].rank, 'the right size').toBe(order[step]);
            expect(friends[i!].placed).toBe(false);
            if (plan.mode === 'line') friends[i!].placed = true;
            step++;
          }
        }
      }
    }
  });

  it('asks for bigger or smaller between two friends, biggest or smallest among more', () => {
    for (const plan of SIZE_PLANS) {
      const word = sizeWord(plan);
      if (plan.count === 2) expect(word).toBe(plan.order === 'big' ? 'bigger' : 'smaller');
      else expect(word).toBe(plan.order === 'big' ? 'biggest' : 'smallest');
    }
  });

  it('chimes the biggest friend lowest, on steps that fall as size rises', () => {
    for (let n = 2; n <= 5; n++) {
      for (let r = 1; r < n; r++) expect(sizeBell(r, n)).toBeLessThan(sizeBell(r - 1, n));
      expect(sizeBell(0, n)).toBe(9);
      expect(sizeBell(n - 1, n)).toBe(5);
    }
  });

  it('pins the size steps: neighbours differ by at least 18 units, and the smallest friend keeps a full target', () => {
    for (const plan of SIZE_PLANS) {
      const h = (r: number) => sizeScale(r, plan.count) * FRIEND_SCALE * CRITTER_H;
      for (let r = 1; r < plan.count; r++) expect(h(r) - h(r - 1), plan.name).toBeGreaterThanOrEqual(18);
      expect(h(0)).toBeGreaterThan(55);
    }
    expect(TARGET.w).toBeGreaterThanOrEqual(100);
    expect(TARGET.h).toBeGreaterThanOrEqual(100);
  });

  it('lays every row out without overlapping targets, each at least 100 wide, and keeps the line spots apart', () => {
    for (const v of VIEWS) {
      expect(v.w).toBeGreaterThanOrEqual(1024);
      for (const plan of SIZE_PLANS) {
        const slots = plan.mode === 'line' ? plan.count : 0;
        const { friends, targetW, spots } = paradeLayout(plan.count, slots, v.w);
        expect(targetW, plan.name).toBeGreaterThanOrEqual(100);
        for (let i = 1; i < friends.length; i++) expect(friends[i] - friends[i - 1], plan.name).toBeGreaterThanOrEqual(targetW);
        expect(friends[0] - targetW / 2).toBeGreaterThanOrEqual(80);
        expect(friends[friends.length - 1] + targetW / 2).toBeLessThanOrEqual(v.w);
        for (let i = 1; i < spots.length; i++) expect(spots[i] - spots[i - 1]).toBeGreaterThanOrEqual(132);
      }
    }
  });

  it('takes a drop near the glowing spot as generously as before, and names another spot rather than counting it', () => {
    const { spots } = paradeLayout(5, 5, 1024), y = 300;
    for (let glowing = 0; glowing < 5; glowing++) {
      expect(dropSpot(spots[glowing], y, spots, y, glowing)).toBe(glowing);
      expect(dropSpot(spots[glowing] + 80, y + 90, spots, y, glowing)).toBe(glowing);
      for (let other = 0; other < 5; other++) if (Math.abs(other - glowing) > 1) expect(dropSpot(spots[other], y, spots, y, glowing)).toBe(other);
    }
    expect(dropSpot(spots[2], y + 200, spots, y, 2)).toBeNull();
    expect(dropSpot(spots[4] + 200, y, spots, y, 0)).toBeNull();
  });

  it('level 17 lines two friends up, smaller first, and the bot can do it; level 10 asks for the middle at least twice in four rows', () => {
    expect(sizePlan(17)).toBe(TWO_IN_A_LINE);
    expect(sizePlan(10)).toBe(MIDDLE_ONE);
    expect(sizePlan(4).count).toBe(4);
    const order = sizeOrder(2, 'small'), friends = [{ rank: 1, placed: false }, { rank: 0, placed: false }];
    expect(friends[sizeTouch(order, 0, friends)!].rank).toBe(0);
    friends[1].placed = true;
    expect(friends[sizeTouch(order, 1, friends)!].rank).toBe(1);
    for (let seed = 1; seed <= 200; seed++) {
      const asks = middleAsks(new Rng(seed));
      expect(asks).toHaveLength(4);
      expect(asks.filter((a) => a === 'middle').length).toBeGreaterThanOrEqual(2);
      expect(asks.some((a) => a !== 'middle')).toBe(true);
      for (const a of asks) expect([0, 1, 2]).toContain(askRank(a));
    }
    expect(askRank('middle')).toBe(1);
    expect(sizeWord(MIDDLE_ONE, 'middle')).toBe('middle-sized');
  });

  it('deals the even spread to every line level and a pick level’s first row, then varied steps that keep a fair ratio', () => {
    const gameH = (step: number) => stepScale(step) * FRIEND_SCALE * CRITTER_H;
    for (const plan of [...SIZE_PLANS, TWO_IN_A_LINE, MIDDLE_ONE, BIG_LITTLE]) {
      for (let seed = 1; seed <= 60; seed++) {
        const rng = new Rng(seed);
        for (let row = 0; row < 4; row++) {
          const steps = dealSteps(rng, plan, row);
          expect(steps, plan.name).toHaveLength(plan.count);
          // Littlest first, every step distinct and on the five-step scale, so rank still means size and neighbours differ by at least 18 units.
          for (let r = 1; r < plan.count; r++) { expect(steps[r], plan.name).toBeGreaterThan(steps[r - 1]); expect(gameH(steps[r]) - gameH(steps[r - 1])).toBeGreaterThanOrEqual(18); }
          for (const st of steps) expect(st).toBeGreaterThanOrEqual(0), expect(st).toBeLessThan(STEPS);
          if (plan.mode === 'line' || row === 0 || plan.bigLittle) { expect(steps[0]).toBe(0); expect(steps[plan.count - 1]).toBe(STEPS - 1); }
          // Two friends stay at least two steps apart, a ratio of at least 1.4; the first row's 2.4 needs no adult.
          if (plan.count === 2) expect(stepScale(steps[1]) / stepScale(steps[0])).toBeGreaterThanOrEqual(1.4);
          // In a varied pick row the asked friend is never a near call against its neighbours.
          if (plan.mode === 'pick' && row > 0) { const asked = plan.order === 'small' ? 0 : plan.count - 1, ratio = (a: number, b: number) => Math.max(stepScale(a), stepScale(b)) / Math.min(stepScale(a), stepScale(b));
          for (const n of [asked - 1, asked + 1]) if (steps[n] !== undefined) expect(ratio(steps[n], steps[asked]), plan.name).toBeGreaterThanOrEqual(MIN_RATIO); }
          if (plan.count === 2 && row === 0) expect(stepScale(steps[1]) / stepScale(steps[0])).toBeCloseTo(2.38, 1);
        }
      }
    }
    // Later rows do vary at the pick levels, and the middle one of level 10 keeps both neighbours a fair step away.
    for (const plan of [SIZE_PLANS[0], SIZE_PLANS[2], SIZE_PLANS[3]]) {
      const seen = new Set<string>();
      for (let seed = 1; seed <= 30; seed++) seen.add(dealSteps(new Rng(seed), plan, 1).join(','));
      expect(seen.size, plan.name).toBeGreaterThan(1);
    }
    for (let seed = 1; seed <= 40; seed++) {
      const steps = dealSteps(new Rng(seed), MIDDLE_ONE, 1, 1);
      expect(steps).toHaveLength(3);
      for (const n of [0, 2]) expect(Math.max(stepScale(steps[n]), stepScale(steps[1])) / Math.min(stepScale(steps[n]), stepScale(steps[1]))).toBeGreaterThanOrEqual(MIN_RATIO);
    }
    expect(FRIENDS).toHaveLength(8);
    expect(new Set(FRIENDS).size).toBe(8);
    expect(new Set(FLAG_COLORS).size).toBe(FLAG_COLORS.length);
    for (let st = 1; st < STEPS; st++) expect(stepBell(st)).toBeLessThan(stepBell(st - 1));
    expect(sizeBell(0, 5)).toBe(stepBell(0));
  });

  it('level 16 cycles one friend through three sizes and back, ending after a bounded number of taps, big enough to see and small enough to touch', () => {
    expect(sizePlan(16)).toBe(SIZE_CYCLE);
    expect(cycleAt(0)).toEqual({ step: 0, word: null });
    const steps = [0], words: string[] = [];
    for (let t = 1; t <= CYCLE.length; t++) { const c = cycleAt(t); steps.push(c.step); words.push(c.word!); }
    expect(steps).toEqual([0, 2, 4, 2, 0]);
    expect(words).toEqual(['bigger', 'biggest', 'smaller', 'littlest']);
    expect(new Set(steps).size).toBe(3);
    expect(CYCLE_TAPS).toBe(12);
    for (let t = 1; t <= CYCLE_TAPS; t++) expect(cycleAt(t)).toEqual(cycleAt(((t - 1) % CYCLE.length) + 1));
    const h = (step: number) => stepScale(step) * FRIEND_SCALE * CYCLE_SCALE * CRITTER_H;
    // The littlest keeps a full target; the biggest, standing 90 from the bottom, keeps its head below the cue strip in a sideways iPad view.
    expect(h(0)).toBeGreaterThanOrEqual(100);
    expect(TARGET.w).toBeGreaterThanOrEqual(100);
    for (const v of VIEWS) expect(v.h - 90 - h(4)).toBeGreaterThanOrEqual(150);
  });

  it('level 9 asks for the big one, then the little one, then the big one, at a 2.4 ratio, far apart, and the bot finds each', () => {
    expect(sizePlan(9)).toBe(BIG_LITTLE);
    expect(pickRounds(BIG_LITTLE)).toBe(3);
    expect(pickRounds(SIZE_PLANS[0])).toBe(4);
    expect(BIG_LITTLE_ASKS).toEqual(['big', 'small', 'big']);
    for (let i = 1; i < BIG_LITTLE_ASKS.length; i++) expect(BIG_LITTLE_ASKS[i]).not.toBe(BIG_LITTLE_ASKS[i - 1]);
    expect(askRank('big', 2)).toBe(1);
    expect(askRank('small', 2)).toBe(0);
    expect(askRank('big')).toBe(2);
    expect(sizeWord(BIG_LITTLE, 'big')).toBe('big');
    expect(sizeWord(BIG_LITTLE, 'small')).toBe('little');
    const steps = dealSteps(new Rng(3), BIG_LITTLE, 1);
    expect(stepScale(steps[1]) / stepScale(steps[0])).toBeGreaterThanOrEqual(2);
    for (const v of VIEWS) {
      const { friends, targetW } = paradeLayout(2, 0, v.w, 420);
      expect(friends[1] - friends[0]).toBeGreaterThanOrEqual(400);
      expect(targetW).toBeGreaterThanOrEqual(100);
      expect(friends[0] - targetW / 2).toBeGreaterThanOrEqual(165);
      expect(friends[1] + targetW / 2).toBeLessThanOrEqual(v.w);
    }
    for (const ask of BIG_LITTLE_ASKS) {
      const order = [askRank(ask, 2)], friends = [{ rank: 1, placed: false }, { rank: 0, placed: false }];
      expect(friends[sizeTouch(order, 0, friends)!].rank).toBe(ask === 'big' ? 1 : 0);
    }
  });

  it('level 11 asks four props in a fixed order, each sized as a fixed multiple of the friend who fits it, scaling with that friend', () => {
    expect(sizePlan(11)).toBe(WHO_FITS);
    expect(WHO_FITS.mode).toBe('fit');
    expect(WHO_FITS.count).toBe(3);
    expect(pickRounds(WHO_FITS)).toBe(4);
    expect(FIT_PROPS.map((p) => p.kind)).toEqual(['bed', 'chair', 'bowl', 'door']);
    const h = (step: number) => stepScale(step) * FRIEND_SCALE * CRITTER_H;
    for (const { kind, ratio } of FIT_PROPS) {
      for (let step = 0; step < STEPS; step++) expect(propSize(kind, h(step)) / h(step)).toBeCloseTo(ratio, 6);
      for (let step = 1; step < STEPS; step++) expect(propSize(kind, h(step))).toBeGreaterThan(propSize(kind, h(step - 1)));
      // The biggest friend's prop still stands above the row and below the progress dots in a landscape view.
      expect(propSize(kind, h(4)) * (kind === 'bed' ? 0.62 : kind === 'door' ? 1.04 : 1)).toBeLessThan(768 - 330 - 140);
    }
  });

  it('level 11: exactly one of three friends fits each prop, the fitting rank is never the same twice running, and every rank fits once', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const asks = fitAsks(new Rng(seed));
      expect(asks).toHaveLength(4);
      const ranks = asks.map((a) => askRank(a, 3));
      for (let i = 1; i < ranks.length; i++) expect(ranks[i]).not.toBe(ranks[i - 1]);
      expect(new Set(ranks)).toEqual(new Set([0, 1, 2]));
      for (const fitting of ranks) {
        expect([0, 1, 2].filter((rank) => fitTry(rank, fitting) === 'fits')).toEqual([fitting]);
        for (const rank of [0, 1, 2]) if (rank !== fitting) expect(fitTry(rank, fitting)).toBe(rank > fitting ? 'big' : 'little');
      }
    }
    // Over many rounds no rank fits more often than chance would make "always the biggest" a strategy.
    const count = [0, 0, 0];
    for (let seed = 1; seed <= 300; seed++) for (const a of fitAsks(new Rng(seed))) count[askRank(a, 3)]++;
    for (const c of count) expect(c / 1200).toBeGreaterThan(0.25);
  });

  it('level 11 deals the even spread first, then varied sizes that keep the fitting friend clearly apart from each neighbour, and the bot taps it', () => {
    for (let seed = 1; seed <= 60; seed++) {
      const rng = new Rng(seed), asks = fitAsks(rng);
      asks.forEach((ask, row) => {
        const fitting = askRank(ask, 3), steps = dealSteps(rng, WHO_FITS, row, fitting);
        if (row === 0) expect(steps).toEqual([0, 2, 4]);
        expect(new Set(steps).size).toBe(3);
        for (const n of [fitting - 1, fitting + 1]) if (steps[n] !== undefined) {
          const a = stepScale(steps[n]), b = stepScale(steps[fitting]);
          expect(Math.max(a, b) / Math.min(a, b)).toBeGreaterThanOrEqual(MIN_RATIO);
        }
        const friends = rng.shuffle([0, 1, 2]).map((rank) => ({ rank, placed: false }));
        expect(friends[sizeTouch([fitting], 0, friends)!].rank).toBe(fitting);
      });
    }
  });

  it('level 11: the fitting friend lies within the bed while one rank bigger hangs its feet over the end', () => {
    const h = (step: number) => stepScale(step) * FRIEND_SCALE * CRITTER_H;
    // A dealt neighbour is at least `MIN_RATIO` bigger than the fitting friend (`dealSteps`), and such a friend hangs over the end.
    for (let fit = 0; fit < STEPS; fit++) {
      const size = propSize('bed', h(fit));
      expect(fitPose('bed', size, h(fit)).x).toBeLessThanOrEqual(size / 2);
      for (let big = fit + 1; big < STEPS; big++) if (h(big) / h(fit) >= MIN_RATIO) expect(fitPose('bed', size, h(big)).x).toBeGreaterThan(size / 2);
      expect(fitPose('bed', size, h(fit) * MIN_RATIO).x).toBeGreaterThan(size / 2);
    }
    // In the other props the friend stands or sits at the prop, and the biggest friend's try stays inside the landscape sky.
    for (const kind of ['chair', 'bowl', 'door'] as const) {
      const pose = fitPose(kind, propSize(kind, h(2)), h(4));
      expect(Math.abs(pose.x)).toBeLessThan(40);
      expect(pose.rotation).toBe(0);
    }
  });

  it('level 11 sits at the top of the preschool order and after 6 in pre-K, and is described', () => {
    expect(sizeParade.levels('preschool')).toEqual({ min: 3, max: 17, order: [3, 4, 17, 10, 5, 6, 11] });
    expect(sizeParade.levels('prek')).toEqual({ min: 5, max: 15, order: [5, 6, 11, 7, 8, 12, 15] });
    expect(sizeParade.levels('school')).toEqual({ min: 7, max: 15, order: [7, 8, 12, 13, 15] });
    expect(sizeParade.describeLevel(11)).toMatch(/bed, chair, bowl and door/);
  });

  it('levels 12 and 15 are planned and sit in the pre-K and school ladders', () => {
    expect(sizePlan(12).mode).toBe('insert');
    expect(sizePlan(12)).toBe(WHERE_DOES_IT_GO);
    expect(sizePlan(15)).toBe(DARKEST_FIRST);
    expect(sizePlan(15).shade).toBe(true);
    expect(sizePlan(15).mode).toBe('line');
    expect(sizePlan(15).count).toBe(5);
    for (const band of ['prek', 'school'] as const) {
      const r = sizeParade.levels(band);
      expect(r.order).toContain(12);
      expect(r.order).toContain(15);
      expect(r.max).toBeGreaterThanOrEqual(15);
    }
  });

  it('level 12 asks four questions, two each way, with the newcomer inside the line in at least two', () => {
    for (let seed = 1; seed <= 300; seed++) {
      const asks = insertAsks(new Rng(seed));
      expect(asks).toHaveLength(4);
      expect(asks.filter((a) => a.order === 'small')).toHaveLength(2);
      expect(asks.filter((a) => a.order === 'big')).toHaveLength(2);
      for (const a of asks) expect(a.rank).toBeGreaterThanOrEqual(0), expect(a.rank).toBeLessThanOrEqual(4);
      const inner = asks.filter((a) => { const g = insertGapFor(a); return g !== 0 && g !== 4; });
      expect(inner.length, `seed ${seed}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('level 12 is deterministic by seed', () => {
    expect(insertAsks(new Rng(7))).toEqual(insertAsks(new Rng(7)));
  });

  it('level 12 has a line of four in strict order and exactly one right gap', () => {
    for (let seed = 1; seed <= 300; seed++) for (const ask of insertAsks(new Rng(seed))) {
      const line = insertLine(ask);
      expect(line).toHaveLength(4);
      expect(new Set(line).size).toBe(4);
      expect(line).not.toContain(ask.rank);
      line.forEach((r, i) => { if (i) ask.order === 'small' ? expect(r).toBeGreaterThan(line[i - 1]) : expect(r).toBeLessThan(line[i - 1]); });
      const right = insertGapFor(ask);
      expect(right).toBeGreaterThanOrEqual(0);
      expect(right).toBeLessThanOrEqual(4);
      // Inserting at the right gap gives a full line in order; any other gap breaks it.
      for (let g = 0; g <= 4; g++) {
        const full = [...line.slice(0, g), ask.rank, ...line.slice(g)];
        const ordered = full.every((r, i) => !i || (ask.order === 'small' ? r > full[i - 1] : r < full[i - 1]));
        expect(ordered, `gap ${g}`).toBe(g === right);
        expect(insertWhy(ask, g) === null).toBe(g === right);
      }
    }
  });

  it('level 12 reads a drop at each gap as that gap, and a drop far from the line as none', () => {
    for (const view of VIEWS) {
      const lineY = view.h - 90, { rest } = insertLayout(view.w, null), mids = gapMids(rest);
      expect(mids).toHaveLength(5);
      mids.forEach((x, g) => {
        for (const up of [0, 50, 100, 150]) expect(insertGap(x, lineY - up, rest, lineY), `gap ${g} up ${up}`).toBe(g);
        expect(insertGap(x, view.h - 400, rest, lineY)).toBeNull();
      });
    }
  });

  it('level 12 opens a wide gap and never overlaps two friends', () => {
    for (const view of VIEWS) {
      const none = insertLayout(view.w, null);
      expect(none.rest).toHaveLength(4);
      none.rest.forEach((x, i) => { if (i) expect(x - none.rest[i - 1]).toBeGreaterThanOrEqual(TARGET.w); });
      for (let g = 0; g <= 4; g++) {
        const l = insertLayout(view.w, g);
        expect(l.xs).toHaveLength(4);
        expect(l.openW).toBeGreaterThanOrEqual(100);
        l.xs.forEach((x, i) => { if (i) expect(x - l.xs[i - 1], `gap ${g}`).toBeGreaterThanOrEqual(TARGET.w); });
        if (g > 0 && g < 4) expect(l.xs[g] - l.xs[g - 1]).toBeCloseTo(2 * l.openW, 5);
        else expect(l.xs[1] - l.xs[0]).toBeCloseTo(l.openW, 5);
      }
    }
  });

  it('level 12 explains a wrong gap truthfully, pointing toward the right one', () => {
    for (let seed = 1; seed <= 300; seed++) for (const ask of insertAsks(new Rng(seed))) {
      const line = insertLine(ask), right = insertGapFor(ask);
      for (let g = 0; g <= 4; g++) {
        const why = insertWhy(ask, g);
        if (g === right) { expect(why).toBeNull(); continue; }
        expect(why).not.toBeNull();
        expect(why!.side).toBe(g < right ? 'after' : 'before');
        expect([g, g - 1]).toContain(why!.friend);
        expect(why!.friend).toBeGreaterThanOrEqual(0);
        expect(why!.friend).toBeLessThan(4);
        expect(why!.cmp).toBe(ask.rank > line[why!.friend] ? 'bigger' : 'smaller');
        // The friend named really is on the wrong side of the newcomer in the line's order.
        const comesFirst = ask.order === 'small' ? line[why!.friend] < ask.rank : line[why!.friend] > ask.rank;
        expect(comesFirst).toBe(why!.side === 'before' ? false : true);
      }
    }
  });

  it('level 15 shades are five distinct, evenly stepped, readable steps from darkest to lightest', () => {
    expect(SHADE_STEP).toBeGreaterThanOrEqual(0);
    for (let i = 1; i < SHADE_LIGHTNESS.length; i++) expect(SHADE_LIGHTNESS[i] - SHADE_LIGHTNESS[i - 1]).toBeCloseTo(SHADE_LIGHTNESS[1] - SHADE_LIGHTNESS[0], 9);
    for (const color of SHADE_COLORS) {
      const five = shades(color);
      expect(five).toHaveLength(5);
      expect(new Set(five.map((s) => s.fill)).size).toBe(5);
      five.forEach((s, i) => {
        expect(luminance(s.line), `${color} ${i} line darker`).toBeLessThan(luminance(s.fill));
        if (!i) return;
        const lo = luminance(five[i - 1].fill), hi = luminance(s.fill);
        expect(hi, `${color} ${i}`).toBeGreaterThan(lo);
        expect((hi + 0.05) / (lo + 0.05), `${color} ${i} contrast`).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
      });
    }
  });

  it('fromHsl round-trips the primaries', () => {
    expect(fromHsl(0, 1, 0.5)).toBe(0xff0000);
    expect(fromHsl(120, 1, 0.5)).toBe(0x00ff00);
    expect(fromHsl(240, 1, 0.5)).toBe(0x0000ff);
    expect(fromHsl(0, 0, 1)).toBe(0xffffff);
  });
  describe('level 13 Hidden heights', () => {
    const perms = (n: number): number[][] => n === 0 ? [[]] : perms(n - 1).flatMap(p => Array.from({ length: n }, (_, i) => [...p.slice(0, i), n - 1, ...p.slice(i)]));
    const ALL = [...perms(4), ...perms(5)];

    it('is planned as a hidden littlest-first level in the school ladder', () => {
      expect(sizePlan(13)).toBe(HIDDEN_HEIGHTS);
      expect(HIDDEN_HEIGHTS.mode).toBe('hidden');
      expect(HIDDEN_HEIGHTS.order).toBe('small');
      expect(sizeParade.describeLevel(13).length).toBeGreaterThan(0);
      expect(sizeParade.levels('school')).toEqual({ min: 7, max: 15, order: [7, 8, 12, 13, 15] });
      expect(new Set(HIDDEN_LINES)).toEqual(new Set([4, 5]));
      expect(new Set(BOOT_COLORS).size).toBeGreaterThanOrEqual(Math.max(...HIDDEN_LINES));
    });

    it('seeded starts are permutations that are never sorted and repeat per seed', () => {
      for (const n of HIDDEN_LINES) for (let seed = 1; seed <= 300; seed++) {
        const line = hiddenStart(new Rng(seed), n);
        expect([...line].sort((a, b) => a - b)).toEqual(Array.from({ length: n }, (_, i) => i));
        expect(isSorted(line)).toBe(false);
        expect(inversions(line)).toBeGreaterThanOrEqual(2);
        expect(hiddenStart(new Rng(seed), n)).toEqual(line);
      }
    });

    it('a pair test swaps only when the left friend is bigger, and only ever helps', () => {
      for (const line of ALL) for (let a = 0; a < line.length; a++) for (let b = 0; b < line.length; b++) {
        if (a === b) continue;
        const copy = [...line], { line: out, swapped } = pairTest(line, a, b);
        expect(line).toEqual(copy);
        const [l, r] = a < b ? [a, b] : [b, a];
        expect(swapped).toBe(line[l] > line[r]);
        if (swapped) {
          expect(out[l]).toBe(line[r]); expect(out[r]).toBe(line[l]);
          expect(inversions(out)).toBeLessThan(inversions(line));
        } else expect(out).toEqual(line);
        expect(inversions(out)).toBeLessThanOrEqual(inversions(line));
      }
    });

    it('isSorted matches zero inversions, and mixedPair points at a swap that mends exactly one', () => {
      for (const line of ALL) {
        expect(isSorted(line)).toBe(inversions(line) === 0);
        const i = mixedPair(line);
        if (isSorted(line)) { expect(i).toBeNull(); continue; }
        expect(i).not.toBeNull();
        expect(line[i!]).toBeGreaterThan(line[i! + 1]);
        const t = pairTest(line, i!, i! + 1);
        expect(t.swapped).toBe(true);
        expect(inversions(t.line)).toBe(inversions(line) - 1);
      }
    });

    it('the ghost sweep always sorts within n(n-1)/2 tests, even after interference', () => {
      const run = (start: number[], s0: Sweep) => {
        let line = start, s = s0, tests = 0;
        for (;;) {
          const step = sweepNext(s);
          if (step === 'gate') return { line, tests };
          const t = pairTest(line, step[0], step[1]);
          line = t.line; tests++;
          s = sweepAfter(s, line.length, t.swapped);
          expect(tests).toBeLessThanOrEqual(50);
        }
      };
      for (const line of ALL) {
        const r = run(line, SWEEP_START);
        expect(isSorted(r.line)).toBe(true);
        expect(r.tests).toBeLessThanOrEqual(line.length * (line.length - 1) / 2);
      }
      for (const n of HIDDEN_LINES) for (let seed = 1; seed <= 200; seed++) {
        const rng = new Rng(seed);
        let line = hiddenStart(rng, n);
        for (let k = rng.int(0, 6); k > 0; k--) line = pairTest(line, rng.int(0, n - 1), rng.int(0, n - 1)).line;
        expect(isSorted(run(line, SWEEP_START).line)).toBe(true);
      }
    });

    it('following the hint pair repeatedly sorts in exactly the line\'s inversions', () => {
      for (const start of ALL) {
        let line = start, tests = 0;
        for (let i = mixedPair(line); i !== null; i = mixedPair(line)) { line = pairTest(line, i, i + 1).line; tests++; }
        expect(isSorted(line)).toBe(true);
        expect(tests).toBe(inversions(start));
      }
    });
  });
});
