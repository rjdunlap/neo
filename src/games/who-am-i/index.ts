import { Container, Graphics, Rectangle } from 'pixi.js';
import { fishArt, frogArt, owlArt, penguinArt, turtleArt } from '../../art/animals';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, ink, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import type { LineId } from '../../content/voice-script';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  botTap, FRIEND_IDS, FRIENDS, galleryLayout, helpTargets, LEVELS, makeRound, planFor, requestHelp, startPlay, tap,
  type Feature, type FriendId, type Rect, type Reason, type WhoPlan, type WhoPlay, type WhoRound,
} from './logic';

const CARD_W = 200, CARD_H = 240;
const line = (color: number, width = 5) => ({ width, color, join: 'round' as const, cap: 'round' as const });

/** A friend standing with its feet on (0, 0), about 150 units tall. */
export function friendArt(id: FriendId): Container {
  const c = new Container();
  let art: Container;
  if (id === 'owl') { art = owlArt('brown'); art.scale.set(0.6); }
  else if (id === 'penguin') { art = penguinArt(); art.scale.set(1.8); art.y = -41 * 1.8; }
  else if (id === 'frog') { art = frogArt(); art.scale.set(1.7); art.y = -13 * 1.7; }
  else if (id === 'turtle') { art = turtleArt(130); art.y = -46; }
  else if (id === 'fish') { art = fishArt(swatch.blue); art.scale.set(1.6); art.y = -60; }
  else { art = new Critter(CRITTERS[id]); art.scale.set(0.6); }
  c.addChild(art);
  return c;
}

