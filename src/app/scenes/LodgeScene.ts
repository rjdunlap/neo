import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import { ink, swatch } from '../../art/palette';
import { drawPiece, LODGE_H, LODGE_W, lodgeBackdrop, PIECE_AT } from '../../art/lodge';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { canBuild, LODGE_PIECES, PIECES, type LodgePiece } from '../../content/lodge';
import { earnsShells } from '../../content/shells';
import { BACK } from '../../creatures/friends-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { shellTag } from '../../ui/shells';
import { FONT } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';

const MUTED = 0x6b5d52;

/**
 * Lantern Lodge (the progression loop, docs/definitions/progression-loop.md, slice 7): a grown-up's own place by the lake,
 * reached from Today's six. The pieces built stand in the picture; each piece that can be built next shows faintly with
 * its price, and a tap on it offers it by name with Build (or how many shells are still to earn). Nothing here is ever
 * taken away, and nothing wears out.
 */
export class LodgeScene extends Scene {
  upright = true;
  uprightArea = true;
  private readonly back = new RoundButton(arrowIcon(-1), swatch.white, 50, () => this.app.go.daily());
  private readonly title = new Text({
    text: 'Lantern Lodge',
    style: { fontFamily: FONT, fontSize: 34, fill: ink, fontWeight: '700' },
  });
  private readonly count = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 22, fill: MUTED, fontWeight: '500' },
  });
  private purse: Container = new Container();
  /** The picture: backdrop, built pieces, ghosts and price tags, in its own 1200 × 800 units. */
  readonly world = new Container();
  private readonly backdrop = new Graphics();
  private readonly built = new Graphics();
  private readonly ghosts = new Container();
  private readonly tags = new Container();
  private readonly hits = new Container();
  /** The offer for the piece chosen: its name and price, and Build. */
  readonly offer = new Container();
  private readonly offerText = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 26, fill: ink, fontWeight: '600', align: 'center' },
  });
  private readonly buildButton = new Container();
  private readonly buildPlate = new Graphics();
  private readonly buildText = new Text({
    text: '',
    style: { fontFamily: FONT, fontSize: 26, fill: 0xffffff, fontWeight: '700' },
  });
  /** The piece offered, or null. */
  chosen: LodgePiece | null = null;

  constructor(app: App) {
    super(app);
  }

  init() {
    this.title.anchor.set(0.5);
    this.count.anchor.set(0.5);
    this.offerText.anchor.set(0.5);
    this.buildText.anchor.set(0.5);
    lodgeBackdrop(this.backdrop);
    this.tags.eventMode = 'none';
    this.world.addChild(this.backdrop, this.built, this.ghosts, this.tags, this.hits);
    this.content.addChild(this.world);
    this.buildButton.addChild(this.buildPlate, this.buildText);
    onTap(this.buildButton, () => this.buildChosen(), { cooldown: 400 });
    this.offer.addChild(this.offerText, this.buildButton);
    this.ui.addChild(this.back, this.title, this.count, this.offer);
    this.redraw();
  }

  /** Pieces that can be built now, in the lodge's order. */
  get next(): LodgePiece[] {
    return LODGE_PIECES.filter((p) => canBuild(store.data.lodge, p));
  }

  /** Redraws the picture, the ghosts, the tags and the counts from the save. */
  private redraw() {
    const have = store.data.lodge.built;
    this.built.clear();
    for (const p of LODGE_PIECES) if (have.includes(p)) drawPiece(this.built, p);
    this.ghosts.removeChildren().forEach((c) => c.destroy());
    this.tags.removeChildren().forEach((c) => c.destroy({ children: true }));
    this.hits.removeChildren().forEach((c) => c.destroy());
    for (const p of this.next) {
      const g = new Graphics();
      drawPiece(g, p);
      // Faint until offered; the piece offered shows more strongly.
      g.alpha = p === this.chosen ? 0.8 : 0.35;
      this.ghosts.addChild(g);
      const at = PIECE_AT[p];
      const tag = shellTag(String(PIECES[p].price), 26, true);
      tag.position.set(at.x, at.y);
      this.tags.addChild(tag);
      const hit = new Container();
      hit.hitArea = new Rectangle(at.x - at.w / 2, at.y - at.h / 2, at.w, at.h);
      onTap(hit, () => this.choose(p), { cooldown: 250 });
      this.hits.addChild(hit);
    }
    this.count.text = `${have.length} of ${LODGE_PIECES.length} built`;
    this.refreshPurse();
    this.drawOffer();
  }

  private refreshPurse() {
    this.purse.destroy({ children: true });
    this.purse = shellTag(String(store.data.shells.balance), 24, true);
    this.ui.addChild(this.purse);
    this.purse.position.set(this.view.w - BACK.x - this.purse.width / 2 + 20, BACK.y);
  }

  /** Offers a piece; a second tap on it puts the offer away. */
  choose(p: LodgePiece) {
    this.chosen = this.chosen === p ? null : p;
    sfx.pop();
    this.redraw();
  }

  /** Builds the piece offered, paying its price. */
  buildChosen() {
    const p = this.chosen;
    if (!p) return;
    if (store.buildLodge(p) !== true) {
      sfx.pop(2);
      return;
    }
    this.chosen = null;
    sfx.sparkle();
    this.redraw();
    const at = PIECE_AT[p];
    const g = this.particles.toLocal(this.world.toGlobal({ x: at.x, y: at.y }));
    this.particles.burst(g.x, g.y, {
      kind: 'star',
      colors: [swatch.yellow.fill, 0xffffff],
      count: 16,
      speed: [140, 300],
      gravity: 0,
      life: [0.4, 0.8],
    });
  }

  private drawOffer() {
    const p = this.chosen;
    this.offer.visible = !!p;
    if (!p) return;
    const price = PIECES[p].price;
    const short = price - store.data.shells.balance;
    this.offerText.text = `${PIECES[p].name} · ${price} shells`;
    this.buildText.text = short > 0 ? `${short} more shells to go` : 'Build';
    const w = Math.max(160, this.buildText.width + 56);
    this.buildPlate
      .clear()
      .roundRect(-w / 2, -30, w, 60, 30)
      .fill(short > 0 ? 0xb9ae9c : swatch.green.fill)
      .stroke({ width: 4, color: short > 0 ? 0x9a8f7e : swatch.green.line });
    this.buildButton.eventMode = short > 0 ? 'none' : 'static';
    this.buildButton.y = 56;
  }

  resize(v: View) {
    this.back.position.set(BACK.x, BACK.y);
    this.title.position.set(v.w / 2, BACK.y - 12);
    this.count.position.set(v.w / 2, BACK.y + 26);
    this.purse.position.set(v.w - BACK.x - this.purse.width / 2 + 20, BACK.y);
    // The picture fills the width between the top bar and the offer, as large as fits.
    const top = BACK.y + BACK.r + 20;
    const foot = 150;
    const s = Math.min((v.w - 32) / LODGE_W, (v.h - top - foot) / LODGE_H);
    this.world.scale.set(s);
    this.world.position.set((v.w - LODGE_W * s) / 2, top + (v.h - top - foot - LODGE_H * s) / 2);
    this.offer.position.set(v.w / 2, v.h - foot + 34);
  }

  async enter() {
    voice.stop();
    if (!earnsShells(store.data.profile.band)) this.app.go.daily();
  }
}
