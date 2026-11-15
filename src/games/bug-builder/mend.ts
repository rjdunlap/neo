import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { spread, type View } from '../../engine/view';
import { tile } from '../shared';
import type { Game, GameContext, TouchIntent } from '../types';
import { bugBody, bugToken } from './art';
import {
  BUG_TOKENS,
  mendBoard,
  mendDrop,
  mendMove,
  mendPlaceAt,
  mendTap,
  type BugPlan,
  type MendEvent,
  type MendState,
} from './logic';

const ring = { width: 7, color: swatch.yellow.line };

/**
 * Level 11, Mend the wing: a finished bug whose right wing should mirror the left, with one place wrong. She taps the
 * place that differs from its twin; its wrong stamp comes off; then she drags the twin's stamp onto it from the tray.
 * A tap on a place that matches is a miss and a look across the line; the second miss brings the round's one hint,
 * after which the glow shows the next useful move. When the wings match they fold across the middle and open together.
 */
export class MendWing implements Game {
  readonly mend: MendState;
  /** The right wing's places (tap targets), and the left wing's (a gentle word, never a miss). */
  readonly places: Container[] = [];
  readonly choices: { token: number; node: Container; drag: DragHandle }[] = [];
  private readonly background = new Graphics();
  private readonly board = new Container();
  private readonly wings: [Container, Container] = [new Container(), new Container()];
  private readonly crease = new Graphics();
  private readonly glow = new Graphics();
  private readonly trayGlow = new Graphics();
  /** A brief ring on a tapped place and its twin, after a tap on a place that already matches. */
  private readonly look = new Graphics();
  private lookLeft = 0;
  private hints = 0;
  private clock = 0;
  private finishTime = 0;
  done = false;

