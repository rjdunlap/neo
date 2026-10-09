import { Container, Graphics } from 'pixi.js';
import type { CritterName } from '../art/critter';
import { swatch } from '../art/palette';
import type { JournalEntry } from '../content/journal';
import { snackPicture } from '../games/animal-snack';
import { launchJournalPicture } from '../games/bouncy-launch';
import { safariJournalPicture } from '../games/photo-safari';
import type { Action } from '../games/photo-safari/logic';
import { seesawJournalPicture } from '../games/seesaw-balance';
import type { BalanceObservation } from '../games/seesaw-balance/logic';
import { thingArt } from '../games/sink-float/art';
import type { Thing } from '../games/sink-float/logic';
import { magnifierIcon } from './icons';

/** The picture for a journal entry, drawn from the game that shows it, centered on (0, 0)-ish; fit it with `fit`. */
export function entryPicture(entry: JournalEntry): Container {
  switch (entry.game) {
    case 'sink-float': return thingArt(entry.key as Thing);
    case 'animal-snack': return snackPicture(entry.key as CritterName);
    case 'photo-safari': return safariJournalPicture(entry.key as Action);
    case 'seesaw-balance': return seesawJournalPicture(entry.key as BalanceObservation);
    case 'bouncy-launch': return launchJournalPicture();
  }
}

/** Scales a picture to fit a square and centers its drawing on (0, 0). Never makes a small picture bigger than it was. */
export function fit(picture: Container, size: number, grow = false): Container {
  const b = picture.getLocalBounds();
  const s = Math.min(grow ? Infinity : 1, size / Math.max(1, b.width), size / Math.max(1, b.height));
  picture.scale.set(s);
  picture.position.set(-(b.x + b.width / 2) * s, -(b.y + b.height / 2) * s);
  const holder = new Container();
  holder.addChild(picture);
  return holder;
}

/** "New in your journal": the new pictures (up to three) beside a little magnifying glass, centered on (0, 0). Decoration only. */
export function discoveryPill(entries: JournalEntry[]): Container {
  const shown = entries.slice(0, 3);
  const w = 96 + shown.length * 92;
  const c = new Container();
  c.addChild(new Graphics().roundRect(-w / 2, -58, w, 116, 30).fill({ color: 0xffffff, alpha: 0.95 }).stroke({ width: 5, color: swatch.yellow.line }));
  const glass = magnifierIcon();
  glass.scale.set(0.9);
  glass.position.set(-w / 2 + 46, 0);
  c.addChild(glass);
  shown.forEach((e, i) => {
    const holder = fit(entryPicture(e), 78);
    holder.position.set(-w / 2 + 96 + 46 + i * 92, 0);
    c.addChild(holder);
  });
  c.eventMode = 'none';
  return c;
}
