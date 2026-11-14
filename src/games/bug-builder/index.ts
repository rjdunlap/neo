import { rangeFor } from '../../progress/difficulty';
import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { checkIcon } from '../../ui/icons';
import { RoundButton } from '../../ui/buttons';
import { spread, type View } from '../../engine/view';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { CountSign, bugBody, bugSticker, bugToken, bugWing } from './art';
import {
  LEVELS,
  BUG_PLANS,
  BUG_TOKENS,
  bugPuzzle,
  countBoard,
  countCheck,
  countHave,
  countLift,
  countMove,
  countPlaceAt,
  countStamp,
  fitsKind,
  kindBoard,
  kindWords,
  nextStamp,
  slotAt,
  type BugSpot,
  type CountEvent,
  type CountState,
} from './logic';

interface Spot extends BugSpot {
  node: Container;
  filled: boolean;
  wrong: number;
}
class BugBuilder implements Game {
  readonly plan;
  readonly targets: Spot[] = [];
  readonly choices: { token: number; node: Container; drag: DragHandle }[] = [];
  private readonly background = new Graphics();
  private readonly board = new Container();
  private readonly model = new Container();
  private readonly wings: [Container, Container] = [new Container(), new Container()];
  private readonly foldReference = new Container();
  private finishTime = 0;
  private readonly glow = new Graphics();
  private readonly paletteGlow = new Graphics();
  private readonly decorations = new Graphics();
  private activeHint: Spot | null = null;
  private misses = 0;
  private hints = 0;
  private done = false;
  private clock = 0;
  /** Levels 8 and 9, Count the spots and Count a kind: the rule state, a node for each open place, the sign and the check. */
  private readonly count: CountState | null = null;
  private readonly places: Container[] = [];
  private readonly sign: CountSign | null = null;
  private readonly check: RoundButton | null = null;
  constructor(private readonly ctx: GameContext) {
    this.plan = BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, ctx.level - 1))];
    ctx.stage.addChild(this.background, this.decorations, this.model, this.board, this.paletteGlow);
    this.glow.eventMode = this.paletteGlow.eventMode = this.decorations.eventMode = 'none';
    let tokens: number[];
    if (this.plan.mode === 'count' || this.plan.mode === 'kind') {
      const board = (this.plan.mode === 'kind' ? kindBoard : countBoard)(this.plan, ctx.rng);
      this.count = board.state;
      tokens = board.tokens;
      this.board.addChild(bugBody(this.plan.rows, this.plan.columns));
      board.state.places.forEach((p, i) => {
        const node = new Container();
        node.position.set(p.x, p.y);
        node.addChild(this.openPlace());
        // A stamped place lifts off with a tap; an open one does nothing.
        onTap(node, () => this.countEvent(countLift(this.count!, i), i), { radius: 56 });
        this.board.addChild(node);
        this.places.push(node);
      });
      this.sign = new CountSign(board.state.want, board.state.kind);
      this.check = new RoundButton(checkIcon(), swatch.green, 58, () =>
        this.countEvent(countCheck(this.count!)),
      );
      ctx.stage.addChild(this.sign, this.check);
    } else tokens = this.buildMatch();
    this.board.addChild(this.glow);
    for (const token of tokens) {
      const node = new Container();
      node.addChild(tile(102, 102), bugToken(token));
      node.hitArea = new Circle(0, 0, 55);
      ctx.stage.addChild(node);
      const drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done) return false;
          if (this.count) {
            const place = countPlaceAt(this.count, x - this.board.x, y - this.board.y);
            if (place >= 0) this.countEvent(countStamp(this.count, place, token), place, token);
          } else this.matchDrop(token, x, y);
          return false; // A reusable stamp: return to the tray after every drop.
        },
      });
      this.choices.push({ token, node, drag });
    }
  }
  /** The bug, the model and the spots for the matching levels (1–7); returns the tray's tokens. */
  private buildMatch(): number[] {
    const ctx = this.ctx;
    const puzzle = bugPuzzle(this.plan, ctx.rng);
    const mirror = this.plan.mode === 'mirror';
    if (mirror) {
      this.foldReference.addChild(bugWing(this.plan.rows, this.plan.columns, -1));
      for (const s of puzzle.model) {
        const shape = bugToken(s.token);
        shape.position.set(s.x, s.y);
        this.foldReference.addChild(shape);
      }
      this.foldReference.alpha = 0.22;
      this.foldReference.visible = false;
      this.foldReference.eventMode = 'none';
      this.board.addChild(this.foldReference);
    }
    this.board.addChild(bugBody(this.plan.rows, this.plan.columns, mirror ? this.wings : undefined));
    if (this.plan.mode === 'copy') this.model.addChild(bugBody(this.plan.rows, this.plan.columns));
    if (this.plan.mode !== 'guided')
      for (const s of puzzle.model) {
        const shape = bugToken(s.token);
        shape.position.set(s.x, s.y);
        (mirror ? this.wings[0] : this.model).addChild(shape);
      }
    for (const s of puzzle.targets) {
      const node = new Container();
      node.position.set(s.x, s.y);
      node.addChild(
        new Graphics().circle(0, 0, 50).fill(cream).stroke({ width: 3, color: swatch.orange.line }),
      );
      if (this.plan.mode === 'guided') {
        const ghost = bugToken(s.token);
        ghost.alpha = 0.32;
        node.addChild(ghost);
      }
      (mirror ? this.wings[1] : this.board).addChild(node);
      this.targets.push({ ...s, node, filled: false, wrong: 0 });
    }
    return puzzle.tokens;
  }
  private matchDrop(token: number, x: number, y: number) {
    const ctx = this.ctx,
      mirror = this.plan.mode === 'mirror';
    // Slots are a little more generous than the outlines, without overlapping neighboring spots.
    const slot = slotAt(this.targets, x - this.board.x, y - this.board.y);
    if (!slot) return;
    if (slot.token !== token) {
      this.misses++;
      slot.wrong++;
      sfx.boing();
      void ctx.say('bug.wrong');
      if (slot.wrong === 2) {
        this.hints++;
        this.activeHint = slot;
        const hint = ctx.say('bug.hint', { ...BUG_TOKENS[slot.token] });
        if (this.plan.mode === 'mirror') void hint.then(() => ctx.say('bug.hintMirror'));
      }
    } else {
      slot.filled = true;
      slot.node.removeChildren().forEach((c) => c.destroy({ children: true }));
      slot.node.addChild(bugToken(token, 38));
      if (this.activeHint === slot) this.activeHint = null;
      sfx.bell(5 + token, 0.3);
      ctx.pet.cheer();
      if (this.targets.every((s) => s.filled)) {
        this.done = true;
        this.foldReference.visible = mirror;
        this.choices.forEach((c) => (c.drag.enabled = false));
        void ctx.say('bug.done');
        void ctx.tw.wait(1.2).then(() => ctx.finish({ misses: this.misses, hints: this.hints }));
      }
    }
    this.drawHint();
  }
  private openPlace(): Graphics {
    return new Graphics()
      .circle(0, 0, 50)
      .fill(cream)
      .stroke({ width: 3, color: swatch.orange.line, alpha: 0.6 });
  }
  /** What a stamp, a lift or the check did on level 8: the count said aloud, the sign, the glow, and the finish. */
  private countEvent(ev: CountEvent, place = -1, token = -1) {
    const s = this.count!,
      ctx = this.ctx;
    if (ev.kind === 'ignored') return;
    if (ev.kind === 'stamp' || ev.kind === 'lift') {
      const node = this.places[place];
      node.removeChildren().forEach((c) => c.destroy({ children: true }));
      node.addChild(ev.kind === 'stamp' ? bugToken(token, 38) : this.openPlace());
      if (ev.kind === 'lift') sfx.tick();
      else sfx.bell(Math.min(9, 4 + ev.n), 0.3);
      const over = ev.kind === 'stamp' && ev.over;
      if (ev.kind === 'stamp' && !ev.over) ctx.pet.cheer();
      if (over) {
        const said = ctx.say('bug.over', { have: ev.n, n: s.want });
        if (ev.hint) this.countHint(said);
      } else if (ev.n > 0) void ctx.say('bug.counted', { n: ev.n });
    } else if (ev.kind === 'wrongKind') {
      // The stamp has already gone back to the tray: name what was put against what the sign wants.
      this.misses++;
      sfx.boing();
      const said = ctx.say('bug.kindWrong', { ...BUG_TOKENS[ev.token], kind: kindWords(s.kind!).many });
      if (ev.hint) this.countHint(said);
    } else if (ev.kind === 'wrong') {
      this.misses++;
      sfx.boing();
      const said = ctx.say(ev.have < s.want ? 'bug.few' : 'bug.many', { have: ev.have, n: s.want });
      if (ev.hint) this.countHint(said);
    } else {
      this.done = true;
      this.choices.forEach((c) => (c.drag.enabled = false));
      ctx.pet.cheer();
      if (s.kind) void ctx.say('bug.kindDone', { n: s.want, kind: kindWords(s.kind).many });
      else void ctx.say('bug.countDone', { n: s.want });
      void ctx.tw.wait(1.2).then(() => ctx.finish({ misses: this.misses, hints: this.hints }));
    }
    this.sign!.show(countHave(s));
    this.drawHint();
  }
  /** The round's one hint: say the next useful move, which the glow now shows until the round ends. */
  private countHint(after: Promise<void>) {
    this.hints++;
    // The glow shows at once (drawn after every event); the line follows what was just said. It names the move as it is
    // then, since she may have moved on meanwhile. A destroyed scene's speech never resolves, so nothing runs late.
    void after.then(() => {
      const m = countMove(this.count!);
      if (!m) return;
      const kind = this.count!.kind;
      if (kind && 'stamp' in m) return void this.ctx.say('bug.kindHintAdd', { one: kindWords(kind).one });
      void this.ctx.say(
        'lift' in m ? 'bug.countHintLift' : 'stamp' in m ? 'bug.countHintAdd' : 'bug.countHintCheck',
      );
    });
  }
  start() {
    const mode = this.plan.mode;
    const kind = this.count?.kind;
    if (kind) void this.ctx.instruct('bug.kind', { n: this.count!.want, kind: kindWords(kind).many });
    else if (mode === 'count') void this.ctx.instruct('bug.count', { n: this.count!.want });
    else
      void this.ctx.instruct(mode === 'guided' ? 'bug.guided' : mode === 'copy' ? 'bug.copy' : 'bug.mirror');
  }
  resize(v: View) {
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.green.light)
      .roundRect(165, v.h - 155, v.w - 200, 135, 32)
      .fill(cream);
    const cy = Math.max(365, (v.h - 160) / 2);
    const mode = this.plan.mode;
    this.board.position.set(mode === 'copy' ? v.w * 0.68 : this.count ? v.w * 0.6 : v.w / 2, cy);
    if (this.sign && this.check) {
      const x = Math.max(this.sign.halfW + 30, v.w * 0.2);
      this.sign.position.set(x, cy - 70);
      this.check.position.set(x, Math.min(cy + 150, v.h - 230));
    }
    this.model.position.set(v.w * 0.24, cy);
    this.model.scale.set(0.62);
    const d = this.decorations.clear();
    if (this.plan.mode === 'copy') {
      d.roundRect(this.model.x - 155, cy - 200, 310, 395, 32).fill(cream);
      const x = v.w * 0.43;
      d.moveTo(x - 12, cy - 20)
        .lineTo(x + 12, cy)
        .lineTo(x - 12, cy + 20)
        .stroke({ width: 7, color: swatch.teal.line });
    }
    if (this.plan.mode === 'mirror')
      for (let y = cy - 140; y < cy + 185; y += 28)
        d.moveTo(this.board.x, y)
          .lineTo(this.board.x, y + 13)
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
  /** The tray stamp the next useful stamp move uses: the first one that counts (any on level 8, the sign's kind on 9). */
  private stampFor() {
    return this.choices.find((c) => fitsKind(this.count!, c.token)) ?? this.choices[0];
  }
  private tray(token: number) {
    return this.choices.find((c) => c.token === token)!;
  }
  private drawHint() {
    this.glow.clear();
    this.paletteGlow.clear();
    if (this.count) return this.drawCountHint();
    if (!this.activeHint || this.done) return;
    const s = this.activeHint,
      choice = this.tray(s.token);
    this.glow.circle(s.x, s.y, 56).stroke({ width: 7, color: swatch.yellow.line });
    // Point at the answer's source too: the twin across the line, or the same place on the little model bug.
    if (this.plan.mode === 'mirror')
      this.glow.circle(-s.x, s.y, 56).stroke({ width: 7, color: swatch.yellow.line });
    if (this.plan.mode === 'copy')
      this.paletteGlow
        .circle(
          this.model.x + s.x * this.model.scale.x,
          this.model.y + s.y * this.model.scale.y,
          56 * this.model.scale.x,
        )
        .stroke({ width: 5, color: swatch.yellow.line });
    this.paletteGlow
      .roundRect(choice.drag.home.x - 59, choice.drag.home.y - 59, 118, 118, 24)
      .stroke({ width: 7, color: swatch.yellow.line });
  }
  /** Once the round's hint is given, the glow shows the next useful move: the extra stamp, an open place and a stamp, or the check. */
  private drawCountHint() {
    const s = this.count!,
      m = countMove(s);
    if (!s.hinted || !m) return;
    const ring = { width: 7, color: swatch.yellow.line };
    if ('check' in m) this.paletteGlow.circle(this.check!.x, this.check!.y, 72).stroke(ring);
    else {
      const p = s.places['lift' in m ? m.lift : m.stamp];
      this.glow.circle(p.x, p.y, 56).stroke(ring);
      if ('stamp' in m) {
        const home = this.stampFor().drag.home;
        this.paletteGlow.roundRect(home.x - 59, home.y - 59, 118, 118, 24).stroke(ring);
      }
    }
  }
  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = this.paletteGlow.alpha = 0.65 + 0.35 * Math.sin(this.clock * 3);
    if (!this.done) return;
    if (this.plan.mode !== 'mirror') {
      this.board.rotation = Math.sin(this.clock * 8) * 0.035;
      return;
    }
    // Fold both wings across the same hinge, meet their twins, then open together.
    // Scene time keeps the finish still when paused; leave the existing 1.2 s finish wait alone.
    this.finishTime = Math.min(1.1, this.finishTime + dt);
    const scale = Math.cos((this.finishTime / 1.1) * Math.PI * 2);
    for (const wing of this.wings) wing.scale.x = Math.abs(scale) < 0.001 ? 0.001 : scale;
  }
  /** The ghost finger on the how-to card: carry the color the next empty spot needs from the tray to it. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.count) {
      // Stamp exactly the number with the first stamp, never one too many, then tap the check.
      const m = countMove(this.count),
        choice = this.stampFor();
      if (!m || choice.drag.dragging) return null;
      if ('check' in m) return { tap: { on: this.check! } };
      if ('lift' in m) return { tap: { on: this.places[m.lift] } };
      const p = this.count.places[m.stamp];
      return { drag: { on: choice.node }, to: { on: this.board, x: p.x, y: p.y } };
    }
    const next = nextStamp(this.targets);
    const choice = next && this.tray(next.token);
    if (!next || !choice || choice.drag.dragging) return null;
    return { drag: { on: choice.node }, to: { on: this.board, x: next.x, y: next.y } };
  }
  destroy() {
    this.choices.forEach((c) => c.drag.destroy());
  }
}
export const bugBuilder: GameModule = {
  id: 'bug-builder',
  name: 'Bug Builder',
  titleLine: 'game.bug-builder',
  region: 'tinker-lab',
  challenge: 'space',
  skills: ['spatial-reasoning', 'symmetry', 'visual-matching', 'counting'],
  bands: ['toddler', 'preschool', 'prek', 'school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (l) => BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, l - 1))].name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Help {name} move a shape to a matching spot on the bug.',
  offScreen:
    'Fold paper in half, dab paint on one side, and press it closed to make matching butterfly wings.',
  hubIcon: () => new WigglyIcon(bugSticker()),
  sticker: (seed) => bugSticker(seed),
  create: (ctx) => new BugBuilder(ctx),
};
