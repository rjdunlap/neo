import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch, wood } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import type { Game, GameContext, TouchIntent } from '../types';
import { barrelArt, plumbArt, potArt } from './art';
import {
  RAFT_SLOTS,
  raftFix,
  raftLoad,
  raftRoundFor,
  raftVerdict,
  sinkPlan,
  type RaftPot,
  type RaftResult,
  type RaftRound,
  type SinkPlan,
} from './logic';

/** The ring's last stop: the Launch button; stops 0 to 5 are the slots under the pallet. */
const LAUNCH_STOP = RAFT_SLOTS;

/** Why a launch failed, so two in a row for the same reason can be told apart from two different ones. */
const reasonOf = (r: RaftResult) => (r.kind === 'tip' ? `tip-${r.side}` : r.kind);

/**
 * Garden Raft (level 8): a pallet of pots has to cross the pond. She taps floats in under the pallet and taps Launch; the raft
 * crosses, sits too low, or tips. A failed launch is an observation, never a miss: it gets the explaining line, and after two
 * in a row for the same reason the best slot glows (one hint). Round 3 starts with a raft that already crossed with the herbs,
 * and a heavy pumpkin arrives: she revises it.
 */
export class GardenRaft implements Game {
  readonly plan: SinkPlan;
  readonly rounds: RaftRound[];
  round = 0;
  /** Misses stay zero: a launch that fails is a test, so only hints count. */
  readonly misses = 0;
  hints = 0;
  busy = true;
  finished = false;
  /** Float slots in the water now. */
  readonly placed = new Set<number>();
  /** Whether round 3's late pumpkin is on the pallet. */
  arrived = false;
  /** Launches this round, and the reason of the last failed one with how many failed in a row for it. */
  launches = 0;
  private lastReason = '';
  private streak = 0;
  private hinted = false;
  glowSlot: number | null = null;

