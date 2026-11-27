import { Container, Graphics, Rectangle, type Text } from 'pixi.js';
import { cream, grass, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import { ease } from '../../engine/tween';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { label } from '../../ui/text';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  checkButton,
  drawPips,
  drawStrip,
  face,
  heart,
  racerArt,
  rigOrder,
  spinner as spinnerArt,
  stripRuler,
  sw,
  type SpinnerArt,
} from './art';
import {
  BTN_H,
  CHECK_W,
  NAME_OF,
  PROOF_SPINS,
  RIG_BOX,
  RIG_COUNT,
  RIG_TALLY,
  RIG_WEDGES,
  RULER,
  SETTLE_R,
  countOf,
  give,
  inBand,
  makeRound,
  nextRig,
  planFor,
  rigLayout,
  rigRight,
  spinRun,
  type Box,
  type Kind,
  type Plan,
  type RigLayout,
  type RigTarget,
  type SetSpec,
  type Spin,
  type Wheel,
} from './logic';
import { RunPlayer } from './runs';
import { wedgePieces, type Piece } from './wedges';

/*
 * Spinner Fair level 9, Rig it: two critters share an eight-wedge wheel that starts even, and the pet asks for a share
 * for its favourite ("about 3 out of every 8 spins", then "about 1 out of every 4"). She hands wedges between the two
 * (a wedge dragged onto the other critter's box, or a tap on a box) and taps Check; a Check on a wheel that is not the
 * share is the only miss. Then eighty honest spins fill the strip and the pet names the count: the proof run judges
 * nothing and is never spun again.
 */

type Phase = 'make' | 'proof';

/** Seconds the proof run plays for: its first eight spins one by one, then the other seventy-two as a fast-forward. */
const PROOF_SECONDS = [2.4, 2.4];

export class RigGame implements Game {
  readonly plan: Plan;
  readonly sets: SetSpec[];
  readonly hintLabel = 'Show me';
  setIndex = 0;
  phase: Phase = 'make';
  /** The wheel as it is now (wedges move until a right Check). */
  wheel: Wheel;
  /** The favourite's spins and all spins of the proof run so far. */
  count = 0;
  total = 0;
  /** The proof run's count of the favourite, once it has played. */
  proved: number | null = null;
  misses = 0;
  hints = 0;
  setMisses = 0;
  glowing = false;
  hinted = false;
  /** The proof run is playing. */
  spinning = false;
  busy = false;
  finished = false;
  art!: SpinnerArt;
  pieces: Piece[] = [];
  /** The favourite's box, then the friend's: the drop and tap targets. */
  boxes: Container[] = [];
  readonly check = new Container();
  private L: RigLayout;
  private clock = 0;
  /** The wedges are rebuilt on the next frame (never inside a drag's own drop). */
  private rebuild = false;
  /** Bumped by every new line of hers or the pet's, so an older chain of lines stops. */
  private talk = 0;
  private readonly runs: RunPlayer;
  private readonly backdrop: Backdrop;
  private readonly panel = new Graphics();
  private readonly strip = new Graphics();
  private readonly stripNode = new Container();
  private readonly boxLayer = new Container();
  private readonly spinLayer = new Container();
  private readonly glowRing = new Graphics();
  private boxNumbers: Text[] = [];
  private boxPips: Graphics[] = [];
  private tallyNumbers: Text[] = [];

  constructor(private readonly ctx: GameContext) {
    this.plan = planFor(ctx.level);
    this.sets = makeRound(ctx.level, ctx.rng);
    this.wheel = this.set.wheels[0];
    this.L = rigLayout(ctx.view);
    this.runs = new RunPlayer(ctx.tw, RIG_WEDGES, {
      wheel: () => this.art.wheel,
      land: (s, loud) => this.land(s, loud),
      redraw: () => this.drawCounts(),
    });
    this.backdrop = new Backdrop(
      {
        sky: [cream, swatch.blue.light],
        hills: [grass, swatch.green.light],
        horizon: 0.36,
        clouds: 2,
        sun: false,
        seed: 89,
      },
      ctx.view,
    );
    this.panel.eventMode = this.glowRing.eventMode = this.stripNode.eventMode = 'none';
    this.check.addChild(checkButton(CHECK_W, BTN_H));
    this.check.hitArea = new Rectangle(-CHECK_W / 2, -BTN_H / 2, CHECK_W, BTN_H);
    onTap(this.check, () => this.pressCheck());
    ctx.stage.addChild(
      this.backdrop,
      this.panel,
      this.stripNode,
      this.boxLayer,
      this.check,
      this.spinLayer,
      this.glowRing,
    );
    this.dressSet();
  }

