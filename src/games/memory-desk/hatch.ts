/**
 * Memory Desk levels 2–3, the hatch. Pictures arrive on the tray one per step; each step's hatch is hers to open or
 * shut; an open hatch writes the new one into the drawer, a shut one keeps what was there, and the window reads the
 * drawer after the write. Level 2, *Open or shut*: make the window end on the sign's picture, twice. Level 3, *Fix the
 * desk*: the hatches come set and wrong, and its failed run stays as a dim row above hers. Only a Check that fails
 * after a hatch change is a miss. Rules: ./logic.ts; definition: docs/definitions/memory-desk.md.
 */
import { Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { Backdrop } from '../../art/scenery';
import { sfx } from '../../audio/sfx';
import type { LineId } from '../../content/voice-script';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { hinted, newTally, tally } from '../../progress/coach';
import { finish, RoundButton, spring, squash } from '../../ui/buttons';
import { checkIcon, undoIcon } from '../../ui/icons';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  hatchArt,
  panelArt,
  signArt,
  slotArt,
  stepArt,
  tokenArt,
  traceArt,
  turtleArt,
  type PanelKind,
} from './art';
import {
  centre,
  deskAt,
  HATCH,
  HATCH_BUTTON_R,
  HATCH_PANEL,
  hatchBriefs,
  hatchLayout,
  helpFor,
  run,
  SIGN,
  STEP_CARD,
  TOKENS,
  TRACE,
  type HatchBrief,
  type HatchLayout,
  type Rect,
  type State,
  type Token,
} from './logic';

export const TOKEN_LINE: Record<Token, LineId> = {
  shell: 'md.token.shell',
  leaf: 'md.token.leaf',
  star: 'md.token.star',
  acorn: 'md.token.acorn',
  feather: 'md.token.feather',
  pebble: 'md.token.pebble',
};

/** Seconds per part (arrive, write, read) of a step she runs, of a Check's run and of Help's slow run. */
const PACE = { step: 0.42, check: 0.3, help: 0.75 };
const GLOW = 4;
const SLOT_DY = 10;
const SLOTS: readonly PanelKind[] = ['tray', 'drawer', 'window'];
const KEY: Record<PanelKind, keyof State> = { tray: 'input', drawer: 'stored', window: 'output' };

export class HatchDesk implements Game {
  readonly briefs: HatchBrief[];
  /** Which of the round's briefs is on the desk. */
  bi = 0;
  hatches: boolean[];
  /** Every hatch change in this brief, oldest first (the hatch's number); Undo takes the last one back. */
  changes: number[] = [];
  /** Whether a hatch has changed since the last judged Check: the same wrong setting checked again is not a second miss. */
  fresh = false;
  /** How far her run has got: three parts a step (arrive, write, read), so 0 to 3 × steps. */
  pos = 0;
  /** Where a run in progress stops, or null when the desk is still. */
  playTo: number | null = null;
  slow = false;
  busy = false;
  finished = false;
  readonly tally = newTally();
  /** Failed Checks on this brief: every second one brings the glow. */
  briefMisses = 0;
  /** The hatch Help has shown and will set on its next press. */
  helpAt: number | null = null;
  /** The targets under a glowing ring, and for how much longer. */
  glowing: { on: number | 'check'; left: number } | null = null;
  hintLabel = 'Help me';

  hatchNodes: Container[] = [];
  stepButton: RoundButton | null = null;
  slowButton: RoundButton | null = null;
  undoButton: RoundButton | null = null;
  checkButton: RoundButton | null = null;

  private readonly root = new Container();
  private readonly backdrop: Backdrop;
  private readonly board = new Container();
  private readonly glow = new Graphics();
  private view: View;
  private layout: HatchLayout;
  private holders: Partial<Record<PanelKind, Container>> = {};
  private traceLayer = new Container();
  private signNode: Container | null = null;
  private pace = PACE.step;
  private playT = 0;
  private after: (() => void) | null = null;
  private clock = 0;
  /** Counts spoken sequences, so a newer one silences the rest of an older one. */
  private talk = 0;

