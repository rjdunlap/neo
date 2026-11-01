import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { cream, grass, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { cardCritter, claimSign, crateArt, everyMark, postArt, stampArt, type SignMark } from './art';
import {
  CARD_H, CARD_W, LEVELS, makeRound, MEND_H, MEND_W, notAlwaysLayout, Play, planFor, SIGN_H, SIGN_W, STAMP,
  type Claim, type Outcome, type Phase, type Plan, type Rect,
} from './logic';

const FRIENDS = ['cat', 'bear', 'dog', 'bunny', 'pig'] as const;
const CARD_SCALE = 0.45;
/** Each level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

const claimLine = (c: Claim) => `notalways.${c.q}.${c.attr}` as LineId;

interface CardNode { node: Container; critter: Critter; ring: Graphics; base: number }

class NotAlways implements Game {
  readonly plan: Plan;
  readonly play: Play;
  readonly hintLabel = 'Show me';
  /** Between claims, or while a break or a stamp is being shown: taps wait, never counted. */
  busy = true;
  private alive = true;
  private finished = false;
  private view: View;
  private clock = 0;
  private readonly bg = new Graphics();
  private readonly glow = new Graphics();
  private readonly post = new Container();
  private readonly signHolder = new Container();
  private readonly friendNode = new Container();
  private readonly friend: Critter;
  private readonly cards: CardNode[] = [];
  private readonly stamp: Container | null = null;
  private readonly mendHolder = new Container();
  private mendNodes: Container[] = [];
  private sign: Container | null = null;
  private reading = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(this.plan.level);
    authoredShown.add(this.plan.level);
    this.play = new Play(makeRound(this.plan.level, ctx.rng, authored));
    this.glow.eventMode = 'none';

    // The friend on its crate; tapping it repeats the claim.
    this.friend = ctx.track(new Critter(CRITTERS[ctx.rng.pick(FRIENDS)]));
    this.friend.scale.set(0.6);
    this.friendNode.addChild(crateArt(), this.friend);
    this.friendNode.eventMode = 'static';
    this.friendNode.hitArea = new Rectangle(-80, -150, 160, 196);
    onTap(this.friendNode, () => this.repeat(), { cooldown: 300 });

    ctx.stage.addChild(this.bg, this.post, this.friendNode, this.signHolder);

    this.play.round.cards.forEach((c, i) => {
      const node = new Container();
      const critter = cardCritter(c, CARD_SCALE);
      critter.y = 76;
      const ring = new Graphics().circle(0, 0, 84).stroke({ width: 8, color: swatch.red.fill });
      ring.visible = false;
      node.addChild(tile(CARD_W, CARD_H, 'white'), new Graphics().ellipse(0, 76, 52, 10).fill(grass), critter, ring);
      node.eventMode = 'static';
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => void this.tapCard(i), { cooldown: 250 });
      ctx.stage.addChild(node);
      this.cards.push({ node, critter, ring, base: 1 });
    });

    if (this.plan.mode === 'stamp') {
      const s = stampArt(STAMP);
      s.eventMode = 'static';
      s.hitArea = new Rectangle(-STAMP / 2, -STAMP / 2, STAMP, STAMP);
      onTap(s, () => void this.pressStamp(), { cooldown: 300 });
      ctx.stage.addChild(s);
      this.stamp = s;
    }
    // The glow sits over everything and never takes a touch itself.
    ctx.stage.addChild(this.mendHolder, this.glow);
    this.showSign(this.play.current);
    this.resize(this.view);
  }

  async start() {
    await this.ctx.say(`notalways.instruct.${this.plan.level}` as LineId);
    if (!this.alive) return;
    this.busy = false;
    void this.ctx.instruct(claimLine(this.play.current));
  }

  // The sign -------------------------------------------------------------------------------------------------------

  private showSign(claim: Claim, mark?: SignMark) {
    this.sign?.destroy({ children: true });
    const s = claimSign(claim, SIGN_W, SIGN_H, mark);
    s.eventMode = 'static';
    s.hitArea = new Rectangle(-SIGN_W / 2, -SIGN_H / 2, SIGN_W, SIGN_H);
    onTap(s, () => this.repeat(), { cooldown: 300 });
    this.signHolder.addChild(s);
    this.sign = s;
    const L = notAlwaysLayout(this.view, this.plan.level);
    s.position.set(L.sign.x + L.sign.w / 2, L.sign.y + L.sign.h / 2);
  }

  /** The friend or the sign: hear the claim again (or the mended signs), never counted. */
  private repeat() {
    if (this.play.phase === 'done' || this.finished) return;
    sfx.tick();
    this.friend.poke();
    if (this.busy) return;
    if (this.play.phase === 'mend') void this.readMends();
    else void this.ctx.say(claimLine(this.play.current));
  }

  // Answers --------------------------------------------------------------------------------------------------------

  private async tapCard(i: number) {
    const card = this.cards[i];
    if (this.busy || this.finished) return;
    if (this.play.phase === 'mend') { sfx.tick(); return void this.nod(card); }
    // Touch-down: the card lifts and the friend leans to look.
    void this.lift(card);
    this.friend.rotation = (card.node.x < this.friendNode.x ? -1 : 1) * 0.08;
    void this.ctx.tw.to(this.friend, { rotation: 0 }, { duration: 0.5 });
    const claim = this.play.current;
    const out = this.play.tapCard(i);
    if (out.kind === 'break') return void this.broken(i, claim, out);
    if (out.kind === 'miss') {
      sfx.boing();
      void this.nod(card);
      await this.ctx.say(`notalways.${out.why === 'too' ? 'too' : 'fits'}.${claim.attr}` as LineId);
      if (this.alive && out.glow) void this.ctx.say('notalways.hint');
    }
  }

  private async broken(i: number, claim: Claim, out: Extract<Outcome, { kind: 'break' }>) {
    this.busy = true;
    const card = this.cards[i];
    sfx.whoosh();
    card.ring.visible = true;
    card.critter.hop(0.6);
    this.friend.poke();
    this.showSign(claim, 'not-all');
    sfx.pop(9);
    await this.ctx.say(`notalways.breaks.${claim.attr}` as LineId);
    if (!this.alive) return;
    this.friend.cheer();
    await this.ctx.say('notalways.oops');
    if (!this.alive) return;
    await this.next(out.next);
  }

  private async pressStamp() {
    if (this.busy || this.finished || !this.stamp) return;
    const s = this.stamp;
    s.scale.set(0.9);
    void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.25 });
    const out = this.play.stamp();
    if (out.kind === 'every') {
      this.busy = true;
      sfx.marimba(7);
      const m = everyMark();
      this.sign?.addChild(m);
      m.scale.set(1.4);
      void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.25 });
      for (const c of this.cards) c.critter.hop(0.4);
      await this.ctx.say('notalways.every');
      if (!this.alive) return;
      return void this.next(out.next);
    }
    if (out.kind === 'miss') {
      sfx.boing();
      await this.ctx.say('notalways.again');
      if (this.alive && out.glow) void this.ctx.say('notalways.hint');
    }
  }

  private async chooseMend(j: number) {
    if (this.busy || this.finished || this.play.phase !== 'mend') return;
    const option = this.play.options[j];
    const node = this.mendNodes[j];
    node.scale.set(0.94);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    const out = this.play.chooseMend(j);
    if (out.kind === 'mended') {
      this.busy = true;
      sfx.marimba(9);
      this.showSign(option);
      this.friend.cheer();
      await this.ctx.say('notalways.mend.right');
      if (!this.alive) return;
      return void this.next(out.next);
    }
    if (out.kind === 'miss' && out.card !== null) {
      sfx.boing();
      const card = this.cards[out.card];
      void this.nod(card);
      // The friend points at the card that breaks the chosen sign.
      const line = option.q === 'every' ? `notalways.breaks.${option.attr}` : `notalways.fits.${option.attr}`;
      await this.ctx.say(line as LineId);
      if (this.alive && out.glow) void this.ctx.say('notalways.hint');
    }
  }

  /** After a claim or a mend: the mended signs, the next claim, or the end of the round. */
  private async next(phase: Phase) {
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    for (const c of this.cards) c.ring.visible = false;
    this.clearMends();
    if (phase === 'done') return void this.finale();
    if (phase === 'mend') {
      this.showMends();
      this.busy = false;
      return void this.readMends();
    }
    this.showSign(this.play.current);
    sfx.pop(7);
    if (this.sign) { this.sign.rotation = -0.25; void this.ctx.tw.to(this.sign, { rotation: 0 }, { duration: 0.4 }); }
    this.busy = false;
    void this.ctx.instruct(claimLine(this.play.current));
  }

  // The mended signs (level 3) ------------------------------------------------------------------------------------

  private showMends() {
    const L = notAlwaysLayout(this.view, this.plan.level);
    this.mendNodes = this.play.options.map((c, j) => {
      const n = claimSign(c, MEND_W, MEND_H);
      n.eventMode = 'static';
      n.hitArea = new Rectangle(-MEND_W / 2, -MEND_H / 2, MEND_W, MEND_H);
      onTap(n, () => void this.chooseMend(j), { cooldown: 250 });
      const r = L.mends[j];
      n.position.set(r.x + r.w / 2, r.y + r.h / 2);
      this.mendHolder.addChild(n);
      return n;
    });
  }

  private clearMends() {
    this.mendHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.mendNodes = [];
  }

  /** The friend reads each mended sign as it lifts; stops when she has chosen. */
  private async readMends() {
    const claim = this.play.claim, reading = ++this.reading;
    // A newer reading (the friend tapped again) or her choice stops this one.
    const still = () => this.alive && this.reading === reading && this.play.phase === 'mend' && this.play.claim === claim;
    await this.ctx.say('notalways.mends');
    for (let j = 0; j < this.mendNodes.length; j++) {
      if (!still()) return;
      const n = this.mendNodes[j];
      void this.ctx.tw.to(n, { y: n.y - 10 }, { duration: 0.15 }).then(() => { if (!n.destroyed) void this.ctx.tw.to(n, { y: n.y + 10 }, { duration: 0.2 }); });
      await this.ctx.say(claimLine(this.play.options[j]));
    }
  }

  // Help -----------------------------------------------------------------------------------------------------------

  /** The pause sheet's Show me: the same glow as two misses, counted once per claim or mend; asked again it repeats the claim. */
  askForHint() {
    if (this.busy || this.finished || this.play.phase === 'done') return;
    if (this.play.requestHint()) void this.ctx.say('notalways.hint');
    else this.repeat();
  }

  private targetNode(): Container | null {
    const t = this.play.target();
    if (!t) return null;
    if (t.kind === 'card') return this.cards[t.i].node;
    if (t.kind === 'stamp') return this.stamp;
    return this.mendNodes[t.j] ?? null;
  }

  // Motion ---------------------------------------------------------------------------------------------------------

  private async lift(card: CardNode) {
    const n = card.node;
    if (this.ctx.tw.busy(n.scale)) return;
    await this.ctx.tw.to(n.scale, { x: card.base * 1.06, y: card.base * 1.06 }, { duration: 0.08 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n.scale, { x: card.base, y: card.base }, { duration: 0.16 });
  }

  /** The card nods: it fits the claim, so it shows its part. */
  private async nod(card: CardNode) {
    card.critter.hop(0.35);
    const n = card.node;
    await this.ctx.tw.to(n, { rotation: 0.06 }, { duration: 0.1 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: -0.06 }, { duration: 0.14 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.1 });
  }

  private async finale() {
    if (this.finished) return;
    this.finished = true;
    this.busy = true;
    sfx.marimba(7); void this.ctx.tw.wait(0.18).then(() => { if (this.alive) sfx.marimba(9); });
    this.friend.cheer();
    for (const c of this.cards) c.critter.hop(0.6);
    this.ctx.particles.burst(this.friendNode.x, this.friendNode.y - 80, { kind: 'star', colors: [0xffffff, 0xfff3a0], count: 14, speed: [100, 260], gravity: 0, life: [0.5, 0.9] });
    await this.ctx.say('notalways.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.play.misses, hints: this.play.hints });
  }

  resize(v: View) {
    this.view = v;
    const L = notAlwaysLayout(v, this.plan.level);
    const g = this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    // A grassy grove floor under the cards and a ribbon of leaves across the top.
    const floor = L.foot.y + 20;
    g.rect(0, floor, v.w, v.h - floor).fill(grass);
    for (let x = 0; x < v.w; x += 70) g.ellipse(x + 35, 6, 42, 20).fill(swatch.green.light);
    this.sign?.position.set(L.sign.x + L.sign.w / 2, L.sign.y + L.sign.h / 2);
    this.post.removeChildren().forEach((c) => c.destroy());
    const p = postArt(L.foot.y - (L.sign.y + L.sign.h));
    p.position.set(L.foot.x + 62, L.sign.y + L.sign.h);
    this.post.addChild(p);
    this.friendNode.position.set(L.foot.x, L.foot.y);
    this.cards.forEach((c, i) => {
      const r: Rect = L.cards[i];
      c.base = Math.min(r.w / CARD_W, r.h / CARD_H);
      if (!this.ctx.tw.busy(c.node.scale)) c.node.scale.set(c.base);
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    if (this.stamp && L.stamp) this.stamp.position.set(L.stamp.x + L.stamp.w / 2, L.stamp.y + L.stamp.h / 2);
    this.mendNodes.forEach((n, j) => { const r = L.mends[j]; n.position.set(r.x + r.w / 2, r.y + r.h / 2); });
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (!this.play.glowing || this.busy || this.finished) return;
    const n = this.targetNode();
    if (!n) return;
    const b = n.getLocalBounds();
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 4);
    const w = b.width * n.scale.x + 18, h = b.height * n.scale.y + 18;
    const cx = n.x + (b.x + b.width / 2) * n.scale.x, cy = n.y + (b.y + b.height / 2) * n.scale.y;
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 22).stroke({ width: 8, color: swatch.yellow.fill, alpha: pulse });
  }

  /** The ghost finger: tap what answers the claim (the first breaker or the stamp), then at level 3 the true mended sign. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const n = this.targetNode();
    return n ? { tap: { on: n }, pause: 1.2 } : null;
  }

  destroy() { this.alive = false; }
}

/** The friend on its crate holding up a flipped card with a ring round its creature. */
function friendPicture(seed: number, withCard: boolean): Container {
  const rng = new Rng(seed);
  const c = new Container();
  const crate = crateArt(130, 40);
  const k = new Critter(CRITTERS[rng.pick(FRIENDS)]);
  k.alive = false;
  k.scale.set(0.5);
  c.addChild(crate, k);
  if (withCard) {
    const card = new Container();
    const sub = cardCritter({ color: rng.pick(['red', 'blue', 'yellow'] as const), hat: false, wings: rng.chance(0.5), spots: rng.chance(0.5) }, 0.3);
    sub.y = 40;
    card.addChild(tile(90, 110, 'white'), sub, new Graphics().circle(0, 0, 48).stroke({ width: 6, color: swatch.red.fill }));
    card.position.set(70, -110);
    card.rotation = 0.12;
    c.addChild(card);
  }
  c.y = 30;
  const out = new Container();
  out.addChild(c);
  return out;
}

function hubPicture(): Container {
  const c = new Container();
  const crate = crateArt(120, 40);
  crate.y = 30;
  const sign = claimSign({ q: 'every', attr: 'hat' }, 150, 80);
  sign.y = -40;
  c.addChild(new Graphics().rect(-5, -10, 10, 42).fill(wood.fill).stroke({ width: 3, color: wood.line }), crate, sign);
  return c;
}

export const notAlways: GameModule = {
  id: 'not-always',
  name: 'Not Always',
  titleLine: 'game.not-always',
  region: 'story-grove',
  skills: ['reasoning', 'claims', 'counterexamples', 'listening'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint: "Take turns being the friend: one of you says something about all the cards, like 'all of these have hats', and the other finds the one that isn't.",
  offScreen: "Line up some toys and say something about all of them, like 'all of these are soft'. Can she find one that isn't?",
  hubIcon: () => new WigglyIcon(hubPicture()),
  sticker: (seed) => friendPicture(seed, true),
  create: (ctx) => new NotAlways(ctx),
};
