import { Container, Graphics, Rectangle } from 'pixi.js';
import { swatch } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { rangeFor } from '../../progress/difficulty';
import { hinted, missEvery, newTally, tally } from '../../progress/coach';
import { RoundButton } from '../../ui/buttons';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import {
  changedRequestArt,
  fixtureArt,
  floorArt,
  friendArt,
  ghostArt,
  pieceArt,
  requestArt,
  roomSticker,
  tickArt,
  undoArt,
} from './art';
import { cellAt, roomLayout } from './layout';
import { Round3 } from './round3';
import {
  LEVELS,
  PIECES,
  check,
  check2,
  describeLevel,
  emptyRoom,
  hintAction,
  hintAction2,
  lift,
  pickVisit,
  place,
  previewSide,
  pushUndo,
  requestsKept,
  undo,
  type Fixture,
  type Move,
  type Piece,
  type Room,
  type Side,
  type UndoStack,
} from './logic';

/** The fixture of the last visit, so the next one is the other (each comes once before it repeats). */
let lastFixture: Fixture | undefined;

class Round implements Game {
  private readonly visit;
  private room: Room = emptyRoom();
  private readonly t = newTally();
  private readonly bg = new Graphics();
  private readonly floor: Graphics;
  private readonly glow = new Graphics();
  private readonly fixtureNode: Container;
  private readonly friend: Container;
  private readonly pieces: { piece: Piece; node: Container; drag: DragHandle }[] = [];
  private readonly bubbles: Container[] = [];
  private readonly ticks: Container[] = [];
  private readonly go: RoundButton;
  /** Level 2: the friend's request changes after a first Visit (docs/definitions/common-ground-2.md). */
  private readonly revises: boolean;
  private phase: 1 | 2 = 1;
  private previewed: Side | null = null;
  private previewCushion = 0;
  private stack: UndoStack = [];
  private readonly ghost = new Container();
  private previewBasket = 0;
  private readonly undoBtn: RoundButton;
  private hint: Move | null = null;
  private busy = false;
  private done = false;
  private clock = 0;
  private demoPlant: boolean | null = null;
  private layout: ReturnType<typeof roomLayout>;