  constructor(private readonly ctx: GameContext) {
    this.view = ctx.view;
    this.briefs = hatchBriefs(ctx.level, ctx.rng);
    this.hatches = [...this.brief.preset];
    this.layout = hatchLayout(this.brief.queue.length, ctx.view);
    this.backdrop = new Backdrop(
      {
        sky: [0xd9ecff, 0xfff6e0],
        hills: [0xc5e7a8, 0xa9e0d6],
        horizon: 0.62,
        clouds: 2,
        sun: false,
        seed: 412,
      },
      ctx.view,
    );
    this.glow.eventMode = 'none';
    this.root.addChild(this.backdrop, this.board, this.glow);
    ctx.stage.addChild(this.root);
  }

  get brief(): HatchBrief {
    return this.briefs[this.bi];
  }

  get steps(): number {
    return this.brief.queue.length;
  }

  /** The desk as her run has left it. */
  get state(): State {
    return deskAt(this.brief, this.hatches, this.pos);
  }

  /** Whether a hatch has been changed in this brief: an untouched Check is a nudge, never a miss. */
  get touched(): boolean {
    return this.changes.length > 0;
  }

  start() {
    this.build();
    this.announce();
  }

  resize(v: View) {
    if (this.root.destroyed) return;
    this.view = v;
    this.backdrop.resize(v);
    if (this.hatchNodes.length) this.build();
  }

  destroy() {
    this.after = null;
    this.root.destroy({ children: true });
  }

  /** Says each line in turn, stopping if the round ends or something newer is said. */
  private async sayAll(ids: readonly LineId[], instruct = false) {
    const mine = ++this.talk;
    for (const [i, id] of ids.entries()) {
      await (instruct && i === 0 ? this.ctx.instruct(id) : this.ctx.say(id));
      if (!this.ctx.alive || mine !== this.talk) return;
    }
  }

  private say(...ids: LineId[]) {
    void this.sayAll(ids);
  }

  private announce() {
    const first: LineId =
      this.brief.level >= 3
        ? this.bi
          ? 'md.next-desk'
          : 'md.instruct.3'
        : this.bi
          ? 'md.next-sign'
          : 'md.instruct.2';
    void this.sayAll([first, TOKEN_LINE[this.brief.target]], true);
  }

  // ——— Drawing ———

  private build() {
    for (const h of Object.values(this.holders)) this.ctx.tw.kill(h.scale);
    if (this.signNode) this.ctx.tw.kill(this.signNode.scale);
    for (const c of this.board.removeChildren()) c.destroy({ children: true });
    const l = (this.layout = hatchLayout(this.steps, this.view));
    const brief = this.brief;

    this.signNode = signArt(brief.target, SIGN);
    this.place(centre(l.sign), this.signNode);

    brief.queue.forEach((token, i) => {
      const card = new Container();
      card.addChild(
        finish({ w: STEP_CARD, h: STEP_CARD, corner: 18 }, swatch.white, cream),
        tokenArt(token, 24),
      );
      card.eventMode = 'none';
      this.place(centre(l.cards[i]), card);
    });

    this.hatchNodes = brief.queue.map((_, i) => {
      const node = new Container();
      node.addChild(hatchArt(this.hatches[i], HATCH));
      onTap(
        node,
        () => {
          squash(node);
          spring(node, 90);
          this.toggle(i);
        },
        { cooldown: 200 },
      );
      this.place(centre(l.hatches[i]), node);
      return node;
    });

    if (brief.level >= 3) {
      // The wrong desk's own run, kept on screen so hers can be compared with it step by step.
      run(brief, brief.preset).trace.forEach((cell, i) => {
        const dim = traceArt(cell, TRACE.w, TRACE.h);
        dim.alpha = 0.5;
        this.place(centre(l.presetTrace[i]), dim);
      });
    }
    this.traceLayer = new Container();
    this.traceLayer.eventMode = 'none';
    this.board.addChild(this.traceLayer);

    this.holders = {};
    for (const kind of SLOTS) {
      const holder = new Container();
      holder.eventMode = 'none';
      holder.y = SLOT_DY;
      this.holders[kind] = holder;
      this.place(centre(l[kind]), panelArt(kind, HATCH_PANEL), holder);
    }

    this.stepButton = new RoundButton(stepArt(), swatch.blue, HATCH_BUTTON_R, () => this.step());
    this.slowButton = new RoundButton(turtleArt(this.slow), swatch.yellow, HATCH_BUTTON_R, () =>
      this.toggleSlow(),
    );
    this.undoButton = new RoundButton(undoIcon(), swatch.yellow, HATCH_BUTTON_R, () => this.undo());
    this.checkButton = new RoundButton(checkIcon(), swatch.green, HATCH_BUTTON_R, () => this.check());
    this.place(centre(l.step), this.stepButton);
    this.place(centre(l.slow), this.slowButton);
    this.place(centre(l.undo), this.undoButton);
    this.place(centre(l.check), this.checkButton);
    this.refresh();
  }

