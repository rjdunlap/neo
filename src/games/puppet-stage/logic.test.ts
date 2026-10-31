import { describe, expect, it } from 'vitest';
import { PET_VOICE } from '../../audio/voice';
import { SCRIPT } from '../../content/voice-script';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import type { Band } from '../../progress/bands';
import {
  allPairs, answer, APART, askLine, askedPuppet, BASE_VOICE, bigOf, clearOfBase, hintTarget, inRange, layout, LEVELS, LINES, nearestParked, plan,
  presetsDistinct, PUPPETS, standAt, tinyOf, voicePairs, WAY_VOICE, WAYS, type Ask, type Box, type Puppet, type Way,
} from './logic';

const SEEDS = 300;
const bandsAt = (level: number): Band[] => (Object.keys(LEVELS) as Band[]).filter((b) => level >= LEVELS[b]!.min && level <= LEVELS[b]!.max);

describe('voices', () => {
  it('keeps the three presets apart by the margin rule', () => {
    for (const a of WAYS) for (const b of WAYS) if (a !== b) expect(presetsDistinct(WAY_VOICE[a], WAY_VOICE[b]), `${a} vs ${b}`).toBe(true);
  });
  it('keeps every preset clear of every base voice, so the ordinary way is never one of the three', () => {
    for (const w of WAYS) for (const p of PUPPETS) expect(clearOfBase(WAY_VOICE[w], BASE_VOICE[p]), `${w} vs ${p}`).toBe(true);
  });
  it('gives no puppet the pet\'s voice and keeps every voice intelligible', () => {
    for (const p of PUPPETS) {
      expect(BASE_VOICE[p].pitch === PET_VOICE.pitch && BASE_VOICE[p].rate === PET_VOICE.rate, p).toBe(false);
      expect(inRange(BASE_VOICE[p]), p).toBe(true);
    }
    for (const w of WAYS) expect(inRange(WAY_VOICE[w]), w).toBe(true);
    expect(inRange(PET_VOICE)).toBe(true);
    const pitches = PUPPETS.map((p) => BASE_VOICE[p].pitch);
    expect(new Set(pitches).size).toBe(PUPPETS.length);
  });
  it('sleepy is slow and low, tiny high and quick, big the lowest', () => {
    expect(WAY_VOICE.sleepy.rate).toBeLessThan(Math.min(...PUPPETS.map((p) => BASE_VOICE[p].rate)));
    expect(WAY_VOICE.tiny.pitch).toBeGreaterThan(Math.max(...PUPPETS.map((p) => BASE_VOICE[p].pitch)));
    expect(WAY_VOICE.big.pitch).toBeLessThan(Math.min(...PUPPETS.map((p) => BASE_VOICE[p].pitch)));
  });
  it('voice asks use exactly the pairs whose base pitches differ by half a step, and tiny/big resolve to higher/lower', () => {
    const pairs = voicePairs();
    expect(pairs.map((p) => p.join('-')).sort()).toEqual(['bunny-bear', 'bunny-cat', 'bear-duck', 'duck-cat'].sort());
    for (const pair of allPairs()) {
      const apart = Math.abs(BASE_VOICE[pair[0]].pitch - BASE_VOICE[pair[1]].pitch) + 1e-9 >= 0.5;
      expect(pairs.some((p) => p[0] === pair[0] && p[1] === pair[1]), pair.join('-')).toBe(apart);
      expect(BASE_VOICE[tinyOf(pair)].pitch).toBeGreaterThan(BASE_VOICE[bigOf(pair)].pitch);
      expect(new Set([tinyOf(pair), bigOf(pair)])).toEqual(new Set(pair));
    }
  });
});

