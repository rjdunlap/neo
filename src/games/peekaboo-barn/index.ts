import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { RAINBOW, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx, type AnimalSound } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease, type Tweener } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { STICKER_ANIMALS, COVER_NAMES, roundScene, type SceneId, nearestSpot, shouldNudge, deal, newcomer, pickTarget, planFor, spotToTap, type Animal, type PeekPlan, type CoverKind } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const VOICES: Record<Animal, { sound: AnimalSound; word: string }> = {
  cow: { sound: 'moo', word: 'Moo' },
  duck: { sound: 'quack', word: 'Quack quack' },
  pig: { sound: 'oink', word: 'Oink oink' },
  cat: { sound: 'meow', word: 'Meow' },
  dog: { sound: 'woof', word: 'Woof woof' },
  bunny: { sound: 'hop', word: 'Hop hop' },
  bear: { sound: 'growl', word: 'Grrr' },
};

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 5 },
  preschool: { min: 4, max: 8 },
  prek: { min: 6, max: 8 },
};

const GRASS = 0x9edb86;
const SAND = 0xf3dba0;
const BEACH: readonly CoverKind[] = ['umbrella', 'sandcastle', 'bucket', 'towel'];
const RUG = 0xf3c9b0;
const BEDROOM: readonly CoverKind[] = ['blanket', 'toybox', 'curtain', 'bed'];
const CRITTER_SCALE = 0.55;
/** Where a critter's feet sit, relative to the bottom of its cover. The cover's top is at -150. */
const POSE = { hidden: 90, peek: -82, out: -145 };
type Pose = keyof typeof POSE;

const line = (color: number, width = 6) => ({ width, color, join: 'round' as const, cap: 'round' as const });

const ground = (kind: CoverKind) => (BEACH.includes(kind) ? SAND : BEDROOM.includes(kind) ? RUG : GRASS);

