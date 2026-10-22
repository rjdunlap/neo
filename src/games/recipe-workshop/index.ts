import { Container, Graphics, Rectangle, type FederatedPointerEvent } from 'pixi.js';
import { Critter, CRITTERS } from '../../art/critter';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import type { CompanionRig } from '../../creatures/companion';
import type { LineId } from '../../content/voice-script';
import { palmOnGlass } from '../../engine/input';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { drawBowl, drawWorkshop, panel, picture, plus, potArt, serveArt, spoonArt, topperArt, undoArt } from './art';
import {
  askHint, bowlAt, centre, doAction, emptyBowl, grow, isFull, LEVELS, makeRound, planFor, restartState, roundState, serve, stepFor,
  undo, within, workshopLayout, type Action, type Bowl, type Box, type Hint, type Ingredient, type LevelId, type Round, type RoundState,
  type Topper, type Verdict, type WorkshopLayout,
} from './logic';

/** Levels whose authored first round has been played this session; the demonstration always opens on it. */
const authoredShown = new Set<LevelId>();
/** A pentatonic step per ingredient, so each dollop has its own plip. */
const PLIP: Record<Ingredient, number> = { berries: 5, apple: 7, orange: 9, base: 11 };

type Target =
  | { kind: 'pot'; i: number } | { kind: 'topper'; i: number } | { kind: 'spoon' } | { kind: 'undo' }
  | { kind: 'serve'; i: number } | { kind: 'bowl'; i: number } | { kind: 'card' } | { kind: 'bubble'; i: number };

interface Press { id: number; target: Target; x: number; y: number; dragging: boolean }

class RecipeWorkshop implements Game {
  readonly hintLabel = 'Show a hint';
  readonly level: LevelId;
  readonly round: Round;
  state: RoundState;
  private L: WorkshopLayout;
  private readonly bg = new Graphics();
  private readonly cardLayer = new Container();
  private readonly cardBits: Container[] = [];
  private readonly bubbles: Container[] = [];
  private readonly pots: Container[] = [];
  private readonly toppers: Container[] = [];
  private readonly friends: Container[] = [];
  private readonly bowls: Container[] = [];
  private readonly bowlArt: Graphics[] = [];
  private readonly rings = new Graphics();
  private readonly spoon = new Container();
  private readonly undoBtn = new Container();
  private readonly serves: Container[] = [];
  private readonly glow = new Graphics();
  private readonly fx = new Container();
  /** Takes every touch and resolves it to the nearest target; a carried pot, topper or spoon rides above the finger. */
  readonly tapLayer = new Container();
  private carried: Container | null = null;
  private press: Press | null = null;
  private companion: CompanionRig | null = null;
  private critter: Critter | null = null;
  private finished = false;
  private destroyed = false;
  private t = 0;
  private lastDown = -Infinity;
  /** The bot shows the free order and the card at the first request. */
  private demoStep = 0;
  private readonly cancel = (e: PointerEvent) => { if (this.press && e.pointerId === this.press.id) this.drop(null); };

  constructor(private readonly ctx: GameContext) {
    this.level = planFor(ctx.level).id;
    const authored = !!ctx.demo || !authoredShown.has(this.level);
    if (!ctx.demo) authoredShown.add(this.level);
    const made = makeRound(this.level, ctx.rng, authored);
    this.round = made.round;
    this.state = roundState(this.level, made.requests);
    this.L = workshopLayout(ctx.view, this.level) ?? workshopLayout({ w: Math.max(ctx.view.w, 1024), h: Math.max(ctx.view.h, 768) }, this.level)!;

    ctx.stage.addChild(this.bg, this.cardLayer);
    this.round.pots.forEach((ing) => { const p = potArt(ing); this.pots.push(p); ctx.stage.addChild(p); });
    this.round.toppers.forEach((t) => { const c = new Container(); c.addChild(topperArt(t, 44)); this.toppers.push(c); ctx.stage.addChild(c); });
    this.buildCard();
    this.buildFriends();
    for (let i = 0; i < this.state.slots.length; i++) {
      const c = new Container(), g = new Graphics();
      c.addChild(g); this.bowls.push(c); this.bowlArt.push(g); ctx.stage.addChild(c);
      const s = new Container(); s.addChild(serveArt()); this.serves.push(s); ctx.stage.addChild(s);
    }
    this.spoon.addChild(spoonArt());
    this.undoBtn.addChild(undoArt());
    ctx.stage.addChild(this.rings, this.spoon, this.undoBtn, this.glow, this.fx, this.tapLayer);
    for (const o of [this.bg, this.cardLayer, ...this.pots, ...this.toppers, ...this.bowls, ...this.serves, this.rings, this.spoon, this.undoBtn, this.glow, this.fx]) o.eventMode = 'none';
    this.undoBtn.visible = !!this.L.undo;
    this.tapLayer.eventMode = 'static';
    this.tapLayer.on('pointerdown', (e) => this.down(e));
    this.tapLayer.on('globalpointermove', (e) => this.move(e));
    this.tapLayer.on('pointerup', (e) => this.up(e));
    this.tapLayer.on('pointerupoutside', (e) => this.up(e));
    window.addEventListener('pointercancel', this.cancel, true);
    this.resize(ctx.view);
  }

