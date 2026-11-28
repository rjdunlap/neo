import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { RoundButton } from '../../ui/buttons';
import type { Game, GameContext, TouchIntent } from '../types';
import {
  doorArt,
  floorArt,
  friendArt,
  piece3Art,
  residentCardArt,
  shelfArt,
  tickArt,
  undoArt,
  windowArt,
} from './art';
import { cellAt, roomLayout } from './layout';
import {
  DOORWAY,
  PIECES3,
  check3,
  emptyRoom3,
  hintAction3,
  lift3,
  needsKept3,
  pickDemoPlan,
  pickVisit3,
  place3,
  served,
  type Friend,
  type Move3,
  type Piece3,
  type Room3,
} from './logic';

/** The drawer of the last level-3 visit, so the next one is someone else. */
let lastDrawer: Friend | undefined;

const CARD_H = 140;

/**
 * Level 3, two residents (docs/definitions/common-ground-3.md): two friends share one floor, each with a need and a wish. A
 * `clash` of the two wishes is shown, never scored; which wish a kept plan serves is never recorded.
 */
export class Round3 implements Game {
  private readonly visit;
  private room: Room3 = emptyRoom3();
  private readonly t = newTally();
  private readonly bg = new Graphics();
  private readonly floor: Graphics;
  private readonly glow = new Graphics();
  private readonly fixtures = new Container();
  private readonly cards: ReturnType<typeof residentCardArt>[] = [];
  private readonly friends: Container[] = [];
  private readonly pieces: { piece: Piece3; node: Container; drag: DragHandle }[] = [];
  private readonly go: RoundButton;
  private readonly keep: RoundButton;
  private readonly again: RoundButton;
  private hint: Move3 | null = null;
  /** Visited and accepted: the friends are busy and Keep / Try another are showing. */
  private accepted = false;
  private busy = false;
  private done = false;
  private clock = 0;
  private readonly plan;
  private layout: ReturnType<typeof roomLayout>;

  constructor(private readonly ctx: GameContext) {
    this.visit = pickVisit3(ctx.rng, lastDrawer);
    this.plan = pickDemoPlan(ctx.rng);
    lastDrawer = this.visit.drawer;
    const l = (this.layout = roomLayout(ctx.view, CARD_H));
    this.floor = floorArt(l.floor.cell);
    for (const d of [this.bg, this.glow, this.floor, this.fixtures]) d.eventMode = 'none';
    ctx.stage.addChild(this.bg, this.floor, this.fixtures, this.glow);
    this.go = new RoundButton(this.arrowArt(), swatch.green, 56, () => this.visitNow()).named('Visit');
    this.keep = new RoundButton(tickArt(), swatch.green, 56, () => this.keepPlan()).named('Keep this plan');
    this.again = new RoundButton(undoArt(), swatch.orange, 56, () => this.tryAnother()).named('Try another');
    this.keep.visible = this.again.visible = false;
    const roles = ['drawer', 'drummer'] as const;
    for (const role of roles) {
      const friend = role === 'drawer' ? this.visit.drawer : this.visit.drummer;
      const card = residentCardArt(role, friend, 330, CARD_H, this.visit.tint);
      card.root.eventMode = 'static';
      card.root.cursor = 'pointer';
      card.root.on('pointerdown', () => void this.ask(role));
      this.cards.push(card);
      const f = friendArt(friend, 100);
      f.eventMode = 'none';
      this.friends.push(f);
    }
    for (const piece of PIECES3) {
      const node = piece3Art(piece, l.piece, this.visit.tint);
      node.hitArea = new Rectangle(-55, -55, 110, 110);
      ctx.stage.addChild(node);
      const entry = { piece, node, drag: null as unknown as DragHandle };
      entry.drag = draggable(node, ctx.tw, {
        tapToPlace: true,
        onPick: () => sfx.tick(),
        onDrop: (x, y) => this.drop(piece, x, y),
      });
      this.pieces.push(entry);
      ctx.own(() => entry.drag.destroy());
    }
    ctx.stage.addChild(...this.friends, ...this.cards.map((c) => c.root), this.go, this.keep, this.again);
    this.resize(ctx.view);
  }

  private arrowArt(): Container {
    return new Container().addChild(new Graphics().poly([-14, -24, 26, 0, -14, 24]).fill(0xffffff));
  }

  start() {
    void this.begin();
  }

  private async begin() {
    await this.ctx.instruct('common-ground.start3', { name: this.ctx.childName });
    const order = this.visit.drawerFirst
      ? (['drawer', 'drummer'] as const)
      : (['drummer', 'drawer'] as const);
    for (const role of order) {
      if (!this.ctx.alive || this.done) return;
      await this.ask(role);
    }
  }

