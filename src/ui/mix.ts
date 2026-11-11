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
    .moveTo(-26, 12)
    .bezierCurveTo(-18, -30, 18, -30, 26, 8)
    .stroke({ width: 7, color, cap: 'round' })
    .poly([16, 4, 30, 16, 32, -2])
    .fill(color)
    .circle(0, 18, 7)
    .fill({ color, alpha: 0.5 });
  g.scale.set(size);
  return g;
}

/** One dot per stop, centred on the count: filled once a stop is played or hopped over, ringed for the one that is next. */
export function progressDots(items: readonly MixItem[], next: number | null): Graphics {
  const g = new Graphics();
  items.forEach((it, i) => {
    const x = (i - (items.length - 1) / 2) * 22;
    if (it.state === 'played') g.circle(x, 0, 7).fill(swatch.green.fill);
    else if (it.state !== 'upcoming') g.circle(x, 0, 7).fill({ color: ink, alpha: 0.25 });
    else
      g.circle(x, 0, 7)
        .fill(0xffffff)
        .stroke({ width: 3, color: i === next ? swatch.orange.line : swatch.yellow.line });
  });
  return g;
}

/** The picnic blanket holding the three games' pictures, the size of a game's landmark, feet on (0, 0). */
export function mixSpotArt(mods: readonly GameModule[]): Container {
  const art = new Container();
  const blanket = new Graphics()
    .ellipse(0, 4, 104, 22)
    .fill({ color: swatch.green.line, alpha: 0.18 })
    .poly([-92, -6, 92, -6, 70, -60, -70, -60])
    .fill(swatch.red.light)
    .stroke({ width: 5, color: swatch.red.line });
  for (let i = -3; i <= 3; i++)
    blanket
      .moveTo(i * 24 - 2, -6)
      .lineTo(i * 18 - 2, -60)
      .stroke({ width: 3, color: swatch.red.fill, alpha: 0.5 });
  blanket.moveTo(-81, -33).lineTo(81, -33).stroke({ width: 3, color: swatch.red.fill, alpha: 0.5 });
  art.addChild(blanket);
  mods.forEach((m, i) => art.addChild(picture(m, (i - 1) * 62, -82 - (i === 1 ? 24 : 0), 74)));
  const dots = new Graphics();
  for (let i = -1; i <= 1; i++)
    dots
      .circle(i * 18, -160, 6)
      .fill(swatch.yellow.fill)
      .stroke({ width: 2, color: swatch.yellow.line });
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

/** The All done tile: the first three stops' little pictures and a ribbon. */
export function allDoneArt(mods: readonly GameModule[]): Container {
  const art = new Container();
  const ribbon = new Graphics()
    .poly([210, 30, 250, 30, 262, 82, 230, 66, 198, 82])
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line })
    .circle(230, 34, 20)
    .fill(swatch.yellow.fill)
    .stroke({ width: 3, color: swatch.yellow.line });
  art.addChild(ribbon);
  mods.slice(0, 3).forEach((m, i) => art.addChild(picture(m, 46 + i * 58, 56 + (i === 1 ? -8 : 6), 56)));
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

/** The sheet's stop tiles for one to five stops: their size and centres (before the design area's offset), centred on 512. */
export function sheetTiles(count: number): { size: number; xs: number[] } {
  const size = count <= 3 ? TILE : count === 4 ? 190 : 150;
  const gap = count <= 3 ? 60 : count === 4 ? 24 : 18;
  return { size, xs: Array.from({ length: count }, (_, i) => 512 + (i - (count - 1) / 2) * (size + gap)) };
}

/** Where the sheet puts its tiles, Skip under each, Play, Again mix and Home, and its panel, in view units. */
export interface SheetPlaces {
  size: number;
  tiles: { x: number; y: number }[];
  /** Skip's centre when that tile is next. */
  skips: { x: number; y: number }[];
  play: { x: number; y: number };
  again: { x: number; y: number };
  home: { x: number; y: number };
  panel: { x: number; y: number; w: number; h: number };
}

/**
 * The sheet's places for one to five stops. The wide area keeps one row centred on its 1024 width; the upright 768 × 1024
 * area (chunk 31) wraps the tiles into rows of two (three over two for five), each row leaving room for Skip under
 * its tiles, with the buttons below.
 */
export function sheetPlaces(count: number, view: { w: number; h: number }): SheetPlaces {
  if (view.w >= 1024) {
    const portrait = view.h > view.w;
    const ox = (view.w - 1024) / 2;
    const tileY = portrait ? 520 : 300,
      skipY = portrait ? 690 : 470,
      buttonY = portrait ? 900 : 640;
    const { size, xs } = sheetTiles(count);
    return {
      size,
      tiles: xs.map((x) => ({ x: ox + x, y: tileY })),
      skips: xs.map((x) => ({ x: ox + x, y: skipY })),
      play: { x: ox + 512, y: buttonY },
      again: { x: ox + 372, y: buttonY },
      home: { x: ox + 652, y: buttonY },
      panel: { x: ox + 82, y: tileY - 160, w: 860, h: buttonY - tileY + 260 },
    };
  }
  // Two to a row up to four (220 or 190 across), three of the five 150 tiles.
  const perRow = count === 5 ? 3 : Math.min(2, count);
  // The same sizes as the wide row, since a tile keeps its size when the phone turns.
  const { size } = sheetTiles(count);
  const gap = 30;
  const pitch = size + SKIP_ROOM;
  const mid = view.w / 2;
  const rows = Math.ceil(count / perRow);
  // The block (tiles, Skip, the buttons) a little above the middle of the view, never under Back.
  const block = rows * pitch + 30 + 140;
  const top = Math.max(340, Math.round(view.h * 0.45 - block / 2 + size / 2));
  const tiles: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const col = i - row * perRow;
    tiles.push({ x: mid + (col - (inRow - 1) / 2) * (size + gap), y: top + row * pitch });
  }
  const skips = tiles.map((t) => ({ x: t.x, y: t.y + size / 2 + 15 + 56 }));
  const last = tiles[tiles.length - 1].y;
  const buttonY = last + size / 2 + 15 + 112 + 30 + 70;
  return {
    size,
    tiles,
    skips,
    play: { x: mid, y: buttonY },
    again: { x: mid - 140, y: buttonY },
    home: { x: mid + 140, y: buttonY },
    panel: { x: 20, y: top - size / 2 - 60, w: view.w - 40, h: buttonY + 100 - (top - size / 2 - 60) },
  };
}

