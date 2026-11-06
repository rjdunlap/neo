import { describe, expect, it } from 'vitest';
import { PENTATONIC } from '../../audio/notes';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import {
  advance, BEATS, botMove, canFinish, earlyDone, HAT_IDS, HATS, hatBandLayout, makeRound, mixKey, newBand, nextStep,
  noteStep, onRack, PER_BEAT, spotlight, takeOff, wear,
  type Band, type BeatEvent, type Friend, type HatId, type Mix,
} from './logic';

/** Runs the clock in small frames until `n` more beats have been sounded (rests included). */
function play(band: Band, n: number, dt = 1 / 60): { band: Band; events: BeatEvent[] } {
  const events: BeatEvent[] = [];
  const target = band.played + n;
  let b = band;
  for (let guard = 0; b.played < target && guard < 100000; guard++) {
    const r = advance(b, dt);
    b = r.band;
    events.push(...r.events);
  }
  return { band: b, events };
}
const key = (e: BeatEvent) => [e.index, e.step, e.friend, e.hat, e.role, String(e.pitch)].join('|');
const dress = (a: HatId | null, b: HatId | null, solo: Friend | null = null): Band => {
  let band = newBand();
  if (a) band = wear(band, 0, a);
  if (b) band = wear(band, 1, b);
  return solo === null ? band : spotlight(band, solo);
};

describe('Hat Band loops', () => {
  it('has four hats of four beats; tunes sit on the pentatonic, drums have no pitch, no tune is all rests', () => {
    expect(HAT_IDS).toHaveLength(4);
    for (const id of HAT_IDS) {
      const h = HATS[id];
      if (h.role === 'drum') {
        expect(h.hits).toHaveLength(BEATS);
        expect(h.notes).toBeUndefined();
        expect(h.hits!.some(Boolean)).toBe(true);
      } else {
        expect(h.notes).toHaveLength(BEATS);
        expect(h.hits).toBeUndefined();
        expect(h.notes!.some((n) => n !== null)).toBe(true);
        for (const n of h.notes!) if (n !== null) {
          expect(PENTATONIC).toContain(n);
          expect(Number.isFinite(noteStep(n))).toBe(true);
          expect(PENTATONIC.indexOf(n)).toBeGreaterThanOrEqual(0);
        }
      }
    }
    const loops = HAT_IDS.map((id) => JSON.stringify(HATS[id].hits ?? HATS[id].notes));
    expect(new Set(loops).size).toBe(4);
    expect(HAT_IDS.filter((id) => HATS[id].role === 'drum')).toHaveLength(2);
    expect(HAT_IDS.filter((id) => HATS[id].role === 'tune')).toHaveLength(2);
  });
});

describe('Hat Band rounds', () => {
  it('level 1 has one drum and one tune; levels 2-3 have all four, no duplicates; cast avoids bear and pip', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const level of [1, 2, 3]) {
        const r = makeRound(new Rng(seed), level);
        expect(new Set(r.cast).size).toBe(2);
        expect(r.cast).not.toContain('bear');
        expect(r.cast).not.toContain('pip');
        expect(new Set(r.rack).size).toBe(r.rack.length);
        if (level === 1) {
          expect(r.rack).toHaveLength(2);
          expect(r.rack.map((h) => HATS[h].role).sort()).toEqual(['drum', 'tune']);
        } else {
          expect([...r.rack].sort()).toEqual([...HAT_IDS].sort());
        }
        expect(makeRound(new Rng(seed), level)).toEqual(r);
      }
    }
  });
});

