import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../../art/palette';
import { makePet } from '../../art/pet';
import { frameArt, ITEM_SIZE, roomItem, windowArt } from '../../art/room';
import { flower } from '../../art/shapes';
import { stickerize } from '../../art/sticker';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { clampSpot, starterItem } from '../../content/room';
import { ROOM_ITEMS, type RoomItemId } from '../../content/world';
import { draggable, type DragHandle } from '../../engine/drag';
import { onTap } from '../../engine/input';
import { ease } from '../../engine/tween';
import type { View } from '../../engine/view';
import { gameById } from '../../games/registry';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { againIcon, flipIcon, islandIcon } from '../../ui/icons';
import { StickerPicker } from '../../ui/sticker-picker';
import { label } from '../../ui/text';
import { Scene } from '../Scene';

const FRAME = 190;
/** The wall ends and the floor starts at this fraction of the room's height. */
const FLOOR_LINE = 0.58;

interface Piece {
  id: RoomItemId;
  node: Container;
  art: Container;
  handle: DragHandle;
  /** Where the finger went down, to tell a tap from a move. */
  down: { x: number; y: number } | null;
}

/**
 * The pet's treehouse: one room with six free furnishings, a frame for one sticker, and a pet that uses what it
 * finds. Everything can be moved and turned and put back with the round arrow. Nothing is earned, nothing wears
 * out, and nothing here waits for her: she can leave at any moment and it is exactly as she left it.
 */
export class RoomScene extends Scene {
  private readonly wall = new Container();
  private readonly paint = new Graphics();
  private readonly window = windowArt(86);
  private readonly frame = new Container();
  private readonly stage = new Container();
  private readonly dim = new Graphics();
  private readonly pet = makePet();
  private readonly home = new RoundButton(islandIcon(), swatch.white, 50, () => this.app.go.hub());
  private readonly flip = new RoundButton(flipIcon(), swatch.white, 50, () => this.flipSelected());
  private readonly tidyButton = new RoundButton(againIcon(), swatch.white, 50, () => this.tidy());
  private readonly ring = new Graphics();
  readonly pieces = new Map<RoomItemId, Piece>();
  private picker: StickerPicker | null = null;
  private selected: RoomItemId | null = null;
  private lit = true;
  private acting = false;
  private bloomed = false;
  private clock = 0;

  init() {
    this.stage.sortableChildren = true;
    this.dim.eventMode = 'none';
    this.ring.eventMode = 'none';
    this.window.eventMode = 'none';
    this.wall.addChild(this.paint, this.window);
    this.content.addChild(this.wall, this.frame, this.stage);
    this.stage.addChild(this.ring);
    for (const id of ROOM_ITEMS) this.addPiece(id);
    this.pet.scale.set(0.62);
    onTap(this.pet, () => { this.pet.poke(); sfx.giggle(); }, { radius: 90 });
    this.pet.hitArea = new Rectangle(-150, -300, 300, 320);
    this.stage.addChild(this.track(this.pet));
    this.ui.addChild(this.dim, this.home, this.flip, this.tidyButton);
    this.flip.alpha = 0.35;
    onTap(this.frame, () => this.openPicker(), { cooldown: 400 });
  }

  private addPiece(id: RoomItemId) {
    const node = new Container();
    const art = roomItem(id);
    node.addChild(art);
    if (id === 'lamp') {
      const glow = new Graphics().circle(0, -150, 130).fill({ color: swatch.yellow.fill, alpha: 0.22 });
      glow.eventMode = 'none';
      glow.name = 'glow';
      node.addChildAt(glow, 0);
    }
    const { w, h } = ITEM_SIZE[id];
    // Wide enough and tall enough for a finger even on the thin lamp and the low rug.
    node.hitArea = new Rectangle(-Math.max(w, 110) / 2, -Math.max(h, 110), Math.max(w, 110), Math.max(h, 110));
    this.stage.addChild(node);
    const piece = { id, node, art, down: null } as Piece;
    piece.handle = draggable(node, this.tw, {
      lift: 0,
      keepGrab: true,
      onPick: () => {
        piece.down = { x: node.x, y: node.y };
        this.select(id);
        sfx.pop(3);
      },
      onDrop: () => this.drop(piece),
    });
    this.pieces.set(id, piece);
  }

  resize(v: View) {
    this.drawWall(v);
    this.home.position.set(64, 64);
    this.flip.position.set(v.w - 190, v.h - 70);
    this.tidyButton.position.set(v.w - 75, v.h - 70);
    this.dim.clear().rect(0, 0, v.w, v.h).fill({ color: 0x1d2350, alpha: 1 });
    this.dim.alpha = this.lit ? 0 : 0.38;
    for (const piece of this.pieces.values()) this.place(piece, false);
    if (!this.acting) this.pet.position.set(v.w * 0.36, v.h * 0.9);
    this.pet.zIndex = this.pet.y;
    this.drawFrame();
    this.picker?.layout(v);
    this.drawRing();
  }

