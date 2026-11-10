import { describe, expect, it } from 'vitest';
import { BANDS } from '../progress/bands';
import { placeFor } from '../content/places';
import {
  ageCopy,
  bandSmall,
  bandWhere,
  findingCopy,
  friendHeading,
  playingCopy,
  weekCopy,
  type PanelApp,
} from './copy';

/** Every word the page shows from these sections, for one app. */
function allCopy(app: PanelApp): string {
  const playing = playingCopy(app);
  const finding = findingCopy(app);
  const week = weekCopy(app);
  return [
    ageCopy(app),
    ...BANDS.flatMap((b) => [bandSmall(app, b.id), bandWhere(app, b.id)]),
    friendHeading(app),
    ...playing.before,
    ...playing.after,
    ...(finding ? [finding.label, finding.note] : []),
    week.intro,
    week.older,
  ].join('\n');
}

describe("the grown-ups' page's words (U8a)", () => {
  it('say nothing about the island map on the root', () => {
    // The app's own name is a name, not the map.
    const root = allCopy('root').replaceAll('Puddle Island', '').toLowerCase();
    for (const word of ['map', 'home spot', 'picnic', 'signpost', 'swiping', 'development', 'island'])
      expect(root, word).not.toContain(word);
    for (const b of BANDS) expect(root).not.toContain(placeFor(b.id).name.toLowerCase());
    expect(findingCopy('root')).toBeNull();
    expect(weekCopy('root').picnic).toBe(false);
  });

  it("end the root's age line with the band, and keep classic's home spot", () => {
    expect(bandWhere('root', 'prek')).toBe('Pre-K');
    expect(bandSmall('root', 'prek')).toBe('4–5 years');
    expect(bandWhere('classic', 'prek')).toBe(placeFor('prek').name);
    expect(bandSmall('classic', 'prek')).toContain(placeFor('prek').name);
  });

  it('keep the island words on classic', () => {
    const classic = allCopy('classic');
    expect(classic).toContain('home spot');
    expect(classic).toContain('picnic blanket');
    expect(findingCopy('classic')?.note).toMatch(/Subject cards/);
    expect(weekCopy('classic').older).toBe('A game for bigger kids, from a signpost');
    expect(weekCopy('classic').picnic).toBe(true);
    expect(friendHeading('classic')).toBe('Your island friend');
  });

  it('say in both apps that the ? opens with a tap and that the six is a day of games', () => {
    for (const app of ['root', 'classic'] as const) {
      const words = [...playingCopy(app).before, ...playingCopy(app).after].join('\n');
      expect(words, app).toContain('The ? in a game opens it again.');
      expect(words, app).not.toMatch(/Holding the \?/);
      expect(words, app).not.toContain('six-tile');
    }
    expect(playingCopy('root').before.join('\n')).toContain("the day's page on Home");
    expect(playingCopy('classic').before.join('\n')).toContain("Today's six is a different mix");
  });
});
