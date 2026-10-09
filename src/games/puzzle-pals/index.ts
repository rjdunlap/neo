import { Container, Graphics, Rectangle, RenderTexture, Sprite, Texture } from 'pixi.js';
import type { Critter } from '../../art/critter';
import { cream, RAINBOW, swatch, wood } from '../../art/palette';
import { STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { draggable, type DragHandle } from '../../engine/drag';
import { ease } from '../../engine/tween';
import { spread, type View } from '../../engine/view';
import { WigglyIcon } from '../shared';
import type { Game, GameContext, GameModule, TouchIntent } from '../types';
import { pictureScene, pictureThumb, puzzleIcon, SCENES, type Scene } from './art';
import { dropSlot, nextPuzzleMove, PICTURE_H, PICTURE_W, piecesFor, puzzlePlan, slotCenter, trayRows, type Piece, type PuzzlePlan } from './logic';

interface PieceView {
  piece: Piece;
  node: Container;
  drag: DragHandle;
  placed: boolean;
}

class PuzzlePals implements Game {
  readonly plan: PuzzlePlan;
  readonly scene: Scene;
  readonly pieces: PieceView[] = [];
  wrong = 0;
  misses = 0;
  hints = 0;
  done = false;

  /** The picture drawn once; pieces show parts of it. */
  private readonly texture: RenderTexture;
  private readonly picture: { root: Container; friend: Critter };
  private readonly board = new Container();
  private readonly frame = new Graphics();
  private readonly slots = new Graphics();
  private readonly glow = new Graphics();
  private readonly background = new Graphics();
  private readonly textures: Texture[] = [];
  private scale = 1;
  private trayScale = 0.5;
  private clock = 0;

  constructor(private readonly ctx: GameContext) {
    this.plan = puzzlePlan(ctx.level);
    this.scene = ctx.rng.pick(SCENES);
    this.picture = pictureScene(this.scene, ctx.rng.int(1, 1_000_000));
    this.texture = RenderTexture.create({ width: PICTURE_W, height: PICTURE_H, resolution: 2 });
    ctx.renderer.render({ container: this.picture.root, target: this.texture });

    this.board.addChild(this.frame);
    if (this.plan.ghost) {
      const ghost = new Sprite(this.texture);
      ghost.alpha = 0.28;
      this.board.addChild(ghost);
    }
    this.board.addChild(this.slots);
    ctx.stage.addChild(this.background, this.board);

    const pw = PICTURE_W / this.plan.cols;
    const ph = PICTURE_H / this.plan.rows;
    const all = piecesFor(this.plan);
    const order = [...all.slice(0, this.plan.preplaced), ...ctx.rng.shuffle(all.slice(this.plan.preplaced))];
    for (const piece of order) {
      const texture = new Texture({ source: this.texture.source, frame: new Rectangle(piece.col * pw, piece.row * ph, pw, ph) });
      this.textures.push(texture);
      const sprite = new Sprite(texture);
      sprite.anchor.set(0.5);
      const node = new Container();
      node.addChild(
        new Graphics().roundRect(-pw / 2 + 4, -ph / 2 + 8, pw, ph, 8).fill({ color: wood.line, alpha: 0.25 }),
        sprite,
        new Graphics().roundRect(-pw / 2, -ph / 2, pw, ph, 6).stroke({ width: 4, color: swatch.white.fill }),
      );
      node.hitArea = new Rectangle(-pw / 2 - 10, -ph / 2 - 10, pw + 20, ph + 20);
      const view: PieceView = { piece, node, placed: false, drag: null as unknown as DragHandle };
      view.drag = draggable(node, ctx.tw, {
        // Lifted pieces show their real size, so they are easy to line up with the frame.
        onPick: () => {
          sfx.tick();
          ctx.tw.kill(node.scale);
          void ctx.tw.to(node.scale, { x: this.scale * 1.04, y: this.scale * 1.04 }, { duration: 0.15 });
        },
        onDrop: (x, y) => this.drop(view, x, y),
      });
      this.pieces.push(view);
      ctx.stage.addChild(node);
    }
    this.pieces.slice(0, this.plan.preplaced).forEach((p) => this.settle(p, false));
    ctx.stage.addChild(this.glow);
  }

  start() {
    void this.ctx.instruct(this.plan.ghost ? 'puzzle.ghost' : 'puzzle.start');
  }

  // Placing pieces -------------------------------------------------------------

  private drop(view: PieceView, x: number, y: number): boolean {
    if (this.done) return false;
    const empty = this.pieces.filter((p) => !p.placed).map((p) => p.piece);
    const slot = dropSlot(this.plan, (x - this.board.x) / this.scale, (y - this.board.y) / this.scale, empty);
    // Off the frame is just exploring: the piece floats back without a word.
    if (!slot) return false;
    if (slot.col === view.piece.col && slot.row === view.piece.row) {
      this.settle(view, true);
      return true;
    }
    this.misses++;
    this.wrong++;
    sfx.boing();
    void this.ctx.say(this.wrong === 2 ? 'puzzle.hint' : 'puzzle.wrong');
    if (this.wrong === 2) this.hints++;
    this.drawGlow();
    return false;
  }

  /** Puts a piece in its place. */
  private settle(view: PieceView, animate: boolean) {
    view.placed = true;
    view.drag.enabled = false;
    const c = slotCenter(this.plan, view.piece);
    const x = this.board.x + c.x * this.scale;
    const y = this.board.y + c.y * this.scale;
    this.ctx.stage.addChildAt(view.node, this.ctx.stage.getChildIndex(this.board) + 1);
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
    this.ctx.particles.burst(x, y, { kind: 'star', colors: [swatch.yellow.fill], count: 8, speed: [80, 200] });
    this.wrong = 0;
    this.drawGlow();
    if (this.pieces.every((p) => p.placed)) void this.complete();
  }

  /** The finished picture comes alive: the friend hops, says hello, and the voice names the picture. */
  private async complete() {
    this.done = true;
    await this.ctx.tw.wait(0.5);
    const { root, friend } = this.picture;
    root.position.copyFrom(this.board.position);
    root.scale.set(this.scale);
    this.ctx.stage.addChild(root);
    for (const p of this.pieces) p.node.visible = false;
    friend.alive = true;
    this.ctx.track(friend);
    friend.cheer();
    sfx.animal(this.scene.sound);
    this.ctx.particles.burst(this.board.x + (PICTURE_W * this.scale) / 2, this.board.y + 60, { kind: 'confetti', colors: RAINBOW.map((c) => swatch[c].fill), count: 40, speed: [200, 450], gravity: 300 });
    this.ctx.pet.cheer();
    await this.ctx.say('puzzle.done', { what: this.scene.what });
    await this.ctx.tw.wait(0.4);
    this.ctx.finish({ misses: this.misses, hints: this.hints });
  }

  // Layout ---------------------------------------------------------------------

  resize(v: View) {
    const n = this.pieces.length;
    const rows = trayRows(n);
    const trayH = rows === 1 ? 210 : 240;
    const top = 112;
    const boardW = Math.min(640, v.w - 300, ((v.h - top - trayH - 24) * PICTURE_W) / PICTURE_H);
    this.scale = boardW / PICTURE_W;
    this.board.position.set(v.w / 2 + 50 - boardW / 2, top);
    this.board.scale.set(this.scale);
    this.background.clear().rect(0, 0, v.w, v.h).fill(swatch.teal.light).roundRect(160, v.h - trayH - 6, v.w - 185, trayH - 8, 30).fill(cream);
    const f = this.frame.clear();
    f.roundRect(-18, -18, PICTURE_W + 36, PICTURE_H + 36, 22).fill(wood.fill).stroke({ width: 6, color: wood.line });
    f.rect(0, 0, PICTURE_W, PICTURE_H).fill(cream);
    const pw = PICTURE_W / this.plan.cols;
    const ph = PICTURE_H / this.plan.rows;
    const s = this.slots.clear();
    for (let c = 1; c < this.plan.cols; c++) s.moveTo(c * pw, 0).lineTo(c * pw, PICTURE_H);
    for (let r = 1; r < this.plan.rows; r++) s.moveTo(0, r * ph).lineTo(PICTURE_W, r * ph);
    s.stroke({ width: 3, color: wood.fill, alpha: 0.6 });

    // Waiting pieces shrink to fit the tray; lifted and placed ones are full size.
    const maxH = rows === 1 ? 170 : 100;
    const maxW = rows === 1 ? 240 : 130;
    this.trayScale = Math.min(this.scale, maxH / ph, maxW / pw);
    const waiting = this.pieces.filter((p) => !p.placed);
    const perRow = Math.ceil(waiting.length / rows);
    waiting.forEach((p, i) => {
      const row = Math.floor(i / perRow);
      const inRow = Math.min(perRow, waiting.length - row * perRow);
      const x = spread(inRow, 180, v.w - 40, rows === 1 ? 270 : 145)[i % perRow];
      const y = rows === 1 ? v.h - trayH / 2 - 10 : v.h - trayH + 60 + row * 112;
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
      p.node.position.set(this.board.x + c.x * this.scale, this.board.y + c.y * this.scale);
      p.node.scale.set(this.scale);
    }
    if (this.done) {
      this.picture.root.position.copyFrom(this.board.position);
      this.picture.root.scale.set(this.scale);
    }
    this.drawGlow();
  }

  private drawGlow() {
    const g = this.glow.clear();
    if (this.wrong < 2 || this.done) return;
    const next = this.pieces.find((p) => !p.placed && !p.drag.dragging);
    if (!next) return;
    const pw = (PICTURE_W / this.plan.cols) * this.scale;
    const ph = (PICTURE_H / this.plan.rows) * this.scale;
    const c = slotCenter(this.plan, next.piece);
    g.roundRect(this.board.x + c.x * this.scale - pw / 2, this.board.y + c.y * this.scale - ph / 2, pw, ph, 10).stroke({ width: 7, color: swatch.yellow.line });
    const tw = (PICTURE_W / this.plan.cols) * this.trayScale;
    const th = (PICTURE_H / this.plan.rows) * this.trayScale;
    g.roundRect(next.drag.home.x - tw / 2 - 8, next.drag.home.y - th / 2 - 8, tw + 16, th + 16, 12).stroke({ width: 7, color: swatch.yellow.line });
  }

  update(dt: number) {
    this.clock += dt;
    this.glow.alpha = 0.6 + 0.4 * Math.sin(this.clock * 4);
  }

  /** Carry the next waiting picture piece to the middle of its own grid cell. */
  autotouch(): TouchIntent | null {
    if (this.done) return null;
    const move = nextPuzzleMove(this.plan, this.pieces.filter((p) => !p.drag.dragging));
    return move ? { drag: { on: move.piece.node }, to: { on: this.board, x: move.to.x, y: move.to.y } } : null;
  }

  destroy() {
    // The live picture only joins the stage when finished; otherwise it is ours to clean up.
    if (!this.picture.root.parent) this.picture.root.destroy({ children: true });
    for (const p of this.pieces) p.drag.destroy();
    for (const t of this.textures) t.destroy();
    this.texture.destroy(true);
  }
}

export const puzzlePals: GameModule = {
  id: 'puzzle-pals',
  name: 'Puzzle Pals',
  titleLine: 'game.puzzle-pals',
  region: 'puzzle-peaks',
  skills: ['spatial-reasoning', 'part-whole', 'fine-motor'],
  bands: ['lap', 'toddler', 'preschool', 'prek', 'school'],
  levels: (b) => (b === 'school' ? { min: 6, max: 7 } : b === 'prek' ? { min: 5, max: 7 } : b === 'preschool' ? { min: 4, max: 6 } : b === 'toddler' ? { min: 2, max: 4 } : { min: 1, max: 2 }),
  describeLevel: (l) => puzzlePlan(l).name,
  music: STYLES.paint,
  touchDemo: true,
  coplayHint: 'Ask {name} what is in each piece: an ear, a sun, a flower? Then find where it goes.',
  offScreen: 'Cut an old card or a cereal box picture into two or three pieces and put it back together.',
  hubIcon: () => new WigglyIcon(puzzleIcon()),
  sticker: (seed) => pictureThumb(seed, 170),
  create: (ctx) => new PuzzlePals(ctx),
};