/** Something to hide behind, about 230 wide and 150 tall, standing on (0, 0). */
function drawCover(kind: CoverKind, grass = true): Graphics {
  const g = new Graphics();
  switch (kind) {
    case 'hay':
      g.moveTo(-118, 0).bezierCurveTo(-118, -120, -60, -152, 0, -152).bezierCurveTo(60, -152, 118, -120, 118, 0).closePath();
      g.fill(0xf2c94c).stroke(line(0xc99a2e));
      for (const [x, y] of [[-70, -40], [-30, -90], [20, -60], [60, -100], [80, -36], [-10, -124]]) {
        g.moveTo(x, y).lineTo(x + 18, y - 10).stroke(line(0xc99a2e, 4));
      }
      break;
    case 'bush':
      puffs(g, [[-70, -58, 58], [0, -86, 66], [70, -58, 58], [-92, -26, 36], [92, -26, 36], [0, -40, 60]], 0x7cc463, 0x4e9e3a);
      for (const [x, y] of [[-60, -80], [30, -110], [74, -50], [-20, -40]]) g.circle(x, y, 8).fill(swatch.red.fill);
      break;
    case 'crate':
      g.roundRect(-110, -150, 220, 150, 10).fill(wood.fill).stroke(line(wood.line));
      g.moveTo(-100, -100).lineTo(100, -100).moveTo(-100, -50).lineTo(100, -50).stroke(line(wood.line, 4));
      g.moveTo(-96, -140).lineTo(96, -10).stroke(line(wood.line, 5));
      break;
    case 'flowerpot':
      g.poly([-100, -140, 100, -140, 72, 0, -72, 0]).fill(swatch.orange.fill).stroke(line(swatch.orange.line));
      g.roundRect(-116, -150, 232, 30, 8).fill(swatch.orange.light).stroke(line(swatch.orange.line));
      g.circle(0, -65, 23).fill(swatch.yellow.fill);
      break;
    case 'sunflower':
      g.roundRect(-105, -150, 210, 150, 16).fill(swatch.green.fill).stroke(line(swatch.green.line));
      for (const x of [-65, 0, 65]) {
        g.moveTo(x, -10).lineTo(x, -98).stroke(line(swatch.green.line, 8));
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          g.circle(x + Math.cos(a) * 22, -110 + Math.sin(a) * 22, 14).fill(swatch.yellow.fill);
        }
        g.circle(x, -110, 18).fill(swatch.brown.fill).stroke(line(swatch.brown.line, 3));
      }
      break;
    case 'wheelbarrow':
      g.circle(-62, -10, 30).fill(swatch.brown.line).stroke(line(wood.line));
      g.circle(-62, -10, 12).fill(swatch.white.light);
      g.moveTo(56, -70).lineTo(92, 0).moveTo(65, -115).lineTo(125, -125).stroke(line(wood.line, 12));
      g.poly([-115, -150, 100, -150, 68, -42, -74, -42]).fill(swatch.teal.fill).stroke(line(swatch.teal.line));
      break;
    case 'rock':
      g.poly([-116, 0, -110, -95, -62, -145, 48, -150, 106, -105, 120, 0]).fill(swatch.white.line).stroke(line(swatch.brown.line));
      g.poly([-110, -95, -62, -145, 48, -150, 10, -94]).fill(swatch.white.light);
      g.moveTo(10, -94).lineTo(48, -34).lineTo(106, -105).stroke(line(swatch.brown.line, 4));
      break;
    case 'blanket':
      g.roundRect(-112, -150, 224, 150, 20).fill(swatch.purple.fill).stroke(line(swatch.purple.line));
      for (const [x, y] of [[-70, -105], [0, -60], [70, -105], [-60, -35], [60, -35], [0, -125]]) g.circle(x, y, 11).fill(swatch.purple.light);
      g.roundRect(-112, -150, 224, 28, 14).fill(swatch.white.light).stroke(line(swatch.purple.line, 4));
      break;
    case 'toybox':
      g.roundRect(-108, -140, 216, 140, 8).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.roundRect(-116, -150, 232, 30, 8).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line));
      g.circle(-50, -70, 20).fill(swatch.red.fill);
      g.rect(10, -92, 36, 36).fill(swatch.green.fill);
      g.poly([-12, -40, 12, -40, 0, -18]).fill(swatch.yellow.light);
      break;
    case 'curtain':
      g.roundRect(-118, -150, 236, 150, 6).fill(swatch.teal.light).stroke(line(swatch.teal.line));
      g.moveTo(-118, -142).bezierCurveTo(-60, -110, -40, -50, -34, 0).lineTo(-118, 0).closePath().fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
      g.moveTo(118, -142).bezierCurveTo(60, -110, 40, -50, 34, 0).lineTo(118, 0).closePath().fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
      g.moveTo(-120, -150).lineTo(120, -150).stroke(line(wood.line, 8));
      break;
    case 'bed':
      g.roundRect(-116, -150, 232, 150, 12).fill(wood.fill).stroke(line(wood.line));
      g.roundRect(-100, -104, 200, 98, 10).fill(swatch.pink.light).stroke(line(swatch.pink.line, 4));
      g.roundRect(-92, -128, 80, 40, 16).fill(swatch.white.light).stroke(line(swatch.white.line, 4));
      g.roundRect(-100, -70, 200, 64, 10).fill(swatch.pink.fill);
      break;
    case 'umbrella':
      g.moveTo(0, 0).lineTo(0, -140).stroke(line(wood.line, 10));
      g.moveTo(-118, -70).bezierCurveTo(-118, -170, 118, -170, 118, -70).closePath().fill(swatch.red.fill).stroke(line(swatch.red.line));
      g.moveTo(-40, -148).bezierCurveTo(-60, -120, -62, -92, -50, -72).lineTo(-8, -72).bezierCurveTo(-8, -100, -8, -126, -8, -158)
        .closePath().fill(swatch.white.light);
      g.moveTo(40, -148).bezierCurveTo(60, -120, 62, -92, 50, -72).lineTo(8, -72).bezierCurveTo(8, -100, 8, -126, 8, -158)
        .closePath().fill(swatch.white.light);
      break;
    case 'sandcastle':
      g.roundRect(-110, -70, 220, 70, 8).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      for (const x of [-80, 80]) {
        g.roundRect(x - 30, -130, 60, 130, 6).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
        for (const d of [-20, 0, 20]) g.rect(x + d - 6, -146, 12, 16).fill(swatch.yellow.light).stroke(line(swatch.yellow.line, 3));
      }
      g.roundRect(-30, -150, 60, 150, 6).fill(swatch.yellow.light).stroke(line(swatch.yellow.line));
      g.poly([-38, -148, 0, -190, 38, -148]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      g.roundRect(-14, -50, 28, 50, 14).fill(swatch.yellow.line);
      break;
    case 'bucket':
      g.moveTo(-70, -150).bezierCurveTo(-40, -250, 40, -250, 70, -150).stroke(line(swatch.white.line, 7));
      g.poly([-100, -140, 100, -140, 72, 0, -72, 0]).fill(swatch.blue.fill).stroke(line(swatch.blue.line));
      g.roundRect(-108, -150, 216, 24, 8).fill(swatch.blue.light).stroke(line(swatch.blue.line));
      g.circle(0, -66, 20).fill(swatch.yellow.fill);
      break;
    case 'towel':
      g.roundRect(-112, -150, 224, 150, 10).fill(swatch.pink.fill).stroke(line(swatch.pink.line));
      for (const x of [-72, -24, 24, 72]) g.rect(x - 11, -150, 22, 150).fill(swatch.white.light);
      for (const x of [-100, -80, 80, 100]) g.moveTo(x, 0).lineTo(x, 12).stroke(line(swatch.pink.line, 4));
      break;
    case 'door':
      g.roundRect(-110, -150, 220, 150, 8).fill(0xd9534f).stroke(line(0x9e2f2c));
      g.roundRect(-96, -136, 192, 122, 6).stroke(line(0xffffff, 6));
      g.moveTo(-96, -136).lineTo(96, -14).moveTo(96, -136).lineTo(-96, -14).stroke(line(0xffffff, 6));
      break;
  }
  // A strip of grass in front hides anything tucked down below.
  return grass ? g.roundRect(-130, -6, 260, 120, 20).fill(ground(kind)) : g;
}

