import { describe, expect, it } from 'vitest';
import { DEMO_SPOTS, LIMIT, pixel, place, PLANS, STAMP_COLORS, stampDemo, type StampKind, type StampState } from './logic';
import type { ColorName } from '../../art/palette';
import { STAMP_KINDS, STAMP_NAMES, stickerStamp } from './logic';
import { Rng } from '../../engine/random';
import { roundPlan } from './logic';
import { howToFor } from '../../content/howto';
import { SCRIPT } from '../../content/voice-script';
import { stampStudio } from './index';
import { cleanPicture } from '../../content/creations';
import { playOrder, planFor } from './logic';
import { PENTATONIC, stepToMidi } from '../../audio/notes';
describe('Stamp Studio', () => {
  it('keeps stamps on paper through resize, including edge drops', () => {
    for (const [w,h] of [[674,478],[674,1075],[1200,478]]) for (const x of [-300,0,300,2000]) for(const y of [-500,0,250,2000]) {
      const s = place(x,y,w,h), p = pixel(s,w,h);
      expect(p.x).toBeGreaterThanOrEqual(70); expect(p.x).toBeLessThanOrEqual(w-70);
      expect(p.y).toBeGreaterThanOrEqual(70); expect(p.y).toBeLessThanOrEqual(h-70);
      const changed=pixel(s,w+200,h+300); expect(place(changed.x,changed.y,w+200,h+300)).toEqual(s);
    }
  });
  it('offers simple lap choices and adds manipulation before story invitations', () => {
    expect(PLANS[0].kinds).toHaveLength(1); expect(PLANS[1].kinds).toHaveLength(2);
    expect(PLANS.slice(0,2).every(p=>!p.move && !p.transform)).toBe(true);
    expect(PLANS.slice(3, 6).every(p=>p.move && p.transform)).toBe(true);
  });
  it('makes a small picture on every level, using only the buttons that level has, and ends on the green arrow', () => {
    // The smallest sheet the game draws (the 1024 by 768 design: 674 by 478).
    const [w, h] = [674, 478];
    for (const plan of [...PLANS.slice(0, 6), ...Array.from({ length: 150 }, (_, i) => roundPlan(i % 3 + 1, new Rng(Math.floor(i / 3))).plan)]) {
      const st: StampState = { stamps: [], kind: plan.kinds[0], color: 'purple' };
      const kinds = new Set<StampKind>();
      let move = false;
      let finished = false;
      for (let step = 0; step < 40 && !finished; step++) {
        const m = stampDemo(plan, st);
        if (m.do === 'kind') { expect(plan.kinds).toContain(m.kind); st.kind = m.kind; }
        else if (m.do === 'color') { expect(plan.color).toBe(true); expect(STAMP_COLORS).toContain(m.color); st.color = m.color as ColorName; }
        else if (m.do === 'stamp') {
          // It lands on empty paper, clear of every stamp already there, and inside the sheet.
          const p = pixel(m, w, h);
          for (const o of st.stamps) expect(Math.hypot(p.x - pixel(o, w, h).x, p.y - pixel(o, w, h).y)).toBeGreaterThan(160);
          expect(m.x).toBeGreaterThanOrEqual(0); expect(m.x).toBeLessThanOrEqual(1);
          st.stamps.push({ x: m.x, y: m.y, size: 1, turns: 0 }); kinds.add(st.kind);
        } else if (m.do === 'turn') { expect(plan.transform).toBe(true); st.stamps.at(-1)!.turns = 1; }
        else if (m.do === 'grow') { expect(plan.transform).toBe(true); st.stamps.at(-1)!.size = 1.3; }
        else if (m.do === 'move') {
          expect(plan.move).toBe(true);
          const to = pixel(m, w, h);
          for (const o of st.stamps.filter((_, i) => i !== m.stamp)) expect(Math.hypot(to.x - pixel(o, w, h).x, to.y - pixel(o, w, h).y)).toBeGreaterThan(110);
          Object.assign(st.stamps[m.stamp], { x: m.x, y: m.y }); move = true;
        } else finished = true;
      }
      expect(finished, `${plan.name} reaches the green arrow`).toBe(true);
      expect(st.stamps).toHaveLength(DEMO_SPOTS.length);
      expect(st.stamps.length).toBeLessThanOrEqual(LIMIT);
      expect(move).toBe(plan.move);
      // Every stamp the level offers is used, up to the five presses.
      expect(kinds.size).toBe(Math.min(plan.kinds.length, DEMO_SPOTS.length));
      if (plan.transform) expect(st.stamps.some((s) => s.turns === 1) && st.stamps.some((s) => s.size === 1.3)).toBe(true);
    }
  });
});