  get set(): SetSpec {
    return this.sets[this.setIndex];
  }
  get racers(): [Kind, Kind] {
    return this.set.racers!;
  }
  get fav(): Kind {
    return this.set.favourite!;
  }
  get friend(): Kind {
    return this.set.friend!;
  }
  get target(): RigTarget {
    return this.set.target!;
  }
  private get dragging() {
    return this.pieces.some((p) => p.drag.dragging);
  }
  /** What a scripted play reads. */
  get state() {
    return {
      level: this.plan.level,
      set: this.setIndex,
      phase: this.phase,
      racers: this.racers,
      favourite: this.fav,
      friend: this.friend,
      target: this.target,
      wheel: this.wheel.slice(),
      counts: this.racers.map((k) => countOf(this.wheel, k)),
      right: rigRight(this.wheel, this.fav, this.target.k),
      next: nextRig(this.wheel, this.racers, this.target.k),
      count: this.count,
      total: this.total,
      proved: this.proved,
      misses: this.misses,
      hints: this.hints,
      glowing: this.glowing,
      spinning: this.spinning,
      busy: this.busy,
      finished: this.finished,
    };
  }

  start() {
    void this.instruct();
  }

  private instruct() {
    const { n, of } = this.target;
    return this.ctx.instruct('sf.instruct.9', { kind: NAME_OF[this.fav], n, of });
  }

  destroy() {
    this.finished = true;
    this.runs.stop();
    for (const p of this.pieces) p.drag.destroy();
    this.killTweens();
  }

  private killTweens() {
    if (this.art) this.ctx.tw.kill(this.art.wheel);
    this.ctx.tw.kill(this.check.scale);
    for (const b of this.boxes) this.ctx.tw.kill(b.scale);
  }

  // ---- building a set ----

  private dressSet() {
    this.killTweens();
    this.art?.node.destroy({ children: true });
    for (const b of this.boxes) b.destroy({ children: true });
    for (const p of this.pieces) p.drag.destroy();
    this.pieces = [];
    this.wheel = this.set.wheels[0];
    this.count = this.total = 0;
    this.proved = null;
    this.phase = 'make';
    this.art = spinnerArt(this.wheel, SETTLE_R, { stand: false, bare: true });
    this.art.wheel.eventMode = 'passive';
    this.spinLayer.addChild(this.art.node);
    this.buildPieces();
    this.boxNumbers = [];
    this.boxPips = [];
    this.boxes = this.racers.map((kind, i) => {
      const b = racerArt(kind, RIG_BOX);
      if (i === 0) {
        const h = heart();
        h.position.set(RIG_BOX / 2 - 22, -RIG_BOX / 2 + 20);
        b.addChild(h);
      }
      // The count under the box: a numeral and as many pips, of the wheel's eight.
      const num = label('0', 40);
      num.position.set(-40, RIG_BOX / 2 + RIG_COUNT / 2 + 2);
      const pips = new Graphics();
      pips.position.set(-8, RIG_BOX / 2 + 20);
      b.addChild(num, pips);
      this.boxNumbers.push(num);
      this.boxPips.push(pips);
      b.hitArea = new Rectangle(-RIG_BOX / 2, -RIG_BOX / 2, RIG_BOX, RIG_BOX + RIG_COUNT);
      onTap(b, () => this.tapBox(i));
      this.boxLayer.addChild(b);
      return b;
    });
    this.drawBoxCounts();
    this.resize(this.ctx.view);
  }

