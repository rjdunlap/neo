import { Container, Graphics, Rectangle } from 'pixi.js';
import { Critter, CRITTERS, type CritterName } from '../../art/critter';
import { cream, grass, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  beginningArt,
  bubbleArt,
  cardArt,
  formArt,
  giftArt,
  iconArt,
  saplingArt,
  stallArt,
  stickerArt,
  toolArt,
} from './art';
import {
  BUBBLE_H,
  BUBBLE_W,
  cardChain,
  cardResult,
  clampLevel,
  FORMS,
  LEVEL_NAMES,
  LEVELS,
  makerLaneLayout,
  makerOf,
  Play,
  PATH_H,
  roundFor,
  stallAt,
  THINGS,
  type Card,
  type Chain,
  type Form,
  type Maker,
  type MakerLaneLayout,
  type Outcome,
  type Rect,
  type Step,
} from './logic';

/** Each level's authored round leads its first round of a session, and every demonstration. */
const authoredShown = new Set<number>();
/** Makers are island friends; the cow is a level-3 card and never a maker. */
const MAKER_FRIENDS: readonly CritterName[] = ['duck', 'pig', 'cat', 'bear', 'dog', 'bunny'];
const STRIPES = [swatch.red.fill, swatch.blue.fill, swatch.green.fill, swatch.purple.fill];

interface StallNode {
  node: Container;
  art: Container;
  critter: Critter | null;
  tool: Container | null;
  bubble: Container | null;
  /** The work a maker hung on their stall after their step. */
  hung: Container | null;
  maker: Maker | null;
}

class MakerLane implements Game {
  readonly play: Play;
  readonly level: 1 | 2 | 3;
  readonly hintLabel = 'Show me';
  askForHint?: () => void;
  /** While a maker works or a replay runs: touches wait, never counted. */
  busy = true;
  private alive = true;
  private finished = false;
  private view: View;
  private clock = 0;
  private readonly bg = new Graphics();
  private readonly beginHolder = new Container();
  readonly stalls: StallNode[] = [];
  readonly bundle = new Container();
  private bundleArt: Container | null = null;
  private drag: DragHandle | null = null;
  private readonly glow = new Graphics();
  /** Level 3. */
  readonly frame = new Container();
  readonly cards: Container[] = [];
  private readonly resultHolder = new Container();
  private friends: CritterName[] = [];
  /** The spot the bundle waits at: 0 the beginning, k + 1 in front of stall k. */
  private spot = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.level = clampLevel(ctx.level);
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    authoredShown.add(this.level);
    this.play = new Play(roundFor(this.level, ctx.rng, authored));
    this.glow.eventMode = 'none';
    if (this.level >= 2) this.askForHint = () => this.hint();

