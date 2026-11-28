/**
 * Rain Garden level 8, the mystery patch: draws and times the rules in mystery.ts. A covered patch sits under the
 * cloud, two slots build a test of one or two rains, and only the pond shows what came out. She lights the idea cards
 * that still fit and taps the check; the second rain of a two-rain test is what tells the ideas apart.
 */
import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { leafArt } from '../drops-journey/art';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  arrowArt,
  checkArt,
  cloudArt,
  cloudDropsArt,
  dropArt,
  friendArt,
  motionArt,
  pondArt,
  rippleArt,
} from './art';
import { planFor, type Plan } from './logic';
import {
  MYST_TARGET,
  RULES,
  canCheck,
  canRun,
  makeMystery,
  mysteryCheck,
  mysteryFresh,
  mysteryHint,
  mysteryLayout,
  mysteryNext,
  mysteryRestart,
  mysteryRun,
  runPlan,
  setSlot,
  toggleMark,
  type MysteryLayout,
  type MysteryRound,
  type MysteryState,
  type Rule,
} from './mystery';
import { bedArt, coverArt, ideaCardArt, sizeBadge, slotArt } from './mystery-art';

/** The authored round leads the first round of a session. */
let authoredShown = false;

const POCKETS = [
  { x: -40, y: 12, w: 56, h: 40 },
  { x: 40, y: 12, w: 56, h: 40 },
];

interface Settled {
  node: Container;
  row: number;
}