  /** One movable piece per wedge, in the wheel's frame; the hub caps them. */
  private buildPieces() {
    this.pieces = wedgePieces(this.art, this.wheel, SETTLE_R, this.ctx.tw, this.pieces, {
      onPick: () => sfx.pop(5),
      onDrop: (p, x, y) => this.dropWedge(p, x, y),
    });
    this.syncDrags();
  }

  private syncDrags() {
    for (const p of this.pieces) p.drag.enabled = this.phase === 'make' && !this.busy && !this.finished;
  }

  private drawBoxCounts() {
    this.racers.forEach((kind, i) => {
      const n = countOf(this.wheel, kind);
      this.boxNumbers[i].text = String(n);
      drawPips(this.boxPips[i], n, RIG_WEDGES, sw(kind));
    });
  }

  /**
   * The strip with its ruler of eighths. While she makes the wheel it is empty and carries the pet's order; at the proof
   * run the order gives way to the share marker and the two counts above the strip's ends.
   */
  private buildStrip() {
    const { w, h } = this.L.strip;
    this.stripNode.removeChildren().forEach((c) => {
      if (c !== this.strip) c.destroy({ children: true });
    });
    const proof = this.phase === 'proof';
    this.stripNode.addChild(this.strip, stripRuler(w, h, proof ? this.target.k : null, RIG_WEDGES));
    this.tallyNumbers = [];
    if (proof) {
      const tally = new Container();
      this.tallyNumbers = this.racers.map((kind, i) => {
        const f = face(kind, 36);
        f.position.set(i === 0 ? 22 : w - 22, -RIG_TALLY / 2);
        const n = label('0', 32);
        n.position.set(i === 0 ? 70 : w - 70, -RIG_TALLY / 2);
        tally.addChild(f, n);
        return n;
      });
      this.stripNode.addChild(tally);
    } else {
      const order = rigOrder(this.fav, this.target.n, this.target.of);
      order.position.set(w / 2 + 30, h / 2);
      this.stripNode.addChild(order);
    }
    this.drawCounts();
  }

  private drawCounts() {
    const { w, h } = this.L.strip;
    drawStrip(this.strip, w, h, this.fav, this.friend, this.count, this.total);
    if (!this.tallyNumbers.length) return;
    this.tallyNumbers[0].text = String(this.count);
    this.tallyNumbers[1].text = String(this.total - this.count);
  }

  // ---- play ----