    ctx.stage.addChild(this.bg, this.beginHolder);
    const n = this.level === 2 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const node = new Container();
      const art = new Container();
      node.addChild(art);
      ctx.stage.addChild(node);
      if (this.level < 3) {
        node.eventMode = 'static';
        onTap(node, () => this.tapStall(i), { cooldown: 250 });
      }
      this.stalls.push({ node, art, critter: null, tool: null, bubble: null, hung: null, maker: null });
    }
    this.bundle.eventMode = this.level < 3 ? 'static' : 'none';
    ctx.stage.addChild(this.resultHolder, this.bundle);
    if (this.level < 3) {
      this.drag = draggable(this.bundle, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.busy || this.finished) return false;
          const i = stallAt(this.layout(), x, y);
          // Off any stall it floats home, free; a stall that cannot take it floats it home too.
          return i >= 0 && this.act(i).kind === 'made';
        },
      });
    } else {
      this.frame.eventMode = 'static';
      onTap(this.frame, () => this.tapFrame(), { cooldown: 300 });
      ctx.stage.addChild(this.frame);
      for (let i = 0; i < 3; i++) {
        const c = new Container();
        c.eventMode = 'static';
        onTap(c, () => this.tapCard(i), { cooldown: 300 });
        ctx.stage.addChild(c);
        this.cards.push(c);
      }
    }
    ctx.stage.addChild(this.glow);
    this.resize(this.view);
    this.setUp();
  }

  async start() {
    await this.ctx.instruct(`makerlane.instruct.${this.level}` as LineId);
    if (!this.alive) return;
    if (this.level === 2) await this.ctx.say(this.harvestLine());
    else if (this.level === 3) await this.ctx.say(`makerlane.this.${this.play.question!.thing}` as LineId);
    if (!this.alive) return;
    this.release();
  }

  private layout(): MakerLaneLayout {
    return makerLaneLayout(this.view, this.level);
  }

  // Setting up a bundle or a question -----------------------------------------------------------------------------

  private setUp() {
    if (this.level === 3) return this.setUpQuestion();
    const b = this.play.bundle!;
    this.friends = this.ctx.rng.shuffle([...MAKER_FRIENDS]).slice(0, b.stalls.length);
    this.showBeginning(b.chain, this.level === 2);
    b.stalls.forEach((m, i) => this.dressStall(i, m, this.friends[i]));
    this.setBundle(this.play.form);
    this.moveBundleTo(0, false);
    if (this.drag) this.drag.enabled = true;
  }

  /** The level-2 bundle starts harvested: the pet says what the first maker did. */
  private harvestLine(): LineId {
    return `makerlane.make.${this.play.bundle!.chain}.1` as LineId;
  }

  private beginArgs: [Chain | null, boolean, Card?] | null = null;

  private showBeginning(chain: Chain | null, harvested: boolean, card?: Card) {
    this.beginArgs = [chain, harvested, card];
    this.beginHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    const L = this.layout();
    const r = L.begin;
    const g = new Graphics()
      .roundRect(r.x, r.y + r.h * 0.45, r.w, r.h * 0.55, 18)
      .fill(swatch.green.light)
      .stroke({ width: 4, color: swatch.green.line });
    this.beginHolder.addChild(g);
    const what: Card | Form | null = card ?? (chain ? FORMS[chain][0] : null);
    if (!what) return;
    const size = r.w * 0.85;
    const pic = card ? beginningArt(card, size) : formArt(what as Form, size);
    pic.position.set(r.x + r.w / 2, r.y + r.h * 0.55);
    if (harvested && chain) {
      // After the harvest: the sheep is lighter, the plant picked, the field cut, and a sapling where the tree stood.
      pic.alpha = 0.55;
      if (chain === 'tree') {
        pic.destroy({ children: true });
        const s = saplingArt();
        s.scale.set(0.9);
        s.position.set(r.x + r.w / 2, r.y + r.h * 0.95);
        this.beginHolder.addChild(s);
        return;
      }
    }
    this.beginHolder.addChild(pic);
  }

  private dressStall(i: number, maker: Maker | null, friend: CritterName | null) {
    const s = this.stalls[i];
    const L = this.layout();
    const r = L.stalls[i];
    s.maker = maker;
    s.art.removeChildren().forEach((c) => {
      if (!(c instanceof Critter)) c.destroy({ children: true });
    });
    if (s.critter) {
      this.ctx.untrack(s.critter);
      s.critter.destroy({ children: true });
      s.critter = null;
    }
    s.bubble?.destroy({ children: true });
    s.bubble = null;
    s.hung = null;
    s.node.alpha = 1;
    const stall = stallArt(r.w, r.h, STRIPES[i % STRIPES.length]);
    s.art.addChild(stall);
    if (friend) {
      const k = this.ctx.track(new Critter(CRITTERS[friend]));
      k.scale.set((r.w / 160) * 0.55);
      k.position.set(r.w * 0.5, r.h * 0.78);
      s.art.addChild(k);
      s.critter = k;
    }
    if (maker) {
      const t = toolArt(maker.tool, r.w * 0.5);
      t.position.set(r.w * 0.5, r.h * 0.84);
      s.art.addChild(t);
      s.tool = t;
    } else s.tool = null;
    s.node.position.set(r.x, r.y);
    s.node.hitArea = new Rectangle(0, 0, r.w, r.h + PATH_H * 0.5);
  }

  private setBundle(form: Form | 'milk' | 'egg' | null) {
    this.bundleArt?.destroy({ children: true });
    this.bundleArt = null;
    if (!form) return;
    const size = this.layout().bundle;
    const a = form === 'milk' || form === 'egg' ? giftArt(form, size) : formArt(form, size);
    this.bundle.addChild(a);
    this.bundleArt = a;
    this.bundle.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
  }

  private spotAt(k: number) {
    const L = this.layout();
    return L.spots[Math.min(k, L.spots.length - 1)];
  }

  private async moveBundleTo(k: number, animate = true) {
    this.spot = k;
    const p = this.spotAt(k);
    if (this.drag) this.drag.home = { x: p.x, y: p.y };
    if (!animate) {
      this.bundle.position.set(p.x, p.y);
      return;
    }
    sfx.whoosh();
    await this.ctx.tw.to(this.bundle, { x: p.x, y: p.y }, { duration: 0.4 });
  }

  // Levels 1 and 2: sending the bundle ----------------------------------------------------------------------------

  private tapStall(i: number) {
    if (this.busy || this.finished) return;
    this.act(i);
  }

  /** A tap or a drop on stall `i`: the outcome now, with its feedback following. */
  private act(i: number): Outcome {
    const s = this.stalls[i];
    // Touch-down: the maker leans forward and their tool twitches.
    s.critter?.hop(0.3);
    if (s.tool) {
      s.tool.rotation = 0.15;
      void this.ctx.tw.to(s.tool, { rotation: 0 }, { duration: 0.3 });
    }
    const out = this.play.send(i);
    if (out.kind === 'made') void this.work(i, out);
    else if (out.kind === 'miss') void this.refuse(i, out);
    else if (out.kind === 'free') {
      sfx.tick();
      if (out.why === 'notme') {
        s.critter?.cheer();
        void this.ctx.say('makerlane.notme');
      } else if (out.why === 'bubble' && s.bubble) void this.wiggle(s.bubble);
    }
    return out;
  }

  private async work(i: number, out: Extract<Outcome, { kind: 'made' }>) {
    this.busy = true;
    if (this.drag) this.drag.enabled = false;
    const s = this.stalls[i];
    await this.moveBundleTo(i + 1);
    if (!this.alive) return;
    // The maker works: a hop, the tool swings, a puff, and the bundle comes back new.
    s.critter?.cheer();
    if (s.tool) void this.swing(s.tool);
    sfx.marimba(5 + out.maker.step);
    const p = this.spotAt(i + 1);
    this.ctx.particles.burst(p.x, p.y, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 8,
      speed: [60, 160],
      gravity: 0,
      life: [0.3, 0.6],
    });
    this.setBundle(out.to);
    if (out.maker.step === 1) this.showBeginning(out.maker.chain, true);
    this.bundle.scale.set(0.6);
    void this.ctx.tw.to(this.bundle.scale, { x: 1, y: 1 }, { duration: 0.3 });
    // The bubbles on the other stalls went with the old form.
    for (const st of this.stalls)
      if (st.bubble) {
        st.bubble.destroy({ children: true });
        st.bubble = null;
      }
    await this.ctx.say(`makerlane.make.${out.maker.chain}.${out.maker.step}` as LineId);
    if (!this.alive) return;
    // Done with their step: the maker steps aside and hangs their work on the stall.
    this.hang(i, out.to);
    if (out.finished) {
      await this.toPet();
      if (!this.alive) return;
      if (out.done) return void this.finale();
      this.setUp();
      sfx.pop(7);
      if (this.level === 2) {
        await this.ctx.say(this.harvestLine());
        if (!this.alive) return;
      }
    }
    this.release();
    if (this.drag) this.drag.enabled = true;
  }

  private hang(i: number, form: Form) {
    const s = this.stalls[i];
    const L = this.layout();
    const r = L.stalls[i];
    s.node.alpha = 0.6;
    if (s.critter) void this.ctx.tw.to(s.critter, { x: r.w * 0.82 }, { duration: 0.3 });
    const h = formArt(form, r.w * 0.36);
    h.position.set(r.w * 0.24, r.h * 0.42);
    s.art.addChild(h);
    s.hung = h;
  }

  private async refuse(i: number, out: Extract<Outcome, { kind: 'miss' }>) {
    const s = this.stalls[i];
    const maker = out.maker!;
    sfx.boing();
    if (s.critter) void this.shake(s.critter);
    // The bubble shows the form this maker needs.
    const r = this.layout().stalls[i];
    const b = bubbleArt(maker.accepts, BUBBLE_W, BUBBLE_H);
    b.position.set((r.w - BUBBLE_W) / 2 + 14, -BUBBLE_H * 0.55);
    s.node.addChild(b);
    s.bubble = b;
    b.scale.set(0.4);
    void this.ctx.tw.to(b.scale, { x: 1, y: 1 }, { duration: 0.25 });
    const index = this.play.index;
    await this.ctx.say(`makerlane.notyet.${maker.chain}.${maker.step}` as LineId);
    if (this.alive && out.glow && this.play.glowing && this.play.index === index)
      void this.ctx.say('makerlane.hint');
  }

  /** The product goes to the pet, who loves it; nothing is kept. */
  private async toPet() {
    const pet = this.ctx.stage.toLocal(this.ctx.pet.getGlobalPosition());
    sfx.whoosh();
    await this.ctx.tw.to(this.bundle, { x: pet.x + 40, y: pet.y - 60 }, { duration: 0.5 });
    if (!this.alive) return;
    this.ctx.pet.cheer();
    sfx.pop(9);
    await this.ctx.say('makerlane.forpet');
    if (!this.alive) return;
    this.setBundle(null);
  }

  // Level 3: where did it begin? ----------------------------------------------------------------------------------

  private setUpQuestion() {
    const q = this.play.question!;
    const L = this.layout();
    const f = L.frame!;
    this.frame.removeChildren().forEach((c) => c.destroy({ children: true }));
    const back = new Graphics()
      .roundRect(0, 0, f.w, f.h, 24)
      .fill(0xffffff)
      .stroke({ width: 6, color: swatch.yellow.line });
    const pic = formArt(q.thing, f.w * 0.72);
    pic.position.set(f.w / 2, f.h / 2);
    this.frame.addChild(back, pic);
    this.frame.position.set(f.x, f.y);
    this.frame.hitArea = new Rectangle(0, 0, f.w, f.h);
    q.cards.forEach((card, i) => {
      const c = this.cards[i];
      const r = L.cards[i];
      c.removeChildren().forEach((x) => x.destroy({ children: true }));
      c.addChild(cardArt(r.w));
      const p = beginningArt(card, r.w * 0.72);
      c.addChild(p);
      c.alpha = 1;
      c.position.set(r.x + r.w / 2, r.y + r.h / 2);
      c.hitArea = new Rectangle(-r.w / 2, -r.h / 2, r.w, r.h);
    });
    this.resultHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.emptyLane();
  }

  /** The watched lane between replays: four empty stalls and an empty beginning spot. */
  private emptyLane() {
    this.showBeginning(null, false);
    for (let i = 0; i < this.stalls.length; i++) this.dressStall(i, null, null);
    this.setBundle(null);
  }

  private tapFrame() {
    if (this.busy || this.finished || this.play.done) return;
    sfx.tick();
    void this.wiggle(this.frame);
    void this.ctx.say(`makerlane.this.${this.play.question!.thing}` as LineId);
  }

  private tapCard(i: number) {
    if (this.busy || this.finished) return;
    const c = this.cards[i];
    c.scale.set(1.06);
    void this.ctx.tw.to(c.scale, { x: 1, y: 1 }, { duration: 0.2 });
    const q = this.play.question!;
    const card = q.cards[i];
    const out = this.play.pick(i);
    if (out.kind === 'free') {
      sfx.tick();
      if (out.why === 'dimmed') void this.ctx.say(`makerlane.makes.${card}` as LineId);
      return;
    }
    void this.answer(i, card, out);
  }

  private async answer(i: number, card: Card, out: Outcome) {
    this.busy = true;
    const index = this.play.index;
    if (out.kind === 'miss') {
      sfx.boing();
      this.cards[i].alpha = 0.4;
    } else sfx.marimba(7);
    await this.replay(card);
    if (!this.alive) return;
    if (out.kind === 'began') {
      await this.ctx.say(`makerlane.began.${out.question.thing}` as LineId);
      if (!this.alive) return;
      this.ctx.pet.cheer();
      await this.ctx.tw.wait(0.4);
      if (!this.alive) return;
      if (out.done) return void this.finale();
      this.setUpQuestion();
      sfx.pop(7);
      await this.ctx.say(`makerlane.this.${this.play.question!.thing}` as LineId);
      if (!this.alive) return;
    } else {
      await this.ctx.say(`makerlane.this.${this.play.question!.thing}` as LineId);
      if (!this.alive) return;
      if (out.kind === 'miss' && out.glow && this.play.glowing && this.play.index === index)
        void this.ctx.say('makerlane.hint');
      this.emptyLane();
      this.showResult(card);
    }
    this.release();
  }

  /** What a wrong beginning made, set beside the asked thing until the next card (nothing for the factory). */
  private showResult(card: Card) {
    this.resultHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    const made = cardResult(card);
    if (!made) return;
    const f = this.layout().frame!;
    const size = 120;
    const a = made === 'milk' || made === 'egg' ? giftArt(made, size) : formArt(made, size);
    a.position.set(f.x - size / 2 - 24, f.y + f.h / 2);
    this.resultHolder.addChild(a);
  }

  /** A card walks the lane: its makers work in turn and it becomes what it makes, set beside the asked thing. */
  private async replay(card: Card) {
    const chain = cardChain(card);
    this.resultHolder.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.showBeginning(null, false, card);
    if (chain) {
      const friends = this.ctx.rng.shuffle([...MAKER_FRIENDS]).slice(0, 4);
      for (let k = 0; k < 4; k++) this.dressStall(k, makerOf(chain, (k + 1) as Step), friends[k]);
      this.setBundle(FORMS[chain][0]);
      await this.moveBundleTo(0, false);
      for (let k = 0; k < 4; k++) {
        await this.moveBundleTo(k + 1);
        if (!this.alive) return;
        const s = this.stalls[k];
        s.critter?.cheer();
        if (s.tool) void this.swing(s.tool);
        sfx.pop(5 + k);
        this.setBundle(FORMS[chain][k + 1]);
        await this.ctx.tw.wait(0.25);
        if (!this.alive) return;
      }
    } else {
      // The cow and the hen never take a maker step: the makers shrug, and milk or an egg appears at the start.
      // The factory: the lane runs empty.
      for (let k = 0; k < 4; k++) this.dressStall(k, null, MAKER_FRIENDS[k]);
      this.setBundle(null);
      for (const s of this.stalls) if (s.critter) void this.shake(s.critter);
      const gift = cardResult(card);
      if (gift === 'milk' || gift === 'egg') {
        this.setBundle(gift);
        await this.moveBundleTo(0, false);
        this.bundle.scale.set(0.3);
        await this.ctx.tw.to(this.bundle.scale, { x: 1, y: 1 }, { duration: 0.35 });
      }
      if (!this.alive) return;
    }
    await this.ctx.say(`makerlane.makes.${card}` as LineId);
  }

  // Help and motion ------------------------------------------------------------------------------------------------

  /** Show me (levels 2 and 3): the same glow as two misses, counted once per bundle or question. */
  private hint() {
    if (this.busy || this.finished || this.play.done) return;
    if (this.play.requestHint()) void this.ctx.say('makerlane.hint');
  }

  /** What glows: the waving maker at level 1 always, the right maker or card at 2–3 after two misses or Show me. */
  private glowRect(): Rect | null {
    if (this.busy || this.finished || this.play.done) return null;
    if (this.level > 1 && !this.play.glowing) return null;
    const t = this.play.target();
    if (!t) return null;
    const L = this.layout();
    return t.kind === 'card' ? L.cards[t.i] : L.stalls[t.i];
  }

  /** A stall's middle, in global units (scripted checks tap there). */
  stallCenter(i: number) {
    const r = this.layout().stalls[i];
    return this.stalls[i].node.toGlobal({ x: r.w / 2, y: r.h / 2 });
  }

  targetNode(): Container | null {
    const t = this.play.target();
    if (!t) return null;
    return t.kind === 'card' ? this.cards[t.i] : this.stalls[t.i].node;
  }

  private async swing(n: Container) {
    await this.ctx.tw.to(n, { rotation: -0.4 }, { duration: 0.12 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: 0.3 }, { duration: 0.15 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.12 });
  }

  private async shake(n: Container) {
    const x = n.x;
    for (const d of [-8, 8, -6, 0]) {
      if (!this.alive || n.destroyed) return;
      await this.ctx.tw.to(n, { x: x + d }, { duration: 0.07 });
    }
  }

  private async wiggle(n: Container) {
    if (this.ctx.tw.busy(n)) return;
    await this.ctx.tw.to(n, { rotation: 0.05 }, { duration: 0.1 });
    if (this.alive && !n.destroyed) await this.ctx.tw.to(n, { rotation: -0.05 }, { duration: 0.14 });
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
    for (const s of this.stalls) s.critter?.cheer();
    this.ctx.particles.burst(this.view.w / 2, this.view.h / 2, {
      kind: 'star',
      colors: [0xffffff, 0xfff3a0],
      count: 14,
      speed: [100, 260],
      gravity: 0,
      life: [0.5, 0.9],
    });
    await this.ctx.say('makerlane.done');
    if (!this.alive) return;
    this.ctx.finish({ misses: this.play.misses, hints: this.play.hints });
  }

  resize(v: View) {
    this.view = v;
    const L = this.layout();
    const g = this.bg.clear().rect(0, 0, v.w, v.h).fill(cream);
    // The dirt path under each row of the lane.
    const rows = new Set(L.spots.map((p) => p.y));
    g.rect(0, Math.min(...rows) - 80, v.w, v.h).fill(grass);
    for (const y of rows) {
      const xs = L.spots.filter((p) => p.y === y).map((p) => p.x);
      g.roundRect(
        Math.min(...xs) - L.bundle * 0.7,
        y - L.bundle * 0.45,
        Math.max(...xs) - Math.min(...xs) + L.bundle * 1.4,
        L.bundle * 0.9,
        L.bundle * 0.45,
      ).fill(swatch.brown.light);
    }
    if (L.rows === 2) {
      // The bend between the rows, on the right.
      const ys = [...rows].sort((a, b) => a - b);
      const x = Math.max(...L.spots.map((p) => p.x));
      g.roundRect(x - L.bundle * 0.45, ys[0], L.bundle * 0.9, ys[1] - ys[0], 20).fill(swatch.brown.light);
    }
    this.place();
  }

  /** Put everything where the present view wants it, without rebuilding anything she can see change (dimmed cards stay dim). */
  private place() {
    const L = this.layout();
    this.stalls.forEach((s, i) => s.node.position.set(L.stalls[i].x, L.stalls[i].y));
    if (this.beginArgs) this.showBeginning(...this.beginArgs);
    if (L.frame) {
      this.frame.position.set(L.frame.x, L.frame.y);
      this.cards.forEach((c, i) =>
        c.position.set(L.cards[i].x + L.cards[i].w / 2, L.cards[i].y + L.cards[i].h / 2),
      );
      for (const c of this.resultHolder.children)
        c.position.set(L.frame.x - c.width / 2 - 24, L.frame.y + L.frame.h / 2);
    }
    if (!this.busy && !this.play.done) {
      const p = this.spotAt(this.spot);
      this.bundle.position.set(p.x, p.y);
      if (this.drag) this.drag.home = { x: p.x, y: p.y };
    }
  }

  /** Touches are taken again; a rotation during the animation is caught up here. */
  private release() {
    this.busy = false;
    this.place();
  }

  update(dt: number) {
    this.clock += dt;
    const g = this.glow.clear();
    if (this.level === 1) for (const s of this.stalls) if (s.critter) s.critter.rotation = 0;
    const r = this.glowRect();
    if (!r) return;
    const pulse = 0.6 + 0.4 * Math.sin(this.clock * 4);
    g.roundRect(r.x - 8, r.y - 8, r.w + 16, r.h + 16, 22).stroke({
      width: 8,
      color: swatch.yellow.fill,
      alpha: pulse,
    });
    // Level 1: the waving maker waves.
    if (this.level === 1) {
      const t = this.play.target();
      const k = t?.kind === 'stall' ? this.stalls[t.i].critter : null;
      if (k) k.rotation = Math.sin(this.clock * 6) * 0.08;
    }
  }

  /** The ghost finger: tap the waving stall (level 1), drag the bundle to the maker who can use it (2), tap the right card (3). */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished) return null;
    const n = this.targetNode();
    if (!n) return null;
    if (this.level === 2) {
      const t = this.play.target()!;
      const r = this.layout().stalls[t.i];
      return { drag: { on: this.bundle }, to: { on: n, x: r.w / 2, y: r.h * 0.6 }, pause: 1.2 };
    }
    if (this.level === 1) {
      const r = this.layout().stalls[0];
      return { tap: { on: n, x: r.w / 2, y: r.h / 2 }, pause: 1.4 };
    }
    return { tap: { on: n }, pause: 1.4 };
  }

  destroy() {
    this.alive = false;
    this.drag?.destroy();
  }
}

function stickerPicture(seed: number): Container {
  const rng = new Rng(seed);
  return stickerArt(rng.shuffle(THINGS.map((t) => t as Form)));
}

export const makerLane: GameModule = {
  id: 'maker-lane',
  name: 'Maker Lane',
  titleLine: 'game.maker-lane',
  region: 'cozy-village',
  challenge: 'noticing',
  skills: ['where things come from', 'how things are made', 'plant or animal', 'cause and effect'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => LEVEL_NAMES[clampLevel(level)],
  music: STYLES.hub,
  touchDemo: true,
  coplayHint:
    'Be the maker and the carrier: one of you moves the bundle, the other says what the maker will do to it. Swap at the next stall.',
  offScreen: 'Pick up a sock, a box or some bread together and ask: what did it look like before?',
  hubIcon: () => new WigglyIcon(iconArt()),
  sticker: (seed) => stickerPicture(seed),
  create: (ctx) => new MakerLane(ctx),
};