  start() {
    const r = this.state.slots[0].request;
    if (this.level === 1) { void this.ctx.instruct('recipe.instruct.1'); return; }
    void this.ctx.say(this.level === 2 ? 'recipe.instruct.2' : 'recipe.instruct.3').then(() => {
      if (!this.destroyed && r) void this.ctx.instruct(`recipe.request.${r.fruit}` as LineId);
    });
  }

  /* Building ----------------------------------------------------------------------------------------- */

  private buildCard() {
    const r = this.state.slots[0].request;
    if (!r) return;
    for (const ing of [r.fruit, 'base'] as const) { const p = picture(ing, ing === 'base' ? 0.75 : 0.62); this.cardBits.push(p); }
    const sp = spoonArt(); sp.scale.set(0.6); this.cardBits.push(sp);
    for (const b of this.cardBits) this.cardLayer.addChild(b);
    if (this.level === 3) {
      this.state.slots.forEach((s) => {
        const c = new Container(), g = new Graphics();
        c.addChild(g, topperArt(s.request!.topper!, 32));
        this.bubbles.push(c); this.cardLayer.addChild(c);
      });
    }
  }

  private buildFriends() {
    const pet = this.ctx.companion();
    pet.eventMode = 'none';
    const b = pet.getLocalBounds();
    pet.scale.set(Math.min(1, (this.level === 3 ? 80 : 110) / b.height));
    this.ctx.track(pet);
    this.companion = pet;
    this.friends.push(pet);
    this.ctx.stage.addChild(pet);
    if (this.level === 3 && this.round.friend) {
      const k = new Critter(CRITTERS[this.round.friend]);
      k.eventMode = 'none';
      k.scale.set(0.42);
      this.ctx.track(k);
      this.critter = k;
      this.friends.push(k);
      this.ctx.stage.addChild(k);
    }
  }

  /* Drawing ------------------------------------------------------------------------------------------ */

  resize(v: View) {
    this.L = workshopLayout(v, this.level) ?? this.L;
    const L = this.L;
    drawWorkshop(this.bg, v.w, v.h, L.pots[0].y + L.pots[0].h - 8, L.bowls[0].y + L.bowls[0].h * 0.55);
    const place = (o: Container, b: Box) => o.position.set(b.x + b.w / 2, b.y + b.h / 2);
    this.pots.forEach((p, i) => place(p, L.pots[i]));
    this.toppers.forEach((p, i) => place(p, L.toppers[i]));
    this.bowls.forEach((p, i) => place(p, L.bowls[i]));
    this.serves.forEach((p, i) => place(p, L.serves[i]));
    place(this.spoon, L.spoon);
    if (L.undo) place(this.undoBtn, L.undo);
    this.friends.forEach((f, i) => f.position.set(L.friends[i].x, L.friends[i].y));
    this.drawCard();
    for (let i = 0; i < this.bowls.length; i++) this.drawBowl(i);
    this.drawRings();
    this.tapLayer.hitArea = new Rectangle(0, 0, v.w, v.h);
  }

