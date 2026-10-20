import { Circle, Container, Graphics, Rectangle, RenderTexture, Sprite, type FederatedPointerEvent, type Renderer } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import type { CompanionRig } from '../../creatures/companion';
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
import { allowedParts, askedParts, askedPhrase, cleanPhrase, IdleNudge, MUD_H, MUD_W, Namer, nearestIndex, nearMud, nextToScrub, PATS_PER_PATCH, PHRASES, planFor, spotsOn, STAR, reach, scrubPath, wrongTouches, type Part, type Plan } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 9, order: [9, 1, 2] },
  toddler: { min: 1, max: 4 },
  preschool: { min: 3, max: 7 },
  prek: { min: 5, max: 8 },
};

const MUD = { fill: 0x8b5a2b, dark: 0x6b4423, light: 0xa8743f };
/** A spot counts as clean when this much of it is gone; the last specks vanish on their own. */
const CLEAN_ENOUGH = 0.75;

/** One splotch of mud, drawn into its own texture so scrubbing can erase it bit by bit. */
class Mud {
  readonly sprite: Sprite;
  readonly glow = new Graphics();
  clean = false;
  /** Pats taken in `pat` mode. */
  pats = 0;
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
    private readonly brush: number,
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
    this.reach = reach(size, brush);

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
    return nearMud(lx, ly, this.size, this.brush);
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
  private readonly pip: CompanionRig;
  /** How far the star sits up out of the water, so the tummy's mud clears the rim. */
  private rise = 0;
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
  /** The opening instruction is still being said: hold the parts' names until it ends. */
  private opening = true;
  private readonly namer = new Namer();
  private readonly idle = new IdleNudge();
  private instruction: { id: LineId; vars?: LineVars } | null = null;
  private readonly lift = (e: { pointerId: number }) => {
    this.last.delete(e.pointerId);
    this.scrubbed.delete(e.pointerId);
  };

  constructor(private readonly ctx: GameContext) {
    this.pip = ctx.companion();
    this.plan = planFor(ctx.level);
    if (this.plan.shuffle) this.plan = { ...this.plan, parts: ctx.rng.shuffle([...this.plan.parts]) };
    this.view = ctx.view;
    // The companion is the star of this one, so the corner guide steps out.
    ctx.pet.visible = false;

    this.eraser.texture = textures().brush;
    this.eraser.anchor.set(0.5);
    this.eraser.blendMode = 'erase';

    const star = STAR[this.pip.species];
    this.pip.scale.set(star.scale);
    // Each splotch rides its part (a leaf, an ear, the river's head as it rears), one on each of the part's points.
    const spots = spotsOn((p) => this.pip.partPoints(p), star.mud);
    for (const part of this.plan.parts) {
      this.pip.part(part).forEach((node, i) => {
        const spot = spots.filter((s) => s.part === part)[i];
        const mud = new Mud(part, 0, 0, spot.size, this.plan.brush ?? 1, ctx.rng, ctx.renderer);
        node.addChild(mud.glow, mud.sprite);
        this.muds.push(mud);
      });
    }
    // The tummy's mud sits clear of the tub's rim (the river's tummy is low).
    const lowest = Math.max(...spots.filter((s) => this.plan.parts.includes(s.part)).map((s) => s.y + (48 * s.size)));
    this.rise = Math.max(0, lowest * star.scale + 24);
    this.rubberDuck.scale.set(0.24);
    // The bath is one big scrub surface. The duck stays above it as a generous replay target,
    // so asking for the instruction never cleans mud or advances the round.
    this.rubberDuck.hitArea = new Circle(0, -125, 230);
    onTap(this.rubberDuck, () => this.repeatInstruction(), { cooldown: 500 });
    ctx.track(this.pip);
    ctx.track(this.rubberDuck);

    this.scrubZone.eventMode = 'static';
    this.scrubZone.on('pointerdown', (e) => {
      this.idle.touch();
      if (this.plan.mode === 'pat') this.patAt(e);
      else this.scrubAt(e);
    });
    this.scrubZone.on('globalpointermove', (e) => this.plan.mode !== 'pat' && this.last.has(e.pointerId) && this.scrubAt(e));
    this.scrubZone.on('pointerup', this.lift);
    this.scrubZone.on('pointerupoutside', this.lift);
    window.addEventListener('pointerup', this.lift);
    window.addEventListener('pointercancel', this.lift);

    ctx.stage.addChild(this.wall, this.room, this.pip, this.tubFront, this.foam, this.scrubZone, this.rubberDuck);
  }