  private async ask(role: 'drawer' | 'drummer') {
    if (this.done) return;
    await this.ctx.say(`common-ground.${role}`, { name: this.ctx.childName });
  }

  private drop(piece: Piece3, x: number, y: number): boolean {
    if (this.done || this.busy || this.accepted) return false;
    const cell = cellAt(this.layout, x, y);
    this.room = cell < 0 ? lift3(this.room, piece) : place3(this.room, piece, cell);
    this.hint = null;
    sfx.bell(3 + (cell < 0 ? 0 : cell), 0.25);
    this.sync();
    return true;
  }

  private sync() {
    const l = this.layout;
    for (const p of this.pieces) {
      const cell = this.room.indexOf(p.piece);
      const spot = cell >= 0 ? l.cells[cell] : l.tray[PIECES3.indexOf(p.piece)];
      p.drag.home = { ...spot };
      if (!p.drag.dragging) {
        this.ctx.tw.kill(p.node);
        p.node.position.set(spot.x, spot.y);
      }
    }
    const k = needsKept3(this.room);
    this.cards[0].needTick.visible = k.drawing;
    this.cards[1].needTick.visible = k.drums;
    this.go.alpha = this.room.includes('drawing') && this.room.includes('drums') ? 1 : 0.4;
    this.drawGlow();
  }

  private drawGlow() {
    const l = this.layout;
    this.glow.clear();
    if (!this.hint) return;
    const from = this.room.indexOf(this.hint.piece);
    const at = from >= 0 ? l.cells[from] : l.tray[PIECES3.indexOf(this.hint.piece)];
    const to = l.cells[this.hint.cell];
    const s = l.piece + 28;
    for (const c of [at, to])
      this.glow.roundRect(c.x - s / 2, c.y - s / 2, s, s, 24).stroke({ width: 8, color: swatch.yellow.line });
  }

  private pulse(card: Container) {
    void this.ctx.tw
      .to(card.scale, { x: 1.12, y: 1.12 }, { duration: 0.18 })
      .then(() => this.ctx.tw.to(card.scale, { x: 1, y: 1 }, { duration: 0.25 }));
  }

  private visitNow() {
    if (this.done || this.busy || this.accepted) return;
    const verdict = check3(this.room);
    if (verdict === 'unplaced') {
      sfx.boing();
      return;
    }
    if (verdict === 'ok') {
      void this.welcome();
      return;
    }
    sfx.boing();
    const name = this.ctx.childName;
    if (verdict === 'clash') {
      // The two wishes together: shown, never scored, and never told which to give up.
      this.pulse(this.cards[0].root);
      this.pulse(this.cards[1].root);
      void this.ctx.say('common-ground.clash', { name });
      return;
    }
    const due = missEvery(this.t);
    this.pulse(this.cards[verdict === 'window' ? 0 : 1].root);
    void (async () => {
      await this.ctx.say(`common-ground.miss.${verdict}`, { name });
      if (due && this.ctx.alive && !this.done) this.giveHint();
    })();
  }

  private giveHint() {
    if (this.done || this.busy || this.accepted) return;
    const move = hintAction3(this.room);
    if (!move) return;
    hinted(this.t);
    void this.ctx.say('common-ground.hint', { name: this.ctx.childName });
    if (this.t.hints >= 3) {
      this.room = place3(this.room, move.piece, move.cell);
      this.hint = null;
      sfx.bell(5, 0.3);
      this.sync();
      return;
    }
    this.hint = move;
    this.drawGlow();
  }

  askForHint() {
    this.giveHint();
  }

  /** Both needs kept: each friend goes to their piece and starts; the wishes resolve; Keep and Try another appear. */
  private async welcome() {
    this.busy = true;
    this.hint = null;
    this.drawGlow();
    for (const p of this.pieces) p.drag.enabled = false;
    const l = this.layout;
    const a = l.cells[this.room.indexOf('drawing')],
      d = l.cells[this.room.indexOf('drums')];
    sfx.bell(7, 0.3);
    await Promise.all([
      this.ctx.tw.to(this.friends[0], { x: a.x + 56, y: a.y + 48 }, { duration: 1, ease: ease.inOutSine }),
      this.ctx.tw.to(this.friends[1], { x: d.x - 56, y: d.y + 48 }, { duration: 1, ease: ease.inOutSine }),
    ]);
    if (!this.ctx.alive) return;
    const s = served(this.room);
    this.cards[0].wishStar.visible = this.cards[1].wishStar.visible = true;
    // "Not this time" is shown neutrally: a pale star, never a warning colour.
    this.cards[0].wishStar.alpha = s.shelf ? 1 : 0.25;
    this.cards[1].wishStar.alpha = s.doorway ? 1 : 0.25;
    for (const [i, node] of [this.pieces[0].node, this.pieces[1].node].entries())
      void this.ctx.tw
        .to(node.scale, { x: 1.15, y: 1.15 }, { duration: 0.2 })
        .then(() => this.ctx.tw.to(node.scale, { x: 1, y: 1 }, { duration: 0.25 }))
        .then(() => sfx.bell(8 + i * 2, 0.25));
    this.accepted = true;
    this.busy = false;
    this.go.visible = false;
    this.keep.visible = this.again.visible = true;
    await this.ctx.say(
      s.shelf
        ? 'common-ground.ok.shelf'
        : s.doorway
          ? 'common-ground.ok.doorway'
          : 'common-ground.ok.neither',
      {
        name: this.ctx.childName,
      },
    );
  }

