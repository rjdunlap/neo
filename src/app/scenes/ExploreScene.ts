import { Container, Graphics, Rectangle } from 'pixi.js';
import { landmarkFor } from '../../art/lands';
import { cream, ink, swatch } from '../../art/palette';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { landFor, type LandId } from '../../content/lands';
import { CORNER_RADIUS, EXPLORE_CARD, EXPLORE_MAX, exploreLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon } from '../../ui/icons';
import { label } from '../../ui/text';
import type { App } from '../App';
import { Scene } from '../Scene';
import { LOCATIONS } from './LocationScene';

/** The built locations, in the order RW13 built them, at most a page of them. */
export const exploreIds = (): LandId[] => (Object.keys(LOCATIONS) as LandId[]).slice(0, EXPLORE_MAX);

/**
 * Explore at the root (RW13, docs/rework/HOME.md#home-homescene-the-roots-hub): one page of the built locations, each a
 * 150-unit card with the land's landmark and its name under it. Tapping a card goes there at once (the location greets
 * her); Back returns Home, as does the location's Home. Looking changes nothing; nothing here is a round. RW08's Explore
 * replaces this page.
 */
export class ExploreScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly ids = exploreIds();
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.leave(() => this.app.go.hub()));
  readonly cards: Container[] = this.ids.map((id) => this.card(id));
  private leaving = false;

  constructor(app: App) {
    super(app);
  }

  init() {
    this.content.addChild(this.backdrop);
    this.ui.addChild(this.back, ...this.cards);
  }

  private card(id: LandId): Container {
    const node = new Container();
    const half = EXPLORE_CARD / 2;
    const art = landmarkFor(id);
    const b = art.getLocalBounds();
    art.scale.set(Math.min(1, (EXPLORE_CARD - 30) / Math.max(b.width, b.height, 1)));
    art.position.set(-(b.x + b.width / 2) * art.scale.x, -(b.y + b.height / 2) * art.scale.y);
    art.eventMode = 'none';
    const name = label(landFor(id).name, 22, ink);
    name.y = half + 26;
    // The name sits on its own cream pill so it reads over the busy backdrop.
    const pill = new Graphics().roundRect(-name.width / 2 - 12, name.y - 17, name.width + 24, 34, 17).fill(cream);
    node.addChild(new Graphics().roundRect(-half, -half, EXPLORE_CARD, EXPLORE_CARD, 28).fill(cream).stroke({ color: swatch.green.line, width: 5 }), art, pill, name);
    node.hitArea = new Rectangle(-half, -half, EXPLORE_CARD, EXPLORE_CARD);
    onTap(node, () => {
      sfx.tick();
      node.scale.set(0.9);
      this.leave(() => this.app.go.land(id));
    }, { cooldown: 400 });
    return node;
  }

  /** A short beat for the squish, then the way out; a second tap while leaving does nothing. */
  private async leave(go: () => void) {
    if (this.leaving) return;
    this.leaving = true;
    await this.tw.wait(0.2);
    if (this.app.scene !== this) return;
    go();
  }

  resize(v: View) {
    const l = exploreLayout(v, this.cards.length);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.back.position.set(l.back.x, l.back.y);
    this.cards.forEach((c, i) => c.position.set(l.cards[i].x, l.cards[i].y));
  }

  enter() {
    // The page's island-games link belongs to Home; Back (`go.hub()`) shows it again.
    const link = document.querySelector<HTMLElement>('.classic-link');
    if (link) link.hidden = true;
    music.play(STYLES.hub);
    void voice.say('explore.pick');
  }
}