describe('Stamp Studio saved choices', () => {
  it('gives every offered stamp a spoken name and a kind that survives save repair', () => {
    for (const plan of PLANS) for (const kind of plan.kinds) {
      expect(STAMP_KINDS).toContain(kind);
      expect(STAMP_NAMES[kind]).toMatch(/^A /);
      const original = { kind: 'picture', stamps: [{ kind, color: 'purple', x: 0.5, y: 0.5, size: 1, turns: 0 }] };
      expect(cleanPicture(original)).toEqual(original);
    }
  });
  it('pins the original sticker kind and color for seeds 0–99', () => {
    const original = [
      "fish/blue", "fish/green", "fish/blue", "fish/blue",
      "cat/purple", "fish/purple", "fish/purple", "star/blue",
      "star/blue", "star/pink", "fish/blue", "fish/pink",
      "flower/purple", "fish/blue", "flower/blue", "star/pink",
      "fish/purple", "fish/green", "flower/pink", "star/blue",
      "cat/purple", "flower/pink", "fish/blue", "star/blue",
      "flower/pink", "fish/pink", "fish/purple", "flower/green",
      "flower/blue", "star/pink", "cat/blue", "fish/blue",
      "flower/purple", "fish/green", "fish/blue", "star/blue",
      "cat/purple", "fish/blue", "fish/green", "star/blue",
      "fish/green", "cat/green", "fish/purple", "cat/purple",
      "cat/blue", "star/green", "star/pink", "fish/blue",
      "cat/purple", "flower/purple", "fish/purple", "star/pink",
      "star/pink", "star/purple", "flower/blue", "flower/pink",
      "star/pink", "fish/pink", "flower/blue", "flower/blue",
      "flower/purple", "fish/green", "fish/purple", "star/purple",
      "cat/green", "star/pink", "star/green", "cat/green",
      "flower/green", "cat/purple", "cat/blue", "cat/purple",
      "star/purple", "fish/pink", "star/pink", "star/blue",
      "flower/purple", "flower/green", "fish/green", "star/green",
      "cat/blue", "cat/pink", "cat/pink", "fish/purple",
      "flower/purple", "flower/green", "star/green", "star/purple",
      "cat/blue", "cat/pink", "star/pink", "fish/purple",
      "flower/blue", "flower/purple", "star/blue", "fish/blue",
      "star/pink", "fish/purple", "fish/purple", "flower/blue",
    ];
    for (let seed = 0; seed < original.length; seed++) {
      const sticker = stickerStamp(seed);
      expect(`${sticker.kind}/${sticker.color}`).toBe(original[seed]);
    }
  });
});


