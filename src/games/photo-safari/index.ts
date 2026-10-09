import { Circle, Container, Graphics, Sprite } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { animalToTap, describe, makeScene, planFor, request, type SafariPlan, type Scene, type Sighting, type Spot } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  toddler: { min: 1, max: 2 },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 6 },
};

const SCALE = 0.5;
const SPOT_X: Record<Spot, number> = { tree: 0.24, bush: 0.45, rock: 0.66, pond: 0.86 };

/** One animal on the safari, doing its thing. */
class Actor extends Container {
  readonly critter: Critter;
  readonly glow = new Graphics();
  private readonly extra = new Container();
  private clock = Math.random() * 6;
  private next = 0.4;

  constructor(readonly sighting: Sighting) {
    super();
    this.critter = new Critter(CRITTERS[sighting.animal]);
    this.critter.scale.set(SCALE);
    this.glow.ellipse(0, -60, 90, 100).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.addChild(this.glow, this.critter, this.extra);
    this.hitArea = new Circle(0, -60, 95);
    if (sighting.action === 'sleeping') this.critter.setMood('sleepy');
    if (sighting.action === 'eating') {
      const apple = prop('apple', 'red');
      apple.scale.set(0.42);
      apple.position.set(40, -50);
      this.extra.addChild(apple);
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    if (this.glow.visible) this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    switch (this.sighting.action) {
      case 'jumping':
        this.next -= dt;
        if (this.next <= 0) {
          this.critter.hop(0.75);
          this.next = 0.85;
        }
        break;
      case 'dancing':
        this.critter.rotation = 0.22 * Math.sin(this.clock * 6);
        this.critter.x = 10 * Math.sin(this.clock * 3);
        break;
      case 'eating': {
        // Nibble, nibble: the apple bobs to the mouth.
        const a = this.extra.children[0];
        if (a) a.y = -50 - 10 * Math.max(0, Math.sin(this.clock * 5));
        break;
      }
      case 'sleeping':
        // Little z's drift up and fade.
        this.next -= dt;
        if (this.next <= 0) {
          this.next = 1.2;
          const z = label('z', 30, 0x6b6b8a);
          z.position.set(30, -130);
          this.extra.addChild(z);
        }
        for (const z of [...this.extra.children]) {
          z.y -= 36 * dt;
          z.x += 18 * dt;
          z.alpha -= dt / 1.5;
          if (z.alpha <= 0) z.destroy();
        }
        break;
    }
  }
}

class PhotoSafari implements Game {
  readonly plan: SafariPlan;
  scene: Scene | null = null;
  actors: Actor[] = [];
  photos = 0;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  private readonly backs = new Container();
  private readonly cast = new Container();
  private readonly fronts = new Container();
  private readonly album = new Container();
  private readonly flash = new Graphics();
  private view: View;
  private wrongs = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xa6de8e, 0x9edb86], horizon: 0.45, clouds: 3, sun: true, seed: 64 }, ctx.view);
    this.flash.alpha = 0;
    // Scenery in front of the animals (the bush, the pond's edge, the flash) must not catch taps.
    for (const layer of [this.backs, this.fronts, this.album, this.flash]) layer.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.backs, this.cast, this.fronts, this.album, this.flash);
  }

  get target(): Actor | undefined {
    return this.scene && this.scene.target >= 0 ? this.actors[this.scene.target] : undefined;
  }

  start() {
    void this.nextScene();
  }

  /** The ghost finger on the how-to card: photograph the animal that was asked for, or each animal in turn. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.scene) return null;
    const animal = this.actors[animalToTap(this.scene, this.photos)];
    return animal && !animal.destroyed ? { tap: { on: animal, y: -60 } } : null;
  }

  private ground() {
    return this.view.h * 0.78;
  }

  private spotPos(spot: Spot) {
    const y = this.ground();
    return { x: this.view.w * SPOT_X[spot], y: spot === 'rock' ? y - 56 : spot === 'pond' ? y + 26 : y };
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.flash.clear().rect(0, 0, v.w, v.h).fill(0xffffff);
    this.drawSpots();
    for (const a of this.actors) a.position.copyFrom(this.spotPos(a.sighting.spot));
    this.album.position.set(180, 24);
  }

  /** The four places: a tree to stand under, a bush to hide behind, a rock, and a pond. */
  private drawSpots() {
    this.backs.removeChildren().forEach((c) => c.destroy());
    this.fronts.removeChildren().forEach((c) => c.destroy());
    const y = this.ground();
    const at = (s: Spot) => this.view.w * SPOT_X[s];
    const back = new Graphics();
    // Tree: trunk and canopy, high enough to stand under.
    back.roundRect(at('tree') - 70, y - 250, 36, 250, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
    puffs(back, [[at('tree') - 90, y - 270, 70], [at('tree') - 20, y - 300, 80], [at('tree') + 60, y - 265, 66]], swatch.green.fill, swatch.green.line, 6);
    // Rock.
    back.moveTo(at('rock') - 90, y + 4).bezierCurveTo(at('rock') - 90, y - 90, at('rock') + 90, y - 90, at('rock') + 90, y + 4).closePath().fill(0xb9b2a6).stroke({ width: 5, color: 0x8c857a });
    // Pond, back half.
    back.ellipse(at('pond'), y + 20, 110, 34).fill(0x7cc4f2).stroke({ width: 5, color: 0x5aa9e0 });
    this.backs.addChild(back);
    const front = new Graphics();
    // Low enough that a face still peeks over the top.
    puffs(front, [[at('bush') - 62, y + 2, 38], [at('bush'), y - 12, 43], [at('bush') + 62, y + 2, 38]], 0x7cc463, 0x4a9a35, 6);
    // The pond's near edge covers a swimmer's legs.
    front.moveTo(at('pond') - 110, y + 20).bezierCurveTo(at('pond') - 110, y + 70, at('pond') + 110, y + 70, at('pond') + 110, y + 20).closePath().fill(0x7cc4f2).stroke({ width: 5, color: 0x5aa9e0 });
    this.fronts.addChild(front);
  }

  update(dt: number) {
    for (const a of this.actors) a.update(dt);
  }

  destroy() {}

  private async nextScene() {
    this.busy = true;
    this.wrongs = 0;
    for (const a of this.actors) a.destroy({ children: true });
    this.actors = [];
    if (this.photos >= this.plan.photos) return void this.finale();
    this.scene = makeScene(this.plan, this.ctx.rng);
    this.actors = this.scene.sightings.map((s) => {
      const a = new Actor(s);
      a.position.copyFrom(this.spotPos(s.spot));
      onTap(a, () => void this.snap(a), { cooldown: 500 });
      this.cast.addChild(a);
      a.scale.set(0);
      void this.ctx.tw.to(a.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      return a;
    });
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    const t = this.target;
    if (this.plan.mode === 'snap') {
      if (this.photos === 0) await this.ctx.instruct('safari.snap');
    } else if (t) {
      await this.ctx.instruct('safari.ask', { what: request(this.plan.mode, this.scene!) });
    }
  }

  private async snap(a: Actor) {
    if (this.busy || this.finished) return;
    const t = this.target;
    const right = this.plan.mode === 'snap' || a === t;
    // Click! Every tap takes a picture; only the asked-for one goes in the album.
    sfx.tick();
    sfx.whoosh();
    this.flash.alpha = 0.75;
    void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 0.35 });
    if (!right) {
      this.misses++;
      this.wrongs++;
      sfx.boing();
      void this.ctx.say('safari.thatis', { desc: describe(this.plan.mode, a.sighting) });
      if (this.wrongs >= 2 && t && !t.glow.visible) {
        t.glow.visible = true;
        this.hints++;
        this.wrongs = 0;
      }
      return;
    }
    this.busy = true;
    a.glow.visible = false;
    await this.polaroid(a);
    this.photos++;
    await this.ctx.say('safari.click');
    if (this.plan.mode !== 'snap') await this.ctx.say('praise');
    await this.nextScene();
  }

  /** A photo of the animal flies up into the album strip. */
  private async polaroid(a: Actor) {
    const tex = this.ctx.renderer.generateTexture({ target: a.critter, resolution: 1 });
    const card = new Container();
    const frame = new Graphics().roundRect(-80, -90, 160, 190, 8).fill(0xffffff).stroke({ width: 4, color: 0xd6dde4 });
    const bg = new Graphics().rect(-66, -76, 132, 132).fill(0xbfe6fb);
    const pic = new Sprite(tex);
    pic.anchor.set(0.5);
    const fit = Math.min(120 / pic.width, 120 / pic.height);
    pic.scale.set(fit);
    pic.y = -10;
    card.addChild(frame, bg, pic);
    const start = this.album.toLocal(a.getGlobalPosition());
    card.position.set(start.x, start.y - 60);
    this.album.addChild(card);
    const slot = this.photos;
    await Promise.all([
      this.ctx.tw.to(card, { x: slot * 74, y: 46, rotation: (slot % 2 ? 1 : -1) * 0.08 }, { duration: 0.6, ease: ease.inOutSine }),
      this.ctx.tw.to(card.scale, { x: 0.38, y: 0.38 }, { duration: 0.6, ease: ease.inOutSine }),
    ]);
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    // The album opens up big so everyone can look at the photos together.
    const v = this.view;
    const cards = [...this.album.children];
    const panel = new Graphics().roundRect(v.w / 2 - 320, v.h * 0.32 - 130, 640, Math.ceil(cards.length / 3) * 220 + 60, 30).fill({ color: 0xffffff, alpha: 0.75 });
    panel.alpha = 0;
    this.ctx.stage.addChildAt(panel, this.ctx.stage.getChildIndex(this.album));
    void this.ctx.tw.to(panel, { alpha: 1 }, { duration: 0.4 });
    const cols = 3;
    await Promise.all(
      cards.map((c, i) => {
        const g = this.album.toLocal({ x: v.w / 2 + ((i % cols) - 1) * 190, y: v.h * 0.32 + Math.floor(i / cols) * 220 });
        return Promise.all([this.ctx.tw.to(c, { x: g.x, y: g.y }, { duration: 0.6, ease: ease.outBack }), this.ctx.tw.to(c.scale, { x: 0.9, y: 0.9 }, { duration: 0.6 })]);
      }),
    );
    sfx.tada();
    await this.ctx.say('safari.done');
    await this.ctx.tw.wait(1.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }
}

class SafariIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    const cam = new Graphics().roundRect(-80, -150, 160, 110, 18).fill(0x5a5a6e).stroke({ width: 5, color: 0x2b2b3a });
    cam.roundRect(-40, -170, 50, 26, 6).fill(0x5a5a6e);
    cam.circle(0, -95, 38).fill(0x2b2b3a).circle(0, -95, 26).fill(0x7cc4f2).circle(-8, -103, 8).fill({ color: 0xffffff, alpha: 0.7 });
    c.addChild(cam);
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const frame = new Graphics().roundRect(-90, -100, 180, 210, 8).fill(0xffffff).stroke({ width: 5, color: 0xd6dde4 }).rect(-74, -84, 148, 148).fill(0xbfe6fb);
  c.addChild(frame);
  const a = new Critter(CRITTERS[rng.pick(['cat', 'dog', 'bunny', 'pig', 'duck', 'bear'] as const)]);
  a.alive = false;
  a.scale.set(0.5);
  a.y = 50;
  c.addChild(a);
  return c;
}

export const photoSafari: GameModule = {
  id: 'photo-safari',
  name: 'Photo Safari',
  titleLine: 'game.photo-safari',
  region: 'story-grove',
  skills: ['vocabulary', 'verbs', 'positions', 'listening'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Look at the album together at the end: "What is the bunny doing? Where is it?"',
  offScreen: 'Play "I spy" with places: "I spy a teddy under the table."',
  touchDemo: true,
  hubIcon: () => new SafariIcon(),
  sticker,
  create: (ctx) => new PhotoSafari(ctx),
};