/** The picture on a clue sign, about 100 units across, centered on (0, 0). */
export function featureIcon(f: Feature): Graphics {
  const g = new Graphics();
  switch (f) {
    case 'feathers':
      g.moveTo(-30, 40).bezierCurveTo(-40, -10, 0, -50, 30, -46).bezierCurveTo(34, -10, 0, 30, -30, 40).fill(swatch.blue.light).stroke(line(swatch.blue.line, 4));
      g.moveTo(-36, 48).lineTo(24, -36).stroke(line(swatch.blue.line, 4));
      break;
    case 'fur':
      for (const [x, y, r] of [[-22, -10, 22], [10, -20, 24], [28, 6, 20], [-6, 14, 24], [-30, 18, 16], [18, 26, 16]]) g.circle(x, y, r).fill(swatch.brown.light).stroke(line(swatch.brown.line, 3));
      for (const [x, y] of [[-20, -8], [8, -18], [-4, 14], [24, 6]]) g.moveTo(x - 6, y + 4).quadraticCurveTo(x, y - 6, x + 6, y + 4).stroke(line(swatch.brown.line, 3));
      break;
    case 'shell':
      g.moveTo(-48, 24).arc(0, 24, 48, Math.PI, 0).closePath().fill(swatch.teal.fill).stroke(line(swatch.teal.line, 4));
      g.poly([-16, 4, 0, -10, 16, 4, 16, 20, -16, 20]).stroke(line(swatch.teal.line, 3));
      g.moveTo(-16, 4).lineTo(-36, 0).moveTo(16, 4).lineTo(36, 0).stroke(line(swatch.teal.line, 3));
      break;
    case 'scales':
      for (let r = 0; r < 3; r++) for (let k = -2; k <= 2; k++) {
        const x = k * 22 + (r % 2 ? 11 : 0), y = -24 + r * 22;
        if (Math.abs(x) > 46) continue;
        g.moveTo(x - 12, y).arc(x, y, 12, Math.PI, 0, true).stroke(line(swatch.blue.line, 4));
      }
      g.roundRect(-50, -40, 100, 76, 16).stroke(line(swatch.blue.fill, 3));
      break;
    case 'smooth-skin':
      g.ellipse(0, 6, 46, 32).fill(swatch.green.fill).stroke(line(swatch.green.line, 4));
      g.ellipse(-14, -4, 14, 6).fill({ color: 0xffffff, alpha: 0.6 });
      for (const [x, y] of [[-30, -36], [6, -42], [34, -30]]) g.moveTo(x, y - 10).quadraticCurveTo(x + 7, y + 2, x, y + 4).quadraticCurveTo(x - 7, y + 2, x, y - 10).fill(swatch.blue.light).stroke(line(swatch.blue.line, 2));
      break;
    case 'wings':
    case 'fly':
      g.moveTo(-40, 10).quadraticCurveTo(-10, -50, 44, -30).lineTo(30, -14).lineTo(40, -4).lineTo(22, 6).lineTo(28, 18).quadraticCurveTo(-10, 30, -40, 10).fill(swatch.yellow.fill).stroke(line(swatch.yellow.line, 4));
      if (f === 'fly') for (const y of [-20, 0, 20]) g.moveTo(-56, y + 14).lineTo(-44 - (y === 0 ? 10 : 0), y + 14).stroke(line(ink, 3));
      break;
    case 'beak':
      g.poly([-34, -24, 40, 0, -34, 24]).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      g.moveTo(-34, 0).lineTo(30, 0).stroke(line(swatch.orange.line, 3));
      break;
    case 'fins':
      g.moveTo(-40, 30).quadraticCurveTo(-30, -30, 30, -40).quadraticCurveTo(10, 0, 40, 30).closePath().fill(swatch.blue.fill).stroke(line(swatch.blue.line, 4));
      for (const t of [-20, 0, 18]) g.moveTo(-34, 26).lineTo(t, -24 + Math.abs(t) * 0.2).stroke(line(swatch.blue.line, 2));
      break;
    case 'four-legs':
    case 'two-legs': {
      const spots = f === 'four-legs' ? [[-24, -22], [24, -22], [-24, 26], [24, 26]] : [[-18, 2], [18, 2]];
      for (const [x, y] of spots) {
        g.ellipse(x, y + 4, 11, 13).fill(swatch.brown.fill);
        for (const dx of [-9, 0, 9]) g.circle(x + dx, y - 12, 4.5).fill(swatch.brown.fill);
      }
      break;
    }
    case 'eggs':
      g.ellipse(0, 4, 32, 42).fill(0xfff6e0).stroke(line(swatch.yellow.line, 4));
      g.ellipse(-10, -12, 8, 12).fill({ color: 0xffffff, alpha: 0.8 });
      break;
    case 'milk':
      g.moveTo(-10, 46).lineTo(10, 46).lineTo(18, -10).lineTo(-18, -10).closePath().fill(0xffffff).stroke(line(swatch.blue.line, 4));
      g.roundRect(-14, -24, 28, 14, 4).fill(swatch.pink.fill).stroke(line(swatch.pink.line, 3));
      g.moveTo(-6, -24).quadraticCurveTo(0, -46, 6, -24).fill(swatch.pink.light).stroke(line(swatch.pink.line, 3));
      g.moveTo(-14, 14).lineTo(14, 14).stroke(line(swatch.blue.light, 3));
      break;
    case 'gills':
      g.ellipse(0, 0, 46, 30).fill(swatch.orange.fill).stroke(line(swatch.orange.line, 4));
      for (const x of [-6, 6, 18]) g.moveTo(x, -18).quadraticCurveTo(x - 10, 0, x, 18).stroke(line(swatch.orange.line, 3));
      g.circle(-26, -6, 5).fill(ink);
      for (const [x, y, r] of [[40, -40, 6], [50, -54, 4]]) g.circle(x, y, r).stroke(line(swatch.blue.line, 2));
      break;
  }
  g.eventMode = 'none';
  return g;
}

/** A sign with a clue's picture and a small speaker mark, `w` wide. */
function signArt(f: Feature, w: number, h: number): Container {
  const c = new Container();
  c.addChild(new Graphics().roundRect(-w / 2, -h / 2, w, h, 18).fill(0xffffff).stroke(line(wood.line, 6)));
  const pic = featureIcon(f);
  pic.scale.set(Math.min(1, (h - 20) / 110));
  c.addChild(pic);
  if (w > 200) {
    const s = new Graphics().poly([0, -8, 8, -8, 18, -16, 18, 16, 8, 8, 0, 8]).fill(ink)
      .moveTo(24, -10).quadraticCurveTo(32, 0, 24, 10).stroke(line(ink, 3));
    s.position.set(w / 2 - 44, h / 2 - 26);
    c.addChild(s);
  }
  return c;
}

