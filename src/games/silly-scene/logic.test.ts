import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { computeView } from '../../engine/view';
import { captionPlace } from '../../ui/caption-layout';
import { layout, TARGET } from './layout';
import { glowFor, makeScene } from './logic';
import { VOICE } from './voice';

describe('Silly Scene', () => {
  it.each([
    [1, 'pond', ['fishTree']],
    [2, 'farm', ['wingedPig', 'risingApple']],
    [3, 'beach', ['cloudCrab', 'walkingFish']],
  ] as const)('opens level %i on its authored backdrop', (level, backdrop, arts) => {
    const scene = makeScene(level, new Rng(12), true);
    expect(scene.backdrop).toBe(backdrop);
    expect(scene.things.filter((thing) => thing.kind === 'impossible').map((thing) => thing.art)).toEqual(
      arts,
    );
    if (level === 3) {
      expect(scene.things.find((thing) => thing.kind === 'possible')?.art).toBe('dogHat');
    }
  });

  it.each([1, 2, 3])('builds a solvable level %i on every backdrop', (level) => {
    const backdrops = new Set<string>();
    const art = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const scene = makeScene(level, new Rng(seed));
      backdrops.add(scene.backdrop);
      const impossible = scene.things.filter((thing) => thing.kind === 'impossible');
      expect(impossible).toHaveLength(level === 1 ? 1 : 2);
      expect(scene.things.filter((thing) => thing.kind === 'possible')).toHaveLength(level === 3 ? 1 : 0);
      expect(scene.things.filter((thing) => thing.kind === 'fine')).toHaveLength(level === 2 ? 6 : 5);
      expect(new Set(scene.things.map((thing) => thing.slot)).size).toBe(scene.things.length);
      expect(new Set(impossible.map((thing) => thing.wrong)).size).toBe(impossible.length);
      for (const thing of scene.things) {
        expect(VOICE[thing.why][0]).toBeTruthy();
        if (thing.kind === 'fine') expect(['dogHat', 'bunnyPail', 'roofCat']).not.toContain(thing.art);
      }
      for (const thing of impossible) {
        art.add(thing.art);
        expect(thing.fix.art).not.toBe(thing.art);
      }
      const x = (slot: keyof ReturnType<typeof layout>['slots']) =>
        layout({ w: 1024, h: 768, scale: 1 }, scene.backdrop).slots[slot].x;
      const found = new Set<(typeof impossible)[number]>();
      for (const thing of [...impossible].sort((a, b) => x(a.slot) - x(b.slot))) {
        expect(glowFor(scene, found, x)).toBe(thing);
        found.add(thing);
      }
      expect(glowFor(scene, found, x)).toBeUndefined();
    }
    expect(backdrops.size).toBe(3);
    if (level === 3) expect(art.size).toBe(8);
  });

  it.each([1, 2, 3])('keeps level %i targets clear on the supported views', (level) => {
    const views = [
      computeView(390, 844, undefined, true),
      computeView(390, 625, undefined, true),
      computeView(768, 1024, undefined, true),
      computeView(390, 844),
      computeView(625, 390),
      computeView(844, 390),
      computeView(1024, 768),
    ];
    const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });
    const overlaps = (a: ReturnType<typeof box>, b: ReturnType<typeof box>) =>
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
    for (const view of views) {
      const caption = captionPlace(view, true);
      const game = caption.game;
      for (let seed = 0; seed < 36; seed++) {
        const scene = makeScene(level, new Rng(seed + 1), seed === 0);
        const geometry = layout(game, scene.backdrop);
        const taken = [box(0, 0, 120, 234), box(0, game.h - 182, 148, 182)];
        if (caption.mode === 'bubble' && caption.band) taken.push(caption.band);
        for (const thing of scene.things) {
          const { x, y } = geometry.slots[thing.slot];
          expect(TARGET).toBeGreaterThanOrEqual(120);
          if (level === 1 && thing.kind === 'impossible') {
            expect(x).toBeGreaterThan(game.w / 3);
            expect(x).toBeLessThan((game.w * 2) / 3);
          }
          const target = box(x - TARGET / 2, y - TARGET / 2, TARGET, TARGET);
          expect(target.x).toBeGreaterThanOrEqual(0);
          expect(target.y).toBeGreaterThanOrEqual(0);
          expect(target.x + TARGET).toBeLessThanOrEqual(game.w);
          expect(target.y + TARGET).toBeLessThanOrEqual(game.h);
          expect(
            taken.filter((other) => overlaps(other, target)),
            `${scene.backdrop} ${thing.slot} at ${game.w}×${game.h}`,
          ).toEqual([]);
          taken.push(target);
        }
      }
    }
  });
});
