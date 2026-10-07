import { Container, Graphics, Sprite } from 'pixi.js';
import type { Updatable } from '../app/Scene';
import type { Critter } from '../art/critter';
import { RAINBOW, swatch, type Swatch } from '../art/palette';
import { makePet } from '../art/pet';
import { Particles } from '../art/particles';
import { gradientTexture } from '../art/scenery';
import { sfx } from '../audio/sfx';
import { Rng } from '../engine/random';
import { ease, Tweener } from '../engine/tween';
import type { View } from '../engine/view';
import type { LanternOwner } from './finale';

const SKY: [number, number] = [0x14204d, 0x6a3f86];
/** Player 1 is the blue paddle and Player 2 the pink one; a shared lantern is gold. */
const OWNER: Record<string, Swatch> = { 0: swatch.blue, 1: swatch.pink, both: swatch.yellow };
const DIM = 0x4a4f78;

/** A paper lantern that starts dark and glows when lit. */
export class Lantern extends Container implements Updatable {
  /** Everything that sways and bobs; the lantern itself is moved by tweens. */
  private readonly sway = new Container();
  private readonly glow = new Graphics();
  private readonly bright = new Graphics();
  private clock: number;
  private amount = 0;
  private goal = 0;
  /** Bobbing only starts once it has risen, so it never fights the rise. */
  floating = false;

  constructor(readonly color: Swatch, phase: number) {
    super();
    this.clock = phase;
    const body = (g: Graphics, fill: number, line: number, rib: number) => {
      g.roundRect(-36, -46, 72, 90, 26).fill(fill).stroke({ width: 5, color: line });
      g.moveTo(-14, -44).quadraticCurveTo(-24, 0, -14, 42).moveTo(14, -44).quadraticCurveTo(24, 0, 14, 42).stroke({ width: 3, color: rib, alpha: 0.7 });
      g.roundRect(-26, -58, 52, 16, 7).fill(line);
      g.roundRect(-20, 40, 40, 11, 5).fill(line);
      return g;
    };
    this.glow.circle(0, 0, 150).fill({ color: color.fill, alpha: 0.1 }).circle(0, 0, 100).fill({ color: color.light, alpha: 0.16 });
    const dim = body(new Graphics(), DIM, 0x2a2f55, 0x2a2f55);
    body(this.bright, color.fill, color.line, color.line);
    this.bright.ellipse(0, -2, 17, 30).fill({ color: color.light, alpha: 0.75 });
    this.bright.circle(0, 54, 6).fill(0xfff6c8);
    this.bright.alpha = 0;
    this.glow.alpha = 0;
    this.sway.addChild(this.glow, dim, this.bright);
    this.addChild(this.sway);
    this.eventMode = 'none';
  }

  get lit() {
    return this.goal === 1;
  }

  light(on = true) {
    this.goal = on ? 1 : 0;
  }

  update(dt: number) {
    this.clock += dt;
    this.amount += (this.goal - this.amount) * Math.min(1, dt * 6);
    this.bright.alpha = this.amount;
    this.glow.alpha = this.amount * (0.8 + 0.2 * Math.sin(this.clock * 2.6));
    this.sway.rotation = 0.05 * Math.sin(this.clock * 1.2);
    this.sway.y = this.floating ? 9 * Math.sin(this.clock * 1.1) : 0;
  }
}

/**
 * The couch trip's ending: a night sky where each lantern rises and lights, in the color of whoever
 * took its stop (gold when it was shared), with the pet cheering and confetti. It owns its tweens
 * and sparkles, so leaving the screen stops all of it.
 */
export class FinaleStage extends Container implements Updatable {
  readonly lanterns: Lantern[];
  private readonly tw = new Tweener();
  private readonly fx = new Particles();
  private readonly sky = new Sprite();
  private readonly stars = [new Graphics(), new Graphics(), new Graphics()];
  private readonly scenery = new Graphics();
  private readonly pet: Critter = makePet();
  private view: View;
  private clock = 0;
  private hopIn = 1.2;
  private cheering = false;
  private dead = false;
  private rest: { x: number; y: number }[] = [];

  constructor(view: View, owners: readonly LanternOwner[]) {
    super();
    this.view = view;
    this.sky.texture = gradientTexture(SKY[0], SKY[1]);
    this.lanterns = owners.map((o, i) => new Lantern(OWNER[String(o)], i * 1.7));
    this.pet.scale.set(0.7);
    this.eventMode = 'none';
    this.addChild(this.sky, ...this.stars, this.scenery, ...this.lanterns, this.pet, this.fx);
    this.resize(view);
  }