  start() {
    if (this.plan.mode === 'parts') void this.askForPart();
    else void this.instruct(this.plan.mode === 'pat' ? 'bath.pat' : 'bath.free').then(() => (this.opening = false));
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
    this.pip.position.set(cx, tubTop - 4 - this.rise);
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
    if (this.plan.mode === 'free' && !this.finished && this.idle.tick(dt)) {
      // Quiet for a while: the next muddy spot sparkles and the pet wiggles (an invitation, never a hint).
      const part = nextToScrub(this.plan, 0, (p) => this.partClean(p));
      const m = part && this.muds.find((x) => x.part === part && !x.clean);
      if (m) m.glow.visible = true;
      this.pip.wiggle();
    }
    if (this.plan.mode === 'pat' && !this.finished) {
      // Quiet for a while: sparkle the next patch (an invitation, not a hint).
      this.sinceProgress += dt;
      if (this.sinceProgress > 6) {
        this.sinceProgress = 0;
        const m = this.muds.find((x) => !x.clean);
        if (m) m.glow.visible = true;
      }
    }
    for (const m of this.muds) if (m.glow.visible) m.glow.alpha = 0.5 + 0.4 * Math.sin(this.clock * 7);
  }

  /** The ghost finger: pat the pet's patch, or scrub the next muddy splotch the question allows, back and forth until no mud is left in reach. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    if (this.plan.mode === 'pat') {
      const m = this.muds.find((x) => !x.clean);
      return m ? { tap: { on: m.sprite, x: 0, y: 0 }, receiver: this.scrubZone } : null;
    }
    const part = nextToScrub(this.plan, this.partIndex, (p) => this.partClean(p));
    const mud = part && this.muds.find((m) => m.part === part && !m.clean);
    if (!mud) return null;
    const [start, ...via] = scrubPath(mud.size, this.plan.brush).map((p) => ({ on: mud.sprite, x: p.x, y: p.y }));
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
    if (!b) await this.instruct('bath.part', { part: askedPhrase([a]) });
    else await this.instruct(this.plan.ordered ? 'bath.order' : 'bath.two', { a: askedPhrase([a]), b: askedPhrase([b]) });
  }

  private scrubAt(e: FederatedPointerEvent) {
    if (this.finished) return;
    this.idle.touch();
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
      this.pip.poke(true);
      sfx.giggle();
    }
  }

  /** Pat mode: a touch anywhere takes a third off the nearest patch of mud. */
  private patAt(e: FederatedPointerEvent) {
    if (this.finished) return;
    const open = this.muds.filter((m) => !m.clean);
    const i = nearestIndex(open.map((m) => m.sprite.getGlobalPosition()), e.global.x, e.global.y);
    if (i === null) return;
    const m = open[i];
    m.pats++;
    m.glow.visible = false;
    this.nameAt(m.part);
    this.sinceProgress = 0;
    m.sprite.alpha = 1 - m.pats / PATS_PER_PATCH;
    const p = this.ctx.stage.toLocal(e.global);
    this.ctx.particles.burst(p.x, p.y, { colors: [0xffffff, 0xd6eefa], count: 8, speed: [40, 140], gravity: -160, size: [0.3, 0.7], life: [0.6, 1.1] });
    sfx.squeak(7 + Math.floor(Math.random() * 4));
    this.pip.poke(true);
    if (m.pats >= PATS_PER_PATCH) void this.cleaned(m);
  }

  /** Scrub at one point (canvas pixels). Returns true if the point was on Pip. */
  private scrubPoint(global: { x: number; y: number }, pointerId: number): boolean {
    const body = this.pip.toLocal(global);
    const b = this.pip.bounds();
    const onPip = body.x > b.x - 60 && body.x < b.right + 60 && body.y > b.y - 80 && body.y < 20;
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
      if (!parts) {
        m.glow.visible = false;
        this.nameAt(m.part);
      }
      if (gone >= CLEAN_ENOUGH) void this.cleaned(m);
    }
    return onPip;
  }

  private notThatPart(touched: Part) {
    if (this.clock - this.lastNag < 4) return;
    this.lastNag = this.clock;
    this.misses++;
    const [a, b] = this.asked();
    if (this.plan.ordered && touched === b) void this.ctx.say('bath.first', { a: askedPhrase([a]), b: askedPhrase([b]) });
    else void this.ctx.say(PHRASES[touched].plural ? 'bath.notthose' : 'bath.notthat', { touched: PHRASES[touched].word, part: askedPhrase(this.asked()) });
  }

  /** Free play and patting: say a part's name at its first touch, once a round, never over the opening or too soon after the last. */
  private nameAt(part: Part) {
    if (this.namer.touch(part, this.clock, this.opening)) void this.ctx.say('bath.named', { part: PHRASES[part].word });
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
    if (this.plan.mode === 'parts') {
      if (!this.asked().every((p) => this.partClean(p))) return;
      const done = this.asked();
      this.partIndex += done.length;
      sfx.sparkle();
      await this.ctx.say('bath.cleanpart', { part: cleanPhrase(done) });
      await this.askForPart();
    } else if (this.partClean(m.part)) {
      // Named as it goes clean; the next first-touch name waits a moment so this one is heard.
      this.namer.spoke(this.clock);
      void this.ctx.say('bath.cleanpart', { part: PHRASES[m.part].word });
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
  entryLevels: [9],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.mode === 'pat') return 'Pat anywhere: each touch washes a bit of mud off, nothing to aim';
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
