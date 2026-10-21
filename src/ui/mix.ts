import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';
import { stickerize } from '../art/sticker';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import type { GameModule } from '../games/types';
import type { MixItem, MixState } from '../content/mix';
import { nextUp } from '../content/mix';
import { RoundButton } from './buttons';
import { arrow, label, picture } from './discovery';
import { againIcon, arrowIcon, houseIcon, playIcon } from './icons';

/** A hop over a little bump: Skip, and a skipped stop. Never a cross. */
export function hopIcon(color = ink, size = 1): Graphics {
  const g = new Graphics()
    .moveTo(-26, 12).bezierCurveTo(-18, -30, 18, -30, 26, 8).stroke({ width: 7, color, cap: 'round' })
    .poly([16, 4, 30, 16, 32, -2]).fill(color)
    .circle(0, 18, 7).fill({ color, alpha: 0.5 });
  g.scale.set(size);
  return g;
}

/** Three dots, one per stop: filled once a stop is played or hopped over, ringed for the one that is next. */
export function progressDots(items: readonly MixItem[], next: number | null): Graphics {
  const g = new Graphics();
  items.forEach((it, i) => {
    const x = (i - 1) * 22;
    if (it.state === 'played') g.circle(x, 0, 7).fill(swatch.green.fill);
    else if (it.state !== 'upcoming') g.circle(x, 0, 7).fill({ color: ink, alpha: 0.25 });
    else g.circle(x, 0, 7).fill(0xffffff).stroke({ width: 3, color: i === next ? swatch.orange.line : swatch.yellow.line });
  });
  return g;
}

/** The picnic blanket holding the three games' pictures, the size of a game's landmark, feet on (0, 0). */
export function mixSpotArt(mods: readonly GameModule[]): Container {
  const art = new Container();
  const blanket = new Graphics().ellipse(0, 4, 104, 22).fill({ color: swatch.green.line, alpha: 0.18 })
    .poly([-92, -6, 92, -6, 70, -60, -70, -60]).fill(swatch.red.light).stroke({ width: 5, color: swatch.red.line });
  for (let i = -3; i <= 3; i++) blanket.moveTo(i * 24 - 2, -6).lineTo(i * 18 - 2, -60).stroke({ width: 3, color: swatch.red.fill, alpha: 0.5 });
  blanket.moveTo(-81, -33).lineTo(81, -33).stroke({ width: 3, color: swatch.red.fill, alpha: 0.5 });
  art.addChild(blanket);
  mods.forEach((m, i) => art.addChild(picture(m, (i - 1) * 62, -82 - (i === 1 ? 24 : 0), 74)));
  const dots = new Graphics();
  for (let i = -1; i <= 1; i++) dots.circle(i * 18, -160, 6).fill(swatch.yellow.fill).stroke({ width: 2, color: swatch.yellow.line });
  art.addChild(dots);
  return art;
}

/** The result's yellow Next stop tile (288 × 112): the next game's picture, its title, three progress dots and a travel arrow. */
export function nextStopArt(mod: GameModule, title: string, state: MixState): Container {
  const art = new Container();
  const dots = progressDots(state.items, nextUp(state));
  dots.position.set(150, 22);
  art.addChild(picture(mod, 55, 56, 78), dots, label(title, 105, 42, 23, 169), arrow(260, 95));
  return art;
}

/** The All done tile: the blanket's three little pictures and a ribbon. */
export function allDoneArt(mods: readonly GameModule[]): Container {
  const art = new Container();
  const ribbon = new Graphics().poly([210, 30, 250, 30, 262, 82, 230, 66, 198, 82]).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line })
    .circle(230, 34, 20).fill(swatch.yellow.fill).stroke({ width: 3, color: swatch.yellow.line });
  art.addChild(ribbon);
  mods.forEach((m, i) => art.addChild(picture(m, 46 + i * 58, 56 + (i === 1 ? -8 : 6), 56)));
  return art;
}

export interface SheetActions {
  tile(p: number): void;
  play(): void;
  skip(): void;
  back(): void;
  againMix(): void;
  home(): void;
}

const TILE = 220;