  enter() {
    music.play(STYLES.paint);
    void voice.say('room.hello');
  }

  update(dt: number) {
    super.update(dt);
    this.clock += dt;
    this.pet.zIndex = this.pet.y;
    for (const p of this.pieces.values()) if (p.id !== 'rug') p.node.zIndex = p.node.y;
    this.drawRing();
  }

  destroy() {
    for (const p of this.pieces.values()) p.handle.destroy();
    super.destroy();
  }

  private drawWall(v: View) {
    const g = this.paint.clear();
    g.rect(0, 0, v.w, v.h * FLOOR_LINE).fill(swatch.brown.light);
    for (let x = 0; x < v.w; x += 96) g.rect(x, 0, 4, v.h * FLOOR_LINE).fill({ color: swatch.brown.line, alpha: 0.18 });
    g.rect(0, v.h * FLOOR_LINE, v.w, v.h * (1 - FLOOR_LINE)).fill(wood.fill);
    for (let y = v.h * FLOOR_LINE + 46; y < v.h; y += 62) g.rect(0, y, v.w, 4).fill({ color: wood.line, alpha: 0.3 });
    g.rect(0, v.h * FLOOR_LINE - 14, v.w, 18).fill(wood.line);
    this.window.position.set(v.w * 0.2, v.h * 0.26);
    this.frame.position.set(v.w * 0.6, v.h * 0.26);
  }

  /** The frame and, when one is hung, its sticker. A sticker the save no longer has just shows an empty frame. */
  private drawFrame() {
    this.frame.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.frame.addChild(frameArt(FRAME));
    const hung = store.room.frame;
    const record = hung && store.data.stickers.find((s) => s.game === hung.game && s.seed === hung.seed);
    const mod = record && gameById(record.game);
    if (record && mod) {
      const s = stickerize(mod.sticker(record.seed), 70);
      this.frame.addChild(s);
    } else {
      // An empty frame invites a touch: a soft plus.
      this.frame.addChild(new Graphics().moveTo(-26, 0).lineTo(26, 0).moveTo(0, -26).lineTo(0, 26).stroke({ width: 10, color: wood.line, alpha: 0.35, cap: 'round' }));
    }
    this.frame.hitArea = new Rectangle(-FRAME / 2 - 10, -FRAME / 2 - 10, FRAME + 20, FRAME + 20);
  }

  /** Put a piece where the save says. */
  private place(piece: Piece, animate: boolean) {
    const it = store.room.items.find((i) => i.id === piece.id) ?? starterItem(piece.id);
    const x = it.x * this.view.w;
    const y = it.y * this.view.h;
    piece.art.scale.x = it.flip ? -1 : 1;
    this.tw.kill(piece.node);
    if (animate) void this.tw.to(piece.node, { x, y }, { duration: 0.35, ease: ease.outBack });
    else piece.node.position.set(x, y);
    piece.node.zIndex = piece.id === 'rug' ? -10000 + y : y;
    piece.handle.home = { x, y };
  }

  private select(id: RoomItemId | null) {
    this.selected = id;
    this.flip.alpha = id ? 1 : 0.35;
  }

  private drawRing() {
    const g = this.ring.clear();
    const piece = this.selected && this.pieces.get(this.selected);
    if (!piece) return;
    const { w } = ITEM_SIZE[piece.id];
    g.ellipse(piece.node.x, piece.node.y + 4, w * 0.6, 20).stroke({ width: 7 + Math.sin(this.clock * 5), color: swatch.yellow.fill });
    this.ring.zIndex = piece.node.y - 1;
  }

  private drop(piece: Piece): boolean {
    const down = piece.down;
    piece.down = null;
    const v = this.view;
    const moved = down ? Math.hypot(piece.node.x - down.x, piece.node.y - down.y) : 99;
    piece.node.scale.set(1);
    if (moved < 14) {
      // A tap, not a move: the pet goes to see.
      this.place(piece, false);
      void this.use(piece.id);
      return true;
    }
    const spot = clampSpot(piece.node.x / v.w, piece.node.y / v.h);
    store.moveRoomItem(piece.id, spot.x, spot.y);
    this.place(piece, true);
    sfx.pop(5);
    return true;
  }

  private flipSelected() {
    if (!this.selected) return;
    store.flipRoomItem(this.selected);
    const piece = this.pieces.get(this.selected)!;
    this.place(piece, false);
    sfx.whoosh();
  }

  private tidy() {
    store.tidyRoom();
    for (const piece of this.pieces.values()) this.place(piece, true);
    this.select(null);
    sfx.sparkle();
    void voice.say('room.tidy');
  }

  // --- the pet at play ---

  private async walkTo(x: number, y: number) {
    const dist = Math.hypot(this.pet.x - x, this.pet.y - y);
    if (dist < 40) return;
    this.pet.hop(0.8);
    sfx.animal('hop');
    await this.tw.to(this.pet, { x, y }, { duration: Math.min(0.9, 0.25 + dist / 900), ease: ease.inOutSine });
  }