/** A hiding place: an animal tucked behind a cover, which can peek over the top or pop all the way out. */
class Spot extends Container {
  animal: Animal = 'cow';
  pose: Pose = 'hidden';
  hint = false;
  private critter: Critter | null = null;
  private readonly holder = new Container();
  private readonly cover = new Container();
  private readonly panels: Graphics[] = [];
  private readonly leaf = new Graphics().ellipse(0, 0, 11, 5).fill(swatch.green.fill);
  private readonly opening = { amount: 0 };
  private shake = 0;
  private clock = Math.random() * 3;

  constructor(
    readonly kind: CoverKind,
    private readonly tw: Tweener,
  ) {
    super();
    // The foreground grass stays still so a closed place never exposes its tucked-away friend.
    if (kind === 'door' || kind === 'hay') {
      for (const side of [-1, 1]) {
        const panel = new Graphics();
        if (kind === 'door') {
          panel.roundRect(side < 0 ? 0 : -110, -150, 110, 150, 5).fill(0xd9534f).stroke(line(0x9e2f2c));
          panel.moveTo(side < 0 ? 8 : -102, -140).lineTo(side < 0 ? 102 : -8, -10).stroke(line(0xffffff, 5));
          panel.moveTo(side < 0 ? 102 : -8, -140).lineTo(side < 0 ? 8 : -102, -10).stroke(line(0xffffff, 5));
        } else {
          panel.moveTo(0, 0).lineTo(0, -150).bezierCurveTo(side * 80, -150, side * 118, -100, side * 118, 0).closePath().fill(0xf2c94c).stroke(line(0xc99a2e));
          for (const y of [-35, -75, -115]) panel.moveTo(side * 20, y).lineTo(side * 65, y - 10).stroke(line(0xc99a2e, 4));
        }
        if (kind === 'door') panel.x = side * 110;
        this.panels.push(panel);
        this.cover.addChild(panel);
      }
    } else {
      this.cover.addChild(drawCover(kind, false));
      if (kind === 'crate') {
        const lid = new Graphics().roundRect(-116, -160, 232, 20, 5).fill(wood.fill).stroke(line(wood.line));
        this.panels.push(lid);
        this.cover.addChild(lid);
      }
    }
    this.leaf.visible = false;
    this.addChild(this.holder, this.cover, this.leaf, new Graphics().roundRect(-130, -6, 260, 120, 20).fill(ground(kind)));
    this.eventMode = 'none';
    this.hitArea = new Rectangle(-130, -340, 260, 350);
  }

