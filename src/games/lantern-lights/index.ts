import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { HeldDirection, idle, type CouchControls } from '../../engine/controller';
import { onTap } from '../../engine/input';
import { Rng } from '../../engine/random';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { label } from '../../ui/text';
import { tile, WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { courseMinimum, coursePonds, isLanternCourse } from './course';
import { LEVELS, allLit, footprint, hintFor, isLantern, lanternCount, litCount, makePonds, namedHint, planFor, press, shortWay, stuckAt, type LanternPlan, type Pond } from './logic';

/** The room beside the pond the two counts need; under it they move above the pond. */
const SIDE_ROOM = 240;

const WATER = 0x25315f;
const WATER_LINE = 0x151d3d;
const RIPPLE = 0x3a4a82;

/** One paper lantern, lit or dark, with its string above and its tassel below; it fills about `size` units around (0, 0). */
function lanternArt(lit: boolean, size: number): Container {
  const c = new Container();
  const g = new Graphics(), w = size * 0.6, h = size * 0.66;
  const body = lit ? swatch.orange.fill : 0x56648c, line = lit ? swatch.orange.line : 0x39456b, cap = lit ? 0xb4561c : 0x2c3556;
  g.moveTo(0, -h / 2 - size * 0.18).lineTo(0, -h / 2).stroke({ width: 3, color: line });
  g.ellipse(0, 0, w / 2, h / 2).fill(body).stroke({ width: 4, color: line });
  for (const k of [0.62, 0.3]) g.ellipse(0, 0, (w / 2) * k, h / 2).stroke({ width: 2, color: line, alpha: 0.55 });
  g.roundRect(-w * 0.3, -h / 2 - 4, w * 0.6, 12, 5).fill(cap);
  g.roundRect(-w * 0.3, h / 2 - 8, w * 0.6, 12, 5).fill(cap);
  g.moveTo(0, h / 2 + 4).lineTo(0, h / 2 + size * 0.15).stroke({ width: 3, color: line });
  g.circle(0, h / 2 + size * 0.17, 5).fill(lit ? swatch.yellow.fill : 0x6d7bab);
  if (lit) {
    g.ellipse(0, 0, w * 0.3, h * 0.34).fill({ color: 0xfff6c8, alpha: 0.95 });
    g.ellipse(-w * 0.13, -h * 0.12, w * 0.08, h * 0.12).fill({ color: 0xffffff, alpha: 0.7 });
  }
  c.addChild(g);
  return c;
}

/** A lily pad floating where no lantern hangs: a green leaf with a notch, about `size` units across. */
function padArt(size: number): Container {
  const c = new Container();
  const g = new Graphics(), r = size * 0.38;
  g.ellipse(0, 4, r + 2, r * 0.82 + 2).fill(0x1d5a3a);
  g.ellipse(0, 2, r, r * 0.82).fill(swatch.green.fill);
  // The notch: a wedge of water cut into the leaf.
  g.moveTo(0, 2).lineTo(r * 0.95, -r * 0.35).lineTo(r * 0.95, r * 0.2).closePath().fill(WATER);
  for (const a of [-2.4, -1.6, -0.8, 1.2, 2.2]) g.moveTo(0, 2).lineTo(Math.cos(a) * r * 0.7, 2 + Math.sin(a) * r * 0.58).stroke({ width: 2, color: swatch.green.line, alpha: 0.5 });
  c.addChild(g);
  return c;
}

class LanternLights implements Game {
  readonly plan: LanternPlan;
  index = -1;
  misses = 0;
  hints = 0;
  /** Presses beyond each pond's fewest, added up: the couch face-off score (lower is better). */
  excess = 0;
  busy = true;
  finished = false;
  pond!: Pond;
  /** The lanterns now: `true` is lit. */
  lit: boolean[] = [];
  cursor = 0;
  /** Presses on this pond, undone ones included. */
  presses = 0;
  hinted: number | null = null;

  private readonly ponds: Pond[];
  private readonly board = new Container();
  private readonly water = new Graphics();
  private readonly halos = new Graphics();
  private readonly lanterns = new Container();
  private readonly glow = new Graphics();
  private readonly score = label('', 34, ink);
  private readonly sub = label('', 24, ink, '500');
  /** Touch play (every play outside the couch): a tap on a lantern presses it, and three buttons undo, hint and start over. */
  private touch: boolean;
  readonly tapLayer = new Graphics();
  readonly undoButton = new Container();
  readonly hintButton = new Container();
  readonly againButton = new Container();
  /** After a pond lights by touch: replay a fewest way from the start, or go on. */
  readonly shortButton = new Container();
  readonly nextButton = new Container();
  /** A lit pond is waiting for Next pond (touch play outside a course). */
  waiting = false;
  /** The short way is being shown. */
  replaying = false;
  /** The lantern the replay is about to press, ringed. */
  private ring: number | null = null;
  private goOn: (() => void) | null = null;
  private readonly nextLabel = label('Next pond ▶', 24, ink);
  /** The two after-pond buttons have been named aloud once this round. */
  private toldAfter = false;
  private nodes: Container[] = [];
  private onArt: Container[] = [];
  private offArt: Container[] = [];
  private tokens: number[] = [];
  private history: number[] = [];
  private cell = 100;
  /** The counts share one line above the pond, because the room beside it is too narrow. */
  private stacked = false;
  private clock = 0;
  private view: View;
  private readonly held = new HeldDirection();
  private botWait = 0.8;
  /** Couch challenge course: fixed ponds in a row. Null in ordinary play, where ponds are generated. */
  private readonly course: { minimum: number } | null;
  private done: number[] = [];
  /** Presses already spent on the pond we are resuming, so leaving and coming back cannot erase them. */
  private carry = 0;
  private assisted = false;
  private told = false;
  /** School: this pond's "here is where Hint is" nudge has been said. */
  private nudged = false;
  /** The lily pads have been named aloud this round. */
  private toldPads = false;
  private settled = false;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.plan = planFor(ctx.level);
    const run = ctx.couch?.course;
    if (run && isLanternCourse(run.id)) {
      this.ponds = coursePonds(run.id);
      this.course = { minimum: courseMinimum(run.id) };
      this.index = run.resume.board - 1;
      this.done = run.resume.done.slice();
      this.carry = run.resume.attempts;
      this.assisted = run.resume.assisted;
    } else {
      this.ponds = makePonds(this.plan, ctx.rng);
      this.course = null;
    }
    this.touch = !ctx.couch;
    for (const part of [this.board, this.water, this.halos, this.lanterns, this.glow, this.score, this.sub]) part.eventMode = 'none';
    this.board.addChild(this.water, this.halos, this.lanterns, this.glow);
    ctx.stage.addChild(this.board, this.score, this.sub);
    // A layer over the pond works out which lantern a finger touched, so a press never depends on a drawing's own hit area.
    onTap(this.tapLayer, (e) => this.tapPond(e.global.x, e.global.y), { cooldown: 60 });
    this.tapLayer.cursor = 'pointer';
    const buttons: [Container, string, () => void][] = [
      [this.undoButton, 'Undo ↶', () => this.back()],
      [this.hintButton, 'Hint ◇', () => this.askForHint()],
      [this.againButton, 'Start over ↺', () => this.restart()],
    ];
    for (const [node, text, act] of buttons) {
      node.addChild(tile(160, 100, 'purple'), label(text, 24, ink));
      onTap(node, act, { cooldown: 200 });
    }
    this.shortButton.addChild(tile(320, 100, 'purple'), label('Show me a short way ▷', 24, ink));
    onTap(this.shortButton, () => void this.showShortWay(), { cooldown: 300 });
    this.nextButton.addChild(tile(220, 100, 'green'), this.nextLabel);
    onTap(this.nextButton, () => this.carryOn(), { cooldown: 300 });
    ctx.stage.addChild(this.tapLayer, this.undoButton, this.hintButton, this.againButton, this.shortButton, this.nextButton);
    this.showTouchParts(this.touch);
  }

  get n() { return this.pond.size; }
  /** The pond's lily pads (`false` on a pad), or undefined when every cell holds a lantern. */
  get mask() { return this.pond.mask; }

  start() { void this.next(); }

  /** A finger on the pond: the lantern under it takes the press. */
  private tapPond(gx: number, gy: number) {
    if (this.busy || this.finished || !this.pond) return;
    const p = this.board.toLocal({ x: gx, y: gy });
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    const c = Math.floor(p.x / this.cell), r = Math.floor(p.y / this.cell);
    if (c < 0 || r < 0 || c >= this.n || r >= this.n) return;
    const at = r * this.n + c;
    // A lily pad has no lantern: it bobs with a soft tick, nothing counts, and the cursor stays on the last lantern.
    if (!isLantern(at, this.mask)) return this.bobPad(at);
    this.cursor = at;
    this.press();
  }

  private bobPad(i: number) {
    sfx.tick();
    const node = this.nodes[i];
    void this.ctx.tw.to(node.scale, { x: 1.12, y: 0.9 }, { duration: 0.08 }).then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.18, ease: ease.outBack }));
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Layout and drawing                                                                            */
  /* -------------------------------------------------------------------------------------------- */

  resize(v: View) {
    this.view = v;
    if (!this.pond) return;
    // The counts sit beside the pond, clear of the edge; where the room beside it is too narrow (a big pond in
    // portrait), they share one line above it, between the top corner buttons, and the pond moves down to make room.
    const wide = (v.w - Math.min(116, Math.floor((v.h - 262) / this.n)) * this.n) / 2 >= SIDE_ROOM;
    this.cell = Math.min(116, Math.floor((v.h - (wide ? 262 : 322)) / this.n));
    const bw = this.n * this.cell;
    this.board.position.set((v.w - bw) / 2, wide ? 112 : 172);
    this.stacked = !wide;
    if (wide) {
      const x = Math.min((v.w + bw) / 2 + 150, v.w - 120);
      this.score.position.set(x, 190);
      this.sub.position.set(x, 236);
    } else {
      this.score.position.set(v.w / 2, 104);
    }
    this.sub.visible = wide && !this.finished;
    this.tally();
    this.tapLayer.clear().rect(0, 0, bw, bw).fill({ color: 0xffffff, alpha: 0.001 });
    this.tapLayer.hitArea = new Rectangle(0, 0, bw, bw);
    this.tapLayer.position.copyFrom(this.board.position);
    // The buttons sit in a row under the pond, clear of the pet's corner.
    const y = this.board.y + bw + 78;
    [this.undoButton, this.hintButton, this.againButton].forEach((b, i) => b.position.set(v.w / 2 + (i - 1) * 180, y));
    this.shortButton.position.set(v.w / 2 - 120, y);
    this.nextButton.position.set(v.w / 2 + 170, y);
    this.layout();
  }

  private center(i: number) {
    return { x: (i % this.n) * this.cell + this.cell / 2, y: Math.floor(i / this.n) * this.cell + this.cell / 2 };
  }

  /** The pond's water, and every lantern where it hangs. */
  private layout() {
    const n = this.n, cell = this.cell, w = n * cell;
    this.water.clear().roundRect(-18, -18, w + 36, w + 36, 30).fill(WATER).stroke({ width: 7, color: WATER_LINE });
    for (let k = 0; k < n * 2; k++) {
      const x = ((k * 97) % w), y = ((k * 53 + 17) % w);
      this.water.moveTo(x, y).lineTo(x + 26, y).stroke({ width: 3, color: RIPPLE, cap: 'round' });
    }
    this.nodes.forEach((node, i) => {
      const at = this.center(i);
      node.position.set(at.x, at.y + cell * 0.02);
      this.onArt[i].scale.set(cell / 100);
      this.offArt[i].scale.set(cell / 100);
    });
    this.drawHalos();
  }

  /** A warm glow under every lit lantern, which spills a little across its neighbours. */
  private drawHalos() {
    const g = this.halos.clear(), cell = this.cell;
    this.lit.forEach((on, i) => {
      if (!on || !isLantern(i, this.mask)) return;
      const at = this.center(i);
      g.circle(at.x, at.y, cell * 0.54).fill({ color: 0xff9d3c, alpha: 0.2 });
      g.circle(at.x, at.y, cell * 0.42).fill({ color: 0xffc247, alpha: 0.3 });
    });
  }

  private setArt(i: number, lit: boolean) {
    this.onArt[i].visible = lit;
    this.offArt[i].visible = !lit;
  }

  /** Flip a lantern's picture to match the board, with a quick turn. A later flip takes over from an earlier one. */
  private flip(i: number) {
    const node = this.nodes[i], to = this.lit[i], token = ++this.tokens[i];
    void this.ctx.tw.to(node.scale, { x: 0.12 }, { duration: 0.07 }).then(() => {
      if (this.tokens[i] !== token) return;
      this.setArt(i, to);
      this.drawHalos();
      return this.ctx.tw.to(node.scale, { x: 1 }, { duration: 0.1, ease: ease.outBack });
    });
  }

  update(dt: number) {
    this.clock += dt;
    if (!this.pond) return;
    const g = this.glow.clear(), cell = this.cell;
    if (this.ring !== null) {
      const m = this.center(this.ring);
      g.roundRect(m.x - cell / 2 + 2, m.y - cell / 2 + 2, cell - 4, cell - 4, 18).stroke({ width: 7, color: 0xffffff });
    }
    if (this.finished || this.busy) return;
    // A finger needs no cursor: the lantern pressed turns at once, and a hint rings the lantern to try.
    if (this.touch) return void this.drawHint(g);
    const at = this.center(this.cursor);
    // The cursor shows what a press would flip: the lantern and the four beside it.
    for (const c of footprint(this.n, this.cursor, this.mask)) {
      const m = this.center(c);
      g.roundRect(m.x - cell / 2 + 5, m.y - cell / 2 + 5, cell - 10, cell - 10, 14).fill({ color: 0xffffff, alpha: c === this.cursor ? 0.2 : 0.1 });
    }
    g.roundRect(at.x - cell / 2 + 3, at.y - cell / 2 + 3, cell - 6, cell - 6, 16).stroke({ width: 6, color: 0xffffff });
    this.drawHint(g);
  }

  private drawHint(g: Graphics) {
    if (this.hinted === null) return;
    const m = this.center(this.hinted), cell = this.cell;
    g.roundRect(m.x - cell / 2 - 2, m.y - cell / 2 - 2, cell + 4, cell + 4, 18).stroke({ width: 6 + 2 * Math.sin(this.clock * 6), color: swatch.yellow.fill });
  }

  destroy() {}

  /* -------------------------------------------------------------------------------------------- */
  /* Rounds and ponds                                                                              */
  /* -------------------------------------------------------------------------------------------- */

  private async next() {
    this.busy = true;
    this.index++;
    if (this.index >= this.ponds.length) return void this.finale();
    this.pond = this.ponds[this.index];
    this.lit = this.pond.board.slice();
    this.presses = this.carry;
    this.carry = 0;
    this.history = [];
    this.hinted = null;
    this.nudged = false;
    // The middle, or the lantern nearest it when a pad floats there.
    const mid = Math.floor((this.n * this.n) / 2);
    this.cursor = this.lit.map((_, i) => i).filter((i) => isLantern(i, this.mask)).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid))[0];
    this.nodes.forEach((n) => n.destroy({ children: true }));
    this.lanterns.removeChildren();
    this.nodes = [];
    this.onArt = [];
    this.offArt = [];
    this.tokens = this.lit.map(() => 0);
    for (let i = 0; i < this.lit.length; i++) {
      // A pad is stored lit, so its leaf is the "on" picture and it never turns.
      const pad = !isLantern(i, this.mask);
      const node = new Container(), on = pad ? padArt(100) : lanternArt(true, 100), off = pad ? new Container() : lanternArt(false, 100);
      node.addChild(off, on);
      node.eventMode = 'none';
      this.lanterns.addChild(node);
      this.nodes.push(node);
      this.onArt.push(on);
      this.offArt.push(off);
      this.setArt(i, this.lit[i]);
    }
    this.resize(this.view);
    this.tally();
    this.board.alpha = 0;
    await this.ctx.tw.to(this.board, { alpha: 1 }, { duration: 0.3 });
    this.busy = false;
    this.report();
    if (this.told) return;
    this.told = true;
    await this.ctx.instruct(!this.touch ? 'lantern.go' : this.ctx.band === 'school' ? 'lantern.go-school' : 'lantern.go-touch');
    if (this.mask && !this.toldPads) {
      this.toldPads = true;
      await this.ctx.say('lantern.pads');
    }
  }

  private tally() {
    if (!this.pond) return;
    const presses = `${this.presses} ${this.presses === 1 ? 'press' : 'presses'}`, lit = `${litCount(this.lit, this.mask)} of ${lanternCount(this.n, this.mask)} lit`;
    this.score.text = this.stacked ? `${presses} · ${lit}` : presses;
    this.sub.text = lit;
  }

  /** Hand a course's numbers to the shell. `finished` means the pond just ended, so none of its presses are "in progress". */
  private report(finished = false) {
    const run = this.ctx.couch?.course;
    if (!run || !this.course) return;
    run.progress({
      board: this.index,
      boards: this.ponds.length,
      done: this.done.slice(),
      attempts: finished ? 0 : this.presses,
      par: this.pond.par,
      minimum: this.course.minimum,
      assisted: this.assisted,
    });
  }

  /** The score for the pond just lit, over the board for a moment. */
  private async pondScore() {
    const best = this.pond.par, total = this.ponds.length;
    const text = this.presses === best ? `Pond ${this.index + 1} of ${total}: ${this.presses} presses, the fewest possible!` : `Pond ${this.index + 1} of ${total}: ${this.presses} presses (fewest ${best})`;
    const note = label(text, 34, ink);
    note.position.set(this.view.w / 2, Math.max(48, this.board.y - 56));
    note.alpha = 0;
    this.ctx.stage.addChild(note);
    await this.ctx.tw.to(note, { alpha: 1 }, { duration: 0.2 });
    await this.ctx.tw.wait(1.2);
    await this.ctx.tw.to(note, { alpha: 0 }, { duration: 0.25 });
    note.destroy();
  }

  private async glowUp() {
    this.busy = true;
    this.hinted = null;
    this.excess += Math.max(0, this.presses - this.pond.par);
    if (this.course) {
      this.done.push(this.presses);
      this.report(true);
    }
    await this.rowBells();
    const n = this.n;
    const mid = this.ctx.stage.toLocal(this.board.toGlobal({ x: (n * this.cell) / 2, y: (n * this.cell) / 2 }));
    this.ctx.particles.burst(mid.x, mid.y, { kind: 'star', colors: [0xffffff, 0xfff3a0, swatch.orange.light], count: 30, speed: [160, 420], gravity: 0, life: [0.6, 1.1] });
    this.ctx.pet.cheer();
    sfx.sparkle();
    // A course moves straight on after a short score; ordinary play praises.
    if (this.course) await this.pondScore();
    else await this.ctx.say('lantern.lit');
    // By touch, the pond waits: a short way can be shown as often as she likes, and Next pond goes on. Nothing is compared.
    if (this.touch && !this.course) await this.afterPond();
    await this.ctx.tw.to(this.board, { alpha: 0 }, { duration: 0.3 });
    await this.next();
  }

  /** Every row of lanterns bobs in turn, with a bell each. */
  private async rowBells() {
    const n = this.n;
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (!isLantern(r * n + c, this.mask)) continue;
        const node = this.nodes[r * n + c];
        void this.ctx.tw.to(node.scale, { y: 1.28 }, { duration: 0.12 }).then(() => this.ctx.tw.to(node.scale, { y: 1 }, { duration: 0.16 }));
      }
      sfx.bell(3 + (r % 7), 0.25);
      await this.ctx.tw.wait(0.11);
    }
  }

  /** The lit pond stays until Next pond; Show me a short way replays a fewest way meanwhile. */
  private afterPond() {
    return new Promise<void>((resolve) => {
      this.waiting = true;
      this.goOn = resolve;
      // On the last pond the arrow ends the round.
      this.nextLabel.text = this.index === this.ponds.length - 1 ? 'All done ▶' : 'Next pond ▶';
      this.showTouchParts(this.touch);
      // Said once a round, so the buttons never depend on reading.
      if (!this.toldAfter) {
        this.toldAfter = true;
        void this.ctx.say('lantern.after');
      }
    });
  }

  /** Next pond (or a switch to keys or a pad, which has no buttons here): the lit pond goes. */
  private carryOn() {
    if (!this.waiting || this.replaying) return;
    this.waiting = false;
    this.showTouchParts(this.touch);
    const go = this.goOn;
    this.goOn = null;
    go?.();
  }

  /**
   * Put the pond back as it began and press a fewest way, one lantern every 0.6 s with a ring on each, then light it
   * again. It counts nothing: the pond is already done. A destroyed scene's waits never resolve, so this simply stops.
   */
  private async showShortWay() {
    if (!this.waiting || this.replaying) return;
    const way = shortWay(this.pond.board, this.n, this.mask);
    if (!way) return;
    this.replaying = true;
    this.showTouchParts(this.touch);
    const was = this.lit;
    this.lit = this.pond.board.slice();
    this.lit.forEach((on, i) => { if (on !== was[i]) this.flip(i); });
    this.tally();
    await this.ctx.tw.wait(0.6);
    for (const cell of way) {
      this.ring = cell;
      sfx.tick();
      await this.ctx.tw.wait(0.3);
      this.lit = press(this.lit, this.n, cell, this.mask);
      for (const c of footprint(this.n, cell, this.mask)) this.flip(c);
      sfx.pop(3 + (cell % 7));
      this.tally();
      await this.ctx.tw.wait(0.3);
      this.ring = null;
    }
    await this.rowBells();
    sfx.sparkle();
    this.replaying = false;
    // Keys or a pad took over during the show: there is no button to press, so go on.
    if (!this.touch) return void this.carryOn();
    this.showTouchParts(true);
  }

  private async finale() {
    if (this.settled) return;
    this.settled = true;
    this.finished = true;
    this.score.visible = false;
    this.sub.visible = false;
    sfx.tada();
    await this.ctx.say('lantern.done');
    await this.ctx.tw.wait(0.5);
    this.ctx.finish({ misses: this.misses, hints: this.hints, score: this.excess });
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Controls                                                                                      */
  /* -------------------------------------------------------------------------------------------- */

  private showTouchParts(on: boolean) {
    for (const part of [this.tapLayer, this.undoButton, this.hintButton, this.againButton]) part.visible = on && !this.waiting;
    for (const part of [this.shortButton, this.nextButton]) part.visible = on && this.waiting && !this.replaying;
  }

  /** The first key or pad press on the island: the pond's tap layer and buttons go and the cursor shows. Couch play is already here. */
  private useController() {
    if (!this.touch) return;
    this.touch = false;
    this.showTouchParts(false);
    this.carryOn();
  }

  /** A finger came back after keys: the tap layer and buttons return and the cursor goes. */
  touchReturned() {
    if (this.touch || this.finished) return;
    this.touch = true;
    this.showTouchParts(true);
  }

  control(input: CouchControls, dt: number) {
    this.useController();
    if (this.busy || this.finished || !this.pond) return;
    for (const dir of this.held.poll(input, dt)) this.move(dir);
    if (input.players.some((p) => p.action)) this.press();
    else if (input.players.some((p) => p.undo)) this.back();
  }

  private move(dir: number) {
    const n = this.n, r = Math.floor(this.cursor / n), c = this.cursor % n;
    const nr = Math.min(n - 1, Math.max(0, r + [0, 1, 0, -1][dir])), nc = Math.min(n - 1, Math.max(0, c + [1, 0, -1, 0][dir]));
    const to = nr * n + nc;
    if (to === this.cursor) return;
    this.cursor = to;
    sfx.tick();
  }

  /** Press the lantern under the cursor: it and its neighbours flip, and the press counts. */
  private press() {
    const i = this.cursor;
    // A lily pad has no lantern: a soft tick, and nothing counts.
    if (!isLantern(i, this.mask)) return this.bobPad(i);
    this.lit = press(this.lit, this.n, i, this.mask);
    this.history.push(i);
    this.presses++;
    if (this.hinted === i) this.hinted = null;
    for (const c of footprint(this.n, i, this.mask)) this.flip(c);
    sfx.pop(3 + (i % 7));
    this.tally();
    this.report();
    if (allLit(this.lit)) return void this.glowUp();
    // A child pressing on and on without lighting the pond hears once where help is. It counts nothing.
    const stuck = stuckAt(this.ctx.band, this.pond.par);
    if (this.touch && !this.nudged && stuck !== null && this.presses >= stuck) {
      this.nudged = true;
      void this.ctx.say('lantern.stuck-school');
    }
  }

  /** The left button: take the last press back. The press stays counted; taking it back is free. */
  private back() {
    const i = this.history.pop();
    if (i === undefined) return void sfx.squeak();
    this.lit = press(this.lit, this.n, i, this.mask);
    this.cursor = i;
    this.hinted = null;
    for (const c of footprint(this.n, i, this.mask)) this.flip(c);
    sfx.pop(2);
    this.tally();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* Help                                                                                          */
  /* -------------------------------------------------------------------------------------------- */

  /** Couch pause menu's "Show a hint": a lantern in a fewest-press way to light the pond from here. Marks the run helped. */
  askForHint() {
    if (this.busy || this.finished || !this.pond) return;
    const hint = namedHint(this.lit, this.n, this.cursor, this.mask);
    if (hint === null) return;
    this.hinted = hint.cell;
    this.hints++;
    this.assisted = true;
    this.cursor = hint.cell;
    this.report();
    // The line says whether this is the only short way or one of a few.
    void this.ctx.say(hint.kind === 'one' ? 'lantern.hint-one' : 'lantern.hint-many');
  }

  /** Couch pause menu: put the pond back as it began. Presses already made keep counting, so a restart never improves a score. */
  restart() {
    if (this.finished || !this.pond || this.busy) return;
    this.lit = this.pond.board.slice();
    this.history = [];
    this.hinted = null;
    this.lit.forEach((_, i) => { if (isLantern(i, this.mask)) this.flip(i); });
    this.tally();
  }

  /* -------------------------------------------------------------------------------------------- */
  /* The "watch me" demo                                                                           */
  /* -------------------------------------------------------------------------------------------- */

  /** The ghost finger on the how-to card: tap the lantern of a fewest-press way to light the pond from here. */
  autotouch(): TouchIntent | null {
    // A lit pond waits for Next pond.
    if (this.waiting) return this.replaying ? null : { tap: { on: this.nextButton, x: 0, y: 0 }, pause: 0.6 };
    if (this.busy || this.finished || !this.pond) return null;
    const next = hintFor(this.lit, this.n, this.cursor, this.mask);
    if (next === null) return null;
    const at = this.center(next);
    return { tap: { on: this.board, x: at.x, y: at.y }, receiver: this.tapLayer, pause: 0.5 };
  }

  /** A bot that plays a fewest-press way: the nearest lantern in one of them, walked to and pressed. */
  autoplay(dt: number): CouchControls {
    const out = idle();
    this.botWait -= dt;
    if (this.busy || this.finished || !this.pond || this.botWait > 0) return out;
    const next = hintFor(this.lit, this.n, this.cursor, this.mask);
    if (next === null) return out;
    const p = out.players[0];
    p.active = true;
    if (next === this.cursor) { p.action = true; this.botWait = 0.45; return out; }
    const n = this.n, fr = Math.floor(this.cursor / n), fc = this.cursor % n, tr = Math.floor(next / n), tc = next % n;
    p.direction = fc !== tc ? (tc > fc ? 0 : 2) : tr > fr ? 1 : 3;
    this.botWait = 0.16;
    return out;
  }
}

/* ---------------------------------------------------------------------------------------------- */
/* The game's picture                                                                              */
/* ---------------------------------------------------------------------------------------------- */

class LanternIcon extends WigglyIcon {
  constructor() {
    const c = new Container();
    c.addChild(new Graphics().roundRect(-130, -190, 260, 170, 26).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
    [[-80, true], [0, false], [80, true]].forEach(([x, on], k) => {
      const l = lanternArt(on as boolean, 96);
      l.position.set(x as number, -108 + (k === 1 ? 6 : 0));
      c.addChild(l);
    });
    super(c);
  }
}

function sticker(seed: number): Container {
  const rng = new Rng(seed);
  const c = new Container();
  c.addChild(new Graphics().circle(0, 0, 78).fill(WATER).stroke({ width: 6, color: WATER_LINE }));
  const l = lanternArt(true, 150);
  l.rotation = rng.range(-0.15, 0.15);
  l.position.set(0, 4);
  c.addChild(l);
  return c;
}

export const lanternLights: GameModule = {
  id: 'lantern-lights',
  liveController: true,
  name: 'Lantern Lights',
  titleLine: 'game.lantern-lights',
  region: 'puzzle-peaks',
  challenge: 'logic',
  skills: ['logic', 'planning', 'pattern-finding'],
  bands: ['school', 'grownup'],
  inputs: ['touch', 'controller'],
  touchDemo: true,
  coplayHint: 'Tap a lantern to flip it and the ones beside it. Talk about which press would light the most.',
  offScreen: 'Lay out coins or buttons in a grid, all heads up, and flip a coin with its four neighbors to turn them all over.',
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (level) => planFor(level).name,
  music: STYLES.lullaby,
  hubIcon: () => new LanternIcon(),
  sticker,
  create: (ctx) => new LanternLights(ctx),
};