describe('plans', () => {
  it('level 1 has no asks and nothing countable; lap bows by itself after six pops', () => {
    for (const band of bandsAt(1)) for (let seed = 0; seed < SEEDS; seed++) {
      const p = plan(1, band, new Rng(seed));
      expect(p.asks).toEqual([]);
      expect(p.puppets).toEqual(PUPPETS);
      expect(p.popsToBow).toBe(3);
      expect(p.secondsToBow).toBe(30);
      expect(p.autoBowAfter).toBe(band === 'lap' ? 6 : null);
    }
  });
  it('level 2 draws two distinct puppets and four asks, each naming one on stage, never three alike in a row', () => {
    for (const band of bandsAt(2)) {
      let voiceAsks = 0;
      for (let seed = 0; seed < SEEDS; seed++) {
        const p = plan(2, band, new Rng(seed));
        expect(p.puppets).toHaveLength(2);
        expect(p.puppets[0]).not.toBe(p.puppets[1]);
        expect(PUPPETS.indexOf(p.puppets[0])).toBeLessThan(PUPPETS.indexOf(p.puppets[1]));
        expect(p.asks).toHaveLength(4);
        const named = p.asks.map((a) => askedPuppet(a, p.puppets));
        for (const n of named) expect(p.puppets).toContain(n);
        for (let i = 2; i < named.length; i++) expect(named[i] === named[i - 1] && named[i] === named[i - 2], `${band} seed ${seed}`).toBe(false);
        const voice = p.asks.filter((a) => a.kind === 'voice');
        voiceAsks += voice.length;
        if (band === 'toddler') expect(voice).toHaveLength(0);
        else {
          expect(p.asks.slice(0, 2).every((a) => a.kind === 'name')).toBe(true);
          expect(voice).toHaveLength(2);
          expect(new Set(voice.map((a) => (a as { which: string }).which))).toEqual(new Set(['tiny', 'big']));
          expect(voicePairs().some(([a, b]) => a === p.puppets[0] && b === p.puppets[1]), `${p.puppets.join('-')}`).toBe(true);
        }
      }
      if (band !== 'toddler') expect(voiceAsks).toBeGreaterThan(0);
    }
  });
  it('level 3 draws one puppet and one line, four way asks covering all three ways with no two alike in a row', () => {
    const lines = new Set<string>(), puppets = new Set<string>();
    for (const band of bandsAt(3)) for (let seed = 0; seed < SEEDS; seed++) {
      const p = plan(3, band, new Rng(seed));
      expect(p.puppets).toHaveLength(1);
      expect(PUPPETS).toContain(p.puppets[0]);
      expect(LINES).toContain(p.line);
      expect(SCRIPT[p.line!]).toBeDefined();
      lines.add(p.line!); puppets.add(p.puppets[0]);
      expect(p.asks).toHaveLength(4);
      const ways = p.asks.map((a) => (a as { way: Way }).way);
      expect(p.asks.every((a) => a.kind === 'way')).toBe(true);
      expect(new Set(ways)).toEqual(new Set(WAYS));
      for (let i = 1; i < ways.length; i++) expect(ways[i]).not.toBe(ways[i - 1]);
    }
    expect(lines.size).toBe(LINES.length);
    expect(puppets.size).toBe(PUPPETS.length);
  });
  it('is the same plan for the same seed', () => {
    for (const level of [1, 2, 3]) for (const band of bandsAt(level)) expect(plan(level, band, new Rng(7))).toEqual(plan(level, band, new Rng(7)));
  });
  it('lists only the bands the game supports, with stable level numbers', () => {
    expect(LEVELS).toEqual({ lap: { min: 1, max: 1 }, toddler: { min: 1, max: 2 }, preschool: { min: 2, max: 3 }, prek: { min: 3, max: 3 } });
  });
});

describe('answers', () => {
  const pair: Puppet[] = ['bunny', 'bear'];
  it('a name ask is right only for the named puppet, and a miss names the tapped one', () => {
    const ask: Ask = { kind: 'name', puppet: 'bear' };
    expect(answer(ask, 'bear', pair)).toEqual({ right: true });
    expect(answer(ask, 'bunny', pair)).toEqual({ right: false, said: 'ps.im.bunny' });
    expect(hintTarget(ask, pair)).toBe('bear');
    expect(askLine(ask)).toBe('ps.ask.bear');
  });
  it('a voice ask is right for the pair\'s higher (tiny) or lower (big) pitch', () => {
    for (const pr of voicePairs()) {
      expect(answer({ kind: 'voice', which: 'tiny' }, tinyOf(pr), pr)).toEqual({ right: true });
      expect(answer({ kind: 'voice', which: 'tiny' }, bigOf(pr), pr)).toEqual({ right: false, said: `ps.im.${bigOf(pr)}` });
      expect(answer({ kind: 'voice', which: 'big' }, bigOf(pr), pr)).toEqual({ right: true });
      expect(hintTarget({ kind: 'voice', which: 'big' }, pr)).toBe(bigOf(pr));
    }
    expect(askLine({ kind: 'voice', which: 'tiny' })).toBe('ps.ask.tiny-voice');
  });
  it('a way ask is right only for the asked bubble, and a miss names the way she tapped', () => {
    const ask: Ask = { kind: 'way', way: 'sleepy' };
    expect(answer(ask, 'sleepy', ['cat'])).toEqual({ right: true });
    expect(answer(ask, 'big', ['cat'])).toEqual({ right: false, said: 'ps.was.big' });
    expect(answer(ask, 'cat', ['cat'])).toEqual({ right: false, said: 'ps.im.cat' });
    expect(hintTarget(ask, ['cat'])).toBe('sleepy');
    expect(askLine(ask)).toBe('ps.ask.sleepy');
  });
  it('following the hint finishes every ask in one tap, so a round needs at most four hints', () => {
    for (const level of [2, 3]) for (const band of bandsAt(level)) for (let seed = 0; seed < 60; seed++) {
      const p = plan(level, band, new Rng(seed));
      for (const ask of p.asks) expect(answer(ask, hintTarget(ask, p.puppets), p.puppets)).toEqual({ right: true });
    }
  });
  it('every spoken line the rules name exists in the script', () => {
    for (const p of PUPPETS) for (const k of ['hello', 'again', 'talk', 'im', 'ask']) expect(SCRIPT[`ps.${k}.${p}` as keyof typeof SCRIPT], `ps.${k}.${p}`).toBeDefined();
    for (const w of WAYS) for (const k of ['ask', 'was']) expect(SCRIPT[`ps.${k}.${w}` as keyof typeof SCRIPT]).toBeDefined();
  });
});

