import { Circle, Container, Graphics, Rectangle, Sprite, type Texture } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch, wood } from '../../art/palette';
import { prop } from '../../art/props';
import { Backdrop } from '../../art/scenery';
import { puffs } from '../../art/shapes';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { entryId } from '../../content/journal';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { ANIMALS, changeLine, claimTruths, sentence, stillLine, chipsFor, chipPhrase, fewestChips, judgeTell, sameChip, tellHint, toggleChip, type Chip, animalToTap, describe, makeScene, planFor, request, nearestSighting, sightingPositions, spotPosition, type Action, type Animal, type SafariPlan, type Scene, type Sighting, type Spot } from './logic';
import { rangeFor, type BandLevels } from '../../progress/difficulty';

const LEVELS: BandLevels = {
  lap: { min: 1, max: 2 },
  // "Who is sleeping?" (12) is the toddler step after naming; younger players never hear a false claim (9 is school only).
  toddler: { min: 1, max: 12, order: [1, 2, 12] },
  preschool: { min: 2, max: 4 },
  prek: { min: 3, max: 5 },
  school: { min: 4, max: 11, order: [4, 5, 6, 7, 8, 9, 10, 11] },
};

const SCALE = 0.5;

/** One animal on the safari, doing its thing. */
class Actor extends Container {
  readonly critter: Critter;
  readonly glow = new Graphics();
  private readonly extra = new Container();
  private readonly gesture = new Graphics();
  private clock = Math.random() * 6;
  private next = 0.4;

  constructor(readonly sighting: Sighting) {
    super();
    this.critter = new Critter(CRITTERS[sighting.animal]);
    this.critter.scale.set(SCALE);
    this.glow.ellipse(0, -60, 90, 100).fill({ color: 0xfff3a0, alpha: 0.85 });
    this.glow.visible = false;
    this.addChild(this.glow, this.critter, this.extra, this.gesture);
    this.hitArea = new Circle(0, -60, 95);
    this.drawGesture(0);
    if (sighting.action === 'sleeping') this.critter.setMood('sleepy');
    if (sighting.action === 'eating') {
      const apple = prop('apple', 'red');
      apple.scale.set(0.42);
      apple.position.set(40, -50);
      this.extra.addChild(apple);
    }
  }

  /** Scene-owned Graphics: no timers or listeners survive an actor. */
  private drawGesture(time: number) {
    const g = this.gesture.clear();
    if (this.sighting.action === 'waving') {
      const sw = this.critter.sw;
      const handX = 62 + 10 * Math.sin(time * 7);
      const handY = -104 + 7 * Math.cos(time * 7);
      g.moveTo(30, -48).quadraticCurveTo(60, -62, handX, handY)
        .stroke({ width: 20, color: sw.line, cap: 'round' });
      g.moveTo(30, -48).quadraticCurveTo(60, -62, handX, handY)
        .stroke({ width: 13, color: sw.fill, cap: 'round' });
      g.circle(handX, handY, 12).fill(sw.fill).stroke({ width: 3, color: sw.line });
    } else if (this.sighting.action === 'swimming') {
      const blue = swatch.blue;
      // Water covers the feet even in a journal picture or photograph.
      g.ellipse(0, -6, 65, 18).fill(blue.fill);
      for (const side of [-1, 1]) {
        const x = side * (45 + 6 * Math.sin(time * 5));
        g.moveTo(x - 15, -12).quadraticCurveTo(x, -2, x + 15, -12)
          .stroke({ width: 4, color: blue.line, cap: 'round' });
      }
    }
  }