  constructor(private readonly ctx: GameContext) {
    this.visit = pickVisit(ctx.rng, lastFixture);
    lastFixture = this.visit.fixture;
    this.layout = roomLayout(ctx.view);
    const l = this.layout;
    this.revises = ctx.level >= 2;
    this.floor = floorArt(l.floor.cell);
    this.fixtureNode = fixtureArt(
      this.visit.fixture,
      this.visit.fixture === 'window' ? l.fixture.w : 92,
      this.visit.fixture === 'window' ? 44 : 56,
    );
    this.friend = friendArt(this.visit.friend, 104);
    this.friend.eventMode = 'none';
    for (const d of [this.bg, this.glow]) d.eventMode = 'none';
    this.floor.eventMode = 'none';
    this.fixtureNode.eventMode = 'none';
    this.ghost.eventMode = 'none';
    this.ghost.visible = false;
    ctx.stage.addChild(this.bg, this.floor, this.fixtureNode, this.ghost, this.glow);
    this.go = new RoundButton(this.goArt(), swatch.green, 56, () => this.visitNow()).named('Visit');
    this.undoBtn = new RoundButton(undoArt(), swatch.orange, 56, () => this.undoMove()).named('Undo');
    this.undoBtn.visible = false;
    for (const [i, kind] of (['cushion', 'basket'] as const).entries()) {
      const b = requestArt(kind, this.visit.fixture, 330, 120, this.visit.tint);
      b.eventMode = 'static';
      b.cursor = 'pointer';
      b.on('pointerdown', () => void (i === 1 && this.phase === 2 ? this.askChange() : this.askAgain()));
      const tick = tickArt();
      tick.visible = false;
      tick.eventMode = 'none';
      this.bubbles.push(b);
      this.ticks.push(tick);
    }
    for (const piece of PIECES) {
      const node = pieceArt(piece, l.piece, this.visit.tint);
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
    ctx.stage.addChild(this.friend, ...this.bubbles, ...this.ticks, this.go, this.undoBtn);
    this.resize(ctx.view);
  }

  private goArt(): Container {
    const g = new Graphics().poly([-14, -24, 26, 0, -14, 24]).fill(0xffffff);
    return new Container().addChild(g);
  }

  start() {
    void this.begin();
  }
  private async begin() {
    await this.ctx.instruct('common-ground.start', { name: this.ctx.childName });
    if (this.ctx.alive) await this.askAgain();
  }
  private async askAgain() {
    if (this.done) return;
    await this.ctx.say('common-ground.request', { fixture: this.visit.fixture });
  }

  private async askChange() {
    if (this.done) return;
    await this.ctx.say('common-ground.change', { name: this.ctx.childName });
  }

  /** Every move after the change goes through here so Undo can step back through it. */
  private apply(piece: Piece, cell: number) {
    if (this.phase === 2) this.stack = pushUndo(this.stack, this.room);
    this.room = cell < 0 ? lift(this.room, piece) : place(this.room, piece, cell);
  }

  private undoMove() {
    if (this.phase !== 2 || this.done || this.busy || !this.stack.length) return;
    ({ room: this.room, stack: this.stack } = undo(this.room, this.stack));
    this.hint = null;
    sfx.tick();
    this.sync();
  }

  private drop(piece: Piece, x: number, y: number): boolean {
    if (this.done || this.busy) return false;
    const cell = cellAt(this.layout, x, y);
    this.apply(piece, cell);
    this.hint = null;
    sfx.bell(3 + (cell < 0 ? 0 : cell), 0.25);
    this.sync();
    return true;
  }

  /** Put every piece at its cell or its tray spot, redraw the ticks and the glow. */
  private sync() {
    const l = this.layout;
    for (const p of this.pieces) {
      const cell = this.room.indexOf(p.piece);
      const spot = cell >= 0 ? l.cells[cell] : l.tray[PIECES.indexOf(p.piece)];
      p.drag.home = { ...spot };
      if (!p.drag.dragging) {
        this.ctx.tw.kill(p.node);
        p.node.position.set(spot.x, spot.y);
      }
    }
    const k = requestsKept(this.room, this.visit.fixture);
    const placed = this.room.includes('cushion') && this.room.includes('basket');
    this.ticks[0].visible = k.cushion;
    this.ticks[1].visible = this.previewed
      ? check2(this.room, this.visit.fixture, this.previewed) === 'ok'
      : k.basket;
    this.go.alpha = placed ? 1 : 0.4;
    this.undoBtn.alpha = this.stack.length ? 1 : 0.4;
    this.drawGlow();
  }

  private drawGlow() {
    const l = this.layout;
    this.glow.clear();
    if (!this.hint) return;
    const from = this.room.indexOf(this.hint.piece);
    const at = from >= 0 ? l.cells[from] : l.tray[PIECES.indexOf(this.hint.piece)];
    const to = l.cells[this.hint.cell];
    const s = l.piece + 28;
    for (const c of [at, to])
      this.glow.roundRect(c.x - s / 2, c.y - s / 2, s, s, 24).stroke({ width: 8, color: swatch.yellow.line });
  }

  private visitNow() {
    if (this.done || this.busy) return;
    const verdict =
      this.phase === 2 && this.previewed
        ? check2(this.room, this.visit.fixture, this.previewed)
        : check(this.room, this.visit.fixture);
    if (verdict === 'unplaced') {
      sfx.boing();
      return;
    }
    if (verdict === 'ok') {
      void (this.revises && this.phase === 1 ? this.change() : this.welcome());
      return;
    }
    // One miss, naming the one unmet request it can (the cushion first); the unmet bubble pulses.
    const which = verdict === 'basket' || verdict === 'same' ? (verdict as 'basket' | 'same') : 'cushion';
    sfx.boing();
    const due = missEvery(this.t);
    const bubble = this.bubbles[which === 'cushion' ? 0 : 1];
    void this.ctx.tw
      .to(bubble.scale, { x: 1.12, y: 1.12 }, { duration: 0.18 })
      .then(() => this.ctx.tw.to(bubble.scale, { x: 1, y: 1 }, { duration: 0.25 }));
    void (async () => {
      await this.ctx.say(`common-ground.miss.${which}`, {
        fixture: this.visit.fixture,
        name: this.ctx.childName,
      });
      if (due && this.ctx.alive && !this.done) this.giveHint();
    })();
  }

  /** Light the move `hintAction` names (a hint); the third in a round is carried out by the pet, so a round can always finish. */
  private giveHint() {
    if (this.done || this.busy) return;
    const move = this.nextMove();
    if (!move) return;
    hinted(this.t);
    void this.ctx.say('common-ground.hint', { name: this.ctx.childName });
    if (this.t.hints >= 3) {
      this.apply(move.piece, move.cell);
      this.hint = null;
      sfx.bell(5, 0.3);
      this.sync();
      return;
    }
    this.hint = move;
    this.drawGlow();
  }

  /** The one legal move toward the room the friend asks for now. */
  private nextMove(): Move | null {
    return this.phase === 2 && this.previewed
      ? hintAction2(this.room, this.visit.fixture, this.previewed)
      : hintAction(this.room, this.visit.fixture);
  }

  /**
   * Level 2: the first Visit was right, the friend starts to sit, then asks for the basket on a different side. The old place
   * stays as a dashed outline; she repairs the room and presses Visit again.
   */
  private async change() {
    this.busy = true;
    this.hint = null;
    this.drawGlow();
    const side = previewSide(this.room, this.visit.fixture);
    if (!side) {
      this.busy = false;
      return;
    }
    this.previewCushion = this.room.indexOf('cushion');
    const l = this.layout;
    const c = l.cells[this.previewCushion];
    sfx.bell(7, 0.3);
    await this.ctx.tw.to(this.friend, { x: c.x - 40, y: c.y + 52 }, { duration: 0.9, ease: ease.inOutSine });
    if (!this.ctx.alive) return;
    this.previewed = side;
    this.phase = 2;
    this.stack = [];
    this.previewBasket = this.room.indexOf('basket');
    this.ghost.addChild(ghostArt(l.piece + 24));
    this.ghost.visible = true;
    this.bubbles[1].removeChildren().forEach((n) => n.destroy({ children: true }));
    this.bubbles[1].addChild(changedRequestArt(side, 330, 120, this.visit.tint));
    this.undoBtn.visible = true;
    this.busy = false;
    this.resize(this.ctx.view);
    await this.ctx.instruct('common-ground.change', { name: this.ctx.childName });
  }

  /** The pause sheet's Help. */
  askForHint() {
    this.giveHint();
  }

  private async welcome() {
    this.busy = true;
    this.hint = null;
    this.drawGlow();
    for (const p of this.pieces) p.drag.enabled = false;
    const c = this.layout.cells[this.room.indexOf('cushion')];
    sfx.bell(7, 0.3);
    await this.ctx.tw.to(this.friend, { x: c.x, y: c.y + 36 }, { duration: 1.1, ease: ease.inOutSine });
    if (!this.ctx.alive) return;
    this.done = true;
    await this.ctx.say(this.phase === 2 ? 'common-ground.better' : 'common-ground.ok', {
      name: this.ctx.childName,
    });
    if (!this.ctx.alive) return;
    await this.ctx.say(this.room.includes('plant') ? 'common-ground.plant' : 'common-ground.noplant', {
      name: this.ctx.childName,
    });
    if (!this.ctx.alive) return;
    await this.ctx.tw.wait(0.8);
    if (!this.ctx.alive) return;
    await this.ctx.say('common-ground.finish', { name: this.ctx.childName });
    if (this.ctx.alive) this.ctx.finish(tally(this.t));
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.7 + 0.3 * Math.sin(this.clock * 3.2);
  }

  resize(v: View) {
    const l = (this.layout = roomLayout(v));
    this.bg.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.floor.position.set(l.floor.cx, l.floor.cy);
    this.fixtureNode.position.set(
      l.fixture.x,
      this.visit.fixture === 'window' ? l.fixture.y : l.fixture.bottomY - 2,
    );
    l.bubbles.forEach((b, i) => {
      this.bubbles[i].position.set(b.x, b.y);
      this.ticks[i].position.set(b.x + b.w / 2 - 22, b.y - b.h / 2 + 12);
    });
    this.go.position.set(l.visit.x, l.visit.y);
    this.undoBtn.position.set(l.undo.x, l.undo.y);
    this.ghost.position.set(l.cells[this.previewBasket].x, l.cells[this.previewBasket].y);
    if (this.done || this.busy) {
      const c = l.cells[this.room.indexOf('cushion')];
      this.ctx.tw.kill(this.friend);
      this.friend.position.set(c.x, c.y + 36);
    } else if (this.phase === 2) {
      const c = l.cells[this.previewCushion];
      this.ctx.tw.kill(this.friend);
      this.friend.position.set(c.x - 40, c.y + 52);
    } else this.friend.position.set(l.friendStart.x, l.friendStart.y);
    this.sync();
  }

  /** The ghost finger: place what the hint says, sometimes add the plant, then press Visit. */
  /** Guided first play: the next piece's place, then Go; the bot's optional plant (a random draw) is left out. */
  showMove(): TouchIntent | null {
    if (this.done || this.busy || !this.ctx.alive) return null;
    if (this.pieces.some((p) => p.drag.dragging || p.drag.held)) return null;
    const move = this.nextMove();
    if (!move) return { tap: { on: this.go } };
    const p = this.pieces.find((x) => x.piece === move.piece)!;
    const at = this.layout.cells[move.cell];
    return { drag: { on: p.node }, to: { on: this.ctx.stage, x: at.x, y: at.y } };
  }

  autotouch(): TouchIntent | null {
    if (this.done || this.busy || !this.ctx.alive) return null;
    if (this.pieces.some((p) => p.drag.dragging || p.drag.held)) return null;
    const l = this.layout;
    const move = this.nextMove();
    if (move) {
      const p = this.pieces.find((x) => x.piece === move.piece)!;
      return {
        drag: { on: p.node },
        to: { on: this.ctx.stage, x: l.cells[move.cell].x, y: l.cells[move.cell].y },
      };
    }
    this.demoPlant ??= this.ctx.rng.chance(0.5);
    if (this.phase === 1 && this.demoPlant && !this.room.includes('plant')) {
      const free = this.room.findIndex((p) => p === null);
      const p = this.pieces.find((x) => x.piece === 'plant')!;
      return { drag: { on: p.node }, to: { on: this.ctx.stage, x: l.cells[free].x, y: l.cells[free].y } };
    }
    return { tap: { on: this.go } };
  }

  destroy() {
    for (const p of this.pieces) p.drag.destroy();
  }
}

export const game: GameModule = {
  id: 'common-ground',
  name: 'Common Ground',
  titleLine: 'common-ground.title',
  region: 'story-grove',
  challenge: 'space',
  skills: ['listening', 'perspective-taking', 'spatial reasoning'],
  bands: ['school', 'grownup'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  upright: true,
  offScreen: 'Arrange real cushions and a basket for a toy visitor who asks for two things.',
  hubIcon: () => new WigglyIcon(roomSticker(7)),
  sticker: (seed) => roomSticker(seed),
  create: (ctx) => (ctx.level >= 3 ? new Round3(ctx) : new Round(ctx)),
};