  private drawCard() {
    const c = this.L.card;
    this.cardLayer.visible = !!c && !this.state.done;
    if (!c) return;
    const g = (this.cardLayer.children[0] instanceof Graphics && this.cardLayer.children[0].label === 'card')
      ? this.cardLayer.children[0] as Graphics : (() => { const n = new Graphics(); n.label = 'card'; this.cardLayer.addChildAt(n, 0); return n; })();
    g.clear();
    panel(g, c.x, c.y, c.w, c.h);
    const xs = [0.2, 0.5, 0.8].map((f) => c.x + c.w * f), y = c.y + c.h / 2;
    this.cardBits.forEach((b, i) => b.position.set(xs[i], y + (i === 2 ? -4 : 6)));
    plus(g, (xs[0] + xs[1]) / 2, y);
    const ax = (xs[1] + xs[2]) / 2;
    // An arrow, not a minus: then mix.
    g.moveTo(ax - 14, y).lineTo(ax + 10, y).stroke({ width: 5, color: 0x2b2b3a, cap: 'round' });
    g.poly([ax + 4, y - 10, ax + 16, y, ax + 4, y + 10]).fill(0x2b2b3a);
    this.bubbles.forEach((bub, i) => {
      const b = this.L.bubbles[i], bg = bub.children[0] as Graphics, f = this.L.friends[i];
      bub.position.set(b.x + b.w / 2, b.y + b.h / 2);
      bg.clear().roundRect(-b.w / 2, -b.h / 2, b.w, b.h, 30).fill(0xffffff).stroke({ width: 5, color: swatch.teal.line });
      // A tail toward the friend who wants it.
      const dx = f.x - bub.x;
      bg.poly([-14, b.h / 2 - 3, 14, b.h / 2 - 3, Math.max(-60, Math.min(60, dx * 0.25)), b.h / 2 + 30]).fill(0xffffff).stroke({ width: 4, color: swatch.teal.line });
      bg.rect(-12, b.h / 2 - 6, 24, 6).fill(0xffffff);
    });
  }

  private drawBowl(i: number) {
    const b = this.L.bowls[i];
    drawBowl(this.bowlArt[i], this.state.slots[i].bowl, b.w, b.h);
    this.serves[i].alpha = this.state.slots[i].served ? 0.35 : 1;
  }

  private drawRings() {
    const g = this.rings.clear();
    if (this.level !== 3 || this.state.done) return;
    const b = this.L.bowls[this.state.active];
    g.roundRect(b.x - 14, b.y - 14, b.w + 28, b.h + 28, 30).stroke({ width: 7, color: swatch.orange.fill, alpha: 0.85 });
  }

  /** Where the glow goes: the bowl's next step, or the bowl itself at level 3 when another bowl is being worked on. */
  private glowBox(): Box | null {
    if (this.state.done) return null;
    const s = this.state, act = s.slots[s.active];
    const i = act && !act.served && act.glow ? s.active : s.slots.findIndex((x) => x.glow && !x.served);
    if (i < 0) return null;
    if (i !== s.active) return this.L.bowls[i];
    return this.boxFor(stepFor(s.slots[i], this.round.pots), i);
  }

  private boxFor(h: Hint, i: number): Box {
    const L = this.L;
    if (h.kind === 'add') return L.pots[Math.max(0, this.round.pots.indexOf(h.ing))];
    if (h.kind === 'mix') return L.spoon;
    if (h.kind === 'topper') return L.toppers[this.round.toppers.indexOf(h.topper)];
    if (h.kind === 'undo') return L.undo ?? L.spoon;
    return L.serves[i];
  }

  /* Input -------------------------------------------------------------------------------------------- */