describe('Hat Band hats and friends', () => {
  it('rack and worn always make the whole set after random wear, take off and spotlight', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const rng = new Rng(seed);
      const round = makeRound(rng, 2);
      let band = newBand();
      for (let i = 0; i < 60; i++) {
        const f = rng.int(0, 1) as Friend;
        const roll = rng.next();
        if (roll < 0.5) band = wear(band, f, rng.pick(round.rack));
        else if (roll < 0.75) band = takeOff(band, f);
        else band = spotlight(band, f);
        const worn = band.worn.filter((h): h is HatId => h !== null);
        expect(new Set(worn).size).toBe(worn.length);
        expect([...onRack(round, band), ...worn].sort()).toEqual([...HAT_IDS].sort());
        if (band.solo !== null) expect(band.worn[band.solo]).not.toBeNull();
      }
    }
  });

  it('reaches all 21 legal worn states from an empty band by wearing and taking off', () => {
    const k = (b: Band) => b.worn.join(',');
    const seen = new Map<string, Band>([[k(newBand()), newBand()]]);
    const queue = [newBand()];
    while (queue.length) {
      const b = queue.shift()!;
      const next: Band[] = [];
      for (const f of [0, 1] as Friend[]) {
        next.push(takeOff(b, f));
        for (const h of HAT_IDS) next.push(wear(b, f, h));
      }
      for (const n of next) if (!seen.has(k(n))) { seen.set(k(n), n); queue.push(n); }
    }
    expect(seen.size).toBe(21);
  });

  it('replacing a hat sends the old one back to the rack, and a hat moves across rather than being copied', () => {
    const round = makeRound(new Rng(3), 2);
    let band = wear(newBand(), 0, 'steady');
    band = wear(band, 0, 'skippy');
    expect(band.worn).toEqual(['skippy', null]);
    expect(onRack(round, band)).toContain('steady');
    band = wear(band, 1, 'skippy');
    expect(band.worn).toEqual([null, 'skippy']);
  });

  it('any change of hats clears the spotlight; spotlight on a bare friend does nothing; the same star again turns it off', () => {
    let band = dress('steady', 'cuckoo', 0);
    expect(band.solo).toBe(0);
    expect(wear(band, 1, 'rain').solo).toBeNull();
    expect(wear(band, 0, 'skippy').solo).toBeNull();
    expect(takeOff(band, 1).solo).toBeNull();
    expect(takeOff(band, 0).solo).toBeNull();
    expect(spotlight(band, 0).solo).toBeNull();
    expect(spotlight(band, 1).solo).toBe(1);
    const bare = dress('steady', null);
    expect(spotlight(bare, 1)).toEqual(bare);
    expect(spotlight(newBand(), 0)).toEqual(newBand());
  });

  it('re-wearing a hat makes it be heard alone again', () => {
    let band = dress('steady', 'cuckoo', 0);
    band = play(band, 5).band;
    expect(band.heardAlone).toContain('steady');
    expect(takeOff(band, 0).heardAlone).toContain('steady');
    expect(wear(takeOff(band, 0), 0, 'steady').heardAlone).not.toContain('steady');
    expect(wear(band, 1, 'steady').heardAlone).not.toContain('steady');
  });
});

describe('Hat Band beat clock', () => {
  it('emits every beat exactly once and in order, whatever the frame size', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = new Rng(seed);
      const hats = rng.shuffle([...HAT_IDS]);
      const start = dress(hats[0], hats[1]);
      const frames = 1200; // 20 seconds; 20.0 is not on a beat boundary (0.75 s beats)
      let b = start;
      const smallEvents: BeatEvent[] = [];
      for (let i = 0; i < frames; i++) {
        const r = advance(b, 1 / 60);
        b = r.band;
        smallEvents.push(...r.events);
      }
      const big = advance(start, frames / 60);
      const bigEvents = big.events;
      expect(bigEvents.length).toBeGreaterThan(0);
      expect(smallEvents.map(key)).toEqual(bigEvents.map(key));
      expect(b.played).toBe(big.band.played);
      // Indices ascend with no beat repeated, and the steps follow index mod 4.
      const idx = [...new Set(bigEvents.map((e) => e.index))];
      expect(idx).toEqual([...idx].sort((a, c) => a - c));
      for (const e of bigEvents) expect(e.step).toBe(e.index % BEATS);
      // Event times lie inside the call and ascend.
      for (let i = 1; i < bigEvents.length; i++) expect(bigEvents[i].at).toBeGreaterThanOrEqual(bigEvents[i - 1].at);
      expect(bigEvents.at(-1)!.at).toBeLessThanOrEqual(frames / 60);
    }
  });

  it('a steady drum plays its hits at beats 0 and 2 of every bar, and a first beat sounds at once', () => {
    const r = advance(dress('steady', null), 0);
    expect(r.events.map(key)).toEqual(['0|0|0|steady|drum|null']);
    const rest = advance(r.band, 3 * PER_BEAT * 2 + 0.01);
    const all = [...r.events, ...rest.events];
    expect(all.map((e) => e.index)).toEqual([0, 2, 4, 6]);
  });

  it('a change joins only at the next beat boundary, and a hat joining mid-bar plays at the global place', () => {
    let { band } = advance(dress('steady', null), 0);
    band = advance(band, PER_BEAT * 1.5).band; // beats 0 and 1 sounded; half way to beat 2
    band = wear(band, 1, 'cuckoo');
    expect(band.sounding.worn[1]).toBeNull();
    const early = advance(band, PER_BEAT * 0.4);
    expect(early.events).toEqual([]);
    expect(early.band.sounding.worn[1]).toBeNull();
    const r = advance(early.band, PER_BEAT * 0.2);
    const first = r.events.find((e) => e.friend === 1)!;
    expect(first.index).toBe(2);
    expect(first.step).toBe(2);
    expect(first.pitch).toBe(noteStep(HATS.cuckoo.notes![2]!));
    expect(r.band.sounding.worn[1]).toBe('cuckoo');
  });

  it('solo plays only that friend and leaves worn alone', () => {
    for (const f of [0, 1] as Friend[]) {
      let band = dress('steady', 'rain', f);
      const worn = band.worn;
      const r = play(band, 8);
      expect(r.events.length).toBeGreaterThan(0);
      for (const e of r.events) expect(e.friend).toBe(f);
      expect(r.band.worn).toEqual(worn);
      expect(r.band.solo).toBe(f);
    }
  });

  it('roles: drums have no pitch, tunes are all pitched, and no tune means no pitch', () => {
    for (const d of ['steady', 'skippy'] as HatId[]) {
      const ev = play(dress(d, null), 8).events;
      expect(ev.length).toBeGreaterThan(0);
      for (const e of ev) expect(e.pitch).toBeNull();
    }
    for (const t of ['cuckoo', 'rain'] as HatId[]) {
      const ev = play(dress(null, t), 8).events;
      expect(ev.length).toBeGreaterThan(0);
      for (const e of ev) expect(e.pitch).not.toBeNull();
    }
    let band = play(dress('steady', 'cuckoo'), 8).band;
    expect(play(band, 8).events.some((e) => e.pitch !== null)).toBe(true);
    band = takeOff(band, 1);
    const after = play(band, 12);
    // Once the removal has joined (the first beat), nothing is pitched.
    for (const e of after.events) expect(e.pitch).toBeNull();
    expect(after.events.length).toBeGreaterThan(0);
  });
});

