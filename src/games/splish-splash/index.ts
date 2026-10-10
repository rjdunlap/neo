import { Circle, Container, Graphics, Rectangle, RenderTexture, Sprite, type FederatedPointerEvent, type Renderer } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch } from '../../art/palette';
import { gradientTexture } from '../../art/scenery';
import { textures } from '../../art/textures';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineVars } from '../../audio/voice';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { allowedParts, askedParts, MUD_H, MUD_W, nearMud, nextToScrub, PART_SPOTS, planFor, SCRUB_R, scrubPath, wrongTouches, type Part, type Plan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 4 },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 8 },
};

const MUD = { fill: 0x8b5a2b, dark: 0x6b4423, light: 0xa8743f };
/** A spot counts as clean when this much of it is gone; the last specks vanish on their own. */
const CLEAN_ENOUGH = 0.75;
const PIP_SCALE = 1.2;

/** One splotch of mud, drawn into its own texture so scrubbing can erase it bit by bit. */
class Mud {
  readonly sprite: Sprite;
  readonly glow = new Graphics();
  clean = false;
  private readonly rt: RenderTexture;
  private readonly points: { x: number; y: number }[] = [];
  private readonly total: number;
  /** The scrub radius in this splotch's own texture units, so the brush feels the same size on small splotches. */
  private readonly reach: number;

  constructor(
    readonly part: Part,
    x: number,
    y: number,
    readonly size: number,
    rng: Rng,
    private readonly renderer: Renderer,
  ) {
    this.rt = RenderTexture.create({ width: MUD_W, height: MUD_H, resolution: 2 });
    const blobs = Array.from({ length: 6 }, () => ({ x: MUD_W / 2 + rng.range(-28, 28), y: MUD_H / 2 + rng.range(-20, 20), r: rng.range(16, 26) }));
    const g = new Graphics();
    for (const b of blobs) g.circle(b.x, b.y, b.r);
    g.fill(MUD.fill);
    for (let i = 0; i < 7; i++) g.circle(MUD_W / 2 + rng.range(-36, 36), MUD_H / 2 + rng.range(-26, 26), rng.range(3, 7)).fill(MUD.dark);
    for (let i = 0; i < 3; i++) g.circle(MUD_W / 2 + rng.range(-24, 24), MUD_H / 2 + rng.range(-18, 18), rng.range(3, 5)).fill(MUD.light);
    renderer.render({ container: g, target: this.rt, clear: true, clearColor: [0, 0, 0, 0] });
    g.destroy();

    // Sample points inside the blobs; scrubbing knocks them out.
    for (let i = 0; i < 28; i++) {
      const b = rng.pick(blobs);
      const a = rng.range(0, Math.PI * 2);
      const r = Math.sqrt(rng.next()) * b.r * 0.9;
      this.points.push({ x: b.x + Math.cos(a) * r, y: b.y + Math.sin(a) * r });
    }
    this.total = this.points.length;
    this.reach = SCRUB_R / size;

    this.sprite = new Sprite(this.rt);
    this.sprite.anchor.set(0.5);
    this.sprite.position.set(x, y);
    this.sprite.scale.set(size);
    this.glow.scale.set(size);
    this.glow.ellipse(0, 0, MUD_W * 0.62, MUD_H * 0.62).fill({ color: 0xfff3a0, alpha: 0.7 });
    this.glow.position.set(x, y);
    this.glow.visible = false;
  }

  /** True if (lx, ly), in sprite-local coordinates, is near enough to scrub. */
  near(lx: number, ly: number): boolean {
    return nearMud(lx, ly, this.size);
  }

  /** Erase around a sprite-local point. Returns how much is now gone (0..1). */
  scrub(lx: number, ly: number, eraser: Sprite): number {
    const x = lx + MUD_W / 2;
    const y = ly + MUD_H / 2;
    eraser.position.set(x, y);
    eraser.scale.set((this.reach * 2) / eraser.texture.width);
    this.renderer.render({ container: eraser, target: this.rt, clear: false });
    for (let i = this.points.length - 1; i >= 0; i--) {
      const p = this.points[i];
      if (Math.hypot(p.x - x, p.y - y) < this.reach) this.points.splice(i, 1);
    }
    return 1 - this.points.length / this.total;
  }