  private targetAt(x: number, y: number): Target | null {
    const L = this.L, m = 15;
    const hit = (b: Box) => within(grow(b, m), x, y);
    for (let i = 0; i < L.pots.length; i++) if (hit(L.pots[i])) return { kind: 'pot', i };
    for (let i = 0; i < L.toppers.length; i++) if (hit(L.toppers[i])) return { kind: 'topper', i };
    if (hit(L.spoon)) return { kind: 'spoon' };
    if (L.undo && hit(L.undo)) return { kind: 'undo' };
    for (let i = 0; i < L.serves.length; i++) if (hit(L.serves[i])) return { kind: 'serve', i };
    for (let i = 0; i < L.bowls.length; i++) if (hit(L.bowls[i])) return { kind: 'bowl', i };
    if (L.card && hit(L.card)) return { kind: 'card' };
    for (let i = 0; i < L.bubbles.length; i++) if (hit(L.bubbles[i])) return { kind: 'bubble', i };
    return null;
  }

  private nodeFor(t: Target): Container | null {
    switch (t.kind) {
      case 'pot': return this.pots[t.i];
      case 'topper': return this.toppers[t.i];
      case 'spoon': return this.spoon;
      case 'undo': return this.undoBtn;
      case 'serve': return this.serves[t.i];
      case 'bowl': return this.bowls[t.i];
      case 'card': return this.cardLayer;
      case 'bubble': return this.bubbles[t.i];
    }
  }

  private down(e: FederatedPointerEvent) {
    if (this.press || palmOnGlass()) return;
    const now = performance.now();
    if (now - this.lastDown < 80) return;
    this.lastDown = now;
    const p = this.ctx.stage.toLocal(e.global);
    const t = this.targetAt(p.x, p.y);
    if (!t) return;
    this.squash(this.nodeFor(t));
    const carry = t.kind === 'pot' || t.kind === 'topper' || t.kind === 'spoon';
    // A carryable thing waits to see whether the finger lifts (a tap) or travels (a drag); everything else acts at once.
    if (carry) { this.press = { id: e.pointerId, target: t, x: p.x, y: p.y, dragging: false }; return; }
    this.tapTarget(t);
  }

  private move(e: FederatedPointerEvent) {
    const pr = this.press;
    if (!pr || e.pointerId !== pr.id) return;
    const p = this.ctx.stage.toLocal(e.global);
    if (!pr.dragging && Math.hypot(p.x - pr.x, p.y - pr.y) > 28 && !this.finished) {
      pr.dragging = true;
      this.carried = this.carryArt(pr.target);
      this.carried.eventMode = 'none';
      this.fx.addChild(this.carried);
    }
    if (this.carried) this.carried.position.set(p.x, p.y - 40);
  }

  private up(e: FederatedPointerEvent) {
    const pr = this.press;
    if (!pr || e.pointerId !== pr.id) return;
    if (!pr.dragging) { this.press = null; this.tapTarget(pr.target); return; }
    const p = this.ctx.stage.toLocal(e.global);
    this.drop({ x: p.x, y: p.y - 40 });
  }

  /** A carried thing lands in the bowl under it and works there; anywhere else it floats home and nothing happens. */
  private drop(at: { x: number; y: number } | null) {
    const pr = this.press;
    this.press = null;
    const c = this.carried;
    this.carried = null;
    if (!pr) return;
    const i = at ? bowlAt(this.L, at.x, at.y) : null;
    if (i !== null && !this.state.slots[i].served && !this.finished) {
      c?.destroy({ children: true });
      this.select(i);
      this.tapTarget(pr.target, i);
      return;
    }
    if (!c) return;
    const home = this.nodeFor(pr.target)!;
    void this.ctx.tw.to(c, { x: home.x, y: home.y, alpha: 0 }, { duration: 0.35 }).then(() => c.destroy({ children: true }));
  }

  private carryArt(t: Target): Container {
    if (t.kind === 'pot') { const g = new Graphics(), ing = this.round.pots[t.i]; g.circle(0, 0, 30).fill(dollop(ing)).stroke({ width: 3, color: 0x8c8c9c }); return g; }
    if (t.kind === 'topper') return topperArt(this.round.toppers[t.i], 36);
    return spoonArt();
  }

  private tapTarget(t: Target, bowl = this.state.active) {
    if (this.finished) return;
    switch (t.kind) {
      case 'pot': this.add(bowl, this.round.pots[t.i], this.L.pots[t.i]); break;
      case 'topper': this.act(bowl, { kind: 'topper', topper: this.round.toppers[t.i] }); break;
      case 'spoon': this.mix(bowl); break;
      case 'undo': this.undo(bowl); break;
      case 'serve': this.serve(t.i); break;
      case 'bowl': this.select(t.i); break;
      case 'card': this.replay(); break;
      case 'bubble': sfx.pop(9); void this.ctx.say(`recipe.notopper.${this.state.slots[t.i].request!.topper}` as LineId); break;
    }
  }