/** One stop on the sheet (220 across) or a stop card's row (100): bright when next or still to come, a sticker copy once played, dimmed with a hop once passed. */
export class StopTile extends Container {
  private readonly face = new Container();
  private clock = 0;
  bobbing = false;
  constructor(readonly mod: GameModule, readonly item: MixItem, next: boolean, onPress: () => void, readonly size = TILE) {
    super();
    const k = size / TILE;
    this.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    const passed = item.state === 'skipped' || item.state === 'unavailable';
    const color = next ? swatch.yellow : swatch.blue;
    this.face.addChild(new Graphics().roundRect(-size / 2, -size / 2, size, size, 28 * k).fill(color.light).stroke({ width: (next ? 8 : 4) * Math.max(k, 0.6), color: color.line }), picture(mod, 0, 0, 150 * k));
    this.face.eventMode = 'none';
    this.addChild(this.face);
    if (passed) {
      this.face.alpha = 0.4;
      const hop = hopIcon(ink, 1.2 * k);
      hop.position.set(0, -70 * k);
      hop.eventMode = 'none';
      this.addChild(hop);
    }
    if (item.state === 'played' && item.seed !== undefined) {
      const copy = stickerize(mod.sticker(item.seed), 34 * Math.max(k, 0.7));
      copy.position.set(size / 2 - 30 * k, -size / 2 + 30 * k);
      copy.eventMode = 'none';
      this.addChild(copy);
    }
    this.bobbing = next && size === TILE;
    onTap(this, () => {
      this.face.scale.set(1.06);
      onPress();
    });
  }
  update(dt: number) {
    this.clock += dt;
    this.face.y = this.bobbing ? Math.sin(this.clock * 3) * 6 : 0;
    this.face.scale.set(Math.max(1, this.face.scale.x - dt * 0.6));
  }
}

/**
 * The preview and the ending, over the home spot: Back, three stop tiles, then Play and Skip while a stop is left, or
 * Again mix and Home at the end. Pictures carry the meaning; every target is at least 100 across.
 */
export class MixSheet extends Container {
  private readonly scrim = new Graphics();
  private readonly panel = new Graphics();
  private readonly tileLayer = new Container();
  private tiles: StopTile[] = [];
  readonly backButton: RoundButton;
  readonly playButton: RoundButton;
  readonly skipButton: RoundButton;
  readonly againButton: RoundButton;
  readonly homeButton: RoundButton;
  private state: MixState | null = null;

  constructor(private readonly mods: readonly GameModule[], private readonly actions: SheetActions) {
    super();
    this.scrim.eventMode = 'static'; // nothing on the home spot can be touched under the sheet
    this.backButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => actions.back());
    this.playButton = new RoundButton(playIcon(), swatch.green, 70, () => actions.play());
    this.skipButton = new RoundButton(hopIcon(ink), swatch.white, 56, () => actions.skip());
    this.againButton = new RoundButton(againIcon(0xffffff), swatch.green, 70, () => actions.againMix());
    this.homeButton = new RoundButton(houseIcon(0xffffff), swatch.blue, 70, () => actions.home());
    this.addChild(this.scrim, this.panel, this.tileLayer, this.backButton, this.playButton, this.skipButton, this.againButton, this.homeButton);
  }

  get ending(): boolean {
    return !!this.state && nextUp(this.state) === null;
  }

  show(state: MixState, view: View) {
    this.state = state;
    for (const t of this.tiles) t.destroy({ children: true });
    const next = nextUp(state);
    this.tiles = this.mods.map((mod, p) => new StopTile(mod, state.items[p], p === next, () => this.actions.tile(p)));
    this.tileLayer.addChild(...this.tiles);
    this.layout(view);
  }

  layout(view: View) {
    const portrait = view.h > view.w;
    const ox = (view.w - 1024) / 2;
    const tileY = portrait ? 520 : 300, skipY = portrait ? 690 : 470, buttonY = portrait ? 900 : 640;
    this.scrim.clear().rect(0, 0, view.w, view.h).fill({ color: wood.light, alpha: 0.85 });
    this.panel.clear().roundRect(ox + 82, tileY - 160, 860, buttonY - tileY + 260, 40).fill({ color: 0xffffff, alpha: 0.7 });
    this.backButton.position.set(65, 65);
    const xs = [232, 512, 792].map(x => ox + x);
    this.tiles.forEach((t, i) => t.position.set(xs[i], tileY));
    const next = this.state ? nextUp(this.state) : null;
    const ending = next === null;
    this.playButton.visible = this.skipButton.visible = !ending;
    this.againButton.visible = this.homeButton.visible = ending;
    this.playButton.position.set(ox + 512, buttonY);
    this.skipButton.position.set(next === null ? ox + 512 : xs[next], skipY);
    this.againButton.position.set(ox + 372, buttonY);
    this.homeButton.position.set(ox + 652, buttonY);
  }

  update(dt: number) {
    for (const t of this.tiles) t.update(dt);
  }

  /** The tile at a stop, for scripted checks and a poke when it is heard. */
  tileAt(p: number): Container | undefined {
    return this.tiles[p];
  }
}
