import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { star } from '../../art/shore';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { hinted, missOnRequest, newRequestTally, nextRequest, tally } from '../../progress/coach';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { paintBackdrop, thingArt } from './art';
import { layout, TARGET } from './layout';
import { BANDS, describeLevel, glowFor, LEVELS, makeScene, type Thing } from './logic';

const authoredShown = new Set<number>();
const repairTime = 0.65;

interface Prop {
  thing: Thing;
  node: Container;
  art: Container;
  ring: Graphics;
  fix?: Container;
  lift: number;
}

class SillyScene implements Game {
  readonly hintLabel = 'Show me';
  private readonly root = new Container();
  private readonly backdrop = new Graphics();
  private readonly progress = new Graphics();
  private readonly repairs = new Container();
  private readonly props: Prop[];
  private readonly scene;
  private readonly count;
  private readonly found = new Set<Thing>();
  private readonly tried = new Set<Thing>();
  private readonly score = newRequestTally();
  private readonly artRng: Rng;
  private view: View;
  private geometry;
  private glowing: Thing | undefined;
  private repairing: Prop | undefined;
  private elapsed = 0;
  private clock = 0;
  private waitingForReason = false;
  private finished = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.scene = makeScene(ctx.level, ctx.rng, !!ctx.demo || !authoredShown.has(ctx.level));
    if (!ctx.demo) authoredShown.add(ctx.level);
    this.artRng = ctx.rng.clone();
    this.count = this.scene.things.filter((thing) => thing.kind === 'impossible').length;
    this.geometry = layout(this.view, this.scene.backdrop);
    this.backdrop.eventMode = this.repairs.eventMode = this.progress.eventMode = 'none';
    this.root.addChild(this.backdrop);
    this.props = this.scene.things.map((thing) => {
      const node = new Container();
      const art = thingArt(thing.art, this.artRng);
      const ring = new Graphics();
      ring.eventMode = 'none';
      node.addChild(art, ring);
      node.hitArea = new Rectangle(-TARGET / 2, -TARGET / 2, TARGET, TARGET);
      const prop: Prop = { thing, node, art, ring, lift: 0 };
      onTap(node, () => this.tap(prop));
      this.root.addChild(node);
      return prop;
    });
    this.root.addChild(this.repairs, this.progress);
    ctx.stage.addChild(this.root);
    this.resize(ctx.view);
  }

  start() {
    void this.ctx.instruct(`sillyscene.instruct.${this.ctx.level as 1 | 2 | 3}`);
  }

  private nextThing() {
    return glowFor(this.scene, this.found, (slot) => this.geometry.slots[slot].x);
  }

  askForHint() {
    if (this.repairing || this.waitingForReason || this.finished) return;
    if (!this.nextThing()) return;
    this.showHint();
    void this.ctx.say('sillyscene.hint');
  }

  private showHint() {
    const thing = this.nextThing();
    if (!thing || this.glowing === thing) return;
    this.glowing = thing;
    this.score.helped = true;
    hinted(this.score);
    this.drawProgress();
  }

  private tap(prop: Prop) {
    if (this.repairing || this.waitingForReason || this.finished) return;
    const { thing, art } = prop;
    if (this.found.has(thing)) return;
    prop.lift = 0.28;
    art.y = -11;
    if (thing.kind !== 'impossible') {
      if (this.tried.has(thing)) return;
      this.tried.add(thing);
      sfx.boing();
      if (missOnRequest(this.score)) this.showHint();
      void this.ctx.say(thing.why);
      return;
    }

    this.found.add(thing);
    this.tried.clear();
    this.glowing = undefined;
    nextRequest(this.score);
    this.repairing = prop;
    this.elapsed = 0;
    prop.fix = thingArt(thing.fix.art, this.artRng, thing.fix.to ? 88 : 108);
    prop.fix.alpha = 0;
    this.repairs.addChild(prop.fix);
    this.placeRepair(prop, 0);
    this.drawProgress();
    sfx.marimba(6 + this.found.size);
    this.ctx.pet.poke();
    this.waitingForReason = true;
    void this.ctx.say(thing.why).then(() => {
      if (!this.ctx.alive) return;
      this.waitingForReason = false;
      this.finishIfReady();
    });
  }

  private finishIfReady() {
    if (this.finished || this.repairing || this.waitingForReason || this.found.size !== this.count) return;
    this.finished = true;
    this.ctx.pet.cheer();
    this.ctx.finish(tally(this.score));
  }

  private placeRepair(prop: Prop, fraction: number) {
    const { thing, fix, art, node } = prop;
    if (!fix || thing.kind !== 'impossible') return;
    const to = thing.fix.to
      ? this.geometry[thing.fix.to]
      : {
          x: node.x,
          y: node.y + (thing.art === 'risingApple' ? 78 : 0),
        };
    art.alpha = 1 - Math.min(1, fraction * 2.4);
    fix.alpha = Math.min(1, fraction * 4);
    fix.position.set(
      node.x + (to.x - node.x) * fraction,
      node.y + (to.y - node.y) * fraction - Math.sin(Math.PI * fraction) * 23,
    );
    fix.rotation = Math.sin(fraction * Math.PI) * (thing.fix.to ? 0.38 : 0.14);
  }

  private drawProgress() {
    for (const { thing, ring } of this.props) {
      ring.clear();
      if (this.found.has(thing)) {
        ring.circle(0, 0, 57).stroke({ width: 5, color: swatch.white.fill, alpha: 0.8 });
        star(ring, 45, -45, 1.1, swatch.yellow);
      } else if (thing === this.glowing) {
        ring.circle(0, 0, 58).stroke({ width: 9, color: swatch.yellow.light });
        ring.circle(0, 0, 62).stroke({ width: 3, color: swatch.yellow.line });
      }
    }
    this.progress.clear();
    if (this.count === 1) return;
    for (let i = 0; i < this.count; i++) {
      const x = this.view.w - 46 - i * 49;
      this.progress.circle(x, 54, 19).fill(swatch.white.light).stroke({ width: 4, color: swatch.blue.line });
      if (i < this.found.size) star(this.progress, x, 54, 0.9, swatch.yellow);
    }
  }

  update(dt: number) {
    this.clock += dt;
    for (const prop of this.props) {
      prop.lift = Math.max(0, prop.lift - dt);
      prop.art.y = -11 * (prop.lift / 0.28);
      prop.ring.alpha = prop.thing === this.glowing ? 0.82 + 0.18 * Math.sin(this.clock * 7) : 1;
    }
    if (!this.repairing) return;
    this.elapsed += dt;
    this.placeRepair(this.repairing, Math.min(1, this.elapsed / repairTime));
    if (this.elapsed >= repairTime) {
      this.repairing = undefined;
      this.finishIfReady();
    }
  }

  resize(view: View) {
    this.view = view;
    this.geometry = layout(view, this.scene.backdrop);
    paintBackdrop(this.backdrop, this.scene.backdrop, view, this.geometry);
    for (const prop of this.props) {
      const place = this.geometry.slots[prop.thing.slot];
      prop.node.position.set(place.x, place.y);
      this.placeRepair(prop, this.repairing === prop ? Math.min(1, this.elapsed / repairTime) : 1);
    }
    this.drawProgress();
  }

  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.repairing || this.waitingForReason || this.finished) return null;
    const prop = this.props.find((item) => item.thing === this.nextThing());
    return prop ? { tap: { on: prop.node } } : null;
  }

  destroy() {
    this.root.destroy({ children: true });
  }
}

const icon = (seed: number) => thingArt('wingedPig', new Rng(seed), 130);

export const game: GameModule = {
  id: 'silly-scene',
  name: 'Silly Scene',
  titleLine: 'game.silly-scene',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: [
    'Finding an impossible part of a familiar scene',
    'Telling an unusual idea from an impossible one',
  ],
  bands: [...BANDS],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  upright: true,
  touchDemo: true,
  coplayHint: 'Ask what looks silly and why, then let her tap it.',
  offScreen: {
    all: 'Take turns saying a silly sentence, like “The cat says moo,” and let the other person fix it.',
  },
  hubIcon: () => new WigglyIcon(icon(1)),
  sticker: icon,
  create: (ctx) => new SillyScene(ctx),
};