  /* Actions ------------------------------------------------------------------------------------------ */

  private select(i: number) {
    if (this.state.slots[i].served || this.state.active === i) return;
    this.state.active = i;
    sfx.tick();
    this.drawRings();
  }

  private act(i: number, a: Action): boolean {
    const slot = this.state.slots[i];
    if (slot.served) return false;
    const changed = doAction(slot, a);
    if (changed) this.drawBowl(i);
    if (a.kind === 'topper') { sfx.tick(); if (changed) this.wobble(this.bowls[i]); }
    return changed;
  }

  private add(i: number, ing: Ingredient, from: Box) {
    const slot = this.state.slots[i];
    if (slot.served) return;
    if (isFull(slot.bowl, ing)) {
      sfx.boing();
      this.wiggle(this.pots[this.round.pots.indexOf(ing)]);
      void this.ctx.say('recipe.full');
      return;
    }
    // A dollop arcs from the pot into the bowl; the bowl takes it at once so a quick hand is never lost.
    this.act(i, { kind: 'add', ing });
    sfx.marimba(PLIP[ing], 0.4);
    const blob = new Graphics().circle(0, 0, 22).fill(dollop(ing)).stroke({ width: 3, color: 0x8c8c9c });
    const a = centre(from), b = centre(this.L.bowls[i]);
    blob.position.set(a.x, a.y - 30);
    blob.eventMode = 'none';
    this.fx.addChild(blob);
    void this.ctx.tw.to(blob, { x: b.x, y: b.y - 30, alpha: 0.2 }, { duration: 0.3 }).then(() => blob.destroy());
    this.ctx.particles.burst(b.x, b.y - 20, { kind: 'ring', colors: [dollop(ing)], count: 6, speed: [40, 120], gravity: 200, life: [0.3, 0.5] });
  }

  private mix(i: number) {
    const changed = this.act(i, { kind: 'mix' });
    sfx.whoosh();
    // The spoon swirls whether or not there was anything to stir: an empty stir is harmless.
    this.ctx.tw.kill(this.spoon);
    this.spoon.rotation = 0;
    void this.ctx.tw.to(this.spoon, { rotation: Math.PI * 2 }, { duration: 0.45 }).then(() => { if (!this.destroyed) this.spoon.rotation = 0; });
    if (changed) {
      const b = centre(this.L.bowls[i]);
      this.ctx.particles.burst(b.x, b.y - 30, { kind: 'star', colors: [0xffffff, swatch.pink.light], count: 8, speed: [60, 160], gravity: 100, life: [0.3, 0.6] });
    }
  }

  private undo(i: number) {
    const slot = this.state.slots[i];
    if (slot.served || !undo(slot)) { sfx.tick(); return; }
    sfx.pop(4);
    this.drawBowl(i);
  }

  replay() {
    const r = this.state.slots[this.state.active]?.request;
    sfx.pop(9);
    this.squash(this.cardLayer);
    if (r) void this.ctx.instruct(`recipe.request.${r.fruit}` as LineId);
  }

  private serve(i: number) {
    if (this.state.slots[i].served) return;
    this.select(i);
    const r = serve(this.state, i);
    if (r.kind === 'empty') { void this.ctx.say('recipe.empty'); this.wiggle(this.bowls[i]); return; }
    if (r.kind === 'miss') {
      sfx.boing();
      this.wiggle(this.bowls[i]);
      this.companion?.wiggle();
      this.pulse(r.verdict, i);
      void this.ctx.say(missLine(r.verdict)).then(() => { if (!this.destroyed && r.newHint) void this.ctx.say(hintLine(stepFor(this.state.slots[i], this.round.pots))); });
      return;
    }
    sfx.bell(9);
    this.serves[i].alpha = 0.35;
    const friend = this.friends[i];
    if (friend === this.companion) this.companion?.cheer(); else this.critter?.cheer();
    this.hop(this.bowls[i]);
    this.drawRings();
    if (this.state.done) { this.finish(); return; }
    void this.ctx.say('recipe.served');
  }