  /** Slot tap targets, live only while she builds. */
  readonly areas: Container[] = [];
  readonly launchButton = new Container();
  readonly tray = new Container();
  private readonly background = new Graphics();
  private readonly bank = new Graphics();
  private readonly water = new Graphics();
  private readonly glow = new Graphics();
  private readonly ring = new Graphics();
  private readonly trayArt = new Graphics();
  private readonly raft = new Container();
  private readonly plank = new Graphics();
  private readonly potNodes = new Map<RaftPot, Container>();
  private readonly floatNodes = new Map<number, Container>();
  private plumb: Container | null = null;
  private view: View;
  private clock = 0;
  private lastLine: LineId = 'sink.raft-ask';
  pick = 0;
  private couchOn = false;
  private botWait = 1.2;
  /** How far the raft has glided from its slots, and how far it sits down or tilts, drawn in `update`. */
  private readonly pose = { glide: 0, sink: 0, tilt: 0 };
  askForHint = () => this.requestHint();
  hintLabel = 'Show a hint';

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = sinkPlan(ctx.level);
    this.rounds = raftRoundFor(this.plan, ctx.rng);
    ctx.stage.addChild(this.background, this.bank, this.water);
    this.raft.addChild(this.plank);
    ctx.stage.addChild(this.raft);
    for (let i = 0; i < RAFT_SLOTS; i++) {
      const area = new Container();
      onTap(area, () => void this.tapSlot(i));
      area.eventMode = 'none';
      this.areas.push(area);
    }
    this.launchButton.hitArea = new Rectangle(-85, -75, 170, 150);
    this.launchButton.addChild(new Graphics());
    onTap(this.launchButton, () => void this.launch());
    this.launchButton.eventMode = 'none';
    this.tray.hitArea = new Rectangle(-85, -75, 170, 150);
    this.tray.addChild(this.trayArt);
    onTap(this.tray, () => void this.tapTray());
    this.tray.eventMode = 'none';
    for (const g of [this.glow, this.ring]) g.eventMode = 'none';
    ctx.stage.addChild(...this.areas, this.launchButton, this.tray, this.glow, this.ring);
  }

  private get current() {
    return this.rounds[this.round];
  }

  private get load(): RaftPot[] {
    return raftLoad(this.current, this.arrived);
  }

  private get verdict(): RaftResult {
    return raftVerdict(this.load, this.placed);
  }

  start() {
    this.resize(this.view);
    void this.begin(0);
  }

  private instruct(line: LineId) {
    this.lastLine = line;
    void this.ctx.instruct(line, { name: this.ctx.childName });
  }

  // Rounds ------------------------------------------------------------------------------

  /** A new pallet: the pots hop on, a raft already in the water for round 3, and then she builds. */
  private async begin(i: number) {
    this.round = i;
    this.busy = true;
    this.launches = this.streak = 0;
    this.lastReason = '';
    this.hinted = false;
    this.glowSlot = null;
    this.arrived = !this.current.late;
    this.clearRaft();
    for (const s of this.current.start) this.addFloat(s, false);
    this.live(false);
    this.drawAll();
    const tw = this.ctx.tw;
    for (const pot of this.load) {
      const node = this.addPot(pot);
      node.scale.set(0);
      void tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
      sfx.clunk();
      await tw.wait(0.25);
    }
    if (this.finished) return;
    if (this.current.late) {
      // The first raft is already in the water, level for the herbs: watch it cross, then the pumpkin arrives.
      await tw.wait(0.4);
      await this.glideAcross();
      if (this.finished) return;
      await this.ctx.say('sink.raft-next', { name: this.ctx.childName });
      this.arrived = true;
      const late = this.current.late;
      const node = this.addPot(late);
      node.scale.set(0);
      await tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.35, ease: ease.outBack });
      sfx.clunk();
      this.drawAll();
    }
    if (this.finished) return;
    this.busy = false;
    this.live(true);
    this.instruct('sink.raft-ask');
  }

  private clearRaft() {
    for (const n of [...this.potNodes.values(), ...this.floatNodes.values()]) {
      this.ctx.tw.kill(n);
      n.destroy({ children: true });
    }
    this.potNodes.clear();
    this.floatNodes.clear();
    this.placed.clear();
    this.removePlumb();
    this.pose.glide = this.pose.sink = this.pose.tilt = 0;
  }

  private addPot(pot: RaftPot): Container {
    const node = new Container();
    node.eventMode = 'none';
    node.addChild(potArt(pot.stones, pot.stones === 3));
    node.getChildAt(0).scale.set(1.35);
    this.potNodes.set(pot, node);
    this.raft.addChild(node);
    this.drawAll();
    return node;
  }

  private addFloat(slot: number, pop: boolean): Container {
    const node = new Container();
    node.eventMode = 'none';
    node.addChild(barrelArt());
    this.floatNodes.set(slot, node);
    this.placed.add(slot);
    this.raft.addChildAt(node, 0);
    if (pop) {
      node.scale.set(0.3);
      void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    }
    return node;
  }

  /** The slot taps and the buttons take touches only while she builds. */
  private live(on: boolean) {
    const mode = on && !this.finished ? 'static' : 'none';
    for (const a of this.areas) a.eventMode = mode;
    this.launchButton.eventMode = mode;
    this.tray.eventMode = mode;
  }

  // Building and launching ---------------------------------------------------------------

  private get left() {
    return this.current.floats - this.placed.size;
  }

  /** Tapping a slot puts a float in, or lifts it back out. Free: nothing here is ever wrong. */
  private async tapSlot(slot: number) {
    if (this.busy || this.finished) return;
    if (this.placed.has(slot)) {
      const node = this.floatNodes.get(slot);
      this.floatNodes.delete(slot);
      this.placed.delete(slot);
      if (node) {
        sfx.pop(4);
        void this.ctx.tw
          .to(node, { alpha: 0 }, { duration: 0.2 })
          .then(() => node.destroy({ children: true }));
      }
    } else if (this.left > 0) {
      this.addFloat(slot, true);
      sfx.splash();
      this.ctx.particles.burst(this.slotX(slot), this.surface(), {
        colors: [swatch.blue.fill, swatch.blue.light],
        count: 10,
        speed: [120, 240],
        gravity: 700,
        angle: -Math.PI / 2,
        spread: 1.4,
        size: [0.3, 0.5],
      });
    } else {
      // No floats left on the tray: it wiggles to say so, with no failure sound.
      sfx.tick();
      void this.ctx.tw
        .to(this.tray, { rotation: 0.12 }, { duration: 0.08 })
        .then(() => this.ctx.tw.to(this.tray, { rotation: 0 }, { duration: 0.12, ease: ease.outBack }));
    }
    this.changed();
  }

  /** The tray places the next float in the leftmost free slot: a forgiving shortcut. */
  private tapTray() {
    if (this.busy || this.finished || this.left <= 0) return;
    for (let i = 0; i < RAFT_SLOTS; i++) if (!this.placed.has(i)) return void this.tapSlot(i);
  }

  /** The design changed: the old plumb bob and glow no longer describe it. */
  private changed() {
    this.glowSlot = null;
    this.removePlumb();
    this.drawAll();
  }

  private async launch() {
    if (this.busy || this.finished || this.placed.size === 0) return;
    this.busy = true;
    this.live(false);
    this.glowSlot = null;
    this.launches++;
    const result = this.verdict;
    this.showPlumb();
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    if (result.kind === 'ok') return this.crossed();
    const reason = reasonOf(result);
    this.streak = reason === this.lastReason ? this.streak + 1 : 1;
    this.lastReason = reason;
    if (result.kind === 'low') await this.sitLow();
    else await this.tip(result.side);
    if (this.finished) return;
    this.removePlumb();
    this.busy = false;
    this.live(true);
    if (this.streak >= 2) this.showHint();
  }

  private async crossed() {
    const tw = this.ctx.tw;
    sfx.sparkle();
    const say = this.ctx.say('sink.raft-ok', { name: this.ctx.childName });
    await this.glideAcross();
    if (this.finished) return;
    this.ctx.pet.cheer();
    this.ctx.particles.burst(this.view.w - 80, this.surface() - 90, {
      kind: 'star',
      colors: [swatch.yellow.fill, swatch.white.fill],
      count: 16,
      speed: [120, 260],
      gravity: 200,
      angle: -Math.PI / 2,
      spread: 2,
    });
    await say;
    await tw.wait(0.2);
    if (this.finished) return;
    if (this.round + 1 >= this.rounds.length) return void this.end();
    void this.begin(this.round + 1);
  }

  /** The raft glides off to the garden bank on the far side and the pallet is cleared. */
  private async glideAcross() {
    const target = this.view.w;
    await this.ctx.tw.to(this.pose, { glide: target }, { duration: 1.3, ease: ease.inOutSine });
    if (this.finished) return;
    this.clearRaft();
    this.drawAll();
  }

  /** The raft sits too low: water washes over the pots, then it bobs back up. */
  private async sitLow() {
    const tw = this.ctx.tw;
    sfx.splash();
    this.ctx.particles.burst(this.view.w / 2, this.surface(), {
      colors: [swatch.blue.fill, swatch.blue.light],
      count: 16,
      speed: [120, 260],
      gravity: 700,
      angle: -Math.PI / 2,
      spread: 1.6,
      size: [0.3, 0.5],
    });
    const say = this.ctx.say('sink.raft-low', { name: this.ctx.childName });
    await tw.to(this.pose, { sink: 46 }, { duration: 0.5, ease: ease.inOutSine });
    await tw.to(this.pose, { sink: 0 }, { duration: 0.6, ease: ease.outBack });
    await say;
  }

  /** The raft tilts toward the heavy end and the pots slide into the water, then it rights itself and they hop back on. */
  private async tip(side: 'left' | 'right') {
    const tw = this.ctx.tw;
    const dir = side === 'left' ? -1 : 1;
    sfx.boing();
    const say = this.ctx.say(side === 'left' ? 'sink.raft-tip-left' : 'sink.raft-tip-right', {
      name: this.ctx.childName,
    });
    await tw.to(this.pose, { tilt: 0.22 * dir }, { duration: 0.6, ease: ease.inQuad });
    sfx.splash();
    const pots = [...this.potNodes.values()];
    await Promise.all(
      pots.map((n) => tw.to(n, { alpha: 0, y: n.y + 90 }, { duration: 0.4, ease: ease.inQuad })),
    );
    await tw.to(this.pose, { tilt: 0 }, { duration: 0.5, ease: ease.outBack });
    for (const n of pots) {
      n.alpha = 1;
      n.scale.set(0);
      void tw.to(n.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
    }
    this.drawAll();
    await say;
  }

  // Hints --------------------------------------------------------------------------------

  /** The slot where one change would help glows. One hint per pallet, however it was asked for. */
  private showHint() {
    const fix = raftFix(this.load, [...this.placed], this.current.floats);
    const slot = fix.add[0] ?? fix.remove[0];
    if (slot === undefined) return void this.instruct('sink.raft-ask');
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
    this.glowSlot = slot;
    this.drawAll();
    void this.ctx.say('sink.raft-hint', { name: this.ctx.childName });
  }

  /** The pause sheet's Show a hint: the glow once she can build, otherwise the current instruction again, uncounted. */
  private requestHint() {
    if (this.finished) return;
    if (!this.busy) this.showHint();
    else void this.ctx.instruct(this.lastLine, { name: this.ctx.childName });
  }

  private async end() {
    if (this.finished) return;
    this.finished = true;
    this.live(false);
    await this.ctx.tw.wait(0.5);
    this.ctx.pet.cheer();
    sfx.sparkle();
    await this.ctx.say('sink.done');
    // No journal entry at this level: rafts are not one of the things.
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Bots and the controller ------------------------------------------------------------

  /** The stop the bot wants next: a slot to change, or Launch once the design crosses. */
  private wanted(): number {
    const fix = raftFix(this.load, [...this.placed], this.current.floats);
    return fix.remove[0] ?? fix.add[0] ?? LAUNCH_STOP;
  }

  autotouch(): TouchIntent | null {
    if (this.finished || this.busy) return null;
    const stop = this.wanted();
    if (stop === LAUNCH_STOP)
      return this.placed.size > 0
        ? { tap: { on: this.launchButton, x: this.launchButton.x, y: this.launchButton.y } }
        : null;
    return { tap: { on: this.areas[stop], x: this.slotX(stop), y: this.surface() } };
  }

  /** Left and right move a ring over the six slots and Launch; the action button toggles a float or launches. */
  control(input: CouchControls) {
    this.couchOn = true;
    if (this.busy || this.finished) return;
    for (const p of input.players) {
      if (p.direction === 0) this.pick = Math.min(LAUNCH_STOP, this.pick + 1);
      else if (p.direction === 2) this.pick = Math.max(0, this.pick - 1);
      if (p.action) return void (this.pick === LAUNCH_STOP ? this.launch() : this.tapSlot(this.pick));
    }
  }

  /** The "watch me" demo: rings the stop it wants and presses it. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    out.players[0].active = true;
    this.botWait -= dt;
    if (this.busy || this.finished || this.botWait > 0) return out;
    const want = this.wanted();
    if (want !== this.pick) {
      out.players[0].direction = want > this.pick ? 0 : 2;
      this.botWait = 0.4;
      return out;
    }
    out.players[0].action = true;
    this.botWait = 1;
    return out;
  }

  // Layout -----------------------------------------------------------------------------

  /** The slots span from clear of the pet to the right margin. */
  private get slotLeft() {
    return 190;
  }

  private get slotWidth() {
    return (this.view.w - 40 - this.slotLeft) / RAFT_SLOTS;
  }

  private slotX(slot: number) {
    return this.slotLeft + (slot + 0.5) * this.slotWidth;
  }

  /** The water's surface, where the pallet floats. */
  private surface() {
    return this.view.h * 0.46;
  }

  resize(v: View) {
    this.view = v;
    const s = this.surface();
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    // The pond, with the garden bank on the far side and the shelf on the near one.
    this.water
      .clear()
      .rect(0, s, v.w, v.h - s)
      .fill({ color: swatch.blue.fill, alpha: 0.5 });
    this.water.moveTo(0, s);
    for (let x = 0; x <= v.w; x += 20) this.water.lineTo(x, s + Math.sin(x / 30) * 4);
    this.water.stroke({ width: 4, color: swatch.blue.fill, alpha: 0.8 });
    this.bank
      .clear()
      .rect(v.w - 36, s - 70, 36, v.h * 0.1)
      .fill(swatch.green.fill)
      .rect(0, v.h * 0.78, v.w, v.h * 0.22)
      .fill(wood.light)
      .rect(0, v.h * 0.78 - 8, v.w, 12)
      .fill(wood.fill);
    const top = s - 110;
    for (const [i, a] of this.areas.entries()) {
      a.hitArea = new Rectangle(this.slotLeft + i * this.slotWidth, top, this.slotWidth, 220);
    }
    const y = v.h - 85;
    this.launchButton.position.set(v.w - 125, y);
    this.tray.position.set(v.w - 335, y);
    this.drawButtons();
    this.drawAll();
  }

  private drawButtons() {
    const g = this.launchButton.getChildAt(0) as Graphics;
    g.clear()
      .roundRect(-85, -75, 170, 150, 30)
      .fill(swatch.green.fill)
      .stroke({ width: 6, color: swatch.green.line })
      .poly([-26, -34, 36, 0, -26, 34])
      .fill(swatch.white.fill);
  }

  /** Everything that follows the design: plank, pots, floats, the tray, the glow. */
  private drawAll() {
    const s = this.surface();
    this.raft.pivot.set(this.slotLeft + 3 * this.slotWidth, 0);
    this.raft.position.set(this.slotLeft + 3 * this.slotWidth + this.pose.glide, s + this.pose.sink);
    const w = this.slotWidth;
    this.plank
      .clear()
      .roundRect(this.slotLeft, -30, w * RAFT_SLOTS, 30, 8)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
    for (const [pot, node] of this.potNodes) node.position.set(this.slotX(pot.slot), -30);
    for (const [slot, node] of this.floatNodes) node.position.set(this.slotX(slot), 40);
    const t = this.trayArt.clear();
    t.roundRect(-85, -75, 170, 150, 30).fill({ color: swatch.white.fill, alpha: 0.6 });
    for (let i = 0; i < this.left; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      t.roundRect(-64 + col * 66, -50 + row * 50, 56, 40, 14)
        .fill(swatch.red.fill)
        .stroke({ width: 3, color: swatch.red.line });
    }
    this.tray.visible = !this.finished;
    this.drawGlow();
  }

  private showPlumb() {
    this.removePlumb();
    const load = this.load;
    const weight = load.reduce((n, p) => n + p.stones, 0);
    const moment = load.reduce((n, p) => n + p.stones * p.slot, 0);
    const slot = moment / weight;
    const node = new Container();
    node.addChild(plumbArt(50));
    node.position.set(this.slotLeft + (slot + 0.5) * this.slotWidth, 0);
    this.raft.addChild(node);
    this.plumb = node;
  }

  private removePlumb() {
    this.plumb?.destroy({ children: true });
    this.plumb = null;
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.glowSlot === null || this.finished) return;
    g.roundRect(
      this.slotLeft + this.glowSlot * this.slotWidth + 4,
      this.surface() - 106,
      this.slotWidth - 8,
      212,
      20,
    ).stroke({ width: 8, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    // The raft bobs a little on the pond, and sits where the launch put it.
    const bob = this.busy ? 0 : Math.sin(this.clock * 2.4) * 3;
    this.raft.position.set(
      this.slotLeft + 3 * this.slotWidth + this.pose.glide,
      this.surface() + this.pose.sink + bob,
    );
    this.raft.rotation = this.pose.tilt;
    const ring = this.ring.clear();
    if (this.couchOn && !this.busy && !this.finished) {
      if (this.pick === LAUNCH_STOP)
        ring
          .roundRect(this.launchButton.x - 92, this.launchButton.y - 82, 184, 164, 30)
          .stroke({ width: 8, color: swatch.teal.line });
      else
        ring
          .roundRect(
            this.slotLeft + this.pick * this.slotWidth + 2,
            this.surface() - 110,
            this.slotWidth - 4,
            220,
            22,
          )
          .stroke({ width: 8, color: swatch.teal.line });
    }
  }

  destroy() {
    this.finished = true;
  }
}
