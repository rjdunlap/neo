import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, swatch, wood } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { silenced, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor, type BandLevels } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardBack, checkButtonArt, listenButtonArt, lookButtonArt, outlineArt, parcelArt, soundArt, toyArt } from './art';
import {
  check, countsAsMiss, deciding, exhibitLayout, GLOW_AFTER, HEARD, ITS, makeRound, observe, planFor, possible, SEEN, senseTouch, TOY_IDS, TOY_NAMES, TOYS,
  type Channel, type Observation, type Rect, type Round, type SoundValue, type ToyId,
} from './logic';

const LEVELS: BandLevels = {
  prek: { min: 1, max: 2 },
  school: { min: 2, max: 2 },
};

function playSound(s: SoundValue) {
  if (s === 'ring') sfx.bell(9);
  else if (s === 'beat') sfx.drum();
  else sfx.shake();
}

interface ToyCard { id: ToyId; node: Container; ring: Graphics }
interface Evidence { obs: Observation; node: Container }

class SenseDetective implements Game {
  readonly round: Round;
  readonly record: Observation[] = [];
  cards: ToyCard[] = [];
  evidence: Evidence[] = [];
  selected: ToyId | null = null;
  misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  private alive = true;
  private clock = 0;
  private lastKey: string | null = null;
  private notYets = 0;
  private hinted = false;
  private glowOn = false;
  private view: View;
  private readonly backdrop: Backdrop;
  private readonly parcel = parcelArt();
  readonly lookBtn = new Container();
  readonly listenBtn = new Container();
  readonly checkBtn = new Container();
  private readonly shelfBoard = new Graphics();
  private readonly stripLayer = new Container();
  private readonly glow = new Graphics();

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.round = makeRound(ctx.level, ctx.rng);
    this.backdrop = new Backdrop({ sky: [swatch.teal.light, cream], hills: [swatch.green.fill, swatch.teal.light], horizon: 0.74, clouds: 2, sun: false, seed: 83 }, ctx.view);
    this.glow.eventMode = 'none';
    this.shelfBoard.eventMode = 'none';
    this.parcel.eventMode = 'none';
    this.lookBtn.addChild(lookButtonArt());
    this.listenBtn.addChild(listenButtonArt());
    this.checkBtn.addChild(checkButtonArt());
    ctx.stage.addChild(this.backdrop, this.shelfBoard, this.parcel, this.stripLayer);
    this.makeButton(this.lookBtn, 150, () => void this.investigate('view'));
    if (this.round.channels.includes('sound')) this.makeButton(this.listenBtn, 150, () => void this.investigate('sound'));
    this.makeButton(this.checkBtn, 170, () => void this.press());
    for (const id of this.round.shelf) this.cards.push(this.makeCard(id));
    ctx.stage.addChild(this.glow);
  }

  private makeButton(node: Container, size: number, fn: () => void) {
    node.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    onTap(node, () => {
      if (this.finished) return;
      void this.squish(node);
      fn();
    }, { cooldown: 250 });
    this.ctx.stage.addChild(node);
  }

  private makeCard(id: ToyId): ToyCard {
    const node = new Container();
    const ring = new Graphics().roundRect(-108, -118, 216, 236, 28).stroke({ width: 8, color: swatch.yellow.fill });
    ring.visible = false;
    ring.eventMode = 'none';
    node.addChild(cardBack(200, 220), ring);
    const art = toyArt(id, 130);
    art.y = -22;
    art.eventMode = 'none';
    const badge = outlineArt(TOYS[id].view, 50);
    badge.position.set(-62, 78);
    const plate = new Graphics().circle(-62, 78, 30).fill(swatch.white.light).stroke({ width: 3, color: wood.light });
    plate.eventMode = 'none';
    badge.eventMode = 'none';
    node.addChild(art, plate, badge);
    node.hitArea = new Rectangle(-100, -110, 200, 220);
    onTap(node, () => { if (!this.finished) void this.pick(id); }, { cooldown: 200 });
    this.ctx.stage.addChild(node);
    return { id, node, ring };
  }

  private async squish(n: Container) {
    await this.ctx.tw.to(n.scale, { x: 0.9, y: 0.9 }, { duration: 0.06 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.12, ease: ease.outBack });
  }

  private async bob(n: Container) {
    for (const s of [1.12, 1, 1.12, 1]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n.scale, { x: s, y: s }, { duration: 0.1 });
    }
  }

  start() {
    this.layout();
    void this.begin();
  }

  destroy() {
    this.alive = false;
  }

  resize(v: View) {
    this.view = v;
    this.backdrop.resize(v);
    this.layout();
  }

  private layout() {
    const l = exhibitLayout(this.view, this.cards.length, this.round.channels.length);
    const at = (n: Container, r: Rect) => n.position.set(r.x + r.w / 2, r.y + r.h / 2);
    at(this.parcel, l.parcel);
    at(this.lookBtn, l.look);
    if (l.listen) at(this.listenBtn, l.listen);
    at(this.checkBtn, l.check);
    this.cards.forEach((c, i) => at(c.node, l.shelf[i]));
    this.evidence.forEach((e, i) => at(e.node, l.strip[i]));
    const s = l.shelf[0];
    const last = l.shelf[l.shelf.length - 1];
    this.shelfBoard.clear().roundRect(s.x - 24, s.y - 14, last.x + last.w - s.x + 48, s.h + 28, 26).fill({ color: wood.light, alpha: 0.85 }).stroke({ width: 5, color: wood.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (!this.glowOn || this.finished) return;
    const left = possible(this.round.shelf, this.record);
    if (left.length !== 1) return;
    const c = this.cards.find((x) => x.id === left[0]);
    if (c) this.glow.roundRect(c.node.x - 112, c.node.y - 122, 224, 244, 30).stroke({ width: 7 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
  }

  private async begin() {
    this.busy = true;
    await this.ctx.instruct(this.round.level === 1 ? 'sense.instruct-look' : 'sense.instruct-choose');
    this.busy = false;
  }

  private evidenceCard(obs: Observation): Container {
    const n = new Container();
    n.addChild(cardBack(140, 140));
    if (obs.channel === 'view') n.addChild(outlineArt(obs.value as 'round' | 'handled', 90));
    else {
      const art = soundArt(obs.value as SoundValue, 96);
      art.y = -8;
      const spk = new Graphics().poly([-8, -5, 0, -5, 8, -12, 8, 12, 0, 5, -8, 5]).fill(swatch.blue.line);
      spk.position.set(40, 48);
      n.addChild(art, spk);
    }
    n.hitArea = new Rectangle(-70, -70, 140, 140);
    onTap(n, () => { if (obs.channel === 'sound') playSound(obs.value as SoundValue); else sfx.pop(2); void this.squish(n); }, { cooldown: 250 });
    return n;
  }

  /** Look or Listen: reveals the hidden toy's observation. Replays never cost anything. */
  private async investigate(channel: Channel) {
    if (this.busy || this.finished) return;
    const obs = observe(this.round.hidden, channel);
    if (channel === 'sound') {
      void this.shakeParcel();
      playSound(obs.value as SoundValue);
    } else {
      sfx.pop(3);
      const peep = new Graphics().circle(0, 0, 36).fill(0xffffff);
      peep.position.set(this.parcel.x, this.parcel.y - 30);
      peep.eventMode = 'none';
      this.ctx.stage.addChild(peep);
      void this.ctx.tw.to(peep, { alpha: 0 }, { duration: 0.5 }).then(() => peep.destroy());
    }
    const have = this.record.findIndex((o) => o.channel === channel);
    if (have >= 0) { void this.squish(this.evidence[have].node); return; }
    this.record.push(obs);
    const node = this.evidenceCard(obs);
    this.stripLayer.addChild(node);
    this.evidence.push({ obs, node });
    this.layout();
    const l = exhibitLayout(this.view, this.cards.length, this.round.channels.length).strip[this.evidence.length - 1];
    node.scale.set(0.2);
    node.y = l.y - 120;
    await this.ctx.tw.to(node, { y: l.y + l.h / 2 }, { duration: 0.35, ease: ease.outBack });
    node.scale.set(1);
  }

  private async shakeParcel() {
    for (const r of [0.06, -0.06, 0.04, -0.04, 0]) await this.ctx.tw.to(this.parcel, { rotation: r }, { duration: 0.07 });
  }

  /** Selecting is free: the card rings and the toy plays its own sound with its picture. */
  private async pick(id: ToyId) {
    if (this.busy || this.finished) return;
    this.selected = id;
    for (const c of this.cards) c.ring.visible = c.id === id;
    playSound(TOYS[id].sound);
    const card = this.cards.find((c) => c.id === id)!;
    void this.squish(card.node);
    const pic = soundArt(TOYS[id].sound, 60);
    pic.position.set(52, 78);
    pic.eventMode = 'none';
    card.node.addChild(pic);
    await this.ctx.tw.to(pic, { alpha: 0 }, { duration: 1.2 });
    if (!pic.destroyed) pic.destroy();
  }

  private reason(card: ToyId, obs: Observation): string {
    const name = TOY_NAMES[card];
    if (obs.channel === 'view') {
      const has = TOYS[card].view === 'handled' ? 'has a handle' : 'has no handle';
      return `The peephole shows ${SEEN[obs.value as 'round' | 'handled']}. The ${name} ${has}.`;
    }
    return `We heard ${HEARD[obs.value as SoundValue]}. The ${name} ${ITS[TOYS[card].sound]}.`;
  }

  private async press() {
    if (this.busy || this.finished) return;
    if (!this.selected) { void this.ctx.say('sense.say', { text: 'Tap a toy on the shelf, then press the green tick.' }); return; }
    const card = this.selected;
    const verdict = check(this.round.shelf, this.record, card);
    if (verdict.kind === 'found') return void this.found();
    this.busy = true;
    const node = this.cards.find((c) => c.id === card)!.node;
    if (verdict.kind === 'notyet') {
      sfx.pop(2);
      this.notYets++;
      const text = this.record.length === 0 ? "Let's look first." : `That one might be it, but so might the ${TOY_NAMES[verdict.other!]}. How else could we find out?`;
      const unused = this.round.channels.find((c) => !this.record.some((o) => o.channel === c)) ?? 'view';
      void this.bob(unused === 'view' ? this.lookBtn : this.listenBtn);
      await this.ctx.say('sense.say', { text });
      this.busy = false;
      return;
    }
    const key = `${card}|${this.record.length}`;
    if (countsAsMiss(this.lastKey, key)) this.misses++;
    this.lastKey = key;
    sfx.boing();
    const ev = this.evidence.find((e) => e.obs.channel === verdict.ruledOut.channel);
    if (ev) void this.bob(ev.node);
    for (const r of [0.1, -0.1, 0]) await this.ctx.tw.to(node, { rotation: r }, { duration: 0.08 });
    await this.ctx.say('sense.say', { text: this.reason(card, verdict.ruledOut) });
    if (!this.alive) return;
    if (this.misses >= GLOW_AFTER) this.addHint();
    this.busy = false;
  }

  private addHint() {
    if (!this.hinted) { this.hinted = true; this.hints++; }
    this.glowOn = true;
  }

  /** The pause sheet's Show a hint: run the deciding investigation first if it has not been made, then glow the possible card. */
  askForHint() {
    if (this.busy || this.finished) return;
    if (this.hinted) { void this.ctx.instruct(this.round.level === 1 ? 'sense.instruct-look' : 'sense.instruct-choose'); return; }
    const ch = deciding(this.round, this.record);
    this.addHint();
    if (ch) void this.investigate(ch);
  }

  /** Start again: the same seeded round with the clues cleared; misses and hints keep counting. */
  restart() {
    if (this.finished) return;
    this.record.length = 0;
    for (const e of this.evidence.splice(0)) e.node.destroy({ children: true });
    this.selected = null;
    this.lastKey = null;
    this.glowOn = false;
    this.notYets = 0;
    for (const c of this.cards) c.ring.visible = false;
  }

  private async found() {
    this.finished = true;
    this.busy = true;
    this.glowOn = false;
    const id = this.selected!;
    const card = this.cards.find((c) => c.id === id)!;
    sfx.pop(5);
    await this.ctx.tw.to(this.parcel, { alpha: 0, y: this.parcel.y + 30 }, { duration: 0.35 });
    if (!this.alive) return;
    const toy = toyArt(id, 150);
    toy.position.set(this.parcel.x, this.parcel.y);
    toy.scale.set(0.1);
    this.ctx.stage.addChild(toy);
    await this.ctx.tw.to(toy.scale, { x: 1.07, y: 1.07 }, { duration: 0.3, ease: ease.outBack });
    if (!this.alive) return;
    playSound(TOYS[id].sound);
    this.ctx.particles.burst(toy.x, toy.y, { colors: [swatch.yellow.fill, swatch.white.fill, swatch.pink.fill], count: 12, speed: [80, 180], gravity: 200, size: [0.2, 0.4] });
    await this.ctx.tw.to(toy, { x: card.node.x, y: card.node.y - 20 }, { duration: 0.5, ease: ease.inOutSine });
    if (!this.alive) return;
    sfx.tada();
    await this.ctx.say('sense.say', { text: `It's the ${TOY_NAMES[id]}!` });
    if (!this.alive) return;
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  /** The ghost finger: look first, listen when the look is not enough, taste the choices, then pick the possible toy and press the tick. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const m = senseTouch(this.round, this.record, this.selected);
    if ('investigate' in m) return { tap: { on: m.investigate === 'view' ? this.lookBtn : this.listenBtn } };
    if ('select' in m) return { tap: { on: this.cards.find((c) => c.id === m.select)!.node } };
    return { tap: { on: this.checkBtn } };
  }
}

class SenseIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(parcelArt());
    const eye = lookButtonArt();
    eye.scale.set(0.5);
    eye.position.set(-70, 20);
    const ear = listenButtonArt();
    ear.scale.set(0.5);
    ear.position.set(70, 20);
    c.scale.set(0.8);
    c.addChild(eye, ear);
    super(c);
  }
}

/** A seeded toy on a museum label. */
function sticker(seed: number): Container {
  const id = new Rng(seed).shuffle([...TOY_IDS])[0];
  const c = new Container();
  const label2 = new Graphics().roundRect(-90, 20, 180, 56, 14).fill(cream).stroke({ width: 4, color: wood.line });
  const toy = toyArt(id, 150);
  toy.y = -20;
  c.addChild(label2, toy);
  return c;
}

export const senseDetective: GameModule = {
  id: 'sense-detective',
  name: 'Sense Detective',
  titleLine: 'game.sense-detective',
  region: 'tinker-lab',
  skills: ['observation', 'evidence', 'senses', 'comparing'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: silenced(STYLES.quiet),
  coplayHint: 'Ask what could it be so far? before she presses the tick, or take the Look button while she takes Listen.',
  offScreen: "Put a toy in a bag and let her guess it by shaking, then by peeking.",
  hubIcon: () => new SenseIcon(),
  touchDemo: true,
  sticker,
  create: (ctx) => new SenseDetective(ctx),
};