  /** Free: the friends step back, the wishes hide and the pieces can be moved again. */
  private tryAnother() {
    if (!this.accepted || this.done || this.busy) return;
    this.accepted = false;
    this.keep.visible = this.again.visible = false;
    this.go.visible = true;
    for (const c of this.cards) c.wishStar.visible = false;
    for (const p of this.pieces) p.drag.enabled = true;
    this.placeFriends();
    sfx.tick();
    this.sync();
    void this.ctx.say('common-ground.again', { name: this.ctx.childName });
  }

  private async keepPlan() {
    if (!this.accepted || this.done || this.busy) return;
    this.done = true;
    this.keep.visible = this.again.visible = false;
    await this.ctx.tw.wait(0.6);
    if (!this.ctx.alive) return;
    await this.ctx.say('common-ground.finish3', { name: this.ctx.childName });
    if (this.ctx.alive) this.ctx.finish(tally(this.t));
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 3.2);
  }

  private placeFriends() {
    const l = this.layout;
    const right = l.floor.left + l.floor.w + 62;
    this.ctx.tw.kill(this.friends[0]);
    this.ctx.tw.kill(this.friends[1]);
    this.friends[0].position.set(right, l.floor.top + l.floor.h * 0.4);
    this.friends[1].position.set(right, l.floor.top + l.floor.h * 0.9);
  }

  resize(v: View) {
    const l = (this.layout = roomLayout(v, CARD_H));
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.floor.position.set(l.floor.cx, l.floor.cy);
    // The fixed room: the window on the top wall, a shelf beside cell 0 and the doorway under cell 3.
    this.fixtures.removeChildren().forEach((n) => n.destroy({ children: true }));
    const win = windowArt(l.fixture.w, 44);
    win.position.set(l.fixture.x, l.fixture.y);
    const shelf = shelfArt(54);
    shelf.position.set(l.floor.left - 34, l.cells[0].y + 20);
    const door = doorArt(64, 52);
    door.position.set(l.cells[DOORWAY].x, l.fixture.bottomY - 2);
    this.fixtures.addChild(win, shelf, door);
    l.bubbles.forEach((b, i) => this.cards[i].root.position.set(b.x, b.y));
    this.go.position.set(l.visit.x, l.visit.y);
    this.keep.position.set(l.visit.x, l.visit.y);
    this.again.position.set(l.undo.x, l.undo.y);
    if (this.accepted || this.done) {
      const a = l.cells[this.room.indexOf('drawing')],
        d = l.cells[this.room.indexOf('drums')];
      this.ctx.tw.kill(this.friends[0]);
      this.ctx.tw.kill(this.friends[1]);
      this.friends[0].position.set(a.x + 56, a.y + 48);
      this.friends[1].position.set(d.x - 56, d.y + 48);
    } else this.placeFriends();
    this.sync();
  }

  /** The ghost finger: one accepted plan chosen from the seed, placed piece by piece, then Visit and Keep this plan. */
  autotouch(): TouchIntent | null {
    if (this.done || this.busy || !this.ctx.alive) return null;
    if (this.pieces.some((p) => p.drag.dragging || p.drag.held)) return null;
    if (this.accepted) return { tap: { on: this.keep } };
    const l = this.layout;
    const want: [Piece3, number][] = [
      ['drawing', this.plan[0]],
      ['drums', this.plan[1]],
    ];
    for (const [piece, cell] of want) {
      if (this.room.indexOf(piece) === cell) continue;
      const p = this.pieces.find((x) => x.piece === piece)!;
      return { drag: { on: p.node }, to: { on: this.ctx.stage, x: l.cells[cell].x, y: l.cells[cell].y } };
    }
    return { tap: { on: this.go } };
  }

  destroy() {
    for (const p of this.pieces) p.drag.destroy();
  }
}