describe('layout', () => {
  const VIEWS = {
    landscape: computeView(1024, 768),
    portrait: computeView(768, 1024),
    phone: computeView(844, 390),
    notch: computeView(844, 390, { top: 0, right: 47, bottom: 21, left: 47 }),
  };
  const hit = (a: Box, x0: number, y0: number, x1: number, y1: number) => a.x - a.w / 2 < x1 && a.x + a.w / 2 > x0 && a.y - a.h / 2 < y1 && a.y + a.h / 2 > y0;
  const overlap = (a: Box, b: Box) => hit(a, b.x - b.w / 2, b.y - b.h / 2, b.x + b.w / 2, b.y + b.h / 2);
  const puppetBox = (x: number, floor: number): Box => ({ x, y: floor - 100, w: 140, h: 200 });
  for (const [name, v] of Object.entries(VIEWS)) for (const level of [1, 2, 3]) {
    it(`${name} level ${level}: every input is big, inside, apart and clear of the guide and corner buttons`, () => {
      const l = layout(level, v);
      const stands = level === 1 ? [l.stand.min, l.stand.max] : l.spots;
      const inputs: Box[] = [...l.curtains, l.tassel, l.bow, ...l.bubbles, ...stands.map((x) => puppetBox(x, l.stage.floor))];
      if (level === 1) inputs.push(l.floorTouch);
      for (const b of inputs) {
        expect(b.w, name).toBeGreaterThanOrEqual(100);
        expect(b.h, name).toBeGreaterThanOrEqual(100);
        expect(b.x - b.w / 2, name).toBeGreaterThanOrEqual(0);
        expect(b.y - b.h / 2, name).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w / 2, name).toBeLessThanOrEqual(v.w);
        expect(b.y + b.h / 2, name).toBeLessThanOrEqual(v.h);
        expect(hit(b, 0, v.h - 170, 170, v.h), `${name} guide`).toBe(false);
        expect(hit(b, 0, 0, 120, 220), `${name} corner buttons`).toBe(false);
      }
      for (const c of l.curtains) expect(c.w).toBeGreaterThanOrEqual(110);
      const separate = [...l.bubbles, l.bow, l.tassel, ...stands.map((x) => puppetBox(x, l.stage.floor))];
      for (let i = 0; i < separate.length; i++) for (let j = i + 1; j < separate.length; j++) expect(overlap(separate[i], separate[j]), `${name} ${i} ${j}`).toBe(false);
      expect(l.bubbles).toHaveLength(level === 3 ? 3 : 0);
      expect(l.spots).toHaveLength(level === 1 ? 0 : level === 2 ? 2 : 1);
      if (level === 2) expect(Math.abs(l.spots[1] - l.spots[0])).toBeGreaterThanOrEqual(APART);
      expect(l.portrait).toBe(v.h > v.w);
      if (l.portrait && level === 3) for (const b of l.bubbles) expect(b.y - b.h / 2).toBeGreaterThanOrEqual(l.stage.floor);
      expect(l.stand.max - l.stand.min).toBeGreaterThanOrEqual(APART);
      expect(l.homes).toHaveLength(4);
    });
  }
  it('a touch raises a puppet at its x, inside the stand range and at least 160 from the others', () => {
    const l = layout(1, VIEWS.landscape);
    expect(standAt(l.stand.min - 500, [], l.stand)).toBe(l.stand.min);
    expect(standAt(l.stand.max + 500, [], l.stand)).toBe(l.stand.max);
    for (let x = 0; x <= 1024; x += 37) for (const other of [l.stand.min, (l.stand.min + l.stand.max) / 2, l.stand.max]) {
      const at = standAt(x, [other], l.stand);
      expect(at).toBeGreaterThanOrEqual(l.stand.min);
      expect(at).toBeLessThanOrEqual(l.stand.max);
      expect(Math.abs(at - other)).toBeGreaterThanOrEqual(APART);
    }
  });
  it('the nearest parked puppet rises, by its home spot', () => {
    const l = layout(1, VIEWS.landscape);
    expect(nearestParked(l.homes[0] - 5, PUPPETS, l.homes)).toBe('bunny');
    expect(nearestParked(l.homes[3] + 5, PUPPETS, l.homes)).toBe('cat');
    expect(nearestParked(l.homes[0], ['bear', 'cat'], l.homes)).toBe('bear');
    expect(nearestParked(0, [], l.homes)).toBeNull();
  });
});
