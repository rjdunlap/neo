import { Container, Graphics, Rectangle } from 'pixi.js';
import { cream, ink, swatch } from '../../art/palette';
import { picnicLandmark } from '../../art/picnic';
import { woodlandLandmark } from '../../art/woodland';
import { homeBackdrop } from '../../art/home/backdrop';
import { music, STYLES } from '../../audio/music';
import { sfx } from '../../audio/sfx';
import { voice } from '../../audio/voice';
import { BOOK_NAMES, libraryBooks, type LibraryBook } from '../../content/library';
import type { LineId } from '../../content/voice-script';
import { CORNER_RADIUS, EXPLORE_CARD, exploreGridLayout } from '../../creatures/home-layout';
import { onTap } from '../../engine/input';
import type { View } from '../../engine/view';
import { store } from '../../progress/store';
import { RoundButton } from '../../ui/buttons';
import { arrowIcon, houseIcon, journalIcon } from '../../ui/icons';
import { fitArt } from '../../ui/origin-art';
import { label } from '../../ui/text';
import { Scene } from '../Scene';

const ART: Record<LibraryBook, () => Container> = { journal: journalIcon, windy: picnicLandmark, woodland: woodlandLandmark };
const LINES: Record<LibraryBook, LineId> = { journal: 'library.journal', windy: 'map.picnic', woodland: 'woodland.spot' };

/**
 * The library at the root (RW08 slice 2, docs/rework/RW08-CUTOVER.md#slice-2-the-library-the-stories-and-the-rest-of-home),
 * opened from the books in creature play: 150-unit cards for her discovery journal, the Windy Picnic and (at school) the
 * Woodland Picnic, laid out as Explore's pages are. Each story keeps its own save and steps; the journal and the stories
 * come back here. Back returns to creature play, Home goes Home. Looking changes nothing.
 */
export class LibraryScene extends Scene {
  private readonly backdrop = homeBackdrop();
  readonly books = libraryBooks(store.data.profile.band);
  readonly back = new RoundButton(arrowIcon(-1), swatch.white, CORNER_RADIUS, () => this.leave(() => this.app.go.room(), 'nav.back')).means('back');
  readonly home = new RoundButton(houseIcon(), swatch.white, CORNER_RADIUS, () => this.leave(() => this.app.go.hub(), 'nav.home')).means('home');
  /** The cards on screen, in order, so a script can find and press one. */
  readonly cards: { book: LibraryBook; node: Container }[] = [];
  private leaving = false;

  init() {
    this.content.addChild(this.backdrop);
    for (const book of this.books) this.cards.push({ book, node: this.card(book) });
    this.ui.addChild(this.back, this.home, ...this.cards.map((c) => c.node));
  }

  /** A 150-unit cream card with its picture and its name on a pill under it; it squishes and speaks on touch-down. */
  private card(book: LibraryBook): Container {
    const node = new Container();
    const half = EXPLORE_CARD / 2;
    const art = fitArt(ART[book](), EXPLORE_CARD - 30);
    const text = label(BOOK_NAMES[book], 22, ink);
    text.y = half + 26;
    const pill = new Graphics().roundRect(-text.width / 2 - 12, text.y - 17, text.width + 24, 34, 17).fill(cream);
    node.addChild(new Graphics().roundRect(-half, -half, EXPLORE_CARD, EXPLORE_CARD, 28).fill(cream).stroke({ color: swatch.orange.line, width: 5 }), art, pill, text);
    node.hitArea = new Rectangle(-half, -half, EXPLORE_CARD, EXPLORE_CARD);
    onTap(node, () => {
      if (this.leaving) return;
      sfx.tick();
      node.scale.set(0.9);
      this.leave(() => (book === 'journal' ? this.app.go.journal() : book === 'windy' ? this.app.go.picnic() : this.app.go.woodland()), LINES[book]);
    }, { cooldown: 400 });
    return node;
  }

  /** A short beat for the squish (or the line, up to a moment), then the way out; a second tap while leaving does nothing. */
  private async leave(go: () => void, line?: LineId) {
    if (this.leaving) return;
    this.leaving = true;
    await (line ? Promise.race([voice.say(line), this.tw.wait(1.1)]) : this.tw.wait(0.2));
    if (this.app.scene !== this) return;
    go();
  }

  resize(v: View) {
    const l = exploreGridLayout(v, this.cards.length);
    this.backdrop.position.set(l.backdrop.x, l.backdrop.y);
    this.backdrop.scale.set(l.backdrop.scale);
    this.back.position.set(l.back.x, l.back.y);
    this.home.position.set(l.home.x, l.home.y);
    this.cards.forEach((c, i) => c.node.position.set(l.cards[i].x, l.cards[i].y));
  }

  enter() {
    music.play(STYLES.hub);
    void voice.say('library.hello');
  }
}
