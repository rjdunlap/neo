/**
 * Development-only helpers for driving the game from the browser console or automated checks:
 * synthetic touches that go through the same paths as real fingers.
 * Loaded only by `npm run dev`; never part of the production build.
 */
import { store } from '../progress/store';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const canvas = () => document.querySelector('canvas')!;

function touch(type: string, x: number, y: number, id: number) {
  const target = canvas(); // Pixi must receive pointerup as well as the global window listener.
  target.dispatchEvent(
    new PointerEvent(type, { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', isPrimary: id === 1, bubbles: true, cancelable: true, buttons: type === 'pointerup' ? 0 : 1 }),
  );
}

const kit = {
  sleep,
  store,
  /** Touch down and up at a canvas point (CSS pixels). */
  tap(x: number, y: number, id = 1) {
    touch('pointerdown', x, y, id);
    canvas().dispatchEvent(new PointerEvent('pointerup', { clientX: x, clientY: y, pointerId: id, pointerType: 'touch', bubbles: true }));
  },
  /** Tap the middle of a display object, nudged by (dx, dy). */
  tapOn(obj: { getGlobalPosition(): { x: number; y: number } }, dx = 0, dy = 0) {
    const p = obj.getGlobalPosition();
    kit.tap(p.x + dx, p.y + dy);
  },
  /** Drag along points (CSS pixels). */
  async drag(path: [number, number][], id = 1, stepMs = 16) {
    touch('pointerdown', path[0][0], path[0][1], id);
    for (const [x, y] of path.slice(1)) {
      touch('pointermove', x, y, id);
      await sleep(stepMs);
    }
    const [x, y] = path[path.length - 1];
    touch('pointerup', x, y, id);
  },
  line(a: [number, number], b: [number, number], n = 12): [number, number][] {
    return Array.from({ length: n + 1 }, (_, i) => [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
  },
  /** Drag one object onto another. */
  async dragTo(from: { getGlobalPosition(): { x: number; y: number } }, to: { x: number; y: number }, n = 10) {
    const p = from.getGlobalPosition();
    await kit.drag(kit.line([p.x, p.y], [to.x, to.y], n));
  },
  async until(test: () => boolean, ms = 12000) {
    const t0 = performance.now();
    while (!test() && performance.now() - t0 < ms) await sleep(100);
    return test();
  },
};

Object.assign(window, { kit });
