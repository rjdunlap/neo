import { rangeFor } from '../../progress/difficulty';
import { Container, Graphics, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, RAINBOW, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { pictureScene, pictureThumb, puzzleIcon } from './art';
import { cellFeatures, dealScenePair, SCENES, type Feature, type SceneDef } from './scenes';
import {
  LEVELS,
  dealMend,
  dealPlan,
  dealTurns,
  flipTurn,
  hintPiece,
  judgeDrop,
  judgeSwap,
  judgeTwinDrop,
  nextToPlace,
  outerSides,
  PICTURE_H,
  PICTURE_W,
  pictureBox,
  quarterTurn,
  piecesFor,
  puzzlePlan,
  slotCenter,
  TAP_HOP,
  tapHops,
  oneAtATimeLayout,
  puzzleLayout,
  lidLayout,
  mendLayout,
  twinLayout,
  whereWords,
  type BoardPiece,
  type Piece,
  type PictureBox,
  type PuzzlePlan,
  type Turn,
} from './logic';

/** Small circular turn arrow shown on pieces in turn levels. */
function drawTurnBadge(): Container {
  const badge = new Container();
  badge.eventMode = 'none';
  const glow = new Graphics().circle(0, 0, 26).stroke({ width: 5, color: swatch.yellow.line });
  glow.visible = false;
  const disc = new Graphics().circle(0, 0, 22).fill(cream).stroke({ width: 3.5, color: swatch.blue.line });
  const r = 11;
  const start = -Math.PI * 0.65;
  const end = Math.PI * 0.85;
  const ex = Math.cos(end) * r;
  const ey = Math.sin(end) * r;
  const tx = -Math.sin(end);
  const ty = Math.cos(end);
  const nx = Math.cos(end);
  const ny = Math.sin(end);
  const arrow = new Graphics()
    .arc(0, 0, r, start, end)
    .stroke({ width: 4, color: swatch.blue.line, cap: 'round' })
    .poly([
      ex + tx * 6.5,
      ey + ty * 6.5,
      ex - tx * 3 + nx * 6,
      ey - ty * 3 + ny * 6,
      ex - tx * 3 - nx * 6,
      ey - ty * 3 - ny * 6,
    ])
    .fill(swatch.blue.line);
  badge.addChild(glow, disc, arrow);
  return badge;
}

/** One picture being put together: its scene, the picture drawn once, and its frame on the stage. */
interface BoardView {
  scene: SceneDef;
  picture: { root: Container; friend: Critter };
  texture: RenderTexture;
  node: Container;
  frame: Graphics;
  slots: Graphics;
  /** Level 12: holds the finished live picture, clipped to the cropped frame. */
  holder?: Container;
  /** Where the frame is and how big a picture unit is on screen (set by `resize`). */
  x: number;
  y: number;
}

interface PieceView {
  piece: Piece;
  /** Which board the piece belongs to (0 unless the level has two pictures). */
  board: number;
  node: Container;
  body: Container;
  badge?: Container;
  /** Mend the picture: the place it sits in now (row * cols + col) and a ring for 'picked' and 'look here'. */
  at: number;
  mark?: Graphics;
  turn: Turn;
  targetRotation: number;
  drag: DragHandle;
  placed: boolean;
  /** One at a time (level 8): still to come out (hidden past the right edge), sliding out now, or waiting to be touched. */
  out: 'later' | 'coming' | 'waiting';
}

class PuzzlePals implements Game {
  readonly plan: PuzzlePlan;
  readonly boards: BoardView[] = [];
  readonly pieces: PieceView[] = [];
  wrong = 0;
  misses = 0;
  hints = 0;
  done = false;

  private readonly glow = new Graphics();
  /** Levels 5-7: the box lid, a small copy of the finished picture, beside the frame. */
  private readonly lid?: Container;
  private readonly background = new Graphics();
  private readonly textures: Texture[] = [];
  /** The part of the picture the frame shows (all of it unless the plan crops). */
  private readonly box: PictureBox;
  /** The scene of the first board: a single-picture level's only one. */
  get scene(): SceneDef {
    return this.boards[0].scene;
  }
  private get board(): BoardView {
    return this.boards[0];
  }
  private scale = 1;
  private trayScale = 0.5;
  private clock = 0;
  private hinted?: PieceView;
  /** Mend the picture: the piece she has tapped and is about to swap, and whether a swap is gliding. */
  private picked?: PieceView;
  private swapping = false;
  private mendHint = false;

  constructor(private readonly ctx: GameContext) {
    this.plan = dealPlan(ctx.level, ctx.rng);
    this.box = pictureBox(this.plan);
    const scenes = this.plan.twin ? dealScenePair(ctx.rng) : [ctx.rng.pick(SCENES)];
    ctx.stage.addChild(this.background);
    let mendFeatures: Feature[] = [];
    for (const scene of scenes) {
      // The picture is drawn once into a texture; pieces, ghost and lid all show parts of that one render.
      const picture = pictureScene(scene, ctx.rng.int(1, 1_000_000));
      mendFeatures = picture.features;
      const texture = RenderTexture.create({ width: PICTURE_W, height: PICTURE_H, resolution: 2 });
      ctx.renderer.render({ container: picture.root, target: texture });
      const node = new Container();
      const frame = new Graphics();
      const slots = new Graphics();
      node.addChild(frame);
      if (this.plan.ghost) {
        const ghost = new Sprite(texture);
        ghost.alpha = 0.28;
        node.addChild(ghost);
      }
      node.addChild(slots);
      ctx.stage.addChild(node);
      this.boards.push({ scene, picture, texture, node, frame, slots, x: 0, y: 0 });
    }
    if (this.plan.lid) {
      // The same render the pieces are cut from, so the lid cannot disagree with them. It takes no touches.
      this.lid = new Container();
      this.lid.eventMode = 'none';
      const lidTexture = this.plan.crop
        ? new Texture({
            source: this.boards[0].texture.source,
            frame: new Rectangle(this.box.x, this.box.y, this.box.w, this.box.h),
          })
        : this.boards[0].texture;
      if (this.plan.crop) this.textures.push(lidTexture);
      this.lid.addChild(new Graphics(), new Sprite(lidTexture));
      ctx.stage.addChild(this.lid);
    }

    const pw = this.box.w / this.plan.cols;
    const ph = this.box.h / this.plan.rows;
    const all: BoardPiece[] = this.boards.flatMap((_, board) =>
      piecesFor(this.plan).map((p) => ({ ...p, board })),
    );
    const order = this.plan.mend
      ? all
      : [...all.slice(0, this.plan.preplaced), ...ctx.rng.shuffle(all.slice(this.plan.preplaced))];
    // Mend the picture: two pieces whose looks differ start in each other's places.
    const cells = this.plan.mend
      ? cellFeatures(mendFeatures, this.plan.cols, this.plan.rows, PICTURE_W, PICTURE_H)
      : [];
    const swapped = this.plan.mend
      ? dealMend(order.length, ctx.rng, (a, b) => cells[a].join() === cells[b].join())
      : undefined;
    const turns = this.plan.turns
      ? dealTurns(order.length, this.plan.turns, ctx.rng, this.plan.quarter)
      : order.map((): Turn => 0);
    for (let idx = 0; idx < order.length; idx++) {
      const piece = order[idx];
      const turn = turns[idx];
      const texture = new Texture({
        source: this.boards[piece.board].texture.source,
        frame: new Rectangle(this.box.x + piece.col * pw, this.box.y + piece.row * ph, pw, ph),
      });
      this.textures.push(texture);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      const body = new Container();
      body.addChild(
        sprite,
        new Graphics().roundRect(-pw / 2, -ph / 2, pw, ph, 6).stroke({ width: 4, color: swatch.white.fill }),
      );
      if (!this.plan.ghost && !this.plan.mend) {
        const sides = outerSides(this.plan, piece);
        const rim = new Graphics();
        const x = pw / 2 - 4;
        const y = ph / 2 - 4;
        if (sides.top) rim.moveTo(-x, -y).lineTo(x, -y);
        if (sides.bottom) rim.moveTo(-x, y).lineTo(x, y);
        if (sides.left) rim.moveTo(-x, -y).lineTo(-x, y);
        if (sides.right) rim.moveTo(x, -y).lineTo(x, y);
        rim.stroke({ width: 8, color: wood.line });
        rim.eventMode = 'none';
        body.addChild(rim);
      }
      const targetRotation = (turn * Math.PI) / 2;
      body.rotation = targetRotation;
      const node = new Container();
      node.addChild(
        new Graphics().roundRect(-pw / 2 + 4, -ph / 2 + 8, pw, ph, 8).fill({ color: wood.line, alpha: 0.25 }),
        body,
      );
      let badge: Container | undefined;
      if (this.plan.turns) {
        badge = drawTurnBadge();
        badge.position.set(pw / 2 - 28, ph / 2 - 28);
        node.addChild(badge);
      }
      // A mend piece sits flush against its neighbours, so its touch area is exactly its own.
      const slop = this.plan.mend ? 0 : 10;
      node.hitArea = new Rectangle(-pw / 2 - slop, -ph / 2 - slop, pw + 2 * slop, ph + 2 * slop);
      let mark: Graphics | undefined;
      if (this.plan.mend) {
        mark = new Graphics()
          .roundRect(-pw / 2 + 3, -ph / 2 + 3, pw - 6, ph - 6, 8)
          .stroke({ width: 8, color: swatch.yellow.line });
        mark.visible = false;
        mark.eventMode = 'none';
        node.addChild(mark);
      }
      const out = !this.plan.oneAtATime || !this.pieces.length ? 'waiting' : 'later';
      const view: PieceView = {
        piece,
        board: piece.board,
        node,
        body,
        badge,
        at: idx,
        mark,
        turn,
        targetRotation,
        placed: false,
        out,
        drag: null as unknown as DragHandle,
      };
      // One at a time, only the first piece is out; the others wait out of sight to come out one by one.
      node.visible = out !== 'later';
      view.drag = draggable(node, ctx.tw, {
        // Lifted pieces show their real size, so they are easy to line up with the frame.
        onPick: () => {
          sfx.tick();
          ctx.tw.kill(node.scale);
          void ctx.tw.to(node.scale, { x: this.scale * 1.04, y: this.scale * 1.04 }, { duration: 0.15 });
        },
        onDrop: (x, y) => this.drop(view, x, y),
      });
      ctx.own(() => view.drag.destroy());
      if (swapped) {
        // The two odd pieces sit in each other's places; every other piece is home. Touches are taps, not carries.
        if (idx === swapped[0]) view.at = swapped[1];
        else if (idx === swapped[1]) view.at = swapped[0];
        view.drag.enabled = false;
        view.placed = true;
        onTap(node, () => this.mendTap(view));
      }
      this.pieces.push(view);
      ctx.stage.addChild(node);
    }
    this.pieces.slice(0, this.plan.preplaced).forEach((p) => this.settle(p, false));
    ctx.stage.addChild(this.glow);
    this.glow.eventMode = 'none';
    // One at a time, a touch on the background or the frame hops the waiting piece home, as a touch on the piece does.
    if (this.plan.oneAtATime)
      for (const ground of [this.background, this.board.node]) onTap(ground, () => this.lapTouch());
  }

  start() {
    // Mend the picture has no line of its own yet (a new line needs a rendered clip), so the how-to card carries it.
    if (this.plan.mend) return;
    const line = this.plan.twin
      ? 'puzzle.ghost'
      : this.plan.oneAtATime
        ? 'puzzle.lap'
        : tapHops(this.plan)
          ? 'puzzle.tap'
          : this.plan.turns
            ? 'puzzle.turn'
            : this.plan.ghost
              ? 'puzzle.ghost'
              : 'puzzle.start';
    void this.ctx.instruct(line);
  }

  // Placing pieces -------------------------------------------------------------

  private turnPiece(view: PieceView) {
    view.turn = this.plan.quarter ? quarterTurn(view.turn) : flipTurn(view.turn);
    view.targetRotation += this.plan.quarter ? Math.PI / 2 : Math.PI;
    const target = view.targetRotation;
    sfx.tick();
    this.ctx.tw.kill(view.body);
    void this.ctx.tw.to(view.body, { rotation: target }, { duration: 0.22, ease: ease.outBack }).then(() => {
      if (!view.body.destroyed && view.targetRotation === target) {
        view.targetRotation = (view.turn * Math.PI) / 2;
        view.body.rotation = view.targetRotation;
      }
    });
    this.resetTrayScale(view);
  }

  private resetTrayScale(view: PieceView) {
    this.ctx.tw.kill(view.node.scale);
    void this.ctx.tw.to(view.node.scale, { x: this.trayScale, y: this.trayScale }, { duration: 0.15 });
  }

  private drop(view: PieceView, x: number, y: number): boolean {
    if (this.done) return false;
    // One at a time, every let-go hops the piece home, however far it went: nothing can be a miss.
    if (this.plan.oneAtATime) {
      this.settle(view, true);
      return true;
    }
    // Lap: a tap (let go where it was picked up) sends the piece home by itself; a carry is judged where it lands.
    if (tapHops(this.plan) && Math.hypot(x - view.drag.home.x, y - view.drag.home.y) < TAP_HOP) {
      this.settle(view, true);
      return true;
    }
    // Turn it round: tapping a piece in the tray turns it half a turn, free and never a miss.
    if (this.plan.turns && view.drag.tapped) {
      this.turnPiece(view);
      return false;
    }
    if (this.plan.twin) return this.dropTwin(view, x, y);
    const empty = this.pieces.filter((p) => !p.placed).map((p) => p.piece);
    const outcome = judgeDrop(
      this.plan,
      (x - this.board.x) / this.scale,
      (y - this.board.y) / this.scale,
      view.piece,
      view.turn,
      empty,
    );
    // Off the frame is just exploring: the piece floats back without a word.
    if (outcome === 'off') {
      this.resetTrayScale(view);
      return false;
    }
    if (outcome === 'place') {
      this.settle(view, true);
      return true;
    }
    // Right place, still upside down: hops back with "Turn it round!", never a miss.
    if (outcome === 'turn') {
      sfx.pop(4);
      void this.ctx.say('puzzle.turnItRound');
      this.resetTrayScale(view);
      return false;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2) {
      const piece = hintPiece(
        this.plan,
        this.pieces.filter((p) => p.placed).map((p) => p.piece),
      );
      this.hinted = this.pieces.find((p) => p.piece.col === piece?.col && p.piece.row === piece?.row);
      if (this.hinted) {
        this.hints++;
        void this.ctx.say(`puzzle.hint.${whereWords(this.plan, this.hinted.piece)}`);
      }
    } else void this.ctx.say('puzzle.wrong');
    this.drawGlow();
    this.resetTrayScale(view);
    return false;
  }

  /** Two pictures, one tray: a drop is judged against both frames; the other picture's place is a miss with its own words. */
  private dropTwin(view: PieceView, x: number, y: number): boolean {
    const outcome = judgeTwinDrop(
      this.plan,
      this.boards.map((b) => ({ x: (x - b.x) / this.scale, y: (y - b.y) / this.scale })),
      { ...view.piece, board: view.board },
      this.pieces.filter((p) => !p.placed).map((p) => ({ ...p.piece, board: p.board })),
    );
    if (outcome === 'off') {
      this.resetTrayScale(view);
      return false;
    }
    if (outcome === 'place') {
      this.settle(view, true);
      return true;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    if (this.wrong === 2) {
      // The hint is the piece she is holding: its own place on its own picture glows.
      this.hinted = view;
      this.hints++;
      void this.ctx.say('puzzle.hint');
    } else void this.ctx.say('puzzle.wrong');
    this.drawGlow();
    this.resetTrayScale(view);
    return false;
  }

  /** One at a time: a touch on the background or the frame hops the waiting piece home; while the next comes out, a pop. */
  private lapTouch() {
    if (this.done) return;
    const waiting = this.pieces.find((p) => !p.placed && p.out === 'waiting' && !p.drag.dragging);
    if (waiting) this.settle(waiting, true);
    else sfx.pop(5);
  }

  /** Where the one waiting piece sits: beside the frame (right of it sideways, under it upright). */
  private lapHome(v: View) {
    return oneAtATimeLayout(v, this.plan.cols).home;
  }

  /** One at a time, because she touched: the next piece slides in from the right edge to its place beside the frame. */
  private async comeOut() {
    const next = this.pieces.find((p) => p.out === 'later');
    if (!next || this.done) return;
    next.out = 'coming';
    const node = next.node;
    const home = this.lapHome(this.ctx.view);
    next.drag.home = home;
    node.position.set(this.ctx.view.w + (this.box.w * this.scale) / this.plan.cols, home.y);
    node.scale.set(this.trayScale);
    node.visible = true;
    // Not to be grabbed mid-slide: a touch meanwhile lands on the background and pops.
    const mode = node.eventMode;
    node.eventMode = 'none';
    await this.ctx.tw.to(node, { x: home.x }, { duration: 0.5, ease: ease.outQuad });
    if (node.destroyed || this.done || next.placed) return;
    node.eventMode = mode;
    node.position.set(next.drag.home.x, next.drag.home.y);
    next.out = 'waiting';
    sfx.tick();
  }

  // Mend the picture -------------------------------------------------------------

  private mendSlot(at: number) {
    const c = slotCenter(this.plan, { col: at % this.plan.cols, row: Math.floor(at / this.plan.cols) });
    const b = this.board;
    return { x: b.x + c.x * this.scale, y: b.y + c.y * this.scale };
  }

  private homeOf(view: PieceView) {
    return view.piece.row * this.plan.cols + view.piece.col;
  }

  /** The pieces that are not where they belong (two at the start, none once mended). */
  private oddPieces() {
    return this.pieces.filter((p) => p.at !== this.homeOf(p));
  }

  /** Tap one piece, then another, and they swap; a swap that does not mend both goes back with a soft boing. */
  private mendTap(view: PieceView) {
    if (this.done || this.swapping) return;
    if (!this.picked) {
      this.picked = view;
      sfx.tick();
      return;
    }
    if (this.picked === view) {
      this.picked = undefined;
      sfx.tick();
      return;
    }
    const a = this.picked;
    this.picked = undefined;
    void this.swapPieces(a, view);
  }

  private async swapPieces(a: PieceView, b: PieceView) {
    this.swapping = true;
    const outcome = judgeSwap({ at: a.at, home: this.homeOf(a) }, { at: b.at, home: this.homeOf(b) });
    const from = [this.mendSlot(a.at), this.mendSlot(b.at)];
    const glide = async (pa: { x: number; y: number }, pb: { x: number; y: number }) => {
      await Promise.all([
        this.ctx.tw.to(a.node, pa, { duration: 0.22, ease: ease.outQuad }),
        this.ctx.tw.to(b.node, pb, { duration: 0.22, ease: ease.outQuad }),
      ]);
    };
    this.ctx.stage.addChild(a.node, b.node);
    this.ctx.stage.addChild(this.glow);
    await glide(from[1], from[0]);
    if (a.node.destroyed || b.node.destroyed) return;
    if (outcome === 'mended') {
      [a.at, b.at] = [b.at, a.at];
      this.mendHint = false;
      sfx.clunk();
      for (const p of [a, b])
        this.ctx.particles.burst(p.node.x, p.node.y, {
          kind: 'star',
          colors: [swatch.yellow.fill],
          count: 8,
          speed: [80, 200],
        });
      this.swapping = false;
      if (this.oddPieces().length === 0) void this.complete();
      return;
    }
    // Not both right: they go straight back, which is a miss but never a loss.
    sfx.boing();
    await this.ctx.tw.wait(0.12);
    await glide(from[0], from[1]);
    if (a.node.destroyed || b.node.destroyed) return;
    this.misses++;
    this.wrong++;
    this.swapping = false;
    if (this.wrong === 2) {
      this.hints++;
      this.mendHint = true;
      void this.ctx.say('puzzle.hint');
    } else void this.ctx.say('puzzle.wrong');
  }

  /** Puts a piece in its place. */
  private settle(view: PieceView, animate: boolean) {
    view.placed = true;
    view.drag.enabled = false;
    if (view.badge) view.badge.visible = false;
    view.turn = 0;
    view.targetRotation = 0;
    this.ctx.tw.kill(view.body);
    view.body.rotation = 0;
    if (this.plan.oneAtATime) {
      // A placed piece lets touches through to the frame beneath, so a touch on it hops the next one in.
      view.node.eventMode = 'none';
      void this.comeOut();
    }
    const c = slotCenter(this.plan, view.piece);
    const home = this.boards[view.board];
    const x = home.x + c.x * this.scale;
    const y = home.y + c.y * this.scale;
    this.ctx.stage.addChildAt(view.node, this.ctx.stage.getChildIndex(home.node) + 1);
    if (!animate) {
      view.node.position.set(x, y);
      view.node.scale.set(this.scale);
      return;
    }
    this.ctx.tw.kill(view.node);
    this.ctx.tw.kill(view.node.scale);
    void this.ctx.tw.to(view.node, { x, y }, { duration: 0.18, ease: ease.outQuad });
    void this.ctx.tw.to(view.node.scale, { x: this.scale, y: this.scale }, { duration: 0.18 });
    sfx.clunk();
    sfx.bell(5 + (this.pieces.filter((p) => p.placed).length % 6), 0.25);
    this.ctx.particles.burst(x, y, {
      kind: 'star',
      colors: [swatch.yellow.fill],
      count: 8,
      speed: [80, 200],
    });
    this.wrong = 0;
    this.hinted = undefined;
    this.drawGlow();
    if (this.pieces.every((p) => p.placed)) void this.complete();
  }

  /** The finished picture comes alive: the friend hops, says hello, and the voice names the picture. */
  private async complete() {
    this.done = true;
    await this.ctx.tw.wait(0.5);
    for (const p of this.pieces) p.node.visible = false;
    for (const [i, b] of this.boards.entries()) {
      const { root, friend } = b.picture;
      if (this.plan.crop) {
        // The live picture is drawn whole; only the cropped part may show on the frame.
        const clip = new Graphics().rect(0, 0, this.box.w, this.box.h).fill(0xffffff);
        b.holder = new Container();
        b.holder.addChild(root, clip);
        b.holder.mask = clip;
        this.ctx.stage.addChild(b.holder);
      } else this.ctx.stage.addChild(root);
      this.fitPictures();
      friend.alive = true;
      this.ctx.track(friend);
      friend.cheer();
      void this.ctx.tw.wait(0.45 * i).then(() => {
        if (!root.destroyed) sfx.animal(b.scene.sound);
      });
      this.ctx.particles.burst(b.x + (this.box.w * this.scale) / 2, b.y + 60, {
        kind: 'confetti',
        colors: RAINBOW.map((c) => swatch[c].fill),
        count: 40,
        speed: [200, 450],
        gravity: 300,
      });
    }
    this.ctx.pet.cheer();
    if (this.boards.length > 1)
      await this.ctx.say('puzzle.doneTwin', { a: this.boards[0].scene.what, b: this.boards[1].scene.what });
    else await this.ctx.say('puzzle.done', { what: this.scene.what });
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Layout ---------------------------------------------------------------------

  resize(v: View) {
    if (this.plan.oneAtATime) {
      this.layoutOneAtATime(v);
      return;
    }
    if (this.plan.mend) {
      this.layoutMend(v);
      return;
    }
    const waiting = this.pieces.filter((p) => !p.placed);
    const L = (this.plan.twin ? twinLayout : puzzleLayout)(v, this.plan, this.pieces.length, waiting.length);
    this.scale = L.scale;
    this.boards.forEach((b, i) => this.placeBoard(b, (L.boards ?? [L.board])[i]));
    this.background
      .clear()
      .rect(0, 0, v.w, v.h)
      .fill(swatch.teal.light)
      .roundRect(L.panel.x, L.panel.y, L.panel.w, L.panel.h, 30)
      .fill(cream);
    this.boards.forEach((b) => this.drawFrame(b));
    this.layoutLid(v);
    // Waiting pieces shrink to fit the tray; lifted and placed ones are full size.
    this.trayScale = L.trayScale;
    waiting.forEach((p, i) => {
      const { x, y } = L.homes[i];
      p.drag.home = { x, y };
      if (!p.drag.dragging) {
        this.ctx.tw.kill(p.node);
        this.ctx.tw.kill(p.node.scale);
        p.node.position.set(x, y);
        p.node.scale.set(this.trayScale);
      }
    });
    for (const p of this.pieces.filter((p) => p.placed)) {
      const c = slotCenter(this.plan, p.piece);
      const b = this.boards[p.board];
      p.node.position.set(b.x + c.x * this.scale, b.y + c.y * this.scale);
      p.node.scale.set(this.scale);
    }
    this.fitPictures();
    this.drawGlow();
  }

  /** Mend the picture: the whole picture sits in the frame, big, with no tray. */
  private layoutMend(v: View) {
    const L = mendLayout(v);
    this.scale = this.trayScale = L.scale;
    this.placeBoard(this.board, L);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.drawFrame(this.board);
    for (const p of this.pieces) {
      this.ctx.tw.kill(p.node);
      const { x, y } = this.mendSlot(p.at);
      p.node.position.set(x, y);
      p.node.scale.set(this.scale);
    }
    this.fitPictures();
  }

  /** Puts a frame at a layout's spot, a picture unit being `this.scale` on screen. */
  private placeBoard(b: BoardView, at: { x: number; y: number }) {
    b.x = at.x;
    b.y = at.y;
    b.node.position.set(at.x, at.y);
    b.node.scale.set(this.scale);
  }

  /** Once finished, each live picture sits on its frame. */
  private fitPictures() {
    if (!this.done) return;
    for (const b of this.boards) {
      const at = b.node.position;
      if (b.holder) {
        // A cropped frame shows the middle of the picture, so the whole picture sits left of the frame by the crop.
        b.holder.position.copyFrom(at);
        b.holder.scale.set(this.scale);
        b.picture.root.position.set(-this.box.x, -this.box.y);
      } else {
        b.picture.root.position.copyFrom(at);
        b.picture.root.scale.set(this.scale);
      }
    }
  }

  private layoutLid(v: View) {
    if (!this.lid) return;
    const L = lidLayout(v, this.plan);
    const [border, picture] = this.lid.children as [Graphics, Sprite];
    picture.scale.set(L.w / this.box.w);
    this.lid.position.set(L.x, L.y);
    border
      .clear()
      .roundRect(-8, -8, L.w + 16, L.h + 16, 12)
      .fill(wood.fill)
      .stroke({ width: 4, color: wood.line });
  }

  private drawFrame(b: BoardView) {
    const f = b.frame.clear();
    const { w: W, h: H } = this.box;
    f.roundRect(-18, -18, W + 36, H + 36, 22)
      .fill(wood.fill)
      .stroke({ width: 6, color: wood.line });
    f.rect(0, 0, W, H).fill(cream);
    const pw = W / this.plan.cols;
    const ph = H / this.plan.rows;
    const s = b.slots.clear();
    for (let c = 1; c < this.plan.cols; c++) s.moveTo(c * pw, 0).lineTo(c * pw, H);
    for (let r = 1; r < this.plan.rows; r++) s.moveTo(0, r * ph).lineTo(W, r * ph);
    s.stroke({ width: 3, color: wood.fill, alpha: 0.6 });
  }

  /**
   * One at a time: the frame and one big piece at the frame's own size beside it, right of it sideways and under it
   * upright, with the pet's corner kept clear on the left.
   */
  private layoutOneAtATime(v: View) {
    const L = oneAtATimeLayout(v, this.plan.cols);
    this.scale = this.trayScale = L.scale;
    this.placeBoard(this.board, L.board);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light);
    this.drawFrame(this.board);
    const home = this.lapHome(v);
    for (const p of this.pieces) {
      if (p.placed) {
        const c = slotCenter(this.plan, p.piece);
        p.node.position.set(this.board.x + c.x * this.scale, this.board.y + c.y * this.scale);
        p.node.scale.set(this.scale);
        continue;
      }
      p.drag.home = p.out === 'later' ? { x: v.w + 400, y: home.y } : home;
      if (p.drag.dragging) continue;
      if (p.out !== 'coming') {
        this.ctx.tw.kill(p.node);
        p.node.position.set(p.drag.home.x, p.drag.home.y);
      }
      this.ctx.tw.kill(p.node.scale);
      p.node.scale.set(this.trayScale);
    }
    this.fitPictures();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const next = this.hinted;
    if (!next) return;
    const pw = (this.box.w / this.plan.cols) * this.scale;
    const ph = (this.box.h / this.plan.rows) * this.scale;
    const c = slotCenter(this.plan, next.piece);
    const home = this.boards[next.board];
    g.roundRect(home.x + c.x * this.scale - pw / 2, home.y + c.y * this.scale - ph / 2, pw, ph, 10).stroke({
      width: 7,
      color: swatch.yellow.line,
    });
    const tw = (this.box.w / this.plan.cols) * this.trayScale;
    const th = (this.box.h / this.plan.rows) * this.trayScale;
    g.roundRect(next.drag.home.x - tw / 2 - 8, next.drag.home.y - th / 2 - 8, tw + 16, th + 16, 12).stroke({
      width: 7,
      color: swatch.yellow.line,
    });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
    if (this.plan.mend) {
      const odd = this.mendHint && !this.done ? this.oddPieces() : [];
      for (const p of this.pieces) {
        if (!p.mark) continue;
        p.mark.visible = !this.done && (this.picked === p || odd.includes(p));
        p.mark.alpha = this.picked === p ? 1 : 0.6 + 0.4 * Math.sin(this.clock * 4);
      }
    }
    for (const p of this.pieces) {
      if (!p.badge) continue;
      const pulse = !this.done && this.wrong >= 2 && this.hinted === p && p.turn !== 0;
      p.badge.children[0].visible = pulse;
      p.badge.scale.set(pulse ? 1.15 + 0.2 * Math.sin(this.clock * 6) : 1);
    }
  }

  /** The ghost finger on the how-to card: tap a turned piece to flip it upright, then carry it to its place in the frame. */
  /** Guided first play points at the bot's next move: `autotouch` here only reads the board. */
  showMove(): TouchIntent | null {
    return this.autotouch();
  }

  autotouch(): TouchIntent | null {
    if (this.done) return null;
    if (this.plan.oneAtATime) {
      // One at a time the card shows a tap: the piece hops in by itself.
      const waiting = this.pieces.find((p) => !p.placed && p.out === 'waiting' && !p.drag.dragging);
      return waiting ? { tap: { on: waiting.node } } : null;
    }
    if (this.plan.mend) {
      // Tap one odd piece, then the other: the pair swaps back.
      const odd = this.oddPieces();
      if (this.swapping || odd.length < 2) return null;
      const first = this.picked ? odd.find((p) => p !== this.picked) : odd[0];
      return first ? { tap: { on: first.node } } : null;
    }
    const next = nextToPlace(this.pieces);
    if (!next || next.drag.dragging) return null;
    if (next.turn !== 0) return { tap: { on: next.node } };
    const c = slotCenter(this.plan, next.piece);
    return { drag: { on: next.node }, to: { on: this.boards[next.board].node, x: c.x, y: c.y } };
  }

  destroy() {
    // The live picture only joins the stage when finished; otherwise it is ours to clean up.
    for (const b of this.boards) {
      if (!b.picture.root.parent) b.picture.root.destroy({ children: true });
      b.texture.destroy(true);
    }
    for (const t of this.textures) t.destroy();
  }
}

export const puzzlePals: GameModule = {
  id: 'puzzle-pals',
  name: 'Puzzle Pals',
  titleLine: 'game.puzzle-pals',
  region: 'puzzle-peaks',
  challenge: 'space',
  skills: ['spatial-reasoning', 'part-whole', 'fine-motor'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  upright: true,
  levels: (band) => rangeFor(LEVELS, band),
  // Level 8, one big piece at a time, is lap's first; a toddler carried a pinned 8 lands on toddler's easiest.
  entryLevels: [8],
  describeLevel: (l) => puzzlePlan(l).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint:
    'Ask {name} what is in each piece: an ear, a sun, a flower? Say where it goes: top, bottom, corner, next to.',
  coplayHintLap: 'Say what is in each piece as {name} picks it up: "an ear, a sun!" Point to where it goes.',
  offScreen: {
    all: 'Cut an old card or a cereal box picture into two or three pieces and put it back together.',
    // School: a build or test with a result, predicting first.
    school:
      'Cut an old card into six pieces yourself, mix them up, then swap puzzles with someone and put theirs together.',
  },
  hubIcon: () => new WigglyIcon(puzzleIcon()),
  sticker: (seed) => pictureThumb(seed, 170),
  create: (ctx) => new PuzzlePals(ctx),
};