  constructor(
    private readonly ctx: GameContext,
    plan: BugPlan,
  ) {
    this.mend = mendBoard(plan, ctx.rng);
    ctx.stage.addChild(this.background, this.board, this.trayGlow);
    this.board.addChild(bugBody(plan.rows, plan.columns, this.wings), this.crease);
    // The left wing: its three spots, and its empty places drawn faintly, so each side can be compared place by place.
    for (const p of this.mend.places) {
      const twin = this.mend.left.find((l) => l.x === -p.x && l.y === p.y);
      const node = new Container();
      node.position.set(-p.x, p.y);
      node.addChild(twin ? bugToken(twin.token, 38) : this.openPlace());
      onTap(node, () => this.leftTap(), { radius: 56 });
      this.wings[0].addChild(node);
    }
    this.mend.places.forEach((p, i) => {
      const node = new Container();
      node.position.set(p.x, p.y);
      this.drawPlace(i, node);
      onTap(node, () => this.event(mendTap(this.mend, i), i), { radius: 56 });
      this.wings[1].addChild(node);
      this.places.push(node);
    });
    this.look.eventMode = this.glow.eventMode = this.trayGlow.eventMode = this.crease.eventMode = 'none';
    this.board.addChild(this.look, this.glow);
    for (const token of this.mend.tokens) {
      const node = new Container();
      node.addChild(tile(102, 102), bugToken(token));
      node.hitArea = new Circle(0, 0, 55);
      ctx.stage.addChild(node);
      const drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done) return false;
          const place = mendPlaceAt(this.mend, x - this.board.x, y - this.board.y);
          if (place >= 0) this.event(mendDrop(this.mend, place, token), place);
          return false; // A reusable stamp: back to the tray after every drop.
        },
      });
      this.choices.push({ token, node, drag });
    }
  }

  start() {
    void this.ctx.instruct('bug.mend');
  }

  private openPlace(): Graphics {
    return new Graphics()
      .circle(0, 0, 50)
      .fill(cream)
      .stroke({ width: 3, color: swatch.orange.line, alpha: 0.6 });
  }

  /** A right-wing place as it is now: its stamp, a faint open place, or (once found) an open place ringed in blue. */
  private drawPlace(i: number, node = this.places[i]) {
    node.removeChildren().forEach((c) => c.destroy({ children: true }));
    const token = this.mend.right[i];
    if (token !== null) node.addChild(bugToken(token, 38));
    else node.addChild(this.openPlace());
    if (i === this.mend.wrong && this.mend.found && !this.mend.done)
      node.addChild(new Graphics().circle(0, 0, 50).stroke({ width: 6, color: swatch.blue.line }));
  }

  private leftTap() {
    if (this.done) return;
    sfx.tick();
    void this.ctx.say('bug.mendOther');
  }

  private event(ev: MendEvent, place: number) {
    const ctx = this.ctx,
      s = this.mend;
    // Not a miss, but never silence: a stamp let go on a matching place, or a second tap on the found one, still answers.
    if (ev.kind === 'ignored') return void (this.done || sfx.tick());
    if (ev.kind === 'found') {
      sfx.bell(6, 0.3);
      this.drawPlace(place);
      void ctx.say(s.flaw === 'missing' ? 'bug.mendFoundEmpty' : 'bug.mendFound');
    } else if (ev.kind === 'twin') {
      sfx.boing();
      const p = s.places[place];
      this.look
        .clear()
        .circle(p.x, p.y, 56)
        .stroke({ width: 6, color: swatch.blue.line })
        .circle(-p.x, p.y, 56)
        .stroke({ width: 6, color: swatch.blue.line });
      this.lookLeft = 1.6;
      const said = ctx.say('bug.mendTwin');
      if (ev.hint) this.hint(said);
    } else if (ev.kind === 'wrongStamp') {
      sfx.boing();
      const said = ctx.say('bug.mendWrongStamp', { ...BUG_TOKENS[ev.token] });
      if (ev.hint) this.hint(said);
    } else {
      this.done = true;
      this.drawPlace(place);
      this.choices.forEach((c) => (c.drag.enabled = false));
      sfx.bell(5 + s.want, 0.3);
      ctx.pet.cheer();
      void ctx.say('bug.mendDone');
      void ctx.tw.wait(1.4).then(() => ctx.finish({ misses: s.misses, hints: this.hints }));
    }
    this.drawHint();
  }

  /** The round's one hint: the glow shows the next useful move from now on, and the pet names it after what was just said. */
  private hint(after: Promise<void>) {
    this.hints++;
    void after.then(() => {
      const m = mendMove(this.mend);
      if (!m) return;
      if ('tap' in m) void this.ctx.say('bug.mendHintFind');
      else void this.ctx.say('bug.hint', { ...BUG_TOKENS[m.stamp] });
    });
  }

  private drawHint() {
    this.glow.clear();
    this.trayGlow.clear();
    const m = mendMove(this.mend);
    if (!this.mend.hinted || !m) return;
    const p = this.mend.places['tap' in m ? m.tap : m.place];
    this.glow.circle(p.x, p.y, 58).stroke(ring);
    if ('stamp' in m) {
      const home = this.choices.find((c) => c.token === m.stamp)!.drag.home;
      this.trayGlow.roundRect(home.x - 59, home.y - 59, 118, 118, 24).stroke(ring);
    }
  }

  resize(v: View) {
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.green.light)
      .roundRect(165, v.h - 155, v.w - 200, 135, 32)
      .fill(cream);
    const cy = Math.max(365, (v.h - 160) / 2);
    this.board.position.set(v.w / 2, cy);
    this.crease.clear();
    for (let y = -225; y < 225; y += 28)
      this.crease
        .moveTo(0, y)
        .lineTo(0, y + 13)
        .stroke({ width: 4, color: swatch.white.fill });
    const xs = spread(this.choices.length, 175, v.w - 45, 130);
    this.choices.forEach((c, i) => {
      c.drag.home = { x: xs[i], y: v.h - 87 };
      if (!c.drag.dragging) {
        this.ctx.tw.kill(c.node);
        c.node.position.set(c.drag.home.x, c.drag.home.y);
      }
    });
    this.drawHint();
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = this.trayGlow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (this.lookLeft > 0) {
      this.lookLeft = Math.max(0, this.lookLeft - dt);
      this.look.alpha = Math.min(1, this.lookLeft / 0.4);
    }
    if (!this.done) return;
    // As on the mirror levels: both wings fold across the same hinge, meet their twins, and open together.
    this.finishTime = Math.min(1.1, this.finishTime + dt);
    const scale = Math.cos((this.finishTime / 1.1) * Math.PI * 2);
    for (const wing of this.wings) wing.scale.x = Math.abs(scale) < 0.001 ? 0.001 : scale;
  }

  /** The ghost finger: tap the place that differs, then carry its twin's stamp onto it. */
  autotouch(): TouchIntent | null {
    const m = mendMove(this.mend);
    if (!m || this.done) return null;
    if ('tap' in m) return { tap: { on: this.places[m.tap] } };
    const choice = this.choices.find((c) => c.token === m.stamp)!;
    if (choice.drag.dragging) return null;
    const p = this.mend.places[m.place];
    return { drag: { on: choice.node }, to: { on: this.board, x: p.x, y: p.y } };
  }

  destroy() {
    this.choices.forEach((c) => c.drag.destroy());
  }
}
