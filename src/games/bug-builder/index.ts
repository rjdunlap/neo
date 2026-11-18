import { rangeFor } from '../../progress/difficulty';
import { Circle, Container, Graphics } from 'pixi.js';
import { cream, swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { checkIcon } from '../../ui/icons';
import { RoundButton } from '../../ui/buttons';
import type { View } from '../../engine/view';
import { WigglyIcon, tile } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { CountSign, bugBody, bugSticker, bugToken, bugWing, openPlace, stampedPlace } from './art';
import { FoldFriend } from './fold';
import { MendWing } from './mend';
import {
  LEVELS,
  BUG_PLANS,
  BUG_TOKENS,
  CHECK_RADIUS,
  PLACE_TAP,
  STAMP_HIT,
  bugLayout,
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
        node.addChild(openPlace());
        // A stamped place lifts off with a tap; an open one does nothing.
        onTap(node, () => this.countEvent(countLift(this.count!, i), i), { radius: PLACE_TAP });
        this.board.addChild(node);
        this.places.push(node);
      });
      this.sign = new CountSign(board.state.want, board.state.kind);
      this.check = new RoundButton(checkIcon(), swatch.green, CHECK_RADIUS, () =>
        this.countEvent(countCheck(this.count!)),
      );
      ctx.stage.addChild(this.sign, this.check);
    } else tokens = this.buildMatch();
    this.board.addChild(this.glow);
    for (const token of tokens) {
      const node = new Container();
      node.addChild(tile(102, 102), bugToken(token));
      node.hitArea = new Circle(0, 0, STAMP_HIT);
      ctx.stage.addChild(node);
      const drag = draggable(node, ctx.tw, {
        onPick: () => sfx.tick(),
        onDrop: (x, y) => {
          if (this.done) return false;
          const at = this.onBoard(x, y);
          if (this.count) {
            const place = countPlaceAt(this.count, at.x, at.y);
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
    const at = this.onBoard(x, y);
    const slot = slotAt(this.targets, at.x, at.y);
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
  /** A point on the stage in the bug's own units (the bug is drawn larger on a phone held upright). */
  private onBoard(x: number, y: number) {
    const k = this.board.scale.x;
    return { x: (x - this.board.x) / k, y: (y - this.board.y) / k };
  }
  /** What a stamp, a lift or the check did on level 8: the count said aloud, the sign, the glow, and the finish. */
  private countEvent(ev: CountEvent, place = -1, token = -1) {
    const s = this.count!,
      ctx = this.ctx;
    if (ev.kind === 'ignored') return;
    if (ev.kind === 'stamp' || ev.kind === 'lift') {
      const node = this.places[place];
      node.removeChildren().forEach((c) => c.destroy({ children: true }));
      node.addChild(ev.kind === 'stamp' ? stampedPlace(token) : openPlace());
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
    const l = bugLayout(v, this.plan, this.choices.length, this.sign?.halfW);
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.green.light)
      .roundRect(l.trayBox.x, l.trayBox.y, l.trayBox.w, l.trayBox.h, 32)
      .fill(cream);
    const k = l.board.scale;
    this.board.position.set(l.board.x, l.board.y);
    this.board.scale.set(k);
    if (this.sign && this.check && l.sign && l.check) {
      this.sign.position.set(l.sign.x, l.sign.y);
      this.check.position.set(l.check.x, l.check.y);
    }
    this.model.position.set(l.model.x, l.model.y);
    this.model.scale.set(l.model.scale);
    const d = this.decorations.clear();
    if (l.card && l.arrow) {
      d.roundRect(l.card.x, l.card.y, l.card.w, l.card.h, 32).fill(cream);
      // A chevron from the model to the bug: pointing right beside it, or down when the model sits above.
      const { x, y, down } = l.arrow;
      const at = (along: number, across: number) =>
        down ? [x + across, y + along] : [x + along, y + across];
      const [a, b, c] = [at(-12, -20), at(12, 0), at(-12, 20)];
      d.moveTo(a[0], a[1])
        .lineTo(b[0], b[1])
        .lineTo(c[0], c[1])
        .stroke({ width: 7, color: swatch.teal.line });
    }
    if (this.plan.mode === 'mirror')
      for (let y = -140; y < 185; y += 28)
        d.moveTo(l.board.x, l.board.y + y * k)
          .lineTo(l.board.x, l.board.y + (y + 13) * k)
          .stroke({ width: 4, color: swatch.white.fill });
    this.choices.forEach((c, i) => {
      c.drag.home = l.tray[i];
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
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel: (l) => BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, l - 1))].name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Help {name} move a shape to a matching spot on the bug.',
  offScreen:
    'Fold paper in half, dab paint on one side, and press it closed to make matching butterfly wings.',
  hubIcon: () => new WigglyIcon(bugSticker()),
  sticker: (seed) => bugSticker(seed),
  create: (ctx) => {
    const plan = BUG_PLANS[Math.max(0, Math.min(BUG_PLANS.length - 1, ctx.level - 1))];
    if (plan.mode === 'fold') return new FoldFriend(ctx, plan);
    if (plan.mode === 'mend') return new MendWing(ctx, plan);
    return new BugBuilder(ctx);
  },
};