  /** The card pulses the part that differs: the ingredient's picture, the spoon, or that friend's bubble. */
  private pulse(v: Verdict, i: number) {
    const r = this.state.slots[i].request;
    if (!r) return;
    const node = v.kind === 'extra' || v.kind === 'missing' ? this.cardBits[v.ing === 'base' ? 1 : 0]
      : v.kind === 'notMixed' ? this.cardBits[2] : this.bubbles[i];
    if (!node) return;
    this.ctx.tw.kill(node.scale);
    const s = node.scale.x;
    node.scale.set(s * 1.3);
    void this.ctx.tw.to(node.scale, { x: s, y: s }, { duration: 0.5 });
  }

  private finish() {
    this.finished = true;
    this.glow.clear();
    this.drawCard();
    this.companion?.cheer();
    this.critter?.cheer();
    sfx.tada();
    for (const b of this.bowls) { this.ctx.tw.kill(b); void this.ctx.tw.to(b, { y: b.y - 24 }, { duration: 0.4 }); }
    void this.ctx.say(this.level === 3 ? 'recipe.all' : 'recipe.served');
    void this.ctx.tw.wait(2.4).then(() => { if (!this.destroyed) this.ctx.finish({ misses: this.state.misses, hints: this.state.hints }); });
  }

  /* Motion ------------------------------------------------------------------------------------------- */

  private squash(n: Container | null) {
    if (!n) return;
    this.ctx.tw.kill(n.scale);
    n.scale.set(1.06, 0.9);
    void this.ctx.tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.18 });
  }

  private wiggle(n: Container) {
    if (this.ctx.tw.busy(n)) return;
    void this.ctx.tw.to(n, { rotation: 0.12 }, { duration: 0.08 })
      .then(() => this.ctx.tw.to(n, { rotation: -0.12 }, { duration: 0.12 }))
      .then(() => this.ctx.tw.to(n, { rotation: 0 }, { duration: 0.08 }));
  }

  private wobble(n: Container) { this.squash(n); }

  private hop(n: Container) {
    if (this.ctx.tw.busy(n)) return;
    const y = n.y;
    void this.ctx.tw.to(n, { y: y - 20 }, { duration: 0.12 }).then(() => this.ctx.tw.to(n, { y }, { duration: 0.16 }));
  }

  /* Help --------------------------------------------------------------------------------------------- */

  askForHint() {
    if (this.state.done) return;
    const i = askHint(this.state);
    if (i < 0) return;
    if (i !== this.state.active && this.level === 3) { void this.ctx.say('recipe.hint.bowl'); return; }
    void this.ctx.say(hintLine(stepFor(this.state.slots[i], this.round.pots)));
  }

  /** Empty bowls and the same request, keeping the round's misses and hints. */
  restart() {
    if (this.state.done) return;
    this.drop(null);
    restartState(this.state);
    for (let i = 0; i < this.bowls.length; i++) this.drawBowl(i);
    this.drawRings();
  }

  /* Frame and bot ------------------------------------------------------------------------------------ */

  update(dt: number) {
    this.t += dt;
    const g = this.glow.clear(), b = this.finished ? null : this.glowBox();
    if (!b) return;
    g.roundRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20, 26).stroke({ width: 8, color: swatch.yellow.line });
    g.alpha = 0.65 + 0.35 * Math.sin(this.t * 4);
  }

  /** The ghost finger: level 1 both pots, the spoon and Serve; level 2 the base first (the order is free); level 3 each bowl in turn. */
  autotouch(): TouchIntent | null {
    if (this.finished) return null;
    const s = this.state, tap = (b: Box, pause = 0.7): TouchIntent => ({ tap: { on: this.tapLayer, x: b.x + b.w / 2, y: b.y + b.h / 2 }, pause });
    if (this.level === 1) {
      const slot = s.slots[0], n = slot.bowl.loose.length + Object.keys(slot.bowl.mixed).length;
      if (n < 2) return tap(this.L.pots[Math.min(1, slot.bowl.loose.length)]);
      if (slot.bowl.loose.length) return tap(this.L.spoon, 1);
      return tap(this.L.serves[0]);
    }
    let i = s.active;
    if (s.slots[i].served) i = s.slots.findIndex((x) => !x.served);
    if (i < 0) return null;
    if (i !== s.active) return tap(this.L.bowls[i]);
    const slot = s.slots[i], r = slot.request!;
    if (this.level === 2 && this.demoStep === 0 && isEmptyBowl(slot.bowl)) { this.demoStep = 1; return tap(this.L.pots[1]); }
    return tap(this.boxFor(stepHint(slot.bowl, r), i), 0.7);
  }

  destroy() {
    this.destroyed = true;
    this.finished = true;
    window.removeEventListener('pointercancel', this.cancel, true);
    this.carried = null;
    this.press = null;
  }
}