  resize(view: View) {
    this.view = view;
    this.sky.width = view.w;
    this.sky.height = view.h;
    const rng = new Rng(11);
    this.stars.forEach((g, group) => {
      g.clear();
      for (let i = 0; i < 26; i++) g.circle(rng.range(0, view.w), rng.range(0, view.h * 0.75), rng.range(1.2, 2.8)).fill(group === 0 ? 0xffffff : group === 1 ? 0xfff0b3 : 0xcde6ff);
    });
    this.scenery.clear();
    // A pale full moon, and two dark hills along the bottom.
    this.scenery.circle(view.w - 130, 120, 54).fill(0xfff6d6).circle(view.w - 146, 106, 10).circle(view.w - 118, 140, 14).circle(view.w - 112, 98, 7).fill(0xefe3b4);
    this.scenery.ellipse(view.w * 0.28, view.h + 40, view.w * 0.5, 130).fill(0x1b2455);
    this.scenery.ellipse(view.w * 0.78, view.h + 70, view.w * 0.46, 140).fill(0x232d62);
    // Spread along the top, in a gentle wave; the title's glass panel sits over the left of them.
    this.rest = this.lanterns.map((_, i) => {
      const n = this.lanterns.length;
      return { x: view.w * (0.08 + (0.84 * i) / Math.max(1, n - 1)), y: view.h * [0.2, 0.1, 0.24, 0.12, 0.26, 0.14][i % 6] };
    });
    this.lanterns.forEach((l, i) => {
      if (l.floating) l.position.set(this.rest[i].x, this.rest[i].y);
    });
    this.pet.position.set(view.w - 100, view.h - 14);
  }

  /** The full ceremony: lanterns rise and light one after another, then confetti and a cheer. */
  celebrate() {
    this.lanterns.forEach((l, i) => {
      l.floating = false;
      l.position.set(this.rest[i].x, this.view.h + 140);
    });
    void this.run();
  }

  /** The same sky with everything already lit and still: for coming back to the page. */
  settle() {
    this.lanterns.forEach((l, i) => {
      l.position.set(this.rest[i].x, this.rest[i].y);
      l.light();
      l.floating = true;
    });
    this.cheering = true;
  }

  private async run() {
    const rises = this.lanterns.map(async (lantern, i) => {
      await this.tw.to(lantern, { x: this.rest[i].x, y: this.rest[i].y }, { duration: 1.3, delay: 0.3 + i * 0.38, ease: ease.outCubic });
      if (this.dead) return;
      // The window may have been resized on the way up.
      lantern.position.set(this.rest[i].x, this.rest[i].y);
      lantern.light();
      lantern.floating = true;
      sfx.bell(5 + i, 0.26);
      this.fx.burst(lantern.x, lantern.y, { kind: 'star', colors: [0xffffff, lantern.color.light, lantern.color.fill], count: 14, speed: [120, 300], gravity: 40, life: [0.6, 1.2] });
    });
    await Promise.all(rises);
    if (this.dead) return;
    sfx.tada();
    const colors = RAINBOW.map(c => swatch[c].fill);
    const cannon = { kind: 'confetti' as const, colors, count: 44, speed: [600, 1000] as [number, number], spread: 0.5, gravity: 700, life: [1.8, 2.6] as [number, number] };
    this.fx.burst(0, this.view.h, { ...cannon, angle: -Math.PI / 3 });
    this.fx.burst(this.view.w, this.view.h, { ...cannon, angle: (-Math.PI * 2) / 3 });
    this.pet.cheer();
    this.cheering = true;
  }

  update(dt: number) {
    if (this.dead) return;
    this.clock += dt;
    this.tw.update(dt);
    this.fx.update(dt);
    this.pet.update(dt);
    for (const l of this.lanterns) l.update(dt);
    this.stars.forEach((g, i) => (g.alpha = 0.55 + 0.45 * Math.sin(this.clock * (0.9 + i * 0.5) + i * 2)));
    if (this.cheering) {
      this.hopIn -= dt;
      if (this.hopIn <= 0) {
        this.pet.hop(0.7);
        this.hopIn = 1.3;
      }
    }
  }

  destroy() {
    if (this.dead) return;
    this.dead = true;
    this.tw.clear();
    this.sky.texture.destroy(true);
    super.destroy({ children: true });
  }
}