describe('Hat Band mixes', () => {
  it('a mix is the set of hats heard, not who wears them', () => {
    const m = (a: HatId | null, b: HatId | null, solo: Friend | null = null): Mix => ({ worn: [a, b], solo });
    expect(mixKey(m('steady', 'cuckoo'))).toBe(mixKey(m('cuckoo', 'steady')));
    expect(mixKey(m('steady', 'cuckoo', 0))).toBe(mixKey(m('steady', null)));
    expect(mixKey(m('steady', 'cuckoo'))).not.toBe(mixKey(m('steady', 'rain')));
    expect(mixKey(m(null, null))).toBe('');
    // Swapping places is not a new band.
    let band = play(dress('steady', 'cuckoo'), 4).band;
    expect(band.mixes).toHaveLength(1);
    band = wear(wear(band, 1, 'steady'), 0, 'cuckoo');
    expect(band.worn).toEqual(['cuckoo', 'steady']);
    band = play(band, 5).band;
    expect(band.mixes).toHaveLength(1);
  });
});

describe('Hat Band heard gate', () => {
  it('an empty stage never finishes', () => {
    const band = play(newBand(), 12).band;
    for (const level of [1, 2, 3]) expect(canFinish(band, level)).toBe(false);
    expect(earlyDone(band, 1)).toBe('empty');
    expect(nextStep(makeRound(new Rng(1), 1), band, 1).hat).toBeDefined();
  });

  it('level 1: true once a band has been heard for four beats, and not before or during a change', () => {
    let band = dress('steady', 'cuckoo');
    band = play(band, 3).band;
    expect(canFinish(band, 1)).toBe(false);
    expect(earlyDone(band, 1)).toBe('hear-whole');
    band = play(band, 1).band;
    expect(canFinish(band, 1)).toBe(true);
    band = takeOff(band, 1);
    expect(canFinish(band, 1)).toBe(false);
    band = play(band, 4).band;
    expect(canFinish(band, 1)).toBe(true);
  });

  it('level 2: needs two different bands heard whole', () => {
    let band = play(dress('steady', null), 6).band;
    expect(canFinish(band, 2)).toBe(false);
    expect(earlyDone(band, 2)).toBe('hear-other');
    expect(nextStep(makeRound(new Rng(2), 2), band, 2).hat).toBeDefined();
    band = wear(band, 1, 'cuckoo');
    band = play(band, 3).band;
    expect(canFinish(band, 2)).toBe(false);
    band = play(band, 3).band;
    expect(canFinish(band, 2)).toBe(true);
  });

  it('level 2: hearing one band twice, or the same hats swapped, is not two bands', () => {
    let band = play(dress('steady', 'cuckoo'), 8).band;
    expect(canFinish(band, 2)).toBe(false);
    band = wear(wear(band, 1, 'steady'), 0, 'cuckoo');
    band = play(band, 8).band;
    expect(canFinish(band, 2)).toBe(false);
  });

  it('level 3: both worn, spotlight off, and each hat heard alone, counting a hat that was the only part sounding', () => {
    let band = dress('steady', null);
    band = play(band, 6).band;
    // Drum on its own (no spotlight) counts as heard alone.
    expect(band.heardAlone).toContain('steady');
    expect(canFinish(band, 3)).toBe(false);
    band = wear(band, 1, 'cuckoo');
    band = play(band, 8).band;
    expect(band.heardAlone).not.toContain('cuckoo');
    expect(canFinish(band, 3)).toBe(false);
    expect(earlyDone(band, 3)).toBe('hear-alone');
    expect(nextStep(makeRound(new Rng(1), 3), band, 3).star).toBe(1);
    band = spotlight(band, 1);
    band = play(band, 2).band;
    expect(earlyDone(band, 3)).toBe('hear-whole');
    band = play(band, 4).band;
    expect(band.heardAlone).toContain('cuckoo');
    expect(canFinish(band, 3)).toBe(false); // the spotlight is still on
    expect(earlyDone(band, 3)).toBe('together');
    expect(nextStep(makeRound(new Rng(1), 3), band, 3).star).toBe(1);
    band = spotlight(band, 1);
    expect(canFinish(band, 3)).toBe(false); // the whole band has not been heard yet
    band = play(band, 5).band;
    expect(canFinish(band, 3)).toBe(true);
    // Re-wearing a hat means it must be heard alone again.
    band = wear(band, 1, 'rain');
    band = play(band, 8).band;
    expect(canFinish(band, 3)).toBe(false);
    expect(earlyDone(band, 3)).toBe('hear-alone');
  });

  it('level 3 with one friend bare says both', () => {
    const band = play(dress('steady', null), 8).band;
    expect(earlyDone(band, 3)).toBe('both');
  });
});

