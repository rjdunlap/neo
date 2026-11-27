import { Container, Graphics, Rectangle } from 'pixi.js';
import { ink, swatch, wood } from '../art/palette';
import { onTap } from '../engine/input';
import type { View } from '../engine/view';
import type { GameModule } from '../games/types';
import { RoundButton } from './buttons';
import { label as pictureLabel, picture } from './discovery';
import { againIcon, arrowIcon, heartIcon, nextIcon, playIcon, shuffleIcon } from './icons';
import { label } from './text';

/** A scope chip is 120 across: above the 100-unit floor, with room for a short name under its picture. */
export const CHIP = 120;
const GAP = 16;
/** Room kept above the chips (Back, the heading) and below them (One pick and the page arrows). */
const TOP = 150;
const BOTTOM = 210;

export interface ChipPlaces {
  perPage: number;
  pages: number;
  /** Centres for the chips of one page, in order. */
  at: { x: number; y: number }[];
}

/** Where the chips of one page go in a view: as many per row and rows as fit, never smaller, then page. */
export function chipPlaces(count: number, page: number, view: { w: number; h: number }): ChipPlaces {
  const width = Math.min(view.w - 80, 900);
  const perRow = Math.max(1, Math.floor((width + GAP) / (CHIP + GAP)));
  const rows = Math.max(1, Math.floor((view.h - TOP - BOTTOM + GAP) / (CHIP + GAP)));
  const perPage = perRow * rows;
  const pages = Math.max(1, Math.ceil(count / perPage));
  const p = Math.min(Math.max(0, page), pages - 1);
  const shown = Math.min(perPage, Math.max(0, count - p * perPage));
  const at: { x: number; y: number }[] = [];
  for (let i = 0; i < shown; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, shown - row * perRow);
    const col = i - row * perRow;
    at.push({
      x: view.w / 2 + (col - (inRow - 1) / 2) * (CHIP + GAP),
      y: TOP + CHIP / 2 + row * (CHIP + GAP),
    });
  }
  return { perPage, pages, at };
}

export interface PickChip {
  key: string;
  /** The game whose picture stands for the scope, or null for the heart. */
  mod: GameModule | null;
  name: string;
}

export interface PickSheetActions {
  choose(key: string): void;
  onePick(): void;
  /** D7b: fill the mix lineup from the scope (lap and toddler home spots only). */
  shuffle(): void;
  another(): void;
  again(): void;
  play(): void;
  page(delta: number): void;
  /** Back from a pick to the chooser, or from the chooser to the home spot. */
  back(): void;
}

class Chip extends Container {
  constructor(spec: PickChip, selected: boolean, onPress: () => void) {
    super();
    this.hitArea = new Rectangle(-CHIP / 2, -CHIP / 2, CHIP, CHIP);
    const color = selected ? swatch.yellow : swatch.blue;
    const face = new Graphics()
      .roundRect(-CHIP / 2, -CHIP / 2, CHIP, CHIP, 24)
      .fill(color.light)
      .stroke({ width: selected ? 8 : 4, color: color.line });
    face.eventMode = 'none';
    this.addChild(face);
    if (spec.mod) this.addChild(picture(spec.mod, 0, -14, 58));
    else {
      const heart = heartIcon(swatch.red.fill);
      heart.position.set(0, -14);
      this.addChild(heart);
    }
    const name = pictureLabel(spec.name, 0, 0, 15, CHIP - 12);
    name.style.align = 'center';
    name.anchor.set(0.5, 0);
    name.position.set(0, 20);
    this.addChild(name);
    for (const c of this.children) c.eventMode = 'none';
    this.eventMode = 'static';
    onTap(this, () => {
      this.scale.set(1.06);
      onPress();
    });
  }
}

/**
 * Pick for me (D7a), over a home spot: a row of scope pictures with One pick, then the picked game's picture with Play,
 * Another and Back. Every target is at least 100 across; nothing here changes anything that matters.
 */
export class PickSheet extends Container {
  private readonly scrim = new Graphics();
  private readonly panel = new Graphics();
  private readonly chipLayer = new Container();
  private readonly cardLayer = new Container();
  private chips: Chip[] = [];
  private specs: PickChip[] = [];
  private selected = '';
  private page = 0;
  private card: { mod: GameModule | null; title: string; end: boolean; another: boolean } | null = null;
  readonly backButton: RoundButton;
  readonly pickButton: RoundButton;
  readonly shuffleButton: RoundButton;
  private canShuffle = false;
  readonly playButton: RoundButton;
  readonly anotherButton: RoundButton;
  readonly againButton: RoundButton;
  readonly previousButton: RoundButton;
  readonly nextButton: RoundButton;
  private readonly heading = label('Pick one for me', 34);

