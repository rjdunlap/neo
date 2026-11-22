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
import {
  cardCritter,
  claimSign,
  crateArt,
  everyMark,
  frameArt,
  postArt,
  replyArt,
  responseArt,
  sceneArt,
  stampArt,
  whySign,
  type SignMark,
} from './art';
import {
  CARD_H,
  CARD_W,
  LEVELS,
  makeRound,
  MEND_H,
  breakers,
  members,
  MEND_W,
  notAlwaysLayout,
  Play,
  planFor,
  REPLY_H,
  REPLY_W,
  RESPONSE_H,
  RESPONSE_W,
  rightSpeaker,
  STAMP,
  trueClaim,
  trueMend,
  type Card,
  type Claim,
  type Outcome,
  type Phase,
  type Plan,
  type Rect,
  type Why,
} from './logic';

const FRIENDS = ['cat', 'bear', 'dog', 'bunny', 'pig'] as const;
const CARD_SCALE = 0.45;
/** Each level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();

const claimLine = (c: Claim) =>
  (c.if ? `notalways.if.${c.if}.${c.attr}` : `notalways.${c.q}.${c.attr}`) as LineId;
const whyLine = (w: Why, k: 0 | 1) => `notalways.why.${w.scene}.${k}` as LineId;
const responseLine = (w: Why, r: string) =>
  (r === 'evidence'
    ? `notalways.why.${w.scene}.evidence`
    : r === 'sure'
      ? 'notalways.why.sure'
      : `notalways.why.${w.scene}.again`) as LineId;

interface CardNode {
  node: Container;
  critter: Critter;
  ring: Graphics;
  base: number;
}
interface Speaker {
  node: Container;
  critter: Critter;
  sign: Container;
}

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
  private readonly cardHolder = new Container();
  cards: CardNode[] = [];
  /** The prompt whose row is dealt (levels 4–6 deal a new row per prompt). */
  private dealt = -1;
  readonly stamp: Container | null = null;
  private readonly mendHolder = new Container();
  private mendNodes: Container[] = [];
  /** The claim signs up now: one, or level 6's two. */
  signs: Container[] = [];
  // Level 5: the two speakers, the scene and the three responses.
  speakers: Speaker[] = [];
  private readonly whyHolder = new Container();
  private scene: Container | null = null;
  private sceneMarks: { x: number; y: number }[] = [];
  private readonly trace = new Graphics();
  private traceUntil = 0;
  responseNodes: Container[] = [];
  // Level 6: the reply bubbles.
  replyNodes: Container[] = [];
  private readonly replyHolder = new Container();
  private reading = 0;
  /**
   * The next claim's read-out (or level 3's mended signs read out), waiting behind the last answer's lines (U7 R4);
   * `askGen` drops a stale wait.
   */
  unasked = false;
  private askGen = 0;
  /** Bumped by anything she does, so a chained line (`breaks`, then `oops`) never starts over her newer one. */
  private chain = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(this.plan.level);
    authoredShown.add(this.plan.level);
    this.play = new Play(makeRound(this.plan.level, ctx.rng, authored));
    this.glow.eventMode = 'none';
    this.trace.eventMode = 'none';

    // The friend on its crate; tapping it repeats the claim. Level 5 has two speakers instead.
    this.friend = ctx.track(new Critter(CRITTERS[ctx.rng.pick(FRIENDS)]));
    this.friend.scale.set(0.6);
    this.friendNode.addChild(crateArt(), this.friend);
    this.friendNode.eventMode = 'static';
    this.friendNode.hitArea = new Rectangle(-80, -150, 160, 196);
    onTap(this.friendNode, () => this.repeat(), { cooldown: 300 });
    const why = this.plan.mode === 'why';
    this.friendNode.visible = this.post.visible = !why;

    ctx.stage.addChild(this.bg, this.post, this.friendNode, this.signHolder, this.cardHolder, this.whyHolder);

    if (why) {
      const kinds = ctx.rng.shuffle([...FRIENDS]).slice(0, 2);
      this.speakers = kinds.map((kind, s) => {
        const node = new Container();
        const critter = ctx.track(new Critter(CRITTERS[kind]));
        critter.scale.set(0.42);
        node.eventMode = 'static';
        onTap(node, () => this.repeat(s), { cooldown: 300 });
        node.addChild(critter);
        this.signHolder.addChild(node);
        return { node, critter, sign: new Container() };
      });
    } else this.deal();

    const stamped = ['stamp', 'filter', 'both'].includes(this.plan.mode);
    if (stamped) {
      const s = stampArt(STAMP);
      s.eventMode = 'static';
      s.hitArea = new Rectangle(-STAMP / 2, -STAMP / 2, STAMP, STAMP);
      onTap(s, () => void this.pressStamp(), { cooldown: 300 });
      ctx.stage.addChild(s);
      this.stamp = s;
    }
    // The glow sits over everything and never takes a touch itself.
    ctx.stage.addChild(this.mendHolder, this.replyHolder, this.trace, this.glow);
    if (why) this.showWhy();
    else this.showSigns();
    this.resize(this.view);
  }

  async start() {
    await this.ctx.say(`notalways.instruct.${this.plan.level}` as LineId);
    if (!this.alive) return;
    this.busy = false;
    this.readOut();
  }

  // The row of cards -----------------------------------------------------------------------------------------------

  /** Lays out the current prompt's row: once at levels 1–3, again for each prompt at levels 4 and 6. */
  private deal() {
    if (this.dealt === this.play.claim && this.cards.length) return;
    this.dealt = this.play.claim;
    for (const c of this.cards) {
      this.ctx.tw.kill(c.node);
      this.ctx.tw.kill(c.node.scale);
      c.node.destroy({ children: true });
    }
    this.cards = this.play.row.map((c: Card, i) => {
      const node = new Container();
      const critter = cardCritter(c, CARD_SCALE);
      critter.y = 76;
      const ring = new Graphics().circle(0, 0, 84).stroke({ width: 8, color: swatch.red.fill });
      ring.visible = false;
      node.addChild(tile(CARD_W, CARD_H, 'white'));
      if (c.shape) {
        const f = frameArt(c.shape);
        f.y = -6;
        node.addChild(f);
      }
      node.addChild(new Graphics().ellipse(0, 76, 52, 10).fill(grass), critter, ring);
      node.eventMode = 'static';
      node.hitArea = new Rectangle(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H);
      onTap(node, () => void this.tapCard(i), { cooldown: 250 });
      this.cardHolder.addChild(node);
      return { node, critter, ring, base: 1 };
    });
    if (this.view) this.resize(this.view);
  }

  // The signs ------------------------------------------------------------------------------------------------------

  /** Puts up the current claim signs (`marks` per sign, for a broken or stamped one). */
  private showSigns(marks: (SignMark | undefined)[] = []) {
    for (const s of this.signs) s.destroy({ children: true });
    const L = notAlwaysLayout(this.view, this.plan.level);
    this.signs = this.play.signs.map((claim, k) => {
      const r = L.signs[k];
      const s = claimSign(claim, r.w, r.h, marks[k]);
      s.eventMode = 'static';
      s.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
      onTap(s, () => this.repeat(k), { cooldown: 300 });
      this.signHolder.addChild(s);
      s.position.set(r.x + r.w / 2, r.y + r.h / 2);
      return s;
    });
  }

  /** Changes one sign (a broken claim's not-all mark) and leaves the others. */
  private markSign(k: number, mark: SignMark) {
    const claim = this.play.round.prompts ? this.play.round.prompts[this.dealt]?.claims[k] : undefined;
    const old = this.signs[k];
    const c = claim ?? this.lastClaim;
    if (!old || !c) return;
    const L = notAlwaysLayout(this.view, this.plan.level);
    const r = L.signs[k];
    const s = claimSign(c, r.w, r.h, mark);
    s.position.copyFrom(old.position);
    this.signHolder.addChild(s);
    old.destroy({ children: true });
    this.signs[k] = s;
  }
  private lastClaim: Claim | null = null;

  /** The friend or a sign (`k`): hear the claim again (or the mended signs, the replies), never counted. */
  private repeat(k?: number) {
    if (this.play.phase === 'done' || this.finished) return;
    sfx.tick();
    if (this.plan.mode === 'why' && k !== undefined) this.speakers[k]?.critter.poke();
    else this.friend.poke();
    if (this.busy) return;
    this.chain++;
    if (this.askNow()) return;
    const why = this.play.prompt?.why;
    if (why && k !== undefined) return void this.ctx.say(whyLine(why, why.says[k]));
    if (this.play.phase === 'claim' && k !== undefined && this.play.signs[k])
      return void this.ctx.say(claimLine(this.play.signs[k]));
    this.readOut();
  }

  // Answers --------------------------------------------------------------------------------------------------------

  private async tapCard(i: number) {
    const card = this.cards[i];
    if (this.busy || this.finished || !card) return;
    this.chain++;
    if (this.play.phase !== 'claim') {
      sfx.tick();
      this.askNow();
      return void this.nod(card);
    }
    if (this.unasked) {
      // A tap before she has heard the claim: a card that breaks it goes ahead; another hears the claim, not a miss.
      if (!this.play.signs.some((c) => breakers(this.play.row, c).includes(i))) {
        void this.lift(card);
        return void this.askNow();
      }
      this.dropAsk();
    }
    // Touch-down: the card lifts and the friend leans to look.
    void this.lift(card);
    this.friend.rotation = (card.node.x < this.friendNode.x ? -1 : 1) * 0.08;
    void this.ctx.tw.to(this.friend, { rotation: 0 }, { duration: 0.5 });
    const claims = [...this.play.signs];
    const out = this.play.tapCard(i);
    if (out.kind === 'break') return void this.broken(i, claims[out.sign], out);
    if (out.kind === 'miss') {
      sfx.boing();
      void this.nod(card);
      const c = claims[0];
      const line =
        out.why === 'outside'
          ? `notalways.only.${c.if}`
          : this.plan.mode === 'both'
            ? 'notalways.fitsboth'
            : `notalways.${out.why === 'too' ? 'too' : 'fits'}.${c.attr}`;
      await this.ctx.say(line as LineId);
      if (this.alive && out.glow) void this.sayHint();
    }
  }

  private async broken(i: number, claim: Claim, out: Extract<Outcome, { kind: 'break' }>) {
    this.busy = true;
    const card = this.cards[i];
    sfx.whoosh();
    card.ring.visible = true;
    card.critter.hop(0.6);
    this.friend.poke();
    this.lastClaim = claim;
    this.markSign(out.sign, 'not-all');
    sfx.pop(9);
    // The lesson and the friend's oops start as one sequence, and the next claim follows with input open (U7 R4).
    const chain = ++this.chain;
    const said = this.ctx.say(`notalways.breaks.${claim.attr}` as LineId).then(() => {
      if (!this.alive || chain !== this.chain) return;
      this.friend.cheer();
      return this.ctx.say(this.plan.mode === 'both' ? 'notalways.still' : 'notalways.oops');
    });
    await this.next(out.next, said);
  }

  private async pressStamp() {
    if (this.busy || this.finished || !this.stamp || this.play.phase !== 'claim') return;
    const s = this.stamp;
    s.scale.set(0.9);
    void this.ctx.tw.to(s.scale, { x: 1, y: 1 }, { duration: 0.25 });
    this.chain++;
    if (this.unasked) {
      // The stamp before she has heard the claim: on a true claim it goes ahead; otherwise she hears the claim, not a miss.
      if (!this.play.allTrue) return void this.askNow();
      this.dropAsk();
    }
    const row = this.play.row,
      claims = [...this.play.signs];
    const out = this.play.stamp();
    if (out.kind === 'every') {
      this.busy = true;
      sfx.marimba(7);
      for (const sign of this.signs) {
        const m = everyMark();
        sign.addChild(m);
        m.scale.set(1.4);
        void this.ctx.tw.to(m.scale, { x: 1, y: 1 }, { duration: 0.25 });
      }
      // The cards the claims talk about hop: at level 4 only the group.
      const hop = new Set(claims.flatMap((c) => members(row, c)));
      this.cards.forEach((c, i) => hop.has(i) && c.critter.hop(0.4));
      return void this.next(
        out.next,
        this.ctx.say(this.plan.mode === 'both' ? 'notalways.both' : 'notalways.every'),
      );
    }
    if (out.kind === 'miss') {
      sfx.boing();
      await this.ctx.say('notalways.again');
      if (this.alive && out.glow) void this.sayHint();
    }
  }

  private async chooseMend(j: number) {
    if (this.busy || this.finished || this.play.phase !== 'mend') return;
    const option = this.play.options[j];
    const node = this.mendNodes[j];
    node.scale.set(0.94);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    this.chain++;
    if (this.unasked) {
      // A sign chosen before the friend has read them out: the true one goes ahead; another hears them read, not a miss.
      if (j !== trueMend(this.play.round.cards, this.play.options)) return void this.askNow();
      this.dropAsk();
    }
    const out = this.play.chooseMend(j);
    if (out.kind === 'mended') {
      this.busy = true;
      sfx.marimba(9);
      this.lastClaim = option;
      for (const s of this.signs) s.destroy({ children: true });
      this.signs = [];
      const L = notAlwaysLayout(this.view, this.plan.level);
      const s = claimSign(option, L.sign.w, L.sign.h);
      s.position.set(L.sign.x + L.sign.w / 2, L.sign.y + L.sign.h / 2);
      this.signHolder.addChild(s);
      this.signs = [s];
      this.friend.cheer();
      return void this.next(out.next, this.ctx.say('notalways.mend.right'));
    }
    if (out.kind === 'miss' && out.card !== null) {
      sfx.boing();
      const card = this.cards[out.card];
      void this.nod(card);
      // The friend points at the card that breaks the chosen sign.
      const line = option.q === 'every' ? `notalways.breaks.${option.attr}` : `notalways.fits.${option.attr}`;
      await this.ctx.say(line as LineId);
      if (this.alive && out.glow) void this.sayHint();
    }
  }

  // Level 5: Show me why -------------------------------------------------------------------------------------------

  /** Puts up the current scene: the two speakers' signs, the scene panel and the three response cards. */
  private showWhy() {
    const why = this.play.prompt?.why;
    if (!why) return;
    this.whyHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = notAlwaysLayout(this.view, this.plan.level);
    this.speakers.forEach((_, s) => this.setSpeakerSign(s, why.says[s]));
    const sc = L.scene!;
    const art = sceneArt(why, sc.w, sc.h);
    this.scene = art.node;
    this.sceneMarks = art.marks;
    this.whyHolder.addChild(art.node);
    this.responseNodes = why.responses.map((r, j) => {
      const n = responseArt(r, RESPONSE_W, RESPONSE_H);
      n.eventMode = 'static';
      n.hitArea = new Rectangle(-RESPONSE_W / 2, -RESPONSE_H / 2, RESPONSE_W, RESPONSE_H);
      onTap(n, () => void this.chooseWhy(j), { cooldown: 250 });
      this.whyHolder.addChild(n);
      return n;
    });
    this.resize(this.view);
  }

  /** A speaker's sign shows claim `k`: its portrait on the left, the claim's picture on the right, one tap region. */
  private setSpeakerSign(s: number, k: 0 | 1) {
    const why = this.play.prompt?.why;
    const sp = this.speakers[s];
    if (!why || !sp) return;
    const L = notAlwaysLayout(this.view, this.plan.level);
    const r = L.signs[s];
    sp.sign.destroy({ children: true });
    const sign = whySign(why, k, r.w * 0.6, r.h - 20);
    sign.x = r.w * 0.18;
    sp.sign = sign;
    sp.node.addChildAt(sign, 0);
    sp.node.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    sp.critter.position.set(-r.w * 0.3, r.h / 2 - 12);
  }

  private async chooseWhy(j: number) {
    if (this.busy || this.finished || this.play.phase !== 'claim') return;
    const why = this.play.prompt?.why;
    const node = this.responseNodes[j];
    if (!why || !node) return;
    node.scale.set(0.94);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    this.chain++;
    if (this.unasked) {
      if (why.responses[j] !== 'evidence') return void this.askNow();
      this.dropAsk();
    }
    const out = this.play.chooseWhy(j);
    if (out.kind === 'shown') {
      this.busy = true;
      sfx.marimba(9);
      // The evidence flips open and traces the pan, the ends or the shells in the scene.
      node.scale.x = 0.05;
      void this.ctx.tw.to(node.scale, { x: 1 }, { duration: 0.3 });
      this.traceUntil = this.clock + 2.5;
      const wrong = 1 - rightSpeaker(why);
      const chain = ++this.chain;
      const said = this.ctx.say(responseLine(why, 'evidence')).then(() => {
        if (!this.alive || chain !== this.chain) return;
        this.speakers[wrong]?.critter.cheer();
        this.setSpeakerSign(wrong, trueClaim(why));
        return this.ctx.say('notalways.why.seeit');
      });
      return void this.next(out.next, said);
    }
    if (out.kind === 'miss') {
      sfx.boing();
      await this.ctx.say(out.why === 'sure' ? 'notalways.why.sure.miss' : 'notalways.why.again.miss');
      if (this.alive && out.glow) void this.sayHint();
    }
  }

  /** The two claims in turn, then the question and the three responses, each lifting as it is read. */
  private async readWhy() {
    const why = this.play.prompt?.why;
    if (!why) return;
    const claim = this.play.claim,
      reading = ++this.reading;
    const still = () =>
      this.alive && this.reading === reading && this.play.claim === claim && this.play.phase === 'claim';
    for (let s = 0; s < 2; s++) {
      if (!still()) return;
      this.bob(this.speakers[s].node);
      await this.ctx.say(whyLine(why, why.says[s]));
    }
    if (!still()) return;
    await this.ctx.instruct('notalways.why.responses');
    for (let j = 0; j < this.responseNodes.length; j++) {
      if (!still()) return;
      this.bob(this.responseNodes[j]);
      await this.ctx.say(responseLine(why, why.responses[j]));
    }
  }

  // Level 6: the reply scene ---------------------------------------------------------------------------------------

  private showReplies() {
    this.cardHolder.visible = false;
    if (this.stamp) this.stamp.visible = false;
    const L = notAlwaysLayout(this.view, this.plan.level);
    this.replyNodes = (this.play.round.replies ?? []).map((r, j) => {
      const n = replyArt(r, REPLY_W, REPLY_H);
      n.eventMode = 'static';
      n.hitArea = new Rectangle(-REPLY_W / 2, -REPLY_H / 2, REPLY_W, REPLY_H);
      onTap(n, () => void this.chooseReply(j), { cooldown: 300 });
      const rr = L.replies[j];
      n.position.set(rr.x + rr.w / 2, rr.y + rr.h / 2);
      this.replyHolder.addChild(n);
      return n;
    });
  }

  private clearReplies() {
    this.replyHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.replyNodes = [];
    this.cardHolder.visible = true;
    if (this.stamp) this.stamp.visible = true;
  }

  private async readReplies() {
    const reading = ++this.reading;
    const still = () => this.alive && this.reading === reading && this.play.phase === 'reply';
    await this.ctx.instruct('notalways.replies');
    const replies = this.play.round.replies ?? [];
    for (let j = 0; j < replies.length; j++) {
      if (!still()) return;
      this.bob(this.replyNodes[j]);
      await this.ctx.say(`notalways.reply.${replies[j]}` as LineId);
    }
  }

  /** A reply: never scored. The rude one makes the friend pause and offers the kind one again. */
  private async chooseReply(j: number) {
    if (this.busy || this.finished || this.play.phase !== 'reply') return;
    const node = this.replyNodes[j];
    node.scale.set(0.94);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.2 });
    this.chain++;
    this.dropAsk();
    this.reading++;
    const out = this.play.chooseReply(j);
    if (out.kind !== 'reply') return;
    if (out.rude) {
      sfx.tick();
      this.friend.rotation = -0.12;
      void this.ctx.tw.to(this.friend, { rotation: 0 }, { duration: 1.2 });
      await this.ctx.say('notalways.reply.pause');
      const kind = this.replyNodes[(this.play.round.replies ?? []).indexOf('kind')];
      if (this.alive && kind) this.bob(kind);
      return;
    }
    this.busy = true;
    sfx.marimba(9);
    this.friend.cheer();
    return void this.next(out.next, this.ctx.say('notalways.reply.thanks'));
  }

  /**
   * After a claim or a mend: the mended signs, the next claim, or the end of the round. With `said` (the answer's lines,
   * still playing), the next claim or the mended signs show after the beat with input open, and their read-out waits for
   * the lines, her first tap or the guide (U7 R4); the round's last lines are heard out.
   */
  private async next(phase: Phase, said?: Promise<unknown>) {
    this.dropAsk();
    if (phase === 'done' && said) await said;
    if (phase === 'claim' && this.plan.mode === 'why' && said) await said;
    await this.ctx.tw.wait(0.4);
    if (!this.alive) return;
    for (const c of this.cards) c.ring.visible = false;
    this.clearMends();
    this.clearReplies();
    if (phase === 'done') return void this.finale();
    if (phase === 'mend') this.showMends();
    else if (phase === 'reply') this.showReplies();
    else if (this.plan.mode === 'why') this.showWhy();
    else {
      this.deal();
      this.showSigns();
      sfx.pop(7);
      for (const s of this.signs) {
        s.rotation = -0.25;
        void this.ctx.tw.to(s, { rotation: 0 }, { duration: 0.4 });
      }
    }
    this.busy = false;
    if (!said) return void this.readOut();
    this.unasked = true;
    const gen = this.askGen;
    void said.then(() => {
      if (gen === this.askGen) this.askNow();
    });
  }

  /** The claim (or both claims), the mended signs, the scene's claims and responses, or the replies, read out. */
  private readOut() {
    if (this.play.phase === 'mend') return void this.readMends();
    if (this.play.phase === 'reply') return void this.readReplies();
    if (this.plan.mode === 'why') return void this.readWhy();
    void this.readSigns();
  }

  /** Each claim sign in turn, lifting as it is read; the first is the instruction the pet repeats. */
  private async readSigns() {
    const claim = this.play.claim,
      reading = ++this.reading;
    const signs = [...this.play.signs];
    for (let k = 0; k < signs.length; k++) {
      if (!this.alive || this.reading !== reading || this.play.claim !== claim || this.play.phase !== 'claim')
        return;
      if (signs.length > 1 && this.signs[k]) this.bob(this.signs[k]);
      if (k === 0) await this.ctx.instruct(claimLine(signs[k]));
      else await this.ctx.say(claimLine(signs[k]));
    }
  }

  /** Says the waiting read-out, if there is one. */
  private askNow() {
    if (!this.unasked || this.finished) return false;
    this.dropAsk();
    this.readOut();
    return true;
  }

  private dropAsk() {
    this.unasked = false;
    this.askGen++;
  }

  /**
   * The guide was tapped while the next claim waits: say it, not the one before it. At the mend it reads the mended
   * signs as the friend does, since "What could I say instead? Listen." alone would be followed by nothing.
   */
  sayWaitingAsk() {
    if (this.askNow()) return true;
    if (this.busy || this.finished) return false;
    if (this.play.phase === 'mend') return (void this.readMends(), true);
    if (this.play.phase === 'reply') return (void this.readReplies(), true);
    if (this.signs.length > 1) return (void this.readSigns(), true);
    return false;
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
    const claim = this.play.claim,
      reading = ++this.reading;
    // A newer reading (the friend tapped again) or her choice stops this one.
    const still = () =>
      this.alive && this.reading === reading && this.play.phase === 'mend' && this.play.claim === claim;
    // The claim is broken, so the mend's question is now the line the caption keeps.
    await this.ctx.instruct('notalways.mends');
    for (let j = 0; j < this.mendNodes.length; j++) {
      if (!still()) return;
      this.bob(this.mendNodes[j]);
      await this.ctx.say(claimLine(this.play.options[j]));
    }
  }

  /** A target lifts a little as it is read. */
  private bob(n: Container | undefined) {
    if (!n || n.destroyed || this.ctx.tw.busy(n)) return;
    const y = n.y;
    void this.ctx.tw.to(n, { y: y - 10 }, { duration: 0.15 }).then(() => {
      if (!n.destroyed) void this.ctx.tw.to(n, { y }, { duration: 0.2 });
    });
  }

  // Help -----------------------------------------------------------------------------------------------------------

  /** The hint's words: the group to look at (4), where to look in the scene (5), the claim to check (6), or the shining one. */
  private async sayHint() {
    const why = this.play.prompt?.why;
    if (why) return this.ctx.say(`notalways.why.${why.scene}.look` as LineId);
    if (this.plan.mode === 'filter' && this.play.current.if)
      return this.ctx.say(`notalways.look.${this.play.current.if}` as LineId);
    if (this.plan.mode === 'both') {
      const t = this.play.target();
      const k =
        t?.kind === 'card' ? this.play.signs.findIndex((c) => breakers(this.play.row, c).length > 0) : -1;
      if (k >= 0) return this.ctx.say(claimLine(this.play.signs[k]));
      return this.readSigns();
    }
    return this.ctx.say('notalways.hint');
  }

  /** The pause sheet's Show me: the same glow as two misses, counted once per claim or mend; asked again it repeats the claim. */
  askForHint() {
    if (this.busy || this.finished || this.play.phase === 'done') return;
    if (this.play.requestHint()) void this.sayHint();
    else this.repeat();
  }

  private targetNode(): Container | null {
    const t = this.play.target();
    if (!t) return null;
    if (t.kind === 'card') return this.cards[t.i]?.node ?? null;
    if (t.kind === 'stamp') return this.stamp;
    if (t.kind === 'why') return this.responseNodes[t.j] ?? null;
    if (t.kind === 'reply') return this.replyNodes[t.j] ?? null;
    return this.mendNodes[t.j] ?? null;
  }

  // Motion ---------------------------------------------------------------------------------------------------------

  private async lift(card: CardNode) {
    const n = card.node;
    if (this.ctx.tw.busy(n.scale)) return;
    await this.ctx.tw.to(n.scale, { x: card.base * 1.06, y: card.base * 1.06 }, { duration: 0.08 });
    if (this.alive && !n.destroyed)
      await this.ctx.tw.to(n.scale, { x: card.base, y: card.base }, { duration: 0.16 });
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
    sfx.marimba(7);
    void this.ctx.tw.wait(0.18).then(() => {
      if (this.alive) sfx.marimba(9);
    });
    this.friend.cheer();
    for (const sp of this.speakers) sp.critter.cheer();
    for (const c of this.cards) c.critter.hop(0.6);
    const at = this.plan.mode === 'why' ? this.speakers[0].node : this.friendNode;
    this.ctx.particles.burst(at.x, at.y - 80, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
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
    this.signs.forEach((s, k) => {
      const r = L.signs[k];
      if (r) s.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    this.post.removeChildren().forEach((c) => c.destroy());
    const p = postArt(L.foot.y - (L.sign.y + L.sign.h));
    p.position.set(L.foot.x + 62, L.sign.y + L.sign.h);
    this.post.addChild(p);
    this.friendNode.position.set(L.foot.x, L.foot.y);
    this.cards.forEach((c, i) => {
      const r: Rect | undefined = L.cards[i];
      if (!r) return;
      c.base = Math.min(r.w / CARD_W, r.h / CARD_H);
      if (!this.ctx.tw.busy(c.node.scale)) c.node.scale.set(c.base);
      c.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    if (this.stamp && L.stamp) this.stamp.position.set(L.stamp.x + L.stamp.w / 2, L.stamp.y + L.stamp.h / 2);
    this.mendNodes.forEach((n, j) => {
      const r = L.mends[j];
      n.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    this.replyNodes.forEach((n, j) => {
      const r = L.replies[j];
      n.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    this.speakers.forEach((sp, s) => {
      const r = L.signs[s];
      sp.node.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
    if (this.scene && L.scene) this.scene.position.set(L.scene.x + L.scene.w / 2, L.scene.y + L.scene.h / 2);
    this.responseNodes.forEach((n, j) => {
      const r = L.responses[j];
      n.position.set(r.x + r.w / 2, r.y + r.h / 2);
    });
  }

  update(dt: number) {
    this.clock += dt;
    // Level 5's evidence traces the scene's deciding spots for a moment.
    const tr = this.trace.clear();
    if (this.scene && this.clock < this.traceUntil)
      for (const m of this.sceneMarks)
        tr.circle(this.scene.x + m.x, this.scene.y + m.y, 34 + 6 * Math.sin(this.clock * 8)).stroke({
          width: 7,
          color: swatch.green.line,
        });
    const g = this.glow.clear();
    if (!this.play.glowing || this.busy || this.finished) return;
    const n = this.targetNode();
    if (!n) return;
    const b = n.getLocalBounds();
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 4);
    const w = b.width * n.scale.x + 18,
      h = b.height * n.scale.y + 18;
    const cx = n.x + (b.x + b.width / 2) * n.scale.x,
      cy = n.y + (b.y + b.height / 2) * n.scale.y;
    g.roundRect(cx - w / 2, cy - h / 2, w, h, 22).stroke({
      width: 8,
      color: swatch.yellow.fill,
      alpha: pulse,
    });
  }

  /** The ghost finger: taps what answers (a breaker, the stamp, the true mended sign, the evidence, the continuing reply). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.unasked) return null;
    const n = this.targetNode();
    return n ? { tap: { on: n }, pause: 1.2 } : null;
  }

  destroy() {
    this.alive = false;
  }
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
    const sub = cardCritter(
      {
        color: rng.pick(['red', 'blue', 'yellow'] as const),
        hat: false,
        wings: rng.chance(0.5),
        spots: rng.chance(0.5),
      },
      0.3,
    );
    sub.y = 40;
    card.addChild(
      tile(90, 110, 'white'),
      sub,
      new Graphics().circle(0, 0, 48).stroke({ width: 6, color: swatch.red.fill }),
    );
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
  c.addChild(
    new Graphics().rect(-5, -10, 10, 42).fill(wood.fill).stroke({ width: 3, color: wood.line }),
    crate,
    sign,
  );
  return c;
}

export const notAlways: GameModule = {
  id: 'not-always',
  name: 'Not Always',
  titleLine: 'game.not-always',
  region: 'story-grove',
  challenge: 'logic',
  upright: true,
  skills: ['reasoning', 'claims', 'counterexamples', 'listening'],
  bands: ['prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    "Take turns being the friend: one of you says something about all the cards, like 'all of these have hats', and the other finds the one that isn't.",
  offScreen:
    "Line up some toys and say something about all of them, like 'all of these are soft'. Can she find one that isn't?",
  hubIcon: () => new WigglyIcon(hubPicture()),
  sticker: (seed) => friendPicture(seed, true),
  create: (ctx) => new NotAlways(ctx),
};