  destroy() {
    this.sprite.destroy();
    this.glow.destroy();
    this.rt.destroy(true);
  }
}

class SplishSplash implements Game {
  private readonly plan: Plan;
  private readonly wall = new Sprite(gradientTexture(0xd6eefa, 0xbfe0f4));
  private readonly room = new Graphics();
  private readonly tubFront = new Graphics();
  private readonly foam = new Graphics();
  private readonly pip: Critter;
  private readonly rubberDuck = new Critter(CRITTERS.duck);
  private readonly scrubZone = new Container();
  private readonly eraser = new Sprite();
  private readonly muds: Mud[] = [];
  private readonly last = new Map<number, { x: number; y: number }>();
  /** The splotches each finger has scrubbed in this touch (clean now or not): rubbing on within their reach is not a mistake. */
  private readonly scrubbed = new Map<number, Mud[]>();
  private view: View;
  private partIndex = 0;
  private misses = 0;
  private hints = 0;
  private clock = 0;
  private lastSqueak = 0;
  private lastGiggle = 0;
  private lastNag = -10;
  private sinceProgress = 0;
  private bubbleIn = 0;
  private hinted = false;
  private finished = false;
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  private readonly lift = (e: { pointerId: number }) => {
    this.last.delete(e.pointerId);
    this.scrubbed.delete(e.pointerId);
  };

  constructor(private readonly ctx: GameContext) {
    this.pip = new Critter(ctx.petSpec);
    this.plan = planFor(ctx.level);
    if (this.plan.shuffle) this.plan = { ...this.plan, parts: ctx.rng.shuffle([...this.plan.parts]) };
    this.view = ctx.view;
    // Pip is the star of this one, so the corner guide steps out.
    ctx.pet.visible = false;

    this.eraser.texture = textures().brush;
    this.eraser.anchor.set(0.5);
    this.eraser.blendMode = 'erase';

    this.pip.scale.set(PIP_SCALE);
    for (const part of this.plan.parts) {
      for (const [x, y, size] of PART_SPOTS[part]) {
        const mud = new Mud(part, x, y, size, ctx.rng, ctx.renderer);
        this.pip.attach(mud.glow);
        this.pip.attach(mud.sprite);
        this.muds.push(mud);
      }
    }
    this.rubberDuck.scale.set(0.24);
    // The bath is one big scrub surface. The duck stays above it as a generous replay target,
    // so asking for the instruction never cleans mud or advances the round.
    this.rubberDuck.hitArea = new Circle(0, -125, 230);
    onTap(this.rubberDuck, () => this.repeatInstruction(), { cooldown: 500 });
    ctx.track(this.pip);
    ctx.track(this.rubberDuck);

    this.scrubZone.eventMode = 'static';
    this.scrubZone.on('pointerdown', (e) => this.scrubAt(e));
    this.scrubZone.on('globalpointermove', (e) => this.last.has(e.pointerId) && this.scrubAt(e));
    this.scrubZone.on('pointerup', this.lift);
    this.scrubZone.on('pointerupoutside', this.lift);
    window.addEventListener('pointerup', this.lift);
    window.addEventListener('pointercancel', this.lift);

    ctx.stage.addChild(this.wall, this.room, this.pip, this.tubFront, this.foam, this.scrubZone, this.rubberDuck);
  }

  start() {
    if (this.plan.mode === 'free') void this.instruct('bath.free');
    else void this.askForPart();
  }