  update(dt: number) {
    this.clock += dt;
    this.critter.update(dt);
    this.drawGesture(this.clock);
    if (this.glow.visible) this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 7);
    switch (this.sighting.action) {
      case 'jumping':
        this.next -= dt;
        if (this.next <= 0) {
          this.critter.hop(0.75);
          this.next = 0.85;
        }
        break;
      case 'swimming':
        this.critter.x = 9 * Math.sin(this.clock * 3);
        this.critter.y = 5 * Math.sin(this.clock * 5);
        this.critter.rotation = 0.1 * Math.sin(this.clock * 3);
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

const ACTION_FRIEND: Record<Action, Animal> = { jumping: 'bunny', sleeping: 'cat', eating: 'pig', dancing: 'duck', waving: 'bear', swimming: 'duck' };

/** A still from the safari for the discovery journal's action-word cards. */
export function safariJournalPicture(action: Action): Container {
  const actor = new Actor({ animal: ACTION_FRIEND[action], action, spot: action === 'swimming' ? 'pond' : 'tree' });
  actor.critter.alive = false;
  actor.glow.visible = false;
  if (action === 'jumping') {
    actor.critter.y = -24;
    actor.addChild(new Graphics().moveTo(72, -32).lineTo(72, -145).stroke({ width: 9, color: swatch.blue.line, cap: 'round' }).poly([52, -122, 72, -154, 92, -122]).fill(swatch.blue.line));
  } else if (action === 'sleeping') {
    const z = label('z z', 34, 0x6b6b8a);
    z.position.set(60, -170);
    actor.addChild(z);
  } else if (action === 'dancing') {
    actor.critter.rotation = -0.18;
    const notes = label('♪ ♫', 34, swatch.purple.line);
    notes.position.set(68, -170);
    actor.addChild(notes);
  }
  return actor;
}

/** Small pictures shared by the word cards and the Tell bubble. */
function chipIcon(chip: Chip): Container {
  const c = new Container();
  const g = new Graphics();
  const blue = swatch.blue.line;
  if (chip.kind === 'spot') {
    if (chip.value === 'tree') {
      g.roundRect(-5, -22, 10, 48, 3).fill(wood.fill);
      puffs(g, [[-16, -24, 18], [2, -35, 22], [21, -23, 17]], swatch.green.fill, swatch.green.line, 3);
    } else if (chip.value === 'bush') puffs(g, [[-22, 4, 18], [0, -5, 24], [22, 4, 18]], swatch.green.fill, swatch.green.line, 3);
    else if (chip.value === 'rock') g.poly([-34, 22, -22, -14, 12, -23, 34, 22]).fill(0xb9b2a6).stroke({ width: 3, color: 0x8c857a });
    else g.ellipse(0, 0, 36, 21).fill(swatch.blue.fill).stroke({ width: 3, color: blue });
  } else if (chip.value === 'eating') {
    const apple = prop('apple', 'red'); apple.scale.set(0.5); apple.y = 20; c.addChild(apple);
  } else if (chip.value === 'jumping') {
    g.moveTo(-32, 18).quadraticCurveTo(0, -48, 32, 18).stroke({ width: 6, color: blue });
    g.moveTo(0, 10).lineTo(0, -34).stroke({ width: 6, color: blue }).poly([-12, -20, 0, -40, 12, -20]).fill(blue);
  } else if (chip.value === 'waving') {
    g.moveTo(0, 25).lineTo(0, -8).stroke({ width: 16, color: swatch.orange.fill, cap: 'round' });
    for (let i = -2; i <= 2; i++) g.moveTo(i * 7, -6).lineTo(i * 10, -28 + Math.abs(i) * 5).stroke({ width: 6, color: swatch.orange.line, cap: 'round' });
    g.circle(0, -4, 16).fill(swatch.orange.fill);
  } else if (chip.value === 'sleeping') {
    g.circle(-8, -7, 25).fill(0xffd866).circle(3, -16, 22).fill(0xffffff);
    const z = label('z', 27, blue); z.position.set(23, 10); c.addChild(z);
  } else {
    const note = label('♪', 62, swatch.purple.line); note.y = -4; c.addChild(note);
  }
  c.addChild(g); c.eventMode = 'none'; return c;
}
/** A thumbs-up hand (rotate it for thumbs-down). */
function thumbIcon(sw: { fill: number; line: number }): Graphics {
  const g = new Graphics().roundRect(-24, -44, 22, 46, 11).fill(sw.fill).stroke({ width: 4, color: sw.line })
    .roundRect(-28, -8, 56, 48, 14).fill(sw.fill).stroke({ width: 4, color: sw.line });
  // Curled fingers: three creases across the fist.
  for (const y of [4, 16, 28]) g.moveTo(6, y).lineTo(26, y).stroke({ width: 3, color: sw.line, cap: 'round' });
  return g;
}
function cameraIcon(): Graphics {
  return new Graphics().roundRect(-34, -22, 68, 44, 8).fill(0x5a5a6e).roundRect(-20, -30, 22, 12, 3).fill(0x5a5a6e)
    .circle(2, 0, 15).fill(0x7cc4f2).stroke({ width: 4, color: 0x2b2b3a });
}
class WordCard extends Container {
  readonly plate = new Graphics();
  readonly glow = new Graphics().roundRect(-76, -66, 152, 132, 18).fill({ color: 0xfff3a0, alpha: 0.85 });
  selected = false;
  constructor(readonly chip: Chip, tap: () => void) {
    super();
    this.glow.visible = false; this.glow.eventMode = 'none';
    const icon = chipIcon(chip); icon.y = -16;
    const word = label(chipPhrase([chip]), 22, 0x34475a); word.y = 37;
    this.addChild(this.glow, this.plate, icon, word);
    this.hitArea = new Rectangle(-75, -65, 150, 130);
    onTap(this, tap); this.draw();
  }
  draw() {
    this.plate.clear().roundRect(-70, -60, 140, 120, 16).fill(this.selected ? 0xd5efff : 0xffffff)
      .stroke({ width: this.selected ? 6 : 3, color: this.selected ? 0xffffff : 0x7d9db4 });
  }
}

class PhotoSafari implements Game {
  readonly plan: SafariPlan;
  scene: Scene | null = null;
  actors: Actor[] = [];
  photos = 0;
  /** Action words in photos that made it into this round's album. */
  readonly photographed = new Set<Action>();
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;

  private readonly backdrop: Backdrop;
  /** The backdrop's places and animals together: what a whole-meadow photo shows. */
  private readonly meadow = new Container();
  private readonly backs = new Container();
  private readonly cast = new Container();
  private readonly fronts = new Container();
  private readonly album = new Container();
  private readonly flash = new Graphics();
  readonly tray = new Container();
  chips: WordCard[] = [];
  chosen: Chip[] = [];
  readonly tellButton = new Container();
  readonly viewfinder = new Graphics();
  private readonly tellPictures = new Container();
  private readonly visitor = new Container();
  private friend: Critter | null = null;
  private readonly wanted = new Graphics().poly([0, -22, 6, -6, 22, 0, 6, 6, 0, 22, -6, 6, -22, 0, -6, -6]).fill(0xffce45).stroke({ width: 2, color: 0xb77b10 });
  private tellClock = 0;
  private sparkleAt = 0;
  private view: View;
  private wrongs = 0;
  private readonly textures: Texture[] = [];
  private destroyed = false;
  /** What Changed? and Is it true?: photograph first ('look'), then pick the changed friend ('find') or judge the claim ('judge'). */
  phase: 'look' | 'find' | 'judge' | null = null;
  readonly cameraButton = new Container();
  readonly thumbs: Container[] = [];
  private readonly pinned = new Container();
  private pinnedTexture: Texture | null = null;
  private held: Container | null = null;
  private truths: boolean[] = [];

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.backdrop = new Backdrop({ sky: [0x8fd3f7, 0xe9f7ff], hills: [0xc8ecb0, 0xa6de8e, 0x9edb86], horizon: 0.45, clouds: 3, sun: true, seed: 64 }, ctx.view);
    if (this.sharedPlaces && !this.isTell) {
      onTap(this.cast, (e) => {
        const point = this.cast.toLocal(e.global);
        const i = nearestSighting(this.actors, point);
        if (i >= 0) void this.snap(this.actors[i]);
      }, { cooldown: 500 });
    }
    this.flash.alpha = 0;
    // Scenery in front of the animals (the bush, the pond's edge, the flash) must not catch taps.
    for (const layer of [this.backs, this.fronts, this.album, this.flash]) layer.eventMode = 'none';
    this.meadow.addChild(this.backs, this.cast, this.fronts);
    ctx.stage.addChild(this.backdrop, this.meadow, this.pinned, this.album, this.flash, this.visitor, this.viewfinder, this.tray);
    this.pinned.eventMode = 'none';
    if (this.plan.mode === 'changed') {
      const plate = new Graphics().roundRect(-75, -58, 150, 116, 22).fill(0xe6f5ff).stroke({ width: 5, color: 0x527da0 });
      const cam = cameraIcon(); cam.scale.set(1.3);
      this.cameraButton.addChild(plate, cam);
      this.cameraButton.hitArea = new Rectangle(-75, -58, 150, 116);
      this.cameraButton.visible = false;
      onTap(this.cameraButton, () => void this.photographMeadow());
      this.tray.addChild(this.cameraButton);
    }
    if (this.plan.mode === 'true') {
      this.truths = claimTruths(ctx.rng);
      for (const up of [true, false]) {
        const b = new Container();
        const glow = new Graphics().roundRect(-80, -66, 160, 132, 22).fill({ color: 0xfff3a0, alpha: 0.85 });
        glow.visible = false; glow.eventMode = 'none';
        const plate = new Graphics().roundRect(-72, -58, 144, 116, 20).fill(0xffffff).stroke({ width: 5, color: up ? swatch.green.line : swatch.orange.line });
        const hand = thumbIcon(up ? swatch.green : swatch.orange);
        if (!up) hand.rotation = Math.PI;
        b.addChild(glow, plate, hand);
        b.hitArea = new Rectangle(-75, -60, 150, 120);
        b.visible = false;
        onTap(b, () => void this.judge(up));
        this.thumbs.push(b);
        this.tray.addChild(b);
      }
    }
    for (const layer of [this.visitor, this.viewfinder, this.wanted]) layer.eventMode = 'none';
    if (this.isTell) {
      for (const x of [-110, 110]) for (const y of [-125, 125]) {
        this.viewfinder.moveTo(x, y - Math.sign(y) * 30).lineTo(x, y).lineTo(x - Math.sign(x) * 30, y).stroke({ width: 6, color: 0xffffff });
      }
      const bubble = new Graphics().roundRect(-85, -65, 170, 130, 26).fill(0xe6f5ff).stroke({ width: 5, color: 0x527da0 });
      const cam = cameraIcon(); cam.position.set(-40, -22); cam.scale.set(0.7);
      const text = label('Tell', 27, 0x34475a); text.position.set(22, -22);
      this.tellPictures.y = 27;
      this.tellButton.addChild(bubble, cam, text, this.tellPictures);
      this.tellButton.hitArea = new Rectangle(-85, -65, 170, 130);
      onTap(this.tellButton, () => void this.tell());
      this.tray.addChild(this.tellButton);
    }
  }

  private get sharedPlaces(): boolean {
    return this.plan.mode === 'both' || this.plan.mode === 'clues' || this.isTell;
  }

  private get isTell() { return this.plan.mode === 'tell'; }

  get target(): Actor | undefined {
    return this.scene && this.scene.target >= 0 ? this.actors[this.scene.target] : undefined;
  }

  start() {
    void this.nextScene();
  }

  /** The ghost finger on the how-to card: photograph the animal that was asked for, or each animal in turn. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || !this.scene) return null;
    if (this.isTell) {
      const missing = fewestChips(this.scene).find((c) => !this.chosen.some((k) => sameChip(k, c)));
      const on = missing ? this.chips.find((c) => sameChip(c.chip, missing)) : this.tellButton;
      return on ? { tap: { on }, receiver: on } : null;
    }
    if (this.phase === 'look') return { tap: { on: this.cameraButton }, receiver: this.cameraButton };
    if (this.phase === 'judge') {
      const on = this.thumbs[this.scene.truthy ? 0 : 1];
      return { tap: { on }, receiver: on };
    }
    const animal = this.actors[animalToTap(this.scene, this.photos)];
    return animal && !animal.destroyed ? { tap: { on: animal, y: -60 }, receiver: this.sharedPlaces ? this.cast : animal } : null;
  }

  private ground() {
    return this.isTell ? Math.min(this.view.h * 0.78, this.view.h - 200) : this.view.h * 0.78;
  }

  private spotPos(spot: Spot) {
    return spotPosition(spot, this.scene?.sightings ?? [], this.view.w, this.view.h, this.ground());
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.flash.clear().rect(0, 0, v.w, v.h).fill(0xffffff);
    this.drawSpots();
    this.layoutActors();
    if (this.sharedPlaces && !this.isTell) this.cast.hitArea = new Rectangle(0, 0, v.w, v.h);
    this.album.position.set(180, 24);
    this.cameraButton.position.set(v.w / 2, v.h - 72);
    this.thumbs.forEach((b, i) => b.position.set(v.w / 2 + (i ? 95 : -95), v.h - 72));
    this.pinned.position.set(v.w / 2, 200);
    if (this.held && this.phase === 'judge') this.held.position.copyFrom(this.heldAt());
    if (this.isTell) {
      this.layoutChips();
      this.visitor.position.set(v.w - 110, 250);
      if (!this.busy) this.viewfinder.position.set(v.w / 2, this.ground() - 100);
    }
  }

  private layoutActors() {
    const positions = sightingPositions(this.actors.map((a) => a.sighting), this.view.w, this.view.h, this.ground());
    this.actors.forEach((a, i) => a.position.copyFrom(positions[i]));
  }

  /** The four places: a tree to stand under, a bush to hide behind, a rock, and a pond. */
  private drawSpots() {
    this.backs.removeChildren().forEach((c) => c.destroy());
    this.fronts.removeChildren().forEach((c) => c.destroy());
    const y = this.ground();
    const at = (s: Spot) => this.spotPos(s).x;
    const show = (s: Spot) => !this.sharedPlaces || this.scene?.sightings.some((a) => a.spot === s);
    const back = new Graphics();
    // Tree: trunk and canopy, high enough to stand under.
    if (show('tree')) {
      back.roundRect(at('tree') - 70, y - 250, 36, 250, 10).fill(wood.fill).stroke({ width: 5, color: wood.line });
      puffs(back, [[at('tree') - 90, y - 270, 70], [at('tree') - 20, y - 300, 80], [at('tree') + 60, y - 265, 66]], swatch.green.fill, swatch.green.line, 6);
    }
    const extent = this.sharedPlaces ? 155 : 90;
    const pondExtent = this.sharedPlaces ? 165 : 110;
    // Rock.
    if (show('rock')) back.moveTo(at('rock') - extent, y + 4).bezierCurveTo(at('rock') - extent, y - 90, at('rock') + extent, y - 90, at('rock') + extent, y + 4).closePath().fill(0xb9b2a6).stroke({ width: 5, color: 0x8c857a });
    // Pond, back half.
    if (show('pond')) back.ellipse(at('pond'), y + 20, pondExtent, 34).fill(0x7cc4f2).stroke({ width: 5, color: 0x5aa9e0 });
    this.backs.addChild(back);
    const front = new Graphics();
    // Low enough that a face still peeks over the top.
    if (show('bush')) puffs(front, [[at('bush') - 62, y + 2, 38], [at('bush'), y - 12, 43], [at('bush') + 62, y + 2, 38]], 0x7cc463, 0x4a9a35, 6);
    // The pond's near edge covers a swimmer's legs.
    if (show('pond')) front.moveTo(at('pond') - pondExtent, y + 20).bezierCurveTo(at('pond') - pondExtent, y + 70, at('pond') + pondExtent, y + 70, at('pond') + pondExtent, y + 20).closePath().fill(0x7cc4f2).stroke({ width: 5, color: 0x5aa9e0 });
    this.fronts.addChild(front);
  }

  update(dt: number) {
    for (const a of this.actors) a.update(dt);
    if (this.isTell) {
      this.tellClock += dt; this.friend?.update(dt);
      this.wanted.rotation = 0.2 * Math.sin(this.tellClock);
      this.wanted.scale.set(1 + 0.12 * Math.sin(this.tellClock * 3));
      for (const c of this.chips) c.glow.alpha = 0.6 + 0.4 * Math.sin(this.tellClock * 5);
      if (this.target && !this.finished && this.tellClock > this.sparkleAt) {
        this.sparkleAt = this.tellClock + 2;
        this.ctx.particles.burst(this.target.x, this.target.y - 200, { colors: [0xffce45], count: 2, kind: 'star', speed: [10, 30], gravity: 0, life: [0.4, 0.8], size: [0.15, 0.25] });
      }
    }
  }

  destroy() {
    this.destroyed = true;
    this.busy = true;
    this.wanted.destroy();
    this.clearPinned();
    // Release the sprites before their game-owned generated textures and GPU sources.
    this.album.removeChildren().forEach((card) => card.destroy({ children: true }));
    for (const texture of this.textures) texture.destroy(true);
    this.textures.length = 0;
  }

  private async nextScene() {
    if (this.destroyed) return;
    this.busy = true;
    this.wrongs = 0;
    this.wanted.removeFromParent();
    for (const a of this.actors) a.destroy({ children: true });
    this.actors = [];
    this.phase = null;
    this.clearPinned();
    if (this.photos >= this.plan.photos) return void this.finale();
    this.scene = makeScene(this.plan, this.ctx.rng, this.photos, this.truths[this.photos] ?? true);
    // What changed? starts from the meadow as photographed; the change happens after the photo.
    const shown = this.scene.before ?? this.scene.sightings;
    this.actors = shown.map((s) => {
      const a = new Actor(s);
      a.position.copyFrom(this.spotPos(s.spot));
      if (this.isTell) onTap(a, () => { if (!this.busy && !this.finished) { a.critter.hop(); void this.ctx.say('safari.tell-tap'); } });
      else if (this.sharedPlaces) a.eventMode = 'none';
      else onTap(a, () => void this.snap(a), { cooldown: 500 });
      this.cast.addChild(a);
      a.scale.set(0);
      void this.ctx.tw.to(a.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      return a;
    });
    if (this.isTell) this.prepareTell();
    if (this.sharedPlaces) this.resize(this.view);
    await this.ctx.tw.wait(0.4);
    this.busy = false;
    const t = this.target;
    if (this.plan.mode === 'changed') {
      this.phase = 'look';
      this.cameraButton.visible = true;
      await this.ctx.instruct('safari.meadow');
    } else if (this.plan.mode === 'true') {
      this.phase = 'find';
      await this.ctx.instruct('safari.claim', { claim: request('true', this.scene), animal: this.target!.sighting.animal });
    } else if (this.plan.mode === 'act') {
      await this.ctx.instruct('safari.who-doing', { what: request('act', this.scene) });
    } else if (this.isTell) {
      await this.ctx.instruct('safari.tell');
    } else if (this.plan.mode === 'snap') {
      if (this.photos === 0) await this.ctx.instruct('safari.snap');
    } else if (t) {
      await this.ctx.instruct(this.plan.mode === 'clues' ? 'safari.clues' : 'safari.ask', { what: request(this.plan.mode, this.scene!) });
    }
  }

  private prepareTell() {
    this.chosen = [];
    this.chips.forEach((c) => c.destroy({ children: true }));
    this.chips = chipsFor(this.scene!, this.ctx.rng).map((chip) => {
      const card = new WordCard(chip, () => {
        if (this.busy || this.finished) return;
        this.chosen = toggleChip(this.chosen, chip);
        card.scale.set(0.94);
        void this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.15 });
        void this.ctx.say('safari.chip', { what: chipPhrase([chip]) });
        this.layoutChips();
      });
      this.tray.addChild(card); return card;
    });
    this.target!.addChild(this.wanted); this.wanted.position.set(0, -200);
    this.visitor.removeChildren().forEach((c) => c.destroy({ children: true }));
    const animals = this.scene!.sightings.map((s) => s.animal);
    this.friend = new Critter(CRITTERS[this.ctx.rng.pick(ANIMALS.filter((a) => !animals.includes(a)))]);
    this.friend.scale.set(0.45);
    const thought = new Graphics().roundRect(-190, -168, 150, 105, 24).fill(0xffffff).circle(-46, -51, 10).fill(0xffffff).circle(-27, -33, 6).fill(0xffffff);
    const camera = cameraIcon(); camera.position.set(-115, -115);
    this.visitor.addChild(this.friend, thought, camera);
    this.viewfinder.position.set(this.view.w / 2, this.ground() - 100);
    this.layoutChips();
  }