  /** A friend does something with each furnishing. One thing at a time, nothing that can go wrong. */
  private async use(id: RoomItemId) {
    if (this.acting) return;
    this.acting = true;
    const piece = this.pieces.get(id)!;
    const { x, y } = piece.node;
    const side = x < this.view.w / 2 ? 1 : -1;
    const at = (dx: number) => clampSpot((x + dx) / this.view.w, Math.max(y, this.view.h * 0.84) / this.view.h);
    const stand = (dx: number) => {
      const s = at(dx);
      return { x: s.x * this.view.w, y: s.y * this.view.h };
    };
    switch (id) {
      case 'bed': {
        const p = stand(0);
        await this.walkTo(p.x, p.y);
        this.pet.setMood('sleepy', 3.2);
        sfx.yawn();
        void voice.say('room.bed');
        for (let i = 0; i < 3; i++) {
          this.floatText('z', this.pet.x + 30 + i * 24, this.pet.y - 230 - i * 36);
          await this.tw.wait(0.7);
        }
        break;
      }
      case 'lamp': {
        this.lit = !this.lit;
        sfx.tick();
        const glow = piece.node.getChildByName('glow');
        if (glow) glow.visible = this.lit;
        void this.tw.to(this.dim, { alpha: this.lit ? 0 : 0.38 }, { duration: 0.35 });
        void voice.say(this.lit ? 'room.lamp-on' : 'room.lamp-off');
        await this.tw.wait(0.5);
        break;
      }
      case 'rug': {
        await this.walkTo(x, y + 10);
        void voice.say('room.rug');
        for (let i = 0; i < 3; i++) {
          this.pet.hop(1.3);
          sfx.pop(4 + i * 2);
          await this.tw.wait(0.5);
        }
        this.pet.cheer();
        break;
      }
      case 'shelf': {
        const p = stand(side * 120);
        await this.walkTo(p.x, p.y);
        this.pet.setMood('calm', 2.6);
        const book = new Graphics().roundRect(-34, -20, 68, 44, 6).fill(swatch.red.fill).stroke({ width: 4, color: swatch.red.line }).rect(-3, -20, 6, 44).fill(swatch.red.line);
        book.position.set(this.pet.x, this.pet.y - 110);
        book.zIndex = this.pet.y + 1;
        this.stage.addChild(book);
        void voice.say('room.shelf');
        await this.tw.wait(2.4);
        book.destroy();
        break;
      }
      case 'plant': {
        const p = stand(side * 110);
        await this.walkTo(p.x, p.y);
        sfx.splash();
        const drops = this.particles;
        drops.burst(x, y - 220, { kind: 'dot', colors: [swatch.blue.fill, swatch.blue.light], count: 14, speed: [30, 120], gravity: 380, life: [0.5, 0.9], angle: Math.PI / 2, spread: 0.6 });
        void voice.say('room.plant');
        if (!this.bloomed) {
          this.bloomed = true;
          const bloom = flower(new Graphics(), 34, swatch.pink.fill, swatch.pink.line);
          bloom.position.set(0, -176);
          bloom.scale.set(0);
          piece.node.addChild(bloom);
          void this.tw.to(bloom.scale, { x: 1, y: 1 }, { duration: 0.5, ease: ease.outBack });
        }
        this.pet.cheer();
        await this.tw.wait(1.2);
        break;
      }
      case 'musicbox': {
        const p = stand(side * 120);
        await this.walkTo(p.x, p.y);
        this.pet.setMood('sing', 3);
        const tune = [4, 6, 8, 6, 9, 8];
        for (const step of tune) {
          sfx.bell(step, 0.35);
          this.particles.burst(x, y - 100, { kind: 'note', colors: [swatch.yellow.fill, swatch.pink.fill, swatch.blue.fill], count: 2, speed: [40, 120], gravity: -60, life: [0.8, 1.2] });
          await this.tw.wait(0.4);
        }
        break;
      }
    }
    this.acting = false;
  }

  private floatText(text: string, x: number, y: number) {
    const t = label(text, 54, ink);
    t.position.set(x, y);
    t.zIndex = 99999;
    this.stage.addChild(t);
    void this.tw.to(t, { y: y - 70, alpha: 0 }, { duration: 1.3 }).then(() => t.destroy());
  }

  // --- the frame ---

  private openPicker() {
    if (this.picker) return;
    const all = store.data.stickers.filter((s) => gameById(s.game)).reverse();
    if (!all.length) {
      void voice.say('room.no-stickers');
      this.pet.hop();
      return;
    }
    const picker = new StickerPicker(
      all,
      store.room.frame,
      (record) => {
        store.hangSticker(record);
        this.drawFrame();
        sfx.sparkle();
        void voice.say(record ? 'room.hung' : 'room.cleared');
        this.closePicker();
      },
      () => this.closePicker(),
    );
    picker.layout(this.view);
    this.picker = picker;
    this.ui.addChild(picker);
    void voice.say('room.frame');
  }

  private closePicker() {
    this.picker?.destroy({ children: true });
    this.picker = null;
  }
}