export class RainMystery implements Game {
  readonly plan: Plan;
  readonly round: MysteryRound;
  s: MysteryState;
  busy = false;
  finished = false;
  readonly cloud: Container;
  readonly checkBtn: Container;
  readonly leaf: Container;
  readonly slots: Container[] = [];
  readonly cards: Container[] = [];
  private layout: MysteryLayout;
  private clock = 0;
  private stale = false;
  private readonly backdrop: Backdrop;
  private readonly boardLayer = new Container();
  private readonly coverLayer = new Container();
  private readonly dropLayer = new Container();
  private readonly glow = new Graphics();
  private cloudDrops: Graphics | null = null;
  private cover: Container | null = null;
  private friend: Container | null = null;
  private settled: Settled[] = [];
  private readonly flying = new Set<Container>();
  /** Bumped by anything she or the pet does next, so an unfinished narration chain stops. */
  private talk = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    const first = ctx.demo || !authoredShown;
    if (first && !ctx.demo) authoredShown = true;
    this.round = makeMystery(ctx.rng, first);
    this.s = mysteryFresh(this.round);
    this.backdrop = new Backdrop(
      {
        sky: [0xcfe4f5, 0xfff6e0],
        hills: [0xd6efc8, 0xc5e7a8],
        horizon: 0.86,
        clouds: 0,
        sun: false,
        seed: 157,
      },
      ctx.view,
    );
    this.layout = mysteryLayout(ctx.view)!;
    const c = this.layout.cloud;
    this.cloud = cloudArt(c.w, c.h);
    this.cloud.hitArea = new Rectangle(-c.w / 2, -c.h / 2, c.w, c.h);
    onTap(this.cloud, () => this.tapCloud());
    this.checkBtn = checkArt(MYST_TARGET);
    this.checkBtn.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(this.checkBtn, () => this.tapCheck());
    this.leaf = leafArt(MYST_TARGET);
    this.leaf.hitArea = new Rectangle(-60, -60, 120, 120);
    onTap(this.leaf, () => this.tapLeaf());
    for (const n of [this.boardLayer, this.coverLayer, this.dropLayer, this.glow]) n.eventMode = 'none';
    ctx.stage.addChild(this.backdrop, this.boardLayer, this.coverLayer, this.dropLayer, this.glow);
    for (let i = 0; i < 2; i++) {
      const slot = new Container();
      slot.hitArea = new Rectangle(-60, -60, 120, 120);
      onTap(slot, () => this.tapSlot(i as 0 | 1));
      this.slots.push(slot);
      const card = new Container();
      card.hitArea = new Rectangle(-60, -60, 120, 120);
      onTap(card, () => this.tapCard(RULES[i]));
      this.cards.push(card);
    }
    ctx.stage.addChild(this.cloud, ...this.slots, ...this.cards, this.checkBtn, this.leaf);
    this.resize(ctx.view);
  }

  /** What a scripted play reads. */
  get state() {
    const s = this.s;
    return {
      level: this.plan.level,
      truth: s.truth,
      plan: s.plan.slice(),
      ponds: s.evidence ? s.evidence.ponds.slice() : null,
      evidencePlan: s.evidence ? s.evidence.plan.slice() : null,
      runs: s.runs,
      marks: s.marks.slice(),
      misses: s.misses,
      hints: s.hints,
      ghosts: s.ghosts,
      supported: s.supportedRun !== null,
      revealed: s.revealed,
      check: this.checkBtn.visible,
      leaf: this.leaf.visible,
      pointing: s.pointing,
      friend: this.round.friend,
      busy: this.busy,
      finished: this.finished,
      drops: this.settled.length,
    };
  }

  start() {
    void this.ctx.instruct('rainmyst.instruct');
  }

  destroy() {
    this.finished = true;
    for (const n of [this.cloud, this.checkBtn, this.leaf, ...this.slots, ...this.cards])
      this.ctx.tw.kill(n.scale);
    if (this.friend) this.ctx.tw.kill(this.friend);
    if (this.cover) this.ctx.tw.kill(this.cover);
    for (const n of this.flying) this.ctx.tw.kill(n);
    for (const d of this.settled) this.ctx.tw.kill(d.node);
  }

  // ---- drawing ----

  private drawBoard() {
    const l = this.layout;
    this.boardLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.coverLayer.removeChildren().forEach((c) => c.destroy({ children: true }));
    const bed = bedArt(l.patch.w, l.patch.h, POCKETS);
    bed.position.set(l.patch.x, l.patch.y);
    this.boardLayer.addChild(arrowArt(l.arrow), pondArt(l.pond, [...l.rows[0], ...l.rows[1]]), bed);
    this.friend = friendArt(this.round.friend);
    this.friend.position.set(l.friend.x, l.friend.y);
    this.boardLayer.addChild(this.friend);
    const e = this.s.evidence;
    if (e) {
      e.plan.forEach((size, i) => {
        const badge = sizeBadge(size);
        badge.position.set(l.badges[i].x, l.badges[i].y);
        this.boardLayer.addChild(badge);
      });
    }
    // Once the cover lifts, the pockets show how full the patch ended after the latest run.
    if (this.s.revealed && e) {
      const kept = runPlan(this.s.truth, e.plan).rains.at(-1)!.kept;
      for (let i = 0; i < Math.min(kept, POCKETS.length); i++) {
        const d = dropArt(36);
        d.position.set(l.patch.x + POCKETS[i].x, l.patch.y + POCKETS[i].y);
        this.boardLayer.addChild(d);
      }
    } else {
      this.cover = coverArt(l.patch.w, l.patch.h);
      this.cover.position.set(l.patch.x, l.patch.y);
      this.coverLayer.addChild(this.cover);
    }
    this.drawControls();
  }

  private drawControls() {
    const s = this.s;
    this.slots.forEach((n, i) => {
      n.removeChildren().forEach((c) => c.destroy({ children: true }));
      n.addChild(slotArt(s.plan[i] ?? 0));
    });
    const ghostPlan = s.ghosts && s.evidence ? s.evidence.plan : null;
    this.cards.forEach((n, i) => {
      n.removeChildren().forEach((c) => c.destroy({ children: true }));
      n.addChild(ideaCardArt(RULES[i], s.marks.includes(RULES[i]), ghostPlan));
    });
    this.cloudDrops?.destroy();
    this.cloudDrops = cloudDropsArt(s.plan[0] ?? 0, this.layout.cloud.h / 2 - 16);
    this.cloud.addChildAt(this.cloudDrops, 1);
    this.checkBtn.visible = s.evidence !== null && !s.revealed;
    this.leaf.visible = s.revealed;
  }

  private placeSettled() {
    const l = this.layout;
    const counts = [0, 0];
    for (const d of this.settled) {
      const at = l.rows[d.row][counts[d.row]++];
      d.node.position.set(at.x, at.y);
    }
  }

  // ---- rain ----

  private squash(n: Container) {
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.08, 0.88);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.25, ease: ease.outBack });
  }

  private tapSlot(i: 0 | 1) {
    if (this.busy || this.finished) return;
    this.talk++;
    this.squash(this.slots[i]);
    this.s = setSlot(this.s, i);
    sfx.pluck(2 + this.s.plan.length, 0.3);
    this.drawControls();
    const size = this.s.plan[i];
    if (size && i < this.s.plan.length) void this.ctx.say(size === 2 ? 'rainmyst.small' : 'rainmyst.big');
  }

  private tapCard(rule: Rule) {
    if (this.busy || this.finished) return;
    this.talk++;
    const node = this.cards[RULES.indexOf(rule)];
    this.squash(node);
    this.s = toggleMark(this.s, rule);
    sfx.pluck(this.s.marks.includes(rule) ? 5 : 3, 0.3);
    this.drawControls();
    if (this.s.marks.includes(rule)) void this.ctx.say(`rainmyst.${rule}`);
  }

  private tapCloud() {
    if (this.busy || this.finished) return;
    this.squash(this.cloud);
    if (!canRun(this.s)) {
      this.talk++;
      void this.ctx.say('rainmyst.pick');
      return;
    }
    void this.rainAll();
  }

  /** Run the plan: each rain's drops fall into the cover, and what comes out runs down the arrow into that rain's row. */
  private async rainAll() {
    this.busy = true;
    const talk = ++this.talk;
    await this.clearDrops();
    if (this.finished) return;
    this.s = mysteryRun(this.s);
    this.drawBoard();
    const run = runPlan(this.s.truth, this.s.plan);
    for (let r = 0; r < run.rains.length; r++) {
      const rain = run.rains[r];
      if (r > 0) {
        sfx.whoosh();
        await this.ctx.tw.wait(0.4);
        if (this.finished) return;
      }
      const counts = { slot: 0 };
      const falls: Promise<void>[] = [];
      for (let u = 0; u < rain.steps.length; u++) {
        falls.push(this.fall(rain.steps[u].to, r, counts, u, rain.steps.length));
        await this.ctx.tw.wait(0.45);
        if (this.finished) return;
      }
      await Promise.all(falls);
      if (this.finished) return;
      if (talk === this.talk) await this.ctx.say(`rain.pond.${rain.pond}` as LineId);
      if (this.finished) return;
    }
    this.idle();
    this.drawControls();
  }

  /** One drop: from the cloud onto the cover; the ones the patch cannot hold continue down the arrow into the pond row. */
  private async fall(
    to: 'patch' | 'pond',
    row: number,
    count: { slot: number },
    unit: number,
    units: number,
  ) {
    const l = this.layout;
    const node = new Container();
    node.addChild(dropArt(44));
    node.position.set(l.cloud.x + (unit - (units - 1) / 2) * 36, l.cloud.y + l.cloud.h / 2 - 20);
    this.dropLayer.addChild(node);
    this.flying.add(node);
    await this.ctx.tw.to(node, { y: l.patch.y - l.patch.h / 2 + 24 }, { duration: 0.5, ease: ease.inQuad });
    if (this.finished) return;
    if (to === 'patch') {
      sfx.marimba(5, 0.3);
      this.ctx.particles.burst(node.x, node.y, {
        kind: 'dot',
        colors: [swatch.blue.light, 0xffffff],
        count: 5,
        speed: [40, 90],
        gravity: 200,
        life: [0.2, 0.35],
      });
      this.flying.delete(node);
      node.destroy({ children: true });
      return;
    }
    const index = count.slot++;
    sfx.pluck(3, 0.2);
    const lines = motionArt();
    node.addChildAt(lines, 0);
    await this.ctx.tw.to(node, { x: l.arrow.x1, y: l.arrow.y1 }, { duration: 0.25, ease: ease.inOutSine });
    if (this.finished) return;
    await this.ctx.tw.to(node, { x: l.arrow.x2, y: l.arrow.y2 }, { duration: 0.45, ease: ease.inQuad });
    if (this.finished) return;
    lines.destroy();
    const slot = l.rows[row][index];
    await this.ctx.tw.to(node, { x: slot.x, y: slot.y }, { duration: 0.3, ease: ease.outQuad });
    if (this.finished) return;
    sfx.marimba(index, 0.4);
    sfx.splash();
    const ripple = rippleArt(slot.w / 2);
    ripple.y = 14;
    node.addChildAt(ripple, 0);
    if (row === 0 && index === 0) this.cheer();
    this.flying.delete(node);
    this.settled.push({ node, row });
  }

  private cheer() {
    const f = this.friend;
    if (!f) return;
    if (this.round.friend === 'frog') sfx.ribbit();
    else if (this.round.friend === 'duck') sfx.animal('quack');
    else sfx.squeak(6);
    this.ctx.tw.kill(f);
    const y = this.layout.friend.y;
    void this.ctx.tw
      .to(f, { y: y - 24 }, { duration: 0.18, ease: ease.outQuad })
      .then(() =>
        this.finished ? undefined : this.ctx.tw.to(f, { y }, { duration: 0.25, ease: ease.outBack }),
      );
  }

  /** The old rows empty before a new run; the patch is fresh every time. */
  private async clearDrops() {
    if (!this.settled.length) return;
    const old = this.settled;
    this.settled = [];
    sfx.whoosh();
    for (const d of old)
      void this.ctx.tw.to(d.node, { alpha: 0, y: d.node.y + 30 }, { duration: 0.35, ease: ease.inQuad });
    await this.ctx.tw.wait(0.4);
    for (const d of old) d.node.destroy({ children: true });
  }

  // ---- check ----

  private tapCheck() {
    if (this.busy || this.finished || this.s.revealed) return;
    this.squash(this.checkBtn);
    if (!canCheck(this.s)) {
      this.talk++;
      void this.ctx.say('rainmyst.mark');
      return;
    }
    const before = this.s;
    const { state, verdict } = mysteryCheck(before);
    this.s = state;
    this.talk++;
    if (verdict.judgement === 'ok') {
      if (verdict.reveal) void this.reveal();
      else {
        sfx.pluck(6, 0.35);
        void this.ctx.say('rainmyst.both.ok');
      }
      return;
    }
    sfx.boing();
    const wasGhosts = before.ghosts;
    if (state.ghosts !== wasGhosts) this.drawControls();
    this.cards.forEach((c, i) => {
      if (state.marks.includes(RULES[i])) this.wobble(c);
    });
    void this.ctx.say(`rainmyst.${verdict.judgement}` as LineId);
  }

  private wobble(n: Container) {
    this.ctx.tw.kill(n);
    n.rotation = 0;
    void this.ctx.tw
      .to(n, { rotation: 0.1 }, { duration: 0.1 })
      .then(() => (this.finished ? undefined : this.ctx.tw.to(n, { rotation: -0.08 }, { duration: 0.14 })))
      .then(() => (this.finished ? undefined : this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.12 })));
  }

  /** The cover lifts, the pockets show how full the patch ended, and the leaf appears. */
  private async reveal() {
    this.busy = true;
    sfx.whoosh();
    const cover = this.cover;
    if (cover) {
      await Promise.all([
        this.ctx.tw.to(cover, { y: cover.y - 70, alpha: 0 }, { duration: 0.6, ease: ease.outQuad }),
        this.ctx.tw.wait(0.6),
      ]);
      if (this.finished) return;
    }
    this.cover = null;
    this.drawBoard();
    sfx.tada();
    this.idle();
    await this.ctx.say(`rainmyst.reveal.${this.s.truth}` as LineId);
  }

  private tapLeaf() {
    if (this.finished || this.busy || !this.s.revealed) return;
    this.finished = true;
    sfx.tada();
    this.ctx.finish({ misses: this.s.misses, hints: this.s.hints });
  }

  // ---- help ----

  readonly hintLabel = 'Show me';

  askForHint() {
    if (this.busy || this.finished) return;
    this.talk++;
    const { state, hint } = mysteryHint(this.s);
    this.s = state;
    if (hint === 'test') {
      this.drawControls();
      void this.ctx.say('rainmyst.hint.test');
      void this.ctx.tw.wait(1.2).then(() => (this.finished || this.busy ? undefined : this.rainAll()));
    } else if (hint === 'mark') {
      this.drawControls();
      void this.ctx.say('rainmyst.mark');
    } else void this.ctx.say(hint === 'check' ? 'rain.hint.check' : 'rain.done');
  }

  restart() {
    if (this.finished) return;
    const go = () => {
      if (this.finished) return;
      if (this.busy) {
        void this.ctx.tw.wait(0.2).then(go);
        return;
      }
      this.s = mysteryRestart(this.s, this.round);
      for (const d of this.settled) d.node.destroy({ children: true });
      this.settled = [];
      this.talk++;
      this.drawBoard();
      void this.ctx.say('rain.again');
    };
    go();
  }

  // ---- shell hooks ----

  private idle() {
    this.busy = false;
    if (this.stale) {
      this.stale = false;
      this.resize(this.ctx.view);
    }
  }

  resize(view: View) {
    this.layout = mysteryLayout(view) ?? this.layout;
    const l = this.layout;
    this.backdrop.resize(view);
    if (this.busy) this.stale = true;
    else {
      this.drawBoard();
      this.placeSettled();
    }
    this.cloud.position.set(l.cloud.x, l.cloud.y);
    this.checkBtn.position.set(l.check.x, l.check.y);
    this.leaf.position.set(l.check.x, l.check.y);
    this.slots.forEach((n, i) => n.position.set(l.slots[i].x, l.slots[i].y));
    this.cards.forEach((n, i) => n.position.set(l.cards[i].x, l.cards[i].y));
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.clear();
    if (this.finished || this.busy) return;
    const pulse = 6 + 4 * Math.sin(this.clock * 5);
    const ring = (b: { x: number; y: number; w: number; h: number }) =>
      this.glow
        .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + 2 * pulse, 26)
        .stroke({ width: 7, color: swatch.yellow.fill });
    const p = this.s.pointing;
    if (p) ring(this.layout.check);
  }

  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const n = mysteryNext(this.s);
    const on =
      n.kind === 'cloud'
        ? this.cloud
        : n.kind === 'check'
          ? this.checkBtn
          : n.kind === 'leaf'
            ? this.leaf
            : n.kind === 'slot'
              ? this.slots[n.i]
              : this.cards[RULES.indexOf(n.rule)];
    return { tap: { on }, pause: 0.8 };
  }
}