interface Card {
  friend: FriendId;
  node: Container;
  front: Container;
  back: Container;
  art: Container;
  base: number;
}

class WhoAmI implements Game {
  readonly plan: WhoPlan;
  readonly round: WhoRound;
  readonly play: WhoPlay;
  readonly cards: Card[] = [];
  readonly hintLabel = 'Show a hint';
  /** Waiting for a flip to finish, a clue to arrive or the jump-out: taps are ignored, never counted. */
  busy = true;
  private alive = true;
  private view: View;
  private readonly bg = new Graphics();
  private readonly glow = new Graphics();
  private readonly signHolder = new Container();
  private readonly strip = new Container();
  private sign: Container | null = null;
  private glowOn = false;
  private clock = 0;
  private botShowedMiss = false;
  private botHeard = -1;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    this.round = makeRound(this.plan.level, ctx.rng);
    this.play = startPlay(this.round, this.plan.mode);
    this.glow.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.glow, this.signHolder, this.strip);
    this.round.gallery.forEach((friend, i) => {
      const node = new Container();
      const front = new Container();
      front.addChild(tile(CARD_W, CARD_H, 'white'), new Graphics().ellipse(0, 86, 74, 16).fill(swatch.green.light));
      const art = friendArt(friend);
      art.y = 86;
      for (const k of art.children) if (k instanceof Critter) ctx.track(k);
      front.addChild(art);
      const back = new Container();
      const b = tile(CARD_W, CARD_H, 'purple');
      b.circle(0, 0, 58).fill(swatch.purple.light);
      back.addChild(b, label('?', 84, swatch.purple.line));
      back.visible = false;
      node.addChild(front, back);
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => void this.choose(i), { cooldown: 200 });
      ctx.stage.addChild(node);
      this.cards.push({ friend, node, front, back, art, base: 1 });
    });
    this.showSign();
  }

  private clueLine(f: Feature) { return `whoami.clue.${f}` as LineId; }
  private get clue(): Feature { return this.round.clues[this.play.clue]; }

  async start() {
    await this.ctx.say(this.plan.mode === 'fit' ? 'whoami.instruct-fit' : 'whoami.instruct-turn');
    if (!this.alive) return;
    this.busy = false;
    void this.ctx.instruct(this.clueLine(this.clue));
  }

  private showSign() {
    if (this.sign) this.sign.destroy({ children: true });
    const s = signArt(this.clue, 320, 130);
    s.eventMode = 'static';
    s.hitArea = new Rectangle(-160, -65, 320, 130);
    onTap(s, () => { sfx.tick(); void this.ctx.say(this.clueLine(this.clue)); });
    this.signHolder.addChild(s);
    this.sign = s;
    this.drawStrip();
    this.resize(this.view);
  }

  private drawStrip() {
    this.strip.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = galleryLayout(this.view, this.cards.length);
    for (let k = 0; k < this.play.clue; k++) {
      const f = this.round.clues[k], r = L.strip[k];
      const t = signArt(f, r.w, r.h);
      t.position.set(r.x + r.w / 2, r.y + r.h / 2);
      t.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(t, () => { sfx.tick(); void this.ctx.say(this.clueLine(f)); });
      this.strip.addChild(t);
    }
  }

  private async choose(i: number) {
    const card = this.cards[i];
    if (this.busy || this.play.done) return;
    const out = tap(this.play, i);
    if (out.kind === 'ignored') return;
    if (out.kind === 'peek') return void this.peek(card);
    if (out.kind === 'fit') return void this.finale(i);
    if (out.kind === 'miss') {
      sfx.boing();
      void this.wobble(card);
      const clue = this.play.clue;
      const line = out.reason ? this.reasonLine(out.reason) : null;
      if (line) await this.ctx.say(line.id, line.vars);
      else if (out.stays) await this.ctx.say('whoami.reason.stays', out.stays);
      if (!this.alive) return;
      // She may have finished the clue while the reason was spoken: the help belonged to that clue.
      if (out.helped && this.play.clue === clue && !this.play.done) this.showHelp();
      return;
    }
    // A flip. The last one of a clue holds every tap until the next clue has been given, so nothing is judged against a clue not yet shown.
    if (out.next || out.done) { this.busy = true; this.glowOn = false; }
    sfx.whoosh();
    await this.flip(card, true);
    if (!this.alive) return;
    if (out.done) return void this.finale(this.round.gallery.indexOf(this.round.answer));
    if (out.next) {
      await this.ctx.tw.wait(0.6);
      if (!this.alive) return;
      this.showSign();
      sfx.pop(9);
      if (this.sign) { this.sign.rotation = -0.3; void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 }); }
      await this.ctx.say('whoami.next-clue');
      if (!this.alive) return;
      this.busy = false;
      void this.ctx.instruct(this.clueLine(this.clue));
    }
  }

  private reasonLine(r: Reason): { id: LineId; vars: Record<string, string> } {
    if (r.kind === 'not') return { id: 'whoami.reason.not', vars: { name: r.name, has: r.has, clue: r.clue } };
    if (r.kind === 'no') return { id: 'whoami.reason.no', vars: { name: r.name, lacks: r.lacks } };
    return { id: 'whoami.reason.instead', vars: { name: r.name, lacks: r.lacks, has: r.has } };
  }

  private showHelp() {
    this.glowOn = true;
    void this.ctx.say(this.plan.mode === 'fit' ? 'whoami.hint-glow' : 'whoami.hint-shimmer');
  }

  /** The pause sheet's Show a hint: the same glow or shimmer, counted once per round (level 1) or clue; asked again it repeats the clue. */
  askForHint() {
    if (this.busy || this.play.done) return;
    if (requestHelp(this.play)) this.showHelp();
    else void this.ctx.say(this.clueLine(this.clue));
  }

  /** A keeps-tap or a wrong friend: a half-turn that comes straight back, not a flip. */
  private async wobble(card: Card) {
    const n = card.node, s = card.base;
    await this.ctx.tw.to(n.scale, { x: s * 0.4 }, { duration: 0.14 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: s }, { duration: 0.18 });
  }

  /** Turn a card over: face down (the friend waves first) or face up again. */
  private async flip(card: Card, down: boolean) {
    const n = card.node, s = card.base;
    const critter = card.art.children[0];
    if (down && critter instanceof Critter) critter.hop(0.5);
    await this.ctx.tw.to(n.scale, { x: 0, y: s }, { duration: 0.14 });
    if (!this.alive || n.destroyed) return;
    card.front.visible = !down; card.back.visible = down;
    await this.ctx.tw.to(n.scale, { x: s, y: s }, { duration: 0.14 });
  }

  /** A free look behind a face-down card: the friend shows for a second, and the card stays down. */
  private async peek(card: Card) {
    if (card.front.visible) return;
    sfx.pop(7);
    card.front.visible = true; card.back.visible = false;
    const critter = card.art.children[0];
    if (critter instanceof Critter) critter.hop(0.4);
    await this.ctx.tw.wait(1);
    if (!this.alive || this.play.done) return;
    card.front.visible = false; card.back.visible = true;
  }

  private async finale(i: number) {
    this.busy = true;
    this.glowOn = false;
    const card = this.cards[i];
    const friend = FRIENDS[card.friend];
    this.ctx.stage.addChild(card.node);
    sfx.marimba(7); void this.ctx.tw.wait(0.18).then(() => { if (this.alive) sfx.marimba(9); });
    const critter = card.art.children[0];
    if (critter instanceof Critter) critter.hop(1);
    void this.ctx.tw.to(card.node.scale, { x: card.base * 1.15, y: card.base * 1.15 }, { duration: 0.3 });
    this.ctx.particles.burst(card.node.x, card.node.y - 60, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    await this.ctx.say('whoami.its-me', { name: friend.name });
    if (!this.alive) return;
    // The hidden friends pop up and wave.
    await Promise.all(this.cards.filter((c) => c.back.visible).map((c) => this.flip(c, false)));
    if (!this.alive) return;
    for (const c of this.cards) { const k = c.art.children[0]; if (k instanceof Critter) k.hop(0.6); }
    await this.ctx.say('whoami.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.play.misses, hints: this.play.hints });
  }

  resize(v: View) {
    this.view = v;
    const L = galleryLayout(v, this.cards.length);
    const g = this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    // A plank floor and a curtain across the top: the barn's little stage.
    const floor = v.h * 0.72;
    g.rect(0, floor, v.w, v.h - floor).fill(wood.light);
    for (let y = floor + 40; y < v.h; y += 46) g.moveTo(0, y).lineTo(v.w, y).stroke({ width: 3, color: wood.line, alpha: 0.35 });
    g.rect(0, 0, v.w, 26).fill(swatch.red.fill);
    for (let x = 0; x < v.w; x += 80) g.moveTo(x, 26).quadraticCurveTo(x + 40, 62, x + 80, 26).fill(swatch.red.fill);
    if (this.sign) this.sign.position.set(L.sign.x + L.sign.w / 2, L.sign.y + L.sign.h / 2);
    this.cards.forEach((c, i) => {
      const r: Rect = L.cards[i];
      c.base = Math.min(r.w / CARD_W, r.h / CARD_H);
      if (!this.ctx.tw.busy(c.node.scale)) c.node.scale.set(c.base);
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    this.drawStrip();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.glowOn || this.play.done) return;
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * (this.plan.mode === 'fit' ? 4 : 7));
    for (const i of helpTargets(this.play)) {
      const n = this.cards[i].node, w = CARD_W * this.cards[i].base + 18, h = CARD_H * this.cards[i].base + 18;
      g.roundRect(n.x - w / 2, n.y - h / 2, w, h, 24).fill({ color: swatch.yellow.light, alpha: 0.5 * pulse }).stroke({ width: 8, color: swatch.yellow.fill, alpha: pulse });
    }
  }

  /** The ghost finger: tap the sign to hear each clue, then (level 1) one friend it does not fit and the one it does, or flip every friend it rules out. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.play.done || !this.sign) return null;
    if (this.botHeard !== this.play.clue) { this.botHeard = this.play.clue; return { tap: { on: this.sign } }; }
    const i = botTap(this.play, this.botShowedMiss);
    if (i === null) return null;
    if (this.plan.mode === 'fit' && this.round.gallery[i] !== this.round.answer) { this.botShowedMiss = true; return { tap: { on: this.cards[i].node }, pause: 2.6 }; }
    return { tap: { on: this.cards[i].node }, pause: 0.7 };
  }

  destroy() { this.alive = false; }
}

function cardIcon(friend: FriendId, mark: boolean): Container {
  const c = new Container();
  const back = tile(150, 180, 'purple');
  back.circle(0, 0, 44).fill(swatch.purple.light);
  const peeker = friendArt(friend);
  peeker.scale.set(0.7);
  peeker.y = -40;
  for (const k of peeker.children) if (k instanceof Critter) k.alive = false;
  c.addChild(peeker, back);
  if (mark) c.addChild(label('?', 64, swatch.purple.line));
  c.y = -100;
  const out = new Container();
  out.addChild(c);
  return out;
}

export const whoAmI: GameModule = {
  id: 'who-am-i',
  name: 'Who Am I?',
  titleLine: 'game.who-am-i',
  region: 'barnyard',
  skills: ['animals', 'attributes', 'classification', 'logic'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: 'Say the clue in your own words before the pet does, or act it out: flap for wings, waddle for two legs.',
  offScreen: 'In the car, think of an animal and let her ask what it has.',
  hubIcon: () => new WigglyIcon(cardIcon('duck', true)),
  sticker: (seed) => cardIcon(new Rng(seed).pick(FRIEND_IDS), false),
  create: (ctx) => new WhoAmI(ctx),
};