  private lift(node: Container, to = 1.08) {
    this.ctx.tw.kill(node.scale);
    node.scale.set(to);
    void this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.3, ease: ease.outBack });
  }

  private say(...args: Parameters<GameContext['say']>) {
    this.talk++;
    return this.ctx.say(...args);
  }

  /** A tap on a critter's box hands it one wedge from the other: the aim-free way to move a wedge. Never counted. */
  private tapBox(i: number) {
    if (this.finished) return;
    this.lift(this.boxes[i], 1.05);
    if (this.busy || this.phase !== 'make' || this.dragging || this.rebuild) return;
    const next = give(this.wheel, this.racers, this.racers[i]);
    if (!next) {
      sfx.pop(2);
      void this.say('sf.keep-one');
      return;
    }
    this.handTo(next, i);
  }

  /** A wedge let go: on the other critter's box it changes owner (the wheel re-sorts); anywhere else it goes back. Never counted. */
  private dropWedge(p: Piece, x: number, y: number): boolean {
    if (this.phase !== 'make' || this.busy || this.finished) return false;
    const at = this.ctx.stage.toLocal(this.art.wheel.toGlobal({ x, y }));
    const near = this.boxes
      .map((n, i) => ({ i, d: Math.hypot(n.x - at.x, n.y - at.y) }))
      .sort((a, b) => a.d - b.d)[0];
    const to = this.racers[near.i];
    if (near.d > RIG_BOX / 2 + 60 || to === p.kind) return false;
    const next = give(this.wheel, this.racers, to);
    if (!next) {
      sfx.pop(2);
      void this.say('sf.keep-one');
      return false;
    }
    this.handTo(next, near.i);
    p.node.visible = false;
    return true;
  }

  private handTo(next: Wheel, to: number) {
    this.wheel = next;
    this.rebuild = true;
    this.drawBoxCounts();
    const b = this.boxes[to];
    sfx.bell(4 + to * 3, 0.2);
    this.ctx.particles.burst(b.x, b.y, {
      kind: 'dot',
      colors: [sw(this.racers[to]).fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 250,
      life: [0.3, 0.6],
    });
    this.lift(b, 1.12);
    void this.say('sf.count-now', {
      n: String(countOf(next, this.racers[0])),
      m: String(countOf(next, this.racers[1])),
    });
  }

  /** Check judges the wheel, never a spin: right when the favourite has exactly the wedges asked for. */
  private pressCheck() {
    if (this.finished) return;
    this.lift(this.check);
    if (this.busy || this.dragging || this.rebuild) return;
    if (this.phase !== 'make') {
      sfx.pop(3);
      return;
    }
    if (rigRight(this.wheel, this.fav, this.target.k)) {
      void this.proof();
      return;
    }
    this.misses++;
    this.setMisses++;
    sfx.boing();
    void this.hearWrong();
  }

  /** The count she made, then the reason; the second wrong Check on a set lights the help. A wedge she moves meanwhile stops the lines, never the help. */
  private async hearWrong() {
    const set = this.setIndex;
    const kind = NAME_OF[this.fav];
    const live = () => !this.finished && !this.busy && set === this.setIndex;
    const line = this.say('sf.rig-count', { kind, n: countOf(this.wheel, this.fav) });
    const t = this.talk;
    await line;
    if (live() && t === this.talk)
      await this.ctx.say('sf.rig-hint', { kind, n: this.target.n, of: this.target.of });
    if (!live()) return;
    if (this.setMisses >= 2 && !this.glowing) {
      this.lightHint();
      if (t === this.talk) await this.say('sf.help');
    }
  }

  private lightHint() {
    this.glowing = true;
    if (!this.hinted) {
      this.hinted = true;
      this.hints++;
    }
  }

  /** Asked-for help: the share marked on the wheel's rim and the next critter to hand a wedge to (one hint per set); asked again, the wedge is handed over, or Check pressed. */
  askForHint() {
    if (this.busy || this.finished || this.spinning || this.dragging || this.rebuild) return;
    if (this.phase !== 'make') return;
    if (!this.glowing) {
      this.lightHint();
      void this.say('sf.help');
      return;
    }
    const to = nextRig(this.wheel, this.racers, this.target.k);
    if (!to) {
      this.pressCheck();
      return;
    }
    this.handTo(give(this.wheel, this.racers, to)!, this.racers.indexOf(to));
  }

  /** A right Check: eighty honest spins fill the strip and the pet names the count. The proof run judges nothing. */
  private async proof() {
    this.busy = true;
    this.glowing = false;
    this.phase = 'proof';
    this.syncDrags();
    const set = this.setIndex;
    const alive = () => !this.finished && set === this.setIndex;
    sfx.sparkle();
    this.ctx.particles.burst(this.check.x, this.check.y - BTN_H / 2, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 10,
      speed: [60, 150],
      gravity: 200,
      life: [0.3, 0.6],
    });
    this.buildStrip();
    const { k, n, of } = this.target;
    await this.say('sf.rig-yes', { n: k });
    if (!alive()) return;
    this.spinning = true;
    // Drawn first, honestly and in order, from the game's seeded RNG; then landed on the strip.
    const spins = spinRun(this.ctx.rng, PROOF_SPINS, RIG_WEDGES);
    if (!(await this.runs.play(spins.slice(0, RIG_WEDGES), PROOF_SECONDS[0], true, alive))) return;
    if (!(await this.runs.play(spins.slice(RIG_WEDGES), PROOF_SECONDS[1], false, alive))) return;
    this.spinning = false;
    this.proved = this.count;
    await this.ctx.tw.wait(0.3);
    if (!alive()) return;
    if (inBand(this.count, k)) await this.say('sf.rig-proof', { n: this.count, a: n, b: of });
    else await this.say('sf.unusual', { n: this.count });
    if (!alive()) return;
    await this.endSet();
  }

  /** One spin of the proof run lands on the strip. */
  private land(s: Spin, loud: boolean) {
    const kind = this.wheel[s.wedge];
    this.total++;
    if (kind === this.fav) this.count++;
    if (loud) {
      sfx.bell(kind === this.fav ? 5 : 3, 0.2);
      this.drawCounts();
    }
  }

  private async endSet() {
    if (this.setIndex + 1 >= this.sets.length) {
      this.finished = true;
      sfx.bell(7, 0.35);
      sfx.bell(11, 0.3);
      await this.ctx.say('sf.done-rig');
      await this.ctx.tw.wait(0.5);
      this.ctx.finish({ misses: this.misses, hints: this.hints });
      return;
    }
    await this.ctx.tw.wait(0.4);
    if (this.finished) return;
    this.setIndex++;
    this.setMisses = 0;
    this.hinted = false;
    this.glowing = false;
    this.dressSet();
    sfx.whoosh();
    await this.say('sf.next');
    if (this.finished) return;
    this.busy = false;
    this.syncDrags();
    void this.instruct();
  }

  // ---- shell hooks ----

  resize(view: View) {
    const L = (this.L = rigLayout(view));
    this.backdrop.resize(view);
    this.art.node.position.set(L.spinner.x, L.spinner.y);
    this.boxes.forEach((b, i) => b.position.set(L.boxes[i].x, L.boxes[i].y));
    this.check.position.set(L.check.x, L.check.y);
    this.stripNode.position.set(L.strip.x - L.strip.w / 2, L.strip.y - L.strip.h / 2);
    this.buildStrip();
    const left = L.strip.x - L.strip.w / 2 - 16,
      top = L.strip.y - L.strip.h / 2 - RIG_TALLY;
    this.panel
      .clear()
      .roundRect(left, top, L.strip.w + 32, RIG_TALLY + L.strip.h + RULER + 6, 20)
      .fill(cream);
  }

  update(dt: number) {
    this.clock += dt;
    if (this.finished) return;
    if (this.rebuild) {
      this.rebuild = false;
      this.buildPieces();
    }
    this.runs.update(dt);
    this.check.alpha = this.phase === 'make' ? 1 : 0.45;
    this.glowRing.clear();
    this.art.glow.clear();
    if (!this.glowing || this.busy || this.phase !== 'make') return;
    const pulse = 7 + 3 * Math.sin(this.clock * 5);
    // The share asked for, marked on the rim: an arc over as many wedges, from the favourite's first.
    const a0 = this.art.wheel.rotation - Math.PI / 2;
    this.art.glow
      .arc(0, 0, SETTLE_R + 12 + pulse * 0.5, a0, a0 + (this.target.k * 2 * Math.PI) / RIG_WEDGES)
      .stroke({ width: 10, color: swatch.yellow.fill, cap: 'round' });
    const ring = (b: Box, extra = 0) =>
      this.glowRing
        .roundRect(b.x - b.w / 2 - pulse, b.y - b.h / 2 - pulse, b.w + 2 * pulse, b.h + extra + 2 * pulse, 24)
        .stroke({ width: 7, color: swatch.yellow.fill });
    const to = nextRig(this.wheel, this.racers, this.target.k);
    if (to) ring(this.L.boxes[this.racers.indexOf(to)], RIG_COUNT);
    else ring(this.L.check);
  }

  /** The ghost finger, from the picture: a tap on the box of the critter that needs a wedge until the share is right, then Check. */
  autotouch(): TouchIntent | null {
    if (this.busy || this.finished || this.spinning || this.rebuild || this.dragging) return null;
    if (this.phase !== 'make') return null;
    const to = nextRig(this.wheel, this.racers, this.target.k);
    if (!to) return { tap: { on: this.check }, pause: 0.8 };
    return { tap: { on: this.boxes[this.racers.indexOf(to)] }, pause: 0.7 };
  }
}
