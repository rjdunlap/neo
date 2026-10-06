import { Container, Graphics, Rectangle, Sprite } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { RAINBOW, swatch, wood, type ColorName } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { musicNote } from '../../art/shapes';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { Band } from '../../progress/bands';
import type { Game, GameContext, GameModule } from '../types';
import { Jelly } from './jelly';
import { makeTune, planFor, type JellyPlan } from './logic';

/** Big jelly, low note: C D E G A from left to right. */
const COLORS: ColorName[] = ['red', 'orange', 'yellow', 'green', 'blue'];
const STEPS = [0, 1, 2, 3, 4];
const BULBS = 8;

const LEVELS: Record<Band, { min: number; max: number }> = {
  lap: { min: 1, max: 3 },
  toddler: { min: 1, max: 3 },
  preschool: { min: 4, max: 7 },
  prek: { min: 5, max: 9 },
};

const FANS: CritterName[] = ['duck', 'bunny', 'cat', 'pig'];

class JellyDrums implements Game {
  private readonly plan: JellyPlan;
  private readonly sky = new Sprite(gradientTexture(0xa9c1ff, 0xffe3f1));
  private readonly mountains = new Graphics();
  private readonly stageG = new Graphics();
  private readonly garland = new Graphics();
  private readonly jellies: Jelly[];
  private readonly fans: Critter[];
  private view: View;
  private phase: 'play' | 'listen' | 'turn' | 'done' = 'play';
  private lit = 0;
  private notes = 0;
  private tune: number[] = [];
  private at = 0;
  private tunesDone = 0;
  private wrongThisTune = 0;
  private misses = 0;
  private hints = 0;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    this.jellies = COLORS.map((c, i) => {
      const hw = 82 - i * 7;
      const j = new Jelly(c, hw, hw * 1.55);
      onTap(j, () => this.tapJelly(i), { cooldown: 90 });
      j.hitArea = new Rectangle(-hw - 18, -hw * 1.55 - 30, hw * 2 + 36, hw * 1.55 + 50);
      return j;
    });
    this.fans = FANS.map((name) => {
      const c = ctx.track(new Critter(CRITTERS[name]));
      c.scale.set(0.3);
      return c;
    });
    ctx.stage.addChild(this.sky, this.mountains, this.garland, this.stageG, ...this.jellies, ...this.fans);
  }

  start() {
    void this.ctx.instruct('jelly.free');
    if (this.plan.mode === 'echo') void this.ctx.tw.wait(2).then(() => this.nextTune());
  }

  resize(v: View) {
    this.view = v;
    const cx = v.w / 2;
    const top = v.h * 0.74;
    this.sky.width = v.w;
    this.sky.height = v.h;

    const m = this.mountains.clear();
    const peaks: [number, number, number, number][] = [
      [cx - 420, top - 300, 330, 0xb7a6f0],
      [cx + 360, top - 330, 380, 0xb7a6f0],
      [cx - 60, top - 260, 420, 0x9f8be6],
    ];
    for (const [x, y, half, color] of peaks) {
      m.moveTo(x - half, top).quadraticCurveTo(x - 30, y - 30, x, y).quadraticCurveTo(x + 30, y - 30, x + half, top).closePath().fill(color);
      m.moveTo(x - 58, y + 52)
        .quadraticCurveTo(x - 20, y - 22, x, y - 4)
        .quadraticCurveTo(x + 20, y - 22, x + 58, y + 52)
        .quadraticCurveTo(x + 30, y + 36, x + 12, y + 50)
        .quadraticCurveTo(x - 10, y + 34, x - 30, y + 50)
        .closePath()
        .fill(0xffffff);
    }

    this.stageG
      .clear()
      .roundRect(cx - 470, top - 12, 940, 40, 18)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .rect(cx - 452, top + 26, 904, v.h * 0.12)
      .fill(wood.line);
    for (let i = 0; i < 8; i++) this.stageG.rect(cx - 452 + i * 113 + 54, top + 26, 5, v.h * 0.12).fill({ color: 0x000000, alpha: 0.12 });

    this.jellies.forEach((j, i) => j.position.set(cx + (i - 2) * 178, top + 10));
    this.fans.forEach((f, i) => f.position.set(cx + (i - 1.5) * 150, v.h - 6));
    this.drawGarland();
  }

  update(dt: number) {
    this.clock += dt;
    const beat = music.beat();
    for (const j of this.jellies) j.update(dt, beat);
  }

  destroy() {}

  private tapJelly(i: number) {
    if (this.phase === 'done') return;
    this.sing(i);
    if (this.plan.mode === 'free') {
      this.notes++;
      this.setLit(Math.floor((this.notes / this.plan.goal) * BULBS));
      if (this.notes >= this.plan.goal) void this.finale();
      return;
    }
    if (this.phase !== 'turn') return; // while the jellies sing, taps just make music
    if (i === this.tune[this.at]) {
      this.at++;
      if (this.at >= this.tune.length) void this.copied();
      else if (this.wrongThisTune >= 2) this.jellies[this.tune[this.at]].glow(1.2);
    } else {
      void this.oops();
    }
  }

  private sing(i: number, power = 1) {
    const j = this.jellies[i];
    j.hit(power);
    sfx.marimba(STEPS[i]);
    this.ctx.particles.burst(j.x + (Math.random() - 0.5) * 30, j.y - j.height * 0.9, {
      kind: 'note',
      colors: [swatch[j.color].line],
      count: 1,
      speed: [90, 150],
      spread: 0.7,
      gravity: -40,
      size: [0.8, 1.05],
      life: [1, 1.4],
      spin: 1,
    });
    this.ctx.rng.pick(this.fans).hop(0.5);
  }

  private setLit(n: number) {
    const lit = Math.min(BULBS, n);
    if (lit === this.lit) return;
    this.lit = lit;
    this.drawGarland();
  }

  /** A string of bulbs over the stage; each one lit is a bit of progress. */
  private drawGarland() {
    const v = this.view;
    const cx = v.w / 2;
    const [x0, x1, y, sag] = [cx - 400, cx + 400, 70, 80];
    const g = this.garland.clear();
    g.moveTo(x0, y).quadraticCurveTo(cx, y + sag * 2, x1, y).stroke({ width: 4, color: 0x6b5aa8 });
    for (let k = 0; k < BULBS; k++) {
      const t = (k + 0.5) / BULBS;
      const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const by = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y + sag * 2) + t * t * y;
      const on = k < this.lit;
      const color = swatch[RAINBOW[k % RAINBOW.length]];
      g.rect(bx - 6, by - 4, 12, 10).fill(0x6b5aa8);
      if (on) g.circle(bx, by + 20, 26).fill({ color: color.fill, alpha: 0.25 });
      g.circle(bx, by + 20, 15).fill(on ? color.fill : 0xf4f0ff).stroke({ width: 4, color: on ? color.line : 0xcfc6ee });
    }
  }

  // ----- Copy-the-tune mode -----

  private async nextTune() {
    this.phase = 'listen';
    this.at = 0;
    this.wrongThisTune = 0;
    this.tune = makeTune(this.ctx.rng, this.plan.length);
    await this.playTune(false);
    this.phase = 'turn';
    void this.ctx.instruct('jelly.turn');
  }

  private async playTune(slow: boolean) {
    await this.ctx.say('jelly.listen');
    await this.ctx.tw.wait(0.3);
    for (const i of this.tune) {
      this.jellies[i].glow(slow ? 0.8 : 0.5);
      this.sing(i);
      await this.ctx.tw.wait(slow ? 0.85 : 0.6);
    }
  }

  private async copied() {
    this.phase = 'listen';
    this.tunesDone++;
    this.setLit(Math.round((this.tunesDone / this.plan.goal) * BULBS));
    this.fans.forEach((f) => f.cheer());
    this.ctx.pet.cheer();
    sfx.sparkle();
    void this.ctx.say('jelly.nice');
    await this.ctx.tw.wait(1.6);
    if (this.tunesDone >= this.plan.goal) void this.finale();
    else void this.nextTune();
  }

  private async oops() {
    this.phase = 'listen';
    this.misses++;
    this.wrongThisTune++;
    if (this.wrongThisTune === 2) this.hints++;
    await this.ctx.tw.wait(0.5);
    await this.ctx.say('jelly.oops');
    this.at = 0;
    const help = this.wrongThisTune >= 2;
    await this.playTune(help);
    this.phase = 'turn';
    // After two tries, light the way: the next jelly to tap glows.
    if (help) this.jellies[this.tune[0]].glow(1.5);
  }

  /** The song is done: a run up the scale, a big chord, and the crowd goes wild. */
  private async finale() {
    this.phase = 'done';
    await this.ctx.tw.wait(0.4);
    for (let i = 0; i < this.jellies.length; i++) {
      this.sing(i);
      await this.ctx.tw.wait(0.14);
    }
    await this.ctx.tw.wait(0.2);
    this.jellies.forEach((j) => j.hit(1.4));
    [0, 2, 3, 5].forEach((s) => sfx.marimba(s, 0.3));
    this.fans.forEach((f) => f.cheer());
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, 120, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.tw.wait(1.6);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

/** The hub's little stage: three jellies bobbing to the music, one singing now and then. */
class JellyStand extends Container {
  private readonly jellies: Jelly[];
  private next = 1;

  constructor() {
    super();
    const riser = new Graphics()
      .roundRect(-160, -20, 320, 34, 14)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line })
      .rect(-146, 12, 292, 20)
      .fill(wood.line);
    this.jellies = (['red', 'yellow', 'blue'] as ColorName[]).map((c, i) => {
      const hw = 54 - i * 7;
      const j = new Jelly(c, hw, hw * 1.55);
      j.position.set(-98 + i * 98, -10);
      return j;
    });
    this.addChild(riser, ...this.jellies);
  }

  update(dt: number) {
    const beat = music.beat();
    for (const j of this.jellies) j.update(dt, beat);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 0.9 + Math.random() * 1.4;
      this.jellies[Math.floor(Math.random() * this.jellies.length)].hit(0.6);
    }
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const color = rng.pick(COLORS);
  const c = new Container();
  const j = new Jelly(color, 70, 108);
  j.update(0, 0.5);
  const note = musicNote(new Graphics(), 64, swatch[rng.pick(COLORS.filter((x) => x !== color))].line);
  note.position.set(78, -130);
  c.addChild(j, note);
  return c;
}

export const jellyDrums: GameModule = {
  id: 'jelly-drums',
  name: 'Jelly Drums',
  titleLine: 'game.jelly-drums',
  region: 'music-mountain',
  skills: ['cause-effect', 'rhythm', 'sequence-memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => LEVELS[band],
  describeLevel: (level) => {
    const p = planFor(level);
    return p.mode === 'free' ? `Free play, ${p.goal} notes` : `Copy a ${p.length}-note tune, ${p.goal} tunes`;
  },
  music: STYLES.jelly,
  coplayHint: 'Sing along! Big jellies sing low, little jellies sing high.',
  offScreen: 'Make a pots-and-pans band: big pot, low sound; small pot, high sound.',
  hubIcon: () => new JellyStand(),
  sticker,
  create: (ctx) => new JellyDrums(ctx),
};
