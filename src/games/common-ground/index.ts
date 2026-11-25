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
import { fixtureArt, floorArt, friendArt, pieceArt, requestArt, roomSticker, tickArt } from './art';
import { cellAt, roomLayout } from './layout';
import {
  LEVELS,
  PIECES,
  check,
  describeLevel,
  emptyRoom,
  hintAction,
  lift,
  pickVisit,
  place,
  requestsKept,
  type Fixture,
  type Move,
  type Piece,
  type Room,
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
    ctx.stage.addChild(this.bg, this.floor, this.fixtureNode, this.glow);
    this.go = new RoundButton(this.goArt(), swatch.green, 56, () => this.visitNow()).named('Visit');
    for (const kind of ['cushion', 'basket'] as const) {
      const b = requestArt(kind, this.visit.fixture, 330, 120, this.visit.tint);
      b.eventMode = 'static';
      b.cursor = 'pointer';
      b.on('pointerdown', () => void this.askAgain());
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
    ctx.stage.addChild(this.friend, ...this.bubbles, ...this.ticks, this.go);
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

  private drop(piece: Piece, x: number, y: number): boolean {
    if (this.done || this.busy) return false;
    const cell = cellAt(this.layout, x, y);
    this.room = cell < 0 ? lift(this.room, piece) : place(this.room, piece, cell);
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
    this.ticks[1].visible = k.basket;
    this.go.alpha = placed ? 1 : 0.4;
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
    const verdict = check(this.room, this.visit.fixture);
    if (verdict === 'unplaced') {
      sfx.boing();
      return;
    }
    if (verdict === 'ok') {
      void this.welcome();
      return;
    }
    // One miss, naming the one unmet request it can (the cushion first); the unmet bubble pulses.
    const which = verdict === 'basket' ? 'basket' : 'cushion';
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
    const move = hintAction(this.room, this.visit.fixture);
    if (!move) return;
    hinted(this.t);
    void this.ctx.say('common-ground.hint', { name: this.ctx.childName });
    if (this.t.hints >= 3) {
      this.room = place(this.room, move.piece, move.cell);
      this.hint = null;
      sfx.bell(5, 0.3);
      this.sync();
      return;
    }
    this.hint = move;
    this.drawGlow();
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
    await this.ctx.say('common-ground.ok', { name: this.ctx.childName });
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
    if (this.done || this.busy) {
      const c = l.cells[this.room.indexOf('cushion')];
      this.ctx.tw.kill(this.friend);
      this.friend.position.set(c.x, c.y + 36);
    } else this.friend.position.set(l.friendStart.x, l.friendStart.y);
    this.sync();
  }

  /** The ghost finger: place what the hint says, sometimes add the plant, then press Visit. */
  autotouch(): TouchIntent | null {
    if (this.done || this.busy || !this.ctx.alive) return null;
    if (this.pieces.some((p) => p.drag.dragging || p.drag.held)) return null;
    const l = this.layout;
    const move = hintAction(this.room, this.visit.fixture);
    if (move) {
      const p = this.pieces.find((x) => x.piece === move.piece)!;
      return {
        drag: { on: p.node },
        to: { on: this.ctx.stage, x: l.cells[move.cell].x, y: l.cells[move.cell].y },
      };
    }
    this.demoPlant ??= this.ctx.rng.chance(0.5);
    if (this.demoPlant && !this.room.includes('plant')) {
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
  titleLine: 'game.common-ground',
  region: 'story-grove',
  challenge: 'space',
  skills: ['listening', 'perspective-taking', 'spatial reasoning'],
  bands: ['school'],
  levels: (band) => rangeFor(LEVELS, band),
  describeLevel,
  music: STYLES.quiet,
  touchDemo: true,
  upright: true,
  offScreen: 'Arrange real cushions and a basket for a toy visitor who asks for two things.',
  hubIcon: () => new WigglyIcon(roomSticker(7)),
  sticker: (seed) => roomSticker(seed),
  create: (ctx) => new Round(ctx),
};