  /** Puts parts on the board at `at`, at the layout's scale (on a wrapper: a pressed button sets its own scale). */
  private place(at: { x: number; y: number }, ...parts: Container[]) {
    const wrap = new Container();
    wrap.position.set(at.x, at.y);
    wrap.scale.set(this.layout.scale);
    wrap.addChild(...parts);
    this.board.addChild(wrap);
    return wrap;
  }

  /** Redraws everything that a step or a hatch change moves: the three panels, her trace row and Undo. */
  private refresh() {
    const s = this.state;
    for (const kind of SLOTS) {
      const holder = this.holders[kind];
      if (!holder) continue;
      for (const c of holder.removeChildren()) c.destroy({ children: true });
      holder.addChild(slotArt(s[KEY[kind]], 34));
    }
    for (const c of this.traceLayer.removeChildren()) c.destroy({ children: true });
    const done = Math.floor(this.pos / 3);
    const trace = run(this.brief, this.hatches).trace;
    const k = this.layout.scale;
    this.layout.trace.forEach((r, i) => {
      const cell = traceArt(i < done ? trace[i] : null, TRACE.w, TRACE.h);
      const at = centre(r);
      cell.position.set(at.x, at.y);
      cell.scale.set(k);
      this.traceLayer.addChild(cell);
    });
    // A ring under the step that is running or comes next.
    if (done < this.steps) {
      const r = this.layout.cards[done];
      this.traceLayer.addChild(
        new Graphics()
          .roundRect(r.x - 6 * k, r.y - 6 * k, r.w + 12 * k, r.h + 12 * k, 22 * k)
          .stroke({ width: 5 * k, color: swatch.blue.line }),
      );
    }
    if (this.undoButton) this.undoButton.alpha = this.touched ? 1 : 0.45;
  }

  private popIn(kind: PanelKind) {
    const holder = this.holders[kind];
    if (!holder) return;
    this.ctx.tw.kill(holder.scale);
    holder.scale.set(0.6);
    void this.ctx.tw.to(holder.scale, { x: 1, y: 1 }, { duration: 0.22, ease: ease.outBack });
  }

  private redrawHatch(i: number) {
    const node = this.hatchNodes[i];
    if (!node) return;
    for (const c of node.removeChildren()) c.destroy({ children: true });
    node.addChild(hatchArt(this.hatches[i], HATCH));
  }

  /** A glowing ring on a hatch (by number) or on Check; it follows the layout through a turn of the screen. */
  private ring(on: number | 'check', left = GLOW) {
    this.glowing = { on, left };
  }

  // ——— Running ———

  /** A run in progress jumps to where it was going. */
  private settle() {
    if (this.playTo === null) return;
    this.pos = this.playTo;
    this.playTo = null;
    const then = this.after;
    this.after = null;
    this.refresh();
    then?.();
  }

  /** One part of a step: the picture arrives, the hatch writes it or does not, the window reads the drawer. */
  private advance(spoken: boolean) {
    const i = Math.floor(this.pos / 3);
    const part = this.pos % 3;
    this.pos++;
    this.refresh();
    const token = this.brief.queue[i];
    if (part === 0) {
      sfx.pop(2 + TOKENS.indexOf(token));
      this.popIn('tray');
      if (spoken) this.say(TOKEN_LINE[token]);
    } else if (part === 1) {
      const open = this.hatches[i];
      if (open) {
        sfx.pluck(4);
        this.popIn('drawer');
      } else sfx.tick();
      const node = this.hatchNodes[i];
      if (node) spring(node);
      if (spoken) this.say(open ? 'md.step.open' : 'md.step.shut');
    } else {
      sfx.pluck(7);
      this.popIn('window');
    }
  }