const isEmptyBowl = (b: Bowl) => b.loose.length === 0 && Object.keys(b.mixed).length === 0;
const stepHint = (b: Bowl, r: NonNullable<RoundState['slots'][number]['request']>): Hint => stepFor({ ...emptySlotLike(), bowl: b, request: r }, []);
const emptySlotLike = () => ({ bowl: emptyBowl(), stack: [], request: null, misses: 0, glow: false, hintCounted: false, served: false });

/** A dollop's colour; the white base gets a faint grey so it reads on the white card. */
function dollop(ing: Ingredient): number {
  return ing === 'base' ? 0xfafafa : ({ berries: 0x7a5cc8, apple: 0xff8fb4, orange: 0xff9a3c } as const)[ing];
}

function missLine(v: Verdict): LineId {
  switch (v.kind) {
    case 'extra': return `recipe.extra.${v.ing}` as LineId;
    case 'missing': return `recipe.missing.${v.ing}` as LineId;
    case 'notMixed': return 'recipe.notmixed';
    case 'noTopper': case 'wrongTopper': return `recipe.notopper.${v.topper}` as LineId;
    default: return 'recipe.empty';
  }
}

function hintLine(h: Hint): LineId {
  switch (h.kind) {
    case 'add': return `recipe.hint.${h.ing}` as LineId;
    case 'topper': return `recipe.hint.${h.topper}` as LineId;
    default: return `recipe.hint.${h.kind}` as LineId;
  }
}

function bowlIcon(seed: number): Container {
  const c = new Container(), g = new Graphics();
  const bowl: Bowl = { mixed: { [(['berries', 'apple', 'orange'] as const)[Math.abs(seed) % 3]]: 1, base: 1 }, loose: [], top: Math.abs(seed >> 2) % 2 ? 'leaf' : 'star', folded: [] };
  drawBowl(g, bowl, 180, 130);
  c.addChild(g);
  return c;
}

function hubArt(): Container {
  const c = new Container(), g = new Graphics();
  drawBowl(g, { mixed: { berries: 1, base: 1 }, loose: [], top: null, folded: [] }, 150, 110);
  g.y = -60;
  const sp = spoonArt(); sp.scale.set(0.7); sp.position.set(56, -96);
  c.addChild(g, sp);
  return c;
}

function sticker(seed: number): Container {
  const c = bowlIcon(seed);
  c.y = -70;
  const wrap = new Container(); wrap.addChild(c);
  return wrap;
}

export const recipeWorkshop: GameModule = {
  id: 'recipe-workshop',
  name: 'Recipe Workshop',
  titleLine: 'game.recipe-workshop',
  region: 'cozy-village',
  skills: ['sequencing', 'following-directions', 'cause-and-effect', 'everyday-life'],
  bands: ['toddler', 'preschool', 'prek'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.hub,
  coplayHint: 'Card and cook: point to two pots on a pretend card and {name} makes that bowl, then swap.',
  offScreen: 'With pretend kitchen toys, make a bowl from a picture, then tell someone what you did first.',
  touchDemo: true,
  hubIcon: () => new WigglyIcon(hubArt()),
  sticker,
  create: (ctx) => new RecipeWorkshop(ctx),
};

export type { Topper };