  resize(v: View) {
    this.view = v;
    this.wall.width = v.w;
    this.wall.height = v.h;
    this.scrubZone.hitArea = new Rectangle(0, 0, v.w, v.h);
    const cx = v.w / 2;
    const tubTop = v.h * 0.66;
    const r = this.room.clear();
    for (let x = 0; x < v.w; x += 64) r.moveTo(x, 0).lineTo(x, tubTop).stroke({ width: 2, color: 0xeaf6fd });
    for (let y = 0; y < tubTop; y += 64) r.moveTo(0, y).lineTo(v.w, y).stroke({ width: 2, color: 0xeaf6fd });
    r.rect(0, tubTop + 40, v.w, v.h).fill(0xf3e3c8);
    // Shower head, up top.
    r.roundRect(cx + 150, 40, 14, 120, 6).fill(0xb9c6d1).roundRect(cx + 110, 150, 90, 26, 12).fill(0xb9c6d1);

    // Sitting in the tub: feet and bottom hidden behind the rim, tummy just above the foam.
    this.pip.position.set(cx, tubTop - 4);
    const t = this.tubFront.clear();
    t.circle(cx - 220, tubTop + 172, 20).circle(cx + 220, tubTop + 172, 20).fill(swatch.yellow.fill).stroke({ width: 4, color: swatch.yellow.line });
    t.roundRect(cx - 280, tubTop - 14, 560, 180, 70).fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1 });
    t.roundRect(cx - 296, tubTop - 22, 592, 32, 16).fill(0xffffff).stroke({ width: 6, color: 0xb9c6d1 });
    t.roundRect(cx - 250, tubTop + 40, 500, 10, 5).fill({ color: swatch.blue.light, alpha: 0.7 });
    this.drawFoam(cx, tubTop);
    this.rubberDuck.position.set(cx + 236, tubTop - 18);
  }

  update(dt: number) {
    this.clock += dt;
    this.foam.y = 2 * Math.sin(this.clock * 2);
    this.rubberDuck.rotation = 0.08 * Math.sin(this.clock * 1.6);
    if (this.plan.mode === 'parts' && !this.finished) {
      this.sinceProgress += dt;
      // Stuck for a while: light up the part we're asking for.
      if (this.sinceProgress > 7 && !this.hinted) {
        this.hinted = true;
        this.hints++;
        for (const m of this.muds) if (this.allowed().includes(m.part) && !m.clean) m.glow.visible = true;
      }
    }
    for (const m of this.muds) if (m.glow.visible) m.glow.alpha = 0.5 + 0.4 * Math.sin(this.clock * 7);
  }

  /** The ghost finger: scrub the next muddy splotch the question allows, back and forth until no mud is left in reach. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const part = nextToScrub(this.plan, this.partIndex, (p) => this.partClean(p));
    const mud = part && this.muds.find((m) => m.part === part && !m.clean);
    if (!mud) return null;
    const [start, ...via] = scrubPath(mud.size).map((p) => ({ on: mud.sprite, x: p.x, y: p.y }));
    return { trace: start, via, receiver: this.scrubZone };
  }

  destroy() {
    window.removeEventListener('pointerup', this.lift);
    window.removeEventListener('pointercancel', this.lift);
    for (const m of this.muds) m.destroy();
    this.eraser.destroy();
  }

  private asked(): Part[] {
    return askedParts(this.plan, this.partIndex);
  }

  private partClean(part: Part): boolean {
    return this.muds.filter((m) => m.part === part).every((m) => m.clean);
  }

  private allowed(): Part[] {
    return allowedParts(this.plan, this.partIndex, (p) => this.partClean(p));
  }

  private instruct(id: LineId, vars?: LineVars) {
    this.instruction = { id, vars };
    return this.ctx.instruct(id, vars);
  }

  private repeatInstruction() {
    if (!this.instruction || this.finished) return;
    this.rubberDuck.poke();
    sfx.squeak(9);
    void this.ctx.say(this.instruction.id, this.instruction.vars);
  }

  private async askForPart() {
    this.sinceProgress = 0;
    this.hinted = false;
    const [a, b] = this.asked();
    if (!b) await this.instruct('bath.part', { part: a });
    else await this.instruct(this.plan.ordered ? 'bath.order' : 'bath.two', { a, b });
  }

  private scrubAt(e: FederatedPointerEvent) {
    if (this.finished) return;
    const now = { x: e.global.x, y: e.global.y };
    const prev = this.last.get(e.pointerId) ?? now;
    this.last.set(e.pointerId, now);
    // Fill in the gaps of a fast swipe.
    const dist = Math.hypot(now.x - prev.x, now.y - prev.y);
    const steps = Math.max(1, Math.ceil(dist / 10));
    let onPip = false;
    for (let i = 1; i <= steps; i++) {
      const g = { x: prev.x + ((now.x - prev.x) * i) / steps, y: prev.y + ((now.y - prev.y) * i) / steps };
      onPip = this.scrubPoint(g, e.pointerId) || onPip;
    }
    if (!onPip) return;

    const p = this.ctx.stage.toLocal(e.global);
    this.bubbleIn -= dist / this.view.scale;
    if (this.bubbleIn <= 0) {
      this.bubbleIn = 26;
      this.ctx.particles.burst(p.x, p.y, { colors: [0xffffff, 0xd6eefa], count: 3, speed: [20, 70], gravity: -160, size: [0.3, 0.6], life: [0.6, 1.1] });
    }
    if (this.clock - this.lastSqueak > 0.13) {
      this.lastSqueak = this.clock;
      sfx.squeak(7 + Math.floor(Math.random() * 4));
    }
    if (this.clock - this.lastGiggle > 1.6) {
      this.lastGiggle = this.clock;
      this.pip.poke();
      sfx.giggle();
    }
  }

  /** Scrub at one point (canvas pixels). Returns true if the point was on Pip. */
  private scrubPoint(global: { x: number; y: number }, pointerId: number): boolean {
    const body = this.pip.toLocal(global);
    const onPip = Math.abs(body.x) < 170 && body.y < 20 && body.y > -320;
    // The splotches this point is on. A point on one that is asked for is scrubbing it, even where a neighbor's reach overlaps.
    const touched = this.muds.filter((m) => {
      if (m.clean) return false;
      const l = m.sprite.toLocal(global);
      return m.near(l.x, l.y);
    });
    const parts = this.plan.mode === 'parts';
    // Still within reach of a splotch this finger has scrubbed in this touch (even one that is clean now): it is rubbing on, not changing part.
    const forgiven = (this.scrubbed.get(pointerId) ?? []).some((m) => {
      const l = m.sprite.toLocal(global);
      return m.near(l.x, l.y);
    });
    const wrong = parts ? wrongTouches(this.allowed(), touched.map((m) => m.part), forgiven) : [];
    for (const m of touched) {
      const l = m.sprite.toLocal(global);
      if (parts && !this.allowed().includes(m.part)) {
        if (wrong.includes(m.part)) this.notThatPart(m.part);
        continue;
      }
      const mine = this.scrubbed.get(pointerId) ?? [];
      if (!mine.includes(m)) this.scrubbed.set(pointerId, [...mine, m]);
      const gone = m.scrub(l.x, l.y, this.eraser);
      this.sinceProgress = 0;
      if (gone >= CLEAN_ENOUGH) void this.cleaned(m);
    }
    return onPip;
  }

  private notThatPart(touched: Part) {
    if (this.clock - this.lastNag < 4) return;
    this.lastNag = this.clock;
    this.misses++;
    const [a, b] = this.asked();
    if (this.plan.ordered && touched === b) void this.ctx.say('bath.first', { a, b });
    else void this.ctx.say('bath.notthat', { touched, part: b ? `${a} and my ${b}` : a });
  }

  private async cleaned(m: Mud) {
    m.clean = true;
    m.glow.visible = false;
    void this.ctx.tw.to(m.sprite, { alpha: 0 }, { duration: 0.35 });
    const p = this.ctx.stage.toLocal(m.sprite.getGlobalPosition());
    this.ctx.particles.burst(p.x, p.y, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 10, speed: [100, 240], gravity: 0, life: [0.4, 0.8] });
    sfx.squeak(12);
    this.pip.cheer();

    if (this.muds.every((x) => x.clean)) {
      void this.finale();
      return;
    }
    if (this.plan.mode === 'parts' && this.asked().every((p) => this.partClean(p))) {
      this.partIndex += this.asked().length;
      sfx.sparkle();
      await this.ctx.say('praise');
      await this.askForPart();
    }
  }

  /** A rinse from the shower, then sparkly clean. */
  private async finale() {
    this.finished = true;
    const v = this.view;
    for (let i = 0; i < 6; i++) {
      this.ctx.particles.burst(v.w / 2 + 155, 175, { colors: [swatch.blue.fill, swatch.blue.light, 0xffffff], count: 14, angle: Math.PI / 2 + 0.35, spread: 0.6, speed: [200, 380], gravity: 600, size: [0.2, 0.4], life: [0.7, 1] });
      if (i === 0) sfx.splash();
      await this.ctx.tw.wait(0.12);
    }
    this.pip.cheer();
    void this.ctx.say('bath.clean');
    const colors = RAINBOW.map((c) => swatch[c].fill);
    const p = this.ctx.stage.toLocal(this.pip.getGlobalPosition());
    this.ctx.particles.burst(p.x, p.y - 180, { kind: 'star', colors: [0xffffff, 0xfff3a0, ...colors], count: 30, speed: [150, 400], gravity: 0, life: [0.8, 1.3] });
    sfx.tada();
    await this.ctx.tw.wait(2);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private drawFoam(cx: number, tubTop: number) {
    const f = this.foam.clear();
    const rng = new Rng(5);
    for (let i = 0; i < 26; i++) {
      const x = cx - 270 + i * 21 + rng.range(-6, 6);
      f.circle(x, tubTop - 24 + rng.range(-8, 6), rng.range(14, 24));
    }
    f.fill(0xffffff).stroke({ width: 3, color: 0xd6eefa });
  }
}