  /** Puts a new animal behind the cover (it starts hidden). */
  setAnimal(animal: Animal) {
    if (this.critter) this.tw.kill(this.critter);
    this.critter?.destroy({ children: true });
    this.animal = animal;
    this.critter = new Critter(CRITTERS[animal]);
    this.critter.scale.set(CRITTER_SCALE);
    this.critter.y = POSE.hidden;
    this.pose = 'hidden';
    this.tw.kill(this.opening);
    this.opening.amount = 0;
    this.holder.addChild(this.critter);
  }

  async go(pose: Pose) {
    const c = this.critter;
    if (!c) return;
    const opens = pose === 'out' && this.pose !== 'out';
    this.pose = pose;
    this.tw.kill(this.opening);
    void this.tw.to(this.opening, { amount: pose === 'out' ? 1 : 0 }, { duration: 0.35, ease: ease.outCubic });
    if (opens) {
      if (this.kind === 'door') sfx.marimba(0, 0.08);
      else if (this.kind === 'crate') sfx.marimba(2, 0.08);
      else sfx.whoosh();
    }
    this.tw.kill(c);
    if (pose === 'out') {
      c.poke();
      await this.tw.to(c, { y: POSE.out }, { duration: 0.35, ease: ease.outBack });
      if (!c.destroyed && this.critter === c) c.cheer();
    } else {
      await this.tw.to(c, { y: POSE[pose] }, { duration: pose === 'hidden' ? 0.3 : 0.45, ease: pose === 'hidden' ? ease.inQuad : ease.outCubic });
    }
  }

  wiggle() {
    this.shake = 1;
  }

  update(dt: number) {
    this.clock += dt;
    this.critter?.update(dt);
    if (this.hint && this.shake <= 0 && Math.sin(this.clock * 2.5) > 0.98) this.shake = 1;
    this.shake = Math.max(0, this.shake - dt * 2);
    const open = this.opening.amount;
    this.cover.rotation = 0.06 * Math.sin(this.shake * 25) * this.shake;
    if (this.kind === 'door') this.panels.forEach((p) => p.scale.x = 1 - open * 0.88);
    if (this.kind === 'hay') this.panels.forEach((p, i) => { p.x = (i ? 1 : -1) * open * 34; p.rotation = (i ? 1 : -1) * open * 0.16; });
    if (this.kind === 'crate') { this.panels[0].y = -open * 38; this.panels[0].rotation = open * -0.12; }
    if (this.kind === 'bush') {
      this.cover.rotation += Math.sin(open * Math.PI * 5) * open * 0.08;
      this.leaf.visible = open > 0;
      this.leaf.position.set(85 + open * 30, -90 + open * 60);
      this.leaf.rotation = open * 2;
      this.leaf.alpha = Math.sin(open * Math.PI);
    }
  }
}

