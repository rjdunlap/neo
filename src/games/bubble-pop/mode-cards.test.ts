import { describe, expect, it } from 'vitest';
import { SCRIPT } from '../../content/voice-script';
import { howToFor } from '../../content/howto';
import { GAMES } from '../registry';
import { levelsInOrder } from '../../progress/difficulty';
import { MODE_CARDS, PLANS } from './logic';
import { bubblePop } from './index';

describe('Bubble Pop mode cards', () => {
  it('names every level each band plays, distinctly within the band, with a line the voice script has', () => {
    for (const band of bubblePop.bands) {
      const levels = levelsInOrder(bubblePop.levels(band));
      const names = levels.map((level) => {
        const card = MODE_CARDS[level];
        expect(card, `${band} level ${level}`).toBeDefined();
        expect(SCRIPT[card.line], card.line).toBeDefined();
        return card.name;
      });
      expect(new Set(names).size, band).toBe(names.length);
    }
    expect(Object.keys(MODE_CARDS).length).toBe(PLANS.length);
  });

  it('a picture matches its level: counting pictures count, bond pictures add up, color pictures show the colors in play', () => {
    for (const [level, { picture }] of Object.entries(MODE_CARDS).map(([l, c]) => [Number(l), c] as const)) {
      const plan = PLANS[level - 1];
      if (picture.kind === 'bond') expect(picture.numbers[0] + picture.numbers[1], `level ${level}`).toBe(plan.sum);
      if (picture.kind === 'colors') expect(picture.colors, `level ${level}`).toBe(plan.colors);
      if (picture.kind === 'palm') expect(plan.anywhere, `level ${level}`).toBe(true);
      if (picture.kind === 'plain') expect(plan.mode === 'free' && !plan.anywhere, `level ${level}`).toBe(true);
    }
  });

  it('the how-to card carries the mode; a game without levelCard gets no mode at all', () => {
    expect(howToFor(bubblePop, 13)!.mode!.name).toBe('Count back');
    for (const g of GAMES) {
      if (g.levelCard) continue;
      const card = howToFor(g, levelsInOrder(g.levels(g.bands[0]))[0]);
      if (card) expect('mode' in card, g.id).toBe(false);
    }
  });
});