/** The hub's bathtub, foamy, with a rubber duck bobbing on the rim. */
class TubIcon extends Container {
  private readonly duck = new Critter(CRITTERS.duck);
  private readonly bubbles: Graphics[] = [];
  private clock = 0;

  constructor() {
    super();
    const tub = new Graphics()
      .circle(-100, -8, 13)
      .circle(100, -8, 13)
      .fill(swatch.yellow.fill)
      .stroke({ width: 4, color: swatch.yellow.line })
      .roundRect(-140, -110, 280, 104, 44)
      .fill(0xffffff)
      .stroke({ width: 6, color: 0xb9c6d1 })
      .roundRect(-150, -118, 300, 22, 11)
      .fill(0xffffff)
      .stroke({ width: 5, color: 0xb9c6d1 });
    const foam = new Graphics();
    for (let i = 0; i < 11; i++) foam.circle(-130 + i * 26, -122 - (i % 2) * 8, 16 + (i % 3) * 3);
    foam.fill(0xffffff).stroke({ width: 3, color: 0xd6eefa });
    this.duck.scale.set(0.24);
    this.duck.position.set(70, -132);
    this.addChild(tub, foam, this.duck);
    for (let i = 0; i < 4; i++) {
      const b = new Graphics().circle(0, 0, 8 + i * 2).stroke({ width: 3, color: 0x8fd0ff });
      b.position.set(-60 + i * 30, -150);
      this.bubbles.push(b);
      this.addChild(b);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.duck.update(dt);
    this.duck.rotation = 0.12 * Math.sin(this.clock * 2);
    this.bubbles.forEach((b, i) => {
      const t = (this.clock * 0.5 + i * 0.25) % 1;
      b.y = -140 - t * 120;
      b.x = -60 + i * 30 + Math.sin(this.clock * 2 + i) * 8;
      b.alpha = 1 - t;
    });
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const duck = new Critter(CRITTERS.duck);
  duck.alive = false;
  duck.scale.set(0.5);
  const foam = new Graphics();
  for (let i = 0; i < 6; i++) foam.circle(rng.range(-90, 90), rng.range(-20, 10), rng.range(18, 30));
  foam.fill(0xffffff).stroke({ width: 3, color: 0xbfe0f4 });
  for (let i = 0; i < 3; i++) foam.circle(rng.range(-80, 80), rng.range(-170, -110), rng.range(10, 16)).stroke({ width: 4, color: 0x8fd0ff });
  c.addChild(duck, foam);
  return c;
}

export const splishSplash: GameModule = {
  id: 'splish-splash',
  name: 'Splish Splash',
  titleLine: 'game.splish-splash',
  region: 'cozy-village',
  skills: ['fine-motor', 'body-parts'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.ordered) return 'Two-step directions in order: "first your nose, then your ears"';
    if (p.pairs) return 'Two body parts at once: "wash my ears and my nose"';
    return p.shuffle ? `Wash ${p.parts.length} body parts in a different order each round` : p.mode === 'free' ? 'Scrub all the mud off' : `Wash one body part at a time: ${p.parts.join(', ')}`;
  },
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Name the body parts as {name} scrubs: "tummy", "ears", "cheeks".',
  offScreen: 'At bath time, ask "Where are your toes? Let\'s wash your ears!"',
  hubIcon: () => new TubIcon(),
  sticker,
  create: (ctx) => new SplishSplash(ctx),
};
