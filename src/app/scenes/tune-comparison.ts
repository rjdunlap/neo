import { Container, Graphics, Rectangle, type DestroyOptions } from 'pixi.js';
import { cream, ink, swatch, wood } from '../../art/palette';
import { voice } from '../../audio/voice';
import type { TuneCreation } from '../../content/creations';
import { TUNE_COMPARE, tuneCompareLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { singTune, TunePlaque } from '../../ui/creation-art';
import { crossIcon } from '../../ui/icons';
import { label } from '../../ui/text';

const { width, height, cardWidth, cardHeight, closeRadius } = TUNE_COMPARE;

class TuneCard extends Container {
  readonly plaque = new TunePlaque();
  private readonly border = new Graphics();

  constructor(
    readonly tune: TuneCreation,
    name: string,
  ) {
    super();
    this.hitArea = new Rectangle(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight);
    this.interactiveChildren = false;
    this.plaque.set(tune);
    this.plaque.scale.set(1.55);
    this.plaque.y = 16;
    const title = label(name, 27);
    title.y = -cardHeight / 2 + 25;
    this.addChild(this.border, this.plaque, title);
    this.highlight(false);
  }

  highlight(active: boolean) {
    this.border
      .clear()
      .roundRect(-cardWidth / 2 + 4, -cardHeight / 2 + 4, cardWidth - 8, cardHeight - 8, 23)
      .fill(active ? swatch.green.light : swatch.yellow.light)
      .stroke({ width: active ? 8 : 3, color: active ? swatch.green.line : wood.line });
    if (!active) this.plaque.lightColumn(-1);
  }
}

export class TuneComparison extends Container {
  private readonly scrim = new Graphics();
  private readonly panel = new Graphics()
    .roundRect(-width / 2, -height / 2, width, height, 28)
    .fill(cream)
    .stroke({ width: 6, color: wood.line });
  readonly onDisplay: TuneCard;
  readonly otherTune: TuneCard;
  readonly close: RoundButton;
  private active: TuneCard | null = null;
  private playback = 0;

  constructor(
    current: TuneCreation,
    previous: TuneCreation,
    private readonly wait: (seconds: number) => Promise<unknown>,
    close: () => void,
  ) {
    super();
    this.scrim.eventMode = 'static';
    this.panel.eventMode = 'none';
    const heading = label('Compare tunes', 36);
    heading.anchor.set(0, 0.5);
    heading.position.set(-width / 2 + 30, -height / 2 + 72);
    heading.eventMode = 'none';
    this.panel.addChild(heading);
    this.onDisplay = new TuneCard(current, 'On display');
    this.otherTune = new TuneCard(previous, 'Other tune');
    this.close = new RoundButton(crossIcon(ink), swatch.white, closeRadius, close);
    onTap(this.onDisplay, () => void this.play(this.onDisplay, 'tune.on-display'));
    onTap(this.otherTune, () => void this.play(this.otherTune, 'tune.other'));
    this.addChild(this.scrim, this.panel, this.onDisplay, this.otherTune, this.close);
  }

  resize(v: View) {
    const layout = tuneCompareLayout(v);
    this.scrim.clear().rect(0, 0, v.w, v.h).fill({ color: ink, alpha: 0.48 });
    this.panel.position.copyFrom(layout.panel);
    this.onDisplay.position.copyFrom(layout.onDisplay);
    this.otherTune.position.copyFrom(layout.otherTune);
    this.close.position.copyFrom(layout.close);
  }

  private async play(card: TuneCard, line: 'tune.on-display' | 'tune.other') {
    const playback = ++this.playback;
    this.active?.highlight(false);
    this.active = card;
    card.highlight(true);
    const going = () => this.playback === playback;
    await Promise.race([voice.say(line), this.wait(1.2)]);
    if (!going()) return;
    // Speech can finish while the app is paused. Start the first beat on a scene tick.
    await this.wait(0);
    if (!going()) return;
    await singTune(card.tune, this.wait, (column) => card.plaque.lightColumn(column), going);
    if (!going()) return;
    card.highlight(false);
    this.active = null;
  }

  destroy(options?: DestroyOptions) {
    ++this.playback;
    super.destroy(options);
  }
}