  private play(to: number, pace: number, after: (() => void) | null = null) {
    this.playTo = to;
    this.pace = pace;
    this.playT = 0;
    this.after = after;
  }

  /** Step: run the next step (or, with Slow on, its next part). After the last step it starts the run again. Never counted. */
  step() {
    if (this.finished || this.busy) return;
    if (this.playTo !== null) return this.settle();
    this.glowing = null;
    if (this.pos >= this.steps * 3) this.pos = 0;
    if (this.slow) return this.advance(true);
    const to = (Math.floor(this.pos / 3) + 1) * 3;
    this.advance(true);
    this.play(to, PACE.step);
  }

  toggleSlow() {
    if (this.finished || this.busy) return;
    this.settle();
    this.slow = !this.slow;
    const b = this.slowButton;
    if (b) {
      b.removeChildAt(1).destroy({ children: true });
      b.addChild(turtleArt(this.slow));
    }
    this.say(this.slow ? 'md.slow.on' : 'md.slow.off');
  }

  /** Open or shut one hatch. Her run is cleared from that step on. Never counted. */
  toggle(i: number, line?: LineId) {
    if (this.finished || this.busy) return;
    this.settle();
    this.hatches[i] = !this.hatches[i];
    this.changes.push(i);
    this.fresh = true;
    this.changed(i);
    if (!line) this.helpAt = null;
    if (this.hatches[i]) sfx.pop(9);
    else sfx.clunk();
    this.say(line ?? (this.hatches[i] ? 'md.open' : 'md.shut'));
  }

  private changed(i: number) {
    this.pos = Math.min(this.pos, 3 * i);
    this.glowing = null;
    this.redrawHatch(i);
    this.refresh();
  }

  /** Take back the last hatch change. Never counted. */
  undo() {
    if (this.finished || this.busy) return;
    this.settle();
    const i = this.changes.pop();
    if (i === undefined) return;
    this.hatches[i] = !this.hatches[i];
    this.fresh = this.changes.length > 0;
    this.helpAt = null;
    this.changed(i);
  }

  /** The pause sheet's Start again: the brief's own hatches and an empty run. Never counted, and tries made stay made. */
  restart() {
    if (this.finished || this.busy) return;
    this.playTo = null;
    this.after = null;
    this.hatches = [...this.brief.preset];
    this.changes = [];
    this.fresh = false;
    this.pos = 0;
    this.helpAt = null;
    this.glowing = null;
    this.hatchNodes.forEach((_, i) => this.redrawHatch(i));
    this.refresh();
  }

  /** Check: runs every step on the hatches as they are, whether or not she stepped. */
  check() {
    if (this.finished || this.busy) return;
    this.settle();
    if (!this.touched) {
      // Nothing has been tried yet: a nudge, not a miss.
      sfx.pluck(0);
      for (const [i, n] of this.hatchNodes.entries()) spring(n, i * 80);
      this.say(this.brief.level >= 3 ? 'md.untouched.3' : 'md.untouched.2');
      return;
    }
    this.busy = true;
    this.glowing = null;
    this.pos = 0;
    this.refresh();
    this.play(this.steps * 3, PACE.check, () => void this.judge());
  }