  private layoutChips() {
    const start = (150 + this.view.w - 40 - 806) / 2;
    this.chips.forEach((c, i) => {
      c.selected = this.chosen.some((k) => sameChip(k, c.chip));
      c.position.set(start + 70 + i * 156, this.view.h - 78 - (c.selected ? 16 : 0)); c.draw();
    });
    this.tellButton.position.set(start + 721, this.view.h - 78);
    this.tellPictures.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.chosen.forEach((chip, i) => {
      const icon = chipIcon(chip); icon.scale.set(0.5); icon.x = (i - (this.chosen.length - 1) / 2) * 52; this.tellPictures.addChild(icon);
    });
  }

  private async aimAt(x: number, y: number) {
    await this.ctx.tw.to(this.viewfinder, { x, y }, { duration: 0.25, ease: ease.inOutSine });
  }

  private async tell() {
    if (this.busy || this.finished || !this.scene) return;
    this.tellButton.scale.set(1.08);
    void this.ctx.tw.to(this.tellButton.scale, { x: 1, y: 1 }, { duration: 0.18 });
    const judged = judgeTell(this.chosen, this.scene);
    if (judged.result === 'empty') { void this.ctx.say('safari.tell-empty'); return; }
    this.busy = true;
    const found = judged.fits.map((i) => this.actors[i]);
    if (found.length === 1) await this.aimAt(found[0].x, found[0].y - 100);
    if (judged.result === 'right') {
      this.busy = false;
      await this.snap(this.target!); return;
    }
    this.misses++; this.wrongs++;
    const what = chipPhrase(this.chosen);
    if (found.length === 2) {
      sfx.bell(2, 0.12);
      await this.ctx.tw.wait(0.16); sfx.bell(3, 0.12);
      for (let n = 0; n < 2; n++) for (const a of found) await this.aimAt(a.x, a.y - 100);
      await this.aimAt((found[0].x + found[1].x) / 2, (found[0].y + found[1].y) / 2 - 100);
      await this.ctx.say('safari.which', { what });
    } else if (!found.length) {
      sfx.boing();
      await this.aimAt(this.view.w * 0.3, this.ground() - 100);
      await this.aimAt(this.view.w * 0.76, this.ground() - 100);
      await this.aimAt(this.view.w / 2, this.ground() - 100);
      await this.ctx.say('safari.nobody', { what });
    } else {
      sfx.boing(); sfx.tick();
      this.flash.alpha = 0.75;
      void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 0.35 });
      await this.ctx.say('safari.thatis', { desc: describe('both', found[0].sighting) });
    }
    if (this.wrongs >= 2) {
      const hint = tellHint(this.chosen, this.scene);
      this.chosen = hint.chosen;
      for (const c of this.chips) if (hint.glow.some((k) => sameChip(k, c.chip))) c.glow.visible = true;
      this.hints++; this.wrongs = 0; this.layoutChips();
    }
    this.busy = false;
  }

  private async snap(a: Actor) {
    if (this.busy || this.finished) return;
    // Any animal tapped before the meadow photo takes that photo; it is never a miss.
    if (this.phase === 'look') return void this.photographMeadow();
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
      if (this.plan.mode === 'changed') void this.ctx.say('safari.same', { what: stillLine(this.scene!, this.actors.indexOf(a)) });
      else void this.ctx.say('safari.thatis', { desc: describe(this.plan.mode === 'clues' ? 'both' : this.plan.mode, a.sighting) });
      if (this.wrongs >= 2 && t && !t.glow.visible) {
        t.glow.visible = true;
        this.hints++;
        this.wrongs = 0;
      }
      return;
    }
    this.busy = true;
    a.glow.visible = false;
    this.photographed.add(a.sighting.action);
    if (this.plan.mode === 'true') return void this.holdUp(a);
    await this.polaroid(a);
    this.photos++;
    await this.ctx.say('safari.click');
    if (this.plan.mode === 'changed') await this.ctx.say('safari.was', { what: changeLine(this.scene!) });
    if (this.isTell) { this.friend?.hop(); await this.ctx.say('safari.thanks'); }
    else if (this.plan.mode !== 'snap') await this.ctx.say('praise');
    await this.nextScene();
  }

  /** A photo of the animal flies up into the album strip. */
  private async polaroid(a: Actor) {
    await this.toAlbum(this.photoCard(a));
  }

  private photoCard(a: Actor): Container {
    const tex = this.ctx.renderer.generateTexture({ target: a, resolution: 1 });
    this.textures.push(tex);
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
    return card;
  }

  private async toAlbum(card: Container) {
    const slot = this.photos;
    await Promise.all([
      this.ctx.tw.to(card, { x: slot * 74, y: 46, rotation: (slot % 2 ? 1 : -1) * 0.08 }, { duration: 0.6, ease: ease.inOutSine }),
      this.ctx.tw.to(card.scale, { x: 0.38, y: 0.38 }, { duration: 0.6, ease: ease.inOutSine }),
    ]);
  }

  /** What changed?: the whole meadow is photographed and pinned up, then one friend changes behind a puff. */
  private async photographMeadow() {
    if (this.busy || this.finished || this.phase !== 'look' || !this.scene) return;
    this.busy = true;
    this.cameraButton.visible = false;
    sfx.tick(); sfx.whoosh();
    const v = this.view;
    const top = this.ground() - 330;
    this.pinnedTexture = this.ctx.renderer.generateTexture({ target: this.meadow, frame: new Rectangle(0, top, v.w, 420), resolution: 0.5, clearColor: '#d7f0ff' });
    const pic = new Sprite(this.pinnedTexture);
    pic.anchor.set(0.5);
    const fit = Math.min(340 / pic.width, 150 / pic.height);
    pic.scale.set(fit);
    const frame = new Graphics().roundRect(-pic.width / 2 - 12, -pic.height / 2 - 12, pic.width + 24, pic.height + 24, 10).fill(0xffffff).stroke({ width: 4, color: 0xd6dde4 });
    this.pinned.addChild(frame, pic);
    this.pinned.alpha = 0;
    this.flash.alpha = 0.85;
    void this.ctx.tw.to(this.flash, { alpha: 0 }, { duration: 0.4 });
    await this.ctx.tw.to(this.pinned, { alpha: 1 }, { duration: 0.3 });
    await this.ctx.say('safari.click');
    if (this.destroyed) return;
    // Everyone hides in a puff; when it clears, one friend has changed one thing.
    const clouds = this.actors.map((a) => {
      const g = puffs(new Graphics(), [[-45, -50, 48], [10, -80, 58], [52, -45, 46]], 0xffffff, 0xd6dde4, 4);
      g.position.copyFrom(a.position); g.scale.set(0); g.eventMode = 'none';
      this.meadow.addChild(g);
      return g;
    });
    sfx.whoosh();
    await Promise.all(clouds.map((g) => this.ctx.tw.to(g.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack })));
    if (this.destroyed) return;
    const i = this.scene.target;
    const old = this.actors[i];
    const now = new Actor(this.scene.sightings[i]);
    onTap(now, () => void this.snap(now), { cooldown: 500 });
    this.cast.addChildAt(now, this.cast.getChildIndex(old));
    old.destroy({ children: true });
    this.actors[i] = now;
    this.layoutActors();
    clouds.forEach((g) => g.position.copyFrom(this.actors[clouds.indexOf(g)].position));
    await this.ctx.tw.wait(0.25);
    await Promise.all(clouds.map((g) => this.ctx.tw.to(g, { alpha: 0 }, { duration: 0.35 })));
    clouds.forEach((g) => g.destroy());
    if (this.destroyed) return;
    this.phase = 'find';
    this.busy = false;
    await this.ctx.instruct('safari.changed');
  }

  private clearPinned() {
    this.pinned.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.pinnedTexture?.destroy(true);
    this.pinnedTexture = null;
  }

  /** Is it true?: the photo is held up big beside the thumbs while she checks the claim against it. */
  private async holdUp(a: Actor) {
    const card = this.photoCard(a);
    this.held = card;
    await Promise.all([
      this.ctx.tw.to(card, this.heldAt(), { duration: 0.5, ease: ease.inOutSine }),
      this.ctx.tw.to(card.scale, { x: 1.1, y: 1.1 }, { duration: 0.5 }),
    ]);
    if (this.destroyed) return;
    await this.ctx.say('safari.click');
    this.phase = 'judge';
    for (const b of this.thumbs) b.visible = true;
    this.busy = false;
    await this.ctx.instruct('safari.judge', { claim: request('true', this.scene!) });
  }

  private heldAt() {
    const p = this.album.toLocal({ x: this.view.w / 2, y: 220 });
    return { x: p.x, y: p.y };
  }

  private async judge(up: boolean) {
    if (this.busy || this.finished || this.phase !== 'judge' || !this.scene || !this.held) return;
    const button = this.thumbs[up ? 0 : 1];
    button.scale.set(0.92);
    void this.ctx.tw.to(button.scale, { x: 1, y: 1 }, { duration: 0.15 });
    const shows = sentence(this.scene.sightings[this.scene.target]);
    if (up !== this.scene.truthy) {
      // A wrong judgement replays the photo while the voice says what it really shows.
      this.misses++; this.wrongs++;
      sfx.boing();
      this.busy = true;
      const card = this.held;
      await this.ctx.tw.to(card.scale, { x: 1.25, y: 1.25 }, { duration: 0.2 });
      await this.ctx.say('safari.look-again', { shows });
      if (this.destroyed) return;
      await this.ctx.tw.to(card.scale, { x: 1.1, y: 1.1 }, { duration: 0.2 });
      if (this.wrongs >= 2) {
        const right = this.thumbs[this.scene.truthy ? 0 : 1].children[0];
        if (!right.visible) { right.visible = true; this.hints++; }
        this.wrongs = 0;
      }
      this.busy = false;
      return;
    }
    this.busy = true;
    sfx.sparkle();
    for (const b of this.thumbs) { b.visible = false; (b.children[0] as Graphics).visible = false; }
    await this.ctx.say(this.scene.truthy ? 'safari.true' : 'safari.false', { shows });
    if (this.destroyed) return;
    const card = this.held;
    this.held = null;
    await Promise.all([this.toAlbum(card), this.ctx.tw.to(card.scale, { x: 0.38, y: 0.38 }, { duration: 0.6 })]);
    this.photos++;
    await this.ctx.say('praise');
    await this.nextScene();
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    this.tray.visible = this.visitor.visible = this.viewfinder.visible = this.pinned.visible = false;
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
    this.ctx.finish({ misses: this.misses, hints: this.hints, discoveries: [...this.photographed].map((action) => entryId('photo-safari', action)) });
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
  entryLevels: [12],
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Make an I spy request with an action and a place: "I spy someone jumping in the pond." Look at the album together at the end: "What is the bunny doing? Where is it?"',
  offScreen: 'Play "I spy" with places: "I spy a teddy under the table."',
  touchDemo: true,
  hubIcon: () => new SafariIcon(),
  sticker,
  create: (ctx) => new PhotoSafari(ctx),
};
