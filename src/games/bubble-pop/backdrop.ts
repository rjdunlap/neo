import { Container, Graphics } from 'pixi.js';
import { fishArt } from '../../art/animals';
import { Backdrop } from '../../art/scenery';
import { ink, swatch } from '../../art/palette';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { puffs, starPoints } from '../../art/shapes';
import { LOOKS, type SceneName } from './scenes';

interface Fish {
  node: Container;
  speed: number;
  y: number;
}

const FISH_COLORS = [swatch.orange, swatch.yellow, swatch.pink];


/**
 * The place a round of bubbles floats in: the shore as it always was, a bath, a night sky or the sea. Everything here is
 * decoration (`eventMode = 'none'`), drawn under the bubbles, so nothing in it can take a tap or be mistaken for a bubble.
 */
export class BubbleBackdrop extends Container {
  private readonly base: Backdrop;
  private readonly deco = new Graphics();
  private readonly twinkles: { g: Graphics; fx: number; fy: number; phase: number }[] = [];
  private readonly swimmers: Fish[] = [];
  private view: View;
  private clock = 0;

  constructor(
    readonly scene: SceneName,
    view: View,
    seed = 3,
  ) {
    super();
    this.view = view;
    const look = LOOKS[scene];
    this.base = new Backdrop({ sky: look.sky, hills: look.hills, horizon: look.horizon, clouds: look.clouds, sun: look.sun, seed }, view);
    this.deco.eventMode = 'none';
    this.addChild(this.base, this.deco);
    const rng = new Rng(seed + 11);
    if (scene === 'night') {
      for (let i = 0; i < 34; i++) {
        const star = new Graphics().poly(starPoints(rng.range(4, 8), 2, 4)).fill({ color: 0xfff6c8, alpha: 0.9 });
        star.eventMode = 'none';
        // Where it stands is a fraction of the view, set in `resize`.
        this.twinkles.push({ g: star, fx: rng.next(), fy: rng.next() * 0.72, phase: rng.range(0, 6.28) });
        this.addChild(star);
      }
    }
    if (scene === 'sea') {
      FISH_COLORS.forEach((color, i) => {
        const node = fishArt(color);
        node.eventMode = 'none';
        node.alpha = 0.9;
        node.scale.set(0.9 - i * 0.1);
        node.x = rng.range(0, view.w);
        this.swimmers.push({ node, speed: rng.range(24, 44), y: 0.28 + i * 0.17 });
        this.addChild(node);
      });
    }
    this.resize(view);
  }

  resize(view: View) {
    this.view = view;
    this.base.resize(view);
    const g = this.deco.clear();
    const ground = this.base.groundY;
    if (this.scene === 'bath') {
      // Wall tiles above the water, and a few clumps of foam floating on it.
      const tile = 112;
      for (let x = tile / 2; x < view.w; x += tile) g.moveTo(x, 0).lineTo(x, ground);
      for (let y = tile / 2; y < ground; y += tile) g.moveTo(0, y).lineTo(view.w, y);
      g.stroke({ width: 4, color: 0x7fc9c8, alpha: 0.35 });
      for (const [fx, dy] of [[0.18, 18], [0.52, 30], [0.84, 14]]) {
        const x = view.w * fx;
        puffs(g, [[x - 30, ground + dy, 20], [x, ground + dy - 12, 26], [x + 32, ground + dy, 18]], 0xffffff, 0xcfeff5, 3);
      }
    }
    if (this.scene === 'night') {
      // A sleepy moon where the sun is on the shore.
      const [mx, my] = [Math.max(230, view.w * 0.2), 150];
      g.circle(mx, my, 54).fill(0xfff3c4).stroke({ width: 5, color: 0xe8d38a });
      g.circle(mx - 22, my - 14, 7).fill({ color: 0xe8d38a, alpha: 0.6 }).circle(mx + 24, my + 20, 10).fill({ color: 0xe8d38a, alpha: 0.6 });
      g.moveTo(mx - 24, my - 2).quadraticCurveTo(mx - 15, my + 8, mx - 6, my - 2).moveTo(mx + 6, my - 2).quadraticCurveTo(mx + 15, my + 8, mx + 24, my - 2).stroke({ width: 4, color: ink, cap: 'round' });
      g.moveTo(mx - 10, my + 16).quadraticCurveTo(mx, my + 26, mx + 10, my + 16).stroke({ width: 4, color: ink, cap: 'round' });
      for (const s of this.twinkles) s.g.position.set(s.fx * view.w, s.fy * view.h);
    }
    if (this.scene === 'sea') {
      // Light slanting down through the water, and seaweed standing on the sand.
      for (const fx of [0.12, 0.38, 0.62, 0.88]) {
        const x = view.w * fx;
        g.poly([x - 30, 0, x + 30, 0, x + 130, ground, x - 70, ground]).fill({ color: 0xffffff, alpha: 0.1 });
      }
      for (const fx of [0.06, 0.3, 0.55, 0.78, 0.95]) {
        const x = view.w * fx;
        const h = 90 + ((fx * 977) % 60);
        g.moveTo(x, ground + 30).bezierCurveTo(x - 30, ground - h * 0.4, x + 30, ground - h * 0.7, x, ground - h).stroke({ width: 14, color: swatch.green.fill, cap: 'round' });
      }
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.base.update(dt);
    for (const s of this.twinkles) s.g.alpha = 0.55 + 0.4 * Math.sin(this.clock * 1.6 + s.phase);
    for (const f of this.swimmers) {
      f.node.x += f.speed * dt;
      if (f.node.x > this.view.w + 80) f.node.x = -80;
      f.node.y = this.view.h * f.y + Math.sin(this.clock * 1.2 + f.speed) * 10;
    }
  }
}