  private async judge() {
    const brief = this.brief;
    const out = run(brief, this.hatches).output;
    if (out !== brief.target) {
      sfx.boing();
      // The same wrong hatches checked again play again, and are not a second miss.
      const counted = this.fresh;
      this.fresh = false;
      if (counted) {
        this.tally.misses++;
        this.briefMisses++;
      }
      this.helpAt = null;
      const at = counted && this.briefMisses % 2 === 0 ? helpFor(this.hatches, brief) : null;
      if (at !== null) {
        hinted(this.tally);
        this.ring(at);
      }
      this.busy = false;
      // What happened and what was wanted, never which hatch.
      const ended: LineId[] =
        out === null ? ['md.check-fail.nothing'] : ['md.check-fail.ended', TOKEN_LINE[out]];
      this.say(
        ...ended,
        'md.check-fail.wants',
        TOKEN_LINE[brief.target],
        ...(at !== null ? (['md.glow'] as const) : []),
      );
      return;
    }
    const last = this.bi + 1 >= this.briefs.length;
    this.popIn('window');
    if (this.signNode) {
      this.signNode.scale.set(1.25);
      void this.ctx.tw.to(this.signNode.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
    }
    for (const r of [this.layout.window, this.layout.sign]) {
      const at = centre(r);
      this.ctx.particles.burst(at.x, at.y, {
        colors: [swatch.yellow.fill, swatch.teal.fill, 0xffffff],
        count: 10,
      });
    }
    this.talk++;
    if (last) {
      sfx.tada();
      this.ctx.pet.cheer();
      await this.ctx.say(brief.level >= 3 ? 'md.done.3' : 'md.done.2');
      if (!this.ctx.alive) return;
      this.finished = true;
      this.ctx.finish(tally(this.tally));
      return;
    }
    sfx.sparkle();
    await this.ctx.say('md.check-pass');
    if (!this.ctx.alive) return;
    this.bi++;
    this.hatches = [...this.brief.preset];
    this.changes = [];
    this.fresh = false;
    this.glowing = null;
    this.pos = 0;
    this.briefMisses = 0;
    this.helpAt = null;
    this.busy = false;
    this.build();
    this.announce();
  }

  /**
   * The pet's Help, one hint a press: the first runs slowly up to the hatch that differs from the nearest answer and
   * stops with the drawer pulsing; the second sets that hatch and invites Check. It never ends a brief.
   */
  askForHint() {
    if (this.finished || this.busy) return;
    this.settle();
    const at = helpFor(this.hatches, this.brief);
    if (at === null) {
      // The hatches already pass: pointing at Check is free.
      this.ring('check');
      this.say('md.help.check');
      return;
    }
    hinted(this.tally);
    if (this.helpAt !== at) {
      this.helpAt = at;
      this.pos = 0;
      this.refresh();
      // The glow outlasts the slow run up to that hatch.
      this.ring(at, (3 * at + 2) * PACE.help + GLOW);
      this.say('md.help.look');
      this.play(3 * at + 2, PACE.help, () => this.popIn('drawer'));
      return;
    }
    this.helpAt = null;
    this.toggle(at, this.hatches[at] ? 'md.help.set-shut' : 'md.help.set-open');
    this.ring('check');
  }

  update(dt: number) {
    if (this.root.destroyed) return;
    this.clock += dt;
    if (this.playTo !== null) {
      this.playT += dt;
      while (this.playT >= this.pace && this.pos < this.playTo) {
        this.playT -= this.pace;
        this.advance(false);
      }
      if (this.pos >= this.playTo) {
        this.playTo = null;
        const then = this.after;
        this.after = null;
        then?.();
      }
    }
    this.glow.clear();
    const g = this.glowing;
    if (!g) return;
    g.left -= dt;
    if (g.left <= 0) {
      this.glowing = null;
      return;
    }
    const m = 8 + 3 * Math.sin(this.clock * 6);
    const r: Rect | undefined = g.on === 'check' ? this.layout.check : this.layout.hatches[g.on];
    if (r)
      this.glow
        .roundRect(r.x - m, r.y - m, r.w + 2 * m, r.h + 2 * m, 34 * this.layout.scale)
        .stroke({ width: 8, color: swatch.yellow.fill });
  }

  /** The ghost finger: set the hatch nearest an answer, step the queue through at level 2, then Check. */
  autotouch(): TouchIntent | null {
    if (this.finished || this.busy || this.playTo !== null || !this.hatchNodes.length) return null;
    const at = helpFor(this.hatches, this.brief);
    const node =
      at !== null
        ? this.hatchNodes[at]
        : this.brief.level === 2 && this.pos < this.steps * 3
          ? this.stepButton
          : this.checkButton;
    return node ? { tap: { on: node } } : null;
  }
}