  constructor(private readonly actions: PickSheetActions) {
    super();
    this.scrim.eventMode = 'static'; // nothing on the home spot can be touched under the sheet
    this.backButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => actions.back());
    this.pickButton = new RoundButton(playIcon(), swatch.green, 70, () => actions.onePick());
    this.shuffleButton = new RoundButton(shuffleIcon(), swatch.blue, 70, () => actions.shuffle());
    this.playButton = new RoundButton(playIcon(), swatch.green, 70, () => actions.play());
    this.anotherButton = new RoundButton(nextIcon(ink), swatch.white, 56, () => actions.another());
    this.againButton = new RoundButton(againIcon(0xffffff), swatch.green, 70, () => actions.again());
    this.previousButton = new RoundButton(arrowIcon(-1), swatch.white, 50, () => actions.page(-1));
    this.nextButton = new RoundButton(arrowIcon(1), swatch.white, 50, () => actions.page(1));
    this.addChild(
      this.scrim,
      this.panel,
      this.heading,
      this.chipLayer,
      this.cardLayer,
      this.backButton,
      this.pickButton,
      this.shuffleButton,
      this.playButton,
      this.anotherButton,
      this.againButton,
      this.previousButton,
      this.nextButton,
    );
  }

  get choosing(): boolean {
    return !this.card;
  }

  /** The scope chips, with the held one outlined. */
  showChooser(specs: readonly PickChip[], selected: string, page: number, view: View, canShuffle = false) {
    this.card = null;
    this.canShuffle = canShuffle;
    this.specs = [...specs];
    this.selected = selected;
    this.page = page;
    this.layout(view);
  }

  /** A picked game (or, at the end of the order, no game), with its title under the picture. */
  showCard(card: { mod: GameModule | null; title: string; end: boolean; another: boolean }, view: View) {
    this.card = card;
    this.layout(view);
  }

  layout(view: View) {
    this.scrim.clear().rect(0, 0, view.w, view.h).fill({ color: wood.light, alpha: 0.85 });
    const panelW = Math.min(view.w - 40, 940);
    this.panel
      .clear()
      .roundRect((view.w - panelW) / 2, 100, panelW, view.h - 130, 40)
      .fill({ color: 0xffffff, alpha: 0.7 });
    this.backButton.position.set(65, 65);
    this.heading.position.set(view.w / 2, 62);
    for (const c of this.chips) c.destroy({ children: true });
    this.chips = [];
    for (const c of this.cardLayer.removeChildren()) c.destroy({ children: true });
    const baseY = view.h - 105;
    const mid = view.w / 2;
    const choosing = !this.card;
    this.pickButton.visible = choosing;
    this.shuffleButton.visible = choosing && this.canShuffle;
    this.playButton.visible = !choosing && !this.card!.end;
    this.anotherButton.visible = !choosing && this.card!.another;
    this.againButton.visible = !choosing && this.card!.end;
    if (choosing) {
      const places = chipPlaces(this.specs.length, this.page, view);
      this.page = Math.min(this.page, places.pages - 1);
      const first = this.page * places.perPage;
      places.at.forEach((p, i) => {
        const spec = this.specs[first + i];
        const chip = new Chip(spec, spec.key === this.selected, () => this.actions.choose(spec.key));
        chip.position.set(p.x, p.y);
        this.chips.push(chip);
        this.chipLayer.addChild(chip);
      });
      // With Shuffle beside it, One pick and Shuffle sit side by side and the page arrows step out past them.
      const side = this.canShuffle ? 90 : 0;
      this.pickButton.position.set(mid - side, baseY);
      this.shuffleButton.position.set(mid + side, baseY);
      this.previousButton.visible = this.nextButton.visible = places.pages > 1;
      this.previousButton.alpha = this.page > 0 ? 1 : 0.35;
      this.nextButton.alpha = this.page < places.pages - 1 ? 1 : 0.35;
      const arrows = this.canShuffle ? 260 : 170;
      this.previousButton.position.set(mid - arrows, baseY);
      this.nextButton.position.set(mid + arrows, baseY);
      return;
    }
    this.previousButton.visible = this.nextButton.visible = false;
    const card = this.card!;
    const size = Math.min(260, view.w - 120, view.h - 520);
    const y = Math.max(300, view.h * 0.4);
    const face = new Graphics()
      .roundRect(-size / 2, -size / 2, size, size, 32)
      .fill(swatch.yellow.light)
      .stroke({ width: 8, color: swatch.yellow.line });
    face.position.set(mid, y);
    if (!card.end) this.cardLayer.addChild(face);
    if (card.mod) this.cardLayer.addChild(picture(card.mod, mid, y, size * 0.68));
    const words = label(card.title, 34);
    words.position.set(mid, y + size / 2 + 44);
    this.cardLayer.addChild(words);
    this.playButton.position.set(mid, baseY);
    this.anotherButton.position.set(mid + 170, baseY);
    this.againButton.position.set(mid, baseY);
  }

  /** The title on the card now (or the end line), for scripted checks. */
  cardTitle(): string | null {
    return this.card ? this.card.title : null;
  }

  /** Whether a chip is drawn at all (a scripted check reads this). */
  chipKeys(): string[] {
    return this.specs.map((s) => s.key);
  }
  update(dt: number) {
    for (const c of this.chips) c.scale.set(Math.max(1, c.scale.x - dt * 0.6));
  }
}