describe('Hat Band bot', () => {
  for (const level of [1, 2, 3])
    it(`finishes level ${level} from several seeds within 60 seconds and says done only at the gate`, () => {
      for (let seed = 1; seed <= 30; seed++) {
        const round = makeRound(new Rng(seed), level);
        let band = newBand();
        let selected: HatId | null = null;
        let finished = false;
        const dt = 1 / 30;
        for (let t = 0; t < 60 && !finished; t += dt) {
          const move = botMove(round, band, level, selected);
          if (move === 'done') {
            expect(canFinish(band, level)).toBe(true);
            finished = true;
            break;
          }
          if (move) {
            if ('hat' in move) {
              expect(onRack(round, band)).toContain(move.hat);
              selected = move.hat;
            } else if ('friend' in move) {
              expect(selected).not.toBeNull();
              band = wear(band, move.friend, selected!);
              selected = null;
            } else band = spotlight(band, move.star);
          }
          band = advance(band, dt).band;
        }
        expect(finished).toBe(true);
      }
    });
});

describe('Hat Band layout', () => {
  const VIEWS: [number, number][] = [[1024, 768], [768, 1024], [1366, 768], [1194, 834]];
  type R = { x: number; y: number; w: number; h: number };
  const overlap = (a: R, b: R) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
  const box = (d: { x: number; y: number; r: number }): R => ({ x: d.x - d.r, y: d.y - d.r, w: 2 * d.r, h: 2 * d.r });
  for (const [pw, ph] of VIEWS)
    for (const level of [1, 2, 3])
      it(`keeps every target large, apart, on screen and clear of the pet at ${pw}x${ph}, level ${level}`, () => {
        const view = computeView(pw, ph);
        const hats = level === 1 ? 2 : 4;
        const l = hatBandLayout(view, level, hats);
        expect(l.rack).toHaveLength(hats);
        expect(l.spots).toHaveLength(2);
        if (level === 1) expect(l.stars).toBeUndefined();
        else {
          expect(l.stars).toHaveLength(2);
          for (const s of l.stars!) expect(s.r).toBeGreaterThanOrEqual(50);
        }
        const targets: R[] = [...l.rack, ...l.spots, ...(l.stars ?? []).map(box), box(l.done)];
        const pet: R = { x: 0, y: view.h - 220, w: 220, h: 220 };
        for (const t of targets) {
          expect(Math.min(t.w, t.h)).toBeGreaterThanOrEqual(100);
          expect(t.x).toBeGreaterThanOrEqual(0);
          expect(t.y).toBeGreaterThanOrEqual(0);
          expect(t.x + t.w).toBeLessThanOrEqual(view.w);
          expect(t.y + t.h).toBeLessThanOrEqual(view.h);
          expect(overlap(t, pet)).toBe(false);
        }
        for (let i = 0; i < targets.length; i++)
          for (let j = i + 1; j < targets.length; j++) expect(overlap(targets[i], targets[j])).toBe(false);
      });
});