describe('seeded early stamp choices', () => {
  it('offers one/two/three distinct existing kinds deterministically, with every kind/color represented across 50 seeds', () => {
    for (const level of [1, 2, 3]) {
      const kinds = new Set<StampKind>(), colors = new Set<ColorName>(), rounds = new Set<string>();
      for (let seed = 0; seed < 50; seed++) {
        const round = roundPlan(level, new Rng(seed));
        expect(round).toEqual(roundPlan(level, new Rng(seed)));
        expect(round.plan.kinds).toHaveLength(level);
        expect(new Set(round.plan.kinds).size).toBe(level);
        expect(round.plan).toMatchObject({ color: PLANS[level - 1].color, move: PLANS[level - 1].move, transform: false });
        expect(STAMP_COLORS).toContain(round.color);
        for (const kind of round.plan.kinds) {
          expect(STAMP_KINDS).toContain(kind); kinds.add(kind);
          const picture = { kind: 'picture', stamps: [{ kind, color: round.color, x: 0.5, y: 0.5, size: 1, turns: 0 }] };
          expect(cleanPicture(picture)).toEqual(picture);
        }
        colors.add(round.color); rounds.add(JSON.stringify(round));
      }
      expect(kinds.size).toBe(STAMP_KINDS.length); expect(colors.size).toBe(STAMP_COLORS.length);
      expect(rounds.size).toBeGreaterThan(4);
      const card = howToFor(stampStudio, level)!;
      const text = [stampStudio.describeLevel!(level), ...SCRIPT[`stamp.${PLANS[level - 1].prompt}`], ...card.steps].join(' ');
      expect(text).not.toMatch(/star|cat|fish|flower|animal/i);
      expect(card.finish).toContain('green arrow');
    }
  });
  it('preserves the later plans and consumes no random draws there', () => {
    for (const level of [4, 5, 6]) {
      const rng = new Rng(42), copy = rng.clone();
      expect(roundPlan(level, rng)).toEqual({ plan: PLANS[level - 1], color: 'purple' });
      expect(rng.next()).toBe(copy.next());
    }
  });

  it('Pat the paper is the easiest lap level and its bot pats eight times then finishes', () => {
    const plan = PLANS[6];
    expect(stampStudio.levels!('lap')).toEqual({ min: 1, max: 7, order: [7, 1, 2] });
    expect(plan.pat).toEqual({ size: 85 / 48, count: 8 });
    const st: StampState = { stamps: [], kind: 'star', color: 'purple' };
    for (let n = 0; n < 8; n++) { expect(stampDemo(plan, st).do).toBe('stamp'); st.stamps.push({ x: 0, y: 0, size: 2, turns: 0 }); }
    expect(stampDemo(plan, st)).toEqual({ do: 'finish' });
    expect(SCRIPT['stamp.pats']).toBeTruthy();
    expect(howToFor(stampStudio, 7)!.steps.length).toBeGreaterThan(0);
  });
  it('plays the picture left to right, on the pentatonic scale, higher on the paper sounding higher, in at most 6 s', () => {
    const rng = new Rng(7);
    for (let n = 0; n <= LIMIT; n++) {
      const stamps = Array.from({ length: n }, () => ({ x: rng.next(), y: rng.next() }));
      const notes = playOrder(stamps);
      expect(notes.map(t => t.index).sort((a, b) => a - b)).toEqual(stamps.map((_, i) => i));
      notes.forEach((t, i) => {
        expect(PENTATONIC).toContain(stepToMidi(t.step) % 12);
        if (i) { expect(stamps[t.index].x).toBeGreaterThanOrEqual(stamps[notes[i - 1].index].x); expect(t.at).toBeGreaterThan(notes[i - 1].at); }
      });
      expect(notes.at(-1)?.at ?? 0).toBeLessThanOrEqual(6);
    }
    expect(playOrder([{ x: 0.5, y: 0.5 }])).toEqual([{ index: 0, step: expect.any(Number), at: 0 }]);
    const heights = [1, 0.75, 0.5, 0.25, 0].map(y => playOrder([{ x: 0, y }])[0].step);
    heights.forEach((step, i) => i && expect(step).toBeGreaterThan(heights[i - 1]));
    // Ties in x sound top first.
    expect(playOrder([{ x: 0.3, y: 0.9 }, { x: 0.3, y: 0.1 }]).map(t => t.index)).toEqual([1, 0]);
  });
  it('offers play-back from level 3 to 6, never at the lap levels or Pat the paper', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map(l => !!(planFor(l) as { play?: boolean }).play)).toEqual([false, false, true, true, true, true, false]);
  });
});