class PeekabooBarn implements Game {
  private readonly plan: PeekPlan;
  private readonly setting: SceneId;
  private readonly backdrop: Backdrop;
  private readonly barn = new Graphics();
  private readonly spots: Spot[];
  private view: View;
  private done = 0;
  private misses = 0;
  private hints = 0;
  private missesThisQuestion = 0;
  private target: Animal | null = null;
  private busy = true;
  private finished = false;
  /** The place the ghost finger tapped last, so free play visits them all. */
  private lastTouched = -1;
  private idle = 0;
  private nudgeCount = 0;
  private readonly input = new Container();

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.view = ctx.view;
    const scene = roundScene(ctx.rng, this.plan.spots);
    this.setting = scene.id;
    this.backdrop = ctx.track(
      new Backdrop(this.setting === 'bedroom'
        ? { sky: [swatch.purple.light, swatch.pink.light], hills: [swatch.pink.light, RUG], horizon: 0.5, clouds: 0, sun: false, seed: 84 }
        : this.setting === 'beach'
        ? { sky: [swatch.blue.light, swatch.white.light], hills: [swatch.blue.fill, SAND], horizon: 0.5, clouds: 2, sun: true, seed: 63 }
        : this.setting === 'garden'
        ? { sky: [swatch.blue.light, swatch.white.light], hills: [swatch.green.light, GRASS], horizon: 0.56, clouds: 2, sun: true, seed: 42 }
        : { sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, GRASS], horizon: 0.56, clouds: 3, sun: true, seed: 21 }, ctx.view),
    );
    const covers = scene.covers;
    this.spots = covers.map((kind) => {
      const s = ctx.track(new Spot(kind, ctx.tw));
      return s;
    });
    this.backdrop.eventMode = this.barn.eventMode = 'none';
    onTap(this.input, (e) => {
      const p = ctx.stage.toLocal(e.global);
      const i = nearestSpot(p.x, p.y, this.spots.map((s) => ({ x: s.x, y: s.y, scale: s.scale.x })));
      if (i !== null) void this.tapped(this.spots[i]);
    }, { cooldown: 250 });
    ctx.stage.addChild(this.backdrop, this.barn, ...this.spots, this.input);
  }

  start() {
    if (this.plan.mode === 'free') {
      this.dealAnimals();
      this.busy = false;
      void this.ctx.instruct('peek.free');
    } else {
      void this.question();
    }
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    const cx = v.w / 2;
    const scale = this.plan.spots === 4 ? 0.82 : 1;
    const left = 150 + 130 * scale;
    const right = v.w - 30 - 130 * scale;
    this.spots.forEach((s, i) => {
      s.scale.set(scale);
      s.position.set(left + i * (right - left) / (this.spots.length - 1), v.h - 40);
    });
    this.input.hitArea = new Rectangle(150, v.h - 40 - 340 * scale, v.w - 180, 350 * scale);
    this.drawBarn(cx, this.backdrop.groundY + 30);
  }

  update(dt: number) {
    if (this.finished) return;
    this.idle += dt;
    if (shouldNudge(this.plan.mode, this.idle, this.spots.map((s) => s.pose), this.busy)) {
      this.spots[this.nudgeCount++ % this.spots.length].wiggle();
      sfx.marimba(0, 0.08);
      this.idle = 0;
    }
  }

  /** The ghost finger on the how-to card: tap the place that hides who was asked for, or in free play each place in turn. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const i = spotToTap(this.plan, this.spots.map((s) => s.pose), this.spots.map((s) => s.animal), this.target, this.lastTouched);
    if (i === null) return null;
    this.lastTouched = i;
    // The cover is what a child touches; the animal's head peeks over it.
    const spot = this.spots[i];
    return { tap: { on: this.input, x: spot.x, y: spot.y - 110 * spot.scale.x } };
  }

  destroy() {
    this.finished = true;
    this.input.removeAllListeners();
  }

  /** Different animals in each spot. */
  private dealAnimals() {
    const picks = deal(this.ctx.rng, this.spots.length);
    this.spots.forEach((s, i) => s.setAnimal(picks[i]));
  }

  private say(animal: Animal) {
    sfx.animal(VOICES[animal].sound);
  }

  private async tapped(spot: Spot) {
    if (this.busy || this.finished) return;
    this.idle = 0;
    spot.wiggle();
    if (this.plan.mode === 'free') return this.freeTap(spot);
    if (spot.pose === 'out') return;

    if (spot.animal === this.target) {
      this.busy = true;
      this.spots.forEach((s) => (s.hint = false));
      void spot.go('out');
      this.say(spot.animal);
      this.ctx.pet.cheer();
      this.done++;
      await this.ctx.say('peek.yes', { animal: spot.animal, cover: COVER_NAMES[spot.kind] });
      await this.ctx.tw.wait(0.6);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
      await this.ctx.tw.wait(0.3);
      if (this.done >= this.plan.goal) void this.finale();
      else void this.question();
      return;
    }

    // Not that one: it says hello anyway, then hides again.
    this.busy = true;
    sfx.boing();
    this.misses++;
    this.missesThisQuestion++;
    const back: Pose = this.plan.mode === 'find' ? 'peek' : 'hidden';
    void spot.go('out');
    this.say(spot.animal);
    await this.ctx.say('peek.notit', { other: spot.animal, animal: this.target! });
    await spot.go(back);
    if (this.missesThisQuestion === 2) {
      this.hints++;
      const right = this.spots.find((s) => s.animal === this.target);
      if (right) {
        right.hint = true;
        right.wiggle();
      }
    }
    this.busy = false;
  }

  private async freeTap(spot: Spot) {
    if (spot.pose === 'out') {
      this.say(spot.animal);
      return;
    }
    const animal = spot.animal;
    void spot.go('out');
    this.say(animal);
    void this.ctx.say('peek.found', { word: VOICES[animal].word, animal, cover: COVER_NAMES[spot.kind] });
    this.done++;
    if (this.done % 4 === 0) this.ctx.pet.cheer();
    if (this.done >= this.plan.goal) {
      this.busy = true;
      await this.ctx.tw.wait(1.4);
      void this.finale();
      return;
    }
    await this.ctx.tw.wait(2.4);
    if (this.finished) return;
    await spot.go('hidden');
    // Someone new sneaks in, never the same as a neighbour.
    const taken = this.spots.map((s) => s.animal);
    spot.setAnimal(newcomer(this.ctx.rng, taken));
  }

  private async question() {
    this.busy = true;
    this.missesThisQuestion = 0;
    this.dealAnimals();
    const present = this.spots.map((s) => s.animal);
    this.target = pickTarget(this.ctx.rng, present, this.target);
    if (this.plan.mode === 'find') {
      // Everyone peeks over the top, so there's something to look at.
      for (const s of this.spots) {
        void s.go('peek');
        await this.ctx.tw.wait(0.15);
      }
    } else {
      // Show and tell, then everyone hides.
      void this.ctx.say('peek.look');
      for (const s of this.spots) {
        void s.go('out');
        this.say(s.animal);
        await this.ctx.tw.wait(0.7);
      }
      await this.ctx.tw.wait(1.4);
      await Promise.all(this.spots.map((s) => s.go('hidden')));
    }
    await this.ctx.tw.wait(0.3);
    await this.ctx.instruct('peek.where', { animal: this.target });
    this.busy = false;
  }

  /** Everybody out for a bow. */
  private async finale() {
    this.finished = true;
    this.dealAnimals();
    for (const s of this.spots) {
      void s.go('out');
      this.say(s.animal);
      await this.ctx.tw.wait(0.3);
    }
    this.ctx.pet.cheer();
    const colors = RAINBOW.map((c) => swatch[c].fill);
    this.ctx.particles.burst(this.view.w / 2, this.view.h * 0.3, { kind: 'confetti', colors, count: 60, speed: [200, 600], gravity: 600, life: [1.2, 2] });
    sfx.tada();
    await this.ctx.tw.wait(1.8);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  private drawBarn(cx: number, y: number) {
    if (this.setting === 'bedroom') {
      const g = this.barn.clear();
      g.roundRect(cx - 120, y - 270, 240, 170, 12).fill(swatch.blue.light).stroke(line(wood.line, 8));
      g.moveTo(cx, y - 270).lineTo(cx, y - 100).moveTo(cx - 120, y - 185).lineTo(cx + 120, y - 185).stroke(line(wood.line, 5));
      g.star(cx + 60, y - 225, 5, 16, 7).fill(swatch.yellow.fill);
      g.circle(cx - 60, y - 225, 18).fill(swatch.white.light);
      return;
    }
    if (this.setting === 'beach') {
      const g = this.barn.clear();
      g.poly([cx + 40, y - 140, cx + 40, y - 270, cx + 150, y - 140]).fill(swatch.white.light).stroke(line(swatch.white.line, 4));
      g.poly([cx + 30, y - 140, cx + 30, y - 240, cx - 60, y - 140]).fill(swatch.red.fill).stroke(line(swatch.red.line, 4));
      g.roundRect(cx - 80, y - 140, 250, 22, 10).fill(wood.fill).stroke(line(wood.line, 4));
      return;
    }
    if (this.setting === 'garden') {
      const g = this.barn.clear();
      for (let x = cx - 240; x <= cx + 240; x += 48) {
        g.poly([x - 14, y, x - 14, y - 115, x, y - 135, x + 14, y - 115, x + 14, y]).fill(wood.light).stroke(line(wood.line, 3));
      }
      g.rect(cx - 260, y - 88, 520, 16).rect(cx - 260, y - 38, 520, 16).fill(wood.fill);
      for (const x of [cx - 190, cx + 190]) {
        g.moveTo(x, y).lineTo(x, y - 150).stroke(line(swatch.green.line, 8));
        for (let i = 0; i < 6; i++) {
          const a = i * Math.PI / 3;
          g.circle(x + Math.cos(a) * 22, y - 155 + Math.sin(a) * 22, 15).fill(swatch.pink.fill);
        }
        g.circle(x, y - 155, 15).fill(swatch.yellow.fill);
      }
      return;
    }
    const red = 0xd9534f;
    const dark = 0x9e2f2c;
    this.barn
      .clear()
      .poly([cx - 170, y - 170, cx, y - 290, cx + 170, y - 170])
      .fill(dark)
      .stroke(line(0x7a2422))
      .rect(cx - 150, y - 175, 300, 175)
      .fill(red)
      .stroke(line(dark))
      .roundRect(cx - 60, y - 120, 120, 120, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 6))
      .circle(cx, y - 220, 24)
      .fill(0xfff1c1)
      .stroke(line(0xffffff, 6));
  }
}