/** A row's pitch beyond its tiles on the upright sheet: Skip (112 across) under a tile, with a little air either side. */
const SKIP_ROOM = 15 + 112 + 25;

/** One stop on the sheet (220 across) or a stop card's row (100): bright when next or still to come, a sticker copy once played, dimmed with a hop once passed. */
export class StopTile extends Container {
  private readonly face = new Container();
  private clock = 0;
  bobbing = false;
  constructor(
    readonly mod: GameModule,
    readonly item: MixItem,
    next: boolean,
    onPress: () => void,
    readonly size = TILE,
  ) {
    super();
    const k = size / TILE;
    this.hitArea = new Rectangle(-size / 2, -size / 2, size, size);
    const passed = item.state === 'skipped' || item.state === 'unavailable';
    const color = next ? swatch.yellow : swatch.blue;
    this.face.addChild(
      new Graphics()
        .roundRect(-size / 2, -size / 2, size, size, 28 * k)
        .fill(color.light)
        .stroke({ width: (next ? 8 : 4) * Math.max(k, 0.6), color: color.line }),
      picture(mod, 0, 0, 150 * k),
    );
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
    this.bobbing = next && size > 100; // on the sheet, never on a stop card's row
    onTap(this, () => {
      this.face.scale.set(1.06);
      onPress();
    });
  }
  update(dt: number) {
    this.clock += dt;
    this.face.y = this.bobbing ? (Math.sin(this.clock * 3) * 6 * this.size) / TILE : 0;
    this.face.scale.set(Math.max(1, this.face.scale.x - dt * 0.6));
  }
}

/**
 * The preview and the ending, over the home spot: Back, one to five stop tiles, then Play and Skip while a stop is left, or
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

  constructor(private readonly actions: SheetActions) {
    super();
    this.scrim.eventMode = 'static'; // nothing on the home spot can be touched under the sheet
    this.backButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => actions.back());
    this.playButton = new RoundButton(playIcon(), swatch.green, 70, () => actions.play());
    this.skipButton = new RoundButton(hopIcon(ink), swatch.white, 56, () => actions.skip());
    this.againButton = new RoundButton(againIcon(0xffffff), swatch.green, 70, () => actions.againMix());
    this.homeButton = new RoundButton(houseIcon(0xffffff), swatch.blue, 70, () => actions.home());
    this.addChild(
      this.scrim,
      this.panel,
      this.tileLayer,
      this.backButton,
      this.playButton,
      this.skipButton,
      this.againButton,
      this.homeButton,
    );
  }

  get ending(): boolean {
    return !!this.state && nextUp(this.state) === null;
  }

  /** The live session's stops, one tile each. */
  show(state: MixState, mods: readonly GameModule[], view: View) {
    this.state = state;
    for (const t of this.tiles) t.destroy({ children: true });
    const next = nextUp(state);
    const { size } = sheetTiles(mods.length);
    this.tiles = mods.map(
      (mod, p) => new StopTile(mod, state.items[p], p === next, () => this.actions.tile(p), size),
    );
    this.tileLayer.addChild(...this.tiles);
    this.layout(view);
  }

  layout(view: View) {
    const p = sheetPlaces(this.tiles.length, view);
    this.scrim.clear().rect(0, 0, view.w, view.h).fill({ color: wood.light, alpha: 0.85 });
    this.panel
      .clear()
      .roundRect(p.panel.x, p.panel.y, p.panel.w, p.panel.h, 40)
      .fill({ color: 0xffffff, alpha: 0.7 });
    this.backButton.position.set(65, 65);
    this.tiles.forEach((t, i) => t.position.set(p.tiles[i].x, p.tiles[i].y));
    const next = this.state ? nextUp(this.state) : null;
    const ending = next === null;
    this.playButton.visible = this.skipButton.visible = !ending;
    this.againButton.visible = this.homeButton.visible = ending;
    this.playButton.position.set(p.play.x, p.play.y);
    const skip = next === null ? p.play : p.skips[next];
    this.skipButton.position.set(skip.x, skip.y);
    this.againButton.position.set(p.again.x, p.again.y);
    this.homeButton.position.set(p.home.x, p.home.y);
  }

  update(dt: number) {
    for (const t of this.tiles) t.update(dt);
  }

  /** The tile at a stop, for scripted checks and a poke when it is heard. */
  tileAt(p: number): Container | undefined {
    return this.tiles[p];
  }
}