/** The hub's barn, with someone popping up from behind the haystack now and then. */
class BarnIcon extends Container {
  private readonly peeker = new Container();
  private critter: Critter;
  private clock = 0;
  private next = 1.5;
  private turn = 0;

  constructor() {
    super();
    const red = 0xd9534f;
    const barn = new Graphics()
      .poly([-130, -150, -40, -230, 50, -150])
      .fill(0x9e2f2c)
      .stroke(line(0x7a2422))
      .rect(-118, -155, 156, 155)
      .fill(red)
      .stroke(line(0x9e2f2c))
      .roundRect(-78, -100, 76, 100, 6)
      .fill(0x6b2b2a)
      .stroke(line(0xffffff, 5));
    this.critter = new Critter(CRITTERS.cow);
    this.critter.scale.set(0.34);
    this.peeker.addChild(this.critter);
    this.peeker.position.set(78, 60);
    const hay = new Graphics()
      .moveTo(10, 0)
      .bezierCurveTo(10, -70, 40, -92, 78, -92)
      .bezierCurveTo(116, -92, 146, -70, 146, 0)
      .closePath()
      .fill(0xf2c94c)
      .stroke(line(0xc99a2e, 5))
      .roundRect(0, -4, 160, 76, 10)
      .fill(GRASS);
    this.addChild(barn, this.peeker, hay);
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    this.next -= dt;
    if (this.next <= 0) {
      this.next = 3;
      this.turn++;
      const who = STICKER_ANIMALS[this.turn % STICKER_ANIMALS.length];
      this.critter.destroy({ children: true });
      this.critter = new Critter(CRITTERS[who]);
      this.critter.scale.set(0.34);
      this.peeker.addChild(this.critter);
      this.critter.cheer();
    }
    // Up for a second and a half, then down again.
    const t = 3 - this.next;
    const up = t < 0.3 ? t / 0.3 : t < 1.8 ? 1 : t < 2.1 ? 1 - (t - 1.8) / 0.3 : 0;
    this.peeker.y = 60 - up * 140;
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const who = new Critter(CRITTERS[rng.pick(STICKER_ANIMALS)]);
  who.alive = false;
  who.scale.set(CRITTER_SCALE);
  who.y = POSE.peek;
  c.addChild(who, drawCover(rng.pick(['hay', 'bush', 'door'] as CoverKind[]), false));
  return c;
}

export const peekabooBarn: GameModule = {
  id: 'peekaboo-barn',
  name: 'Peekaboo Barn',
  titleLine: 'game.peekaboo-barn',
  region: 'barnyard',
  skills: ['object-permanence', 'animal-words', 'memory'],
  bands: ['lap', 'toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => {
    const p = planFor(level);
    if (p.mode === 'free') return `Tap to find who's hiding, ${p.spots} hiding places`;
    if (p.mode === 'find') return `"Where's the cow?" with ${p.spots} animals peeking`;
    return `Remember who hid where, ${p.spots} hiding places`;
  },
  music: STYLES.hub,
  coplayHint: 'Make the animal sounds together: "Moo!" Then say its name.',
  offScreen: 'Play peekaboo with stuffed animals under a blanket. Ask "Where did the cow go?"',
  touchDemo: true,
  hubIcon: () => new BarnIcon(),
  sticker,
  create: (ctx) => new PeekabooBarn(ctx),
};
