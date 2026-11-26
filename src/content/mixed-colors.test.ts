import { describe, expect, it } from 'vitest';
import { swatch, type ColorName } from '../art/palette';
import { channels, oklabDistance } from '../art/oklab';
import { hueMatrix, paleness, recolorMatrix } from '../creatures/companion';
import { SPECIES, SPECIES_IDS } from '../creatures/species';
import { mix, POTS, RECIPES } from '../games/paint-mixer/logic';
import { cleanCreatures, meetIn } from '../progress/save';
import { entryId, mixedColors } from './journal';
import { ALL_PET_COLORS, colorChoices, MIXED_COLORS, PET_COLORS, type PetColor } from './world';

/** Paint Mixer 4, the palette unlock (definitions/paint-mixer-5-6.md, "The palette unlock"). */
describe('the paint shelf as pet colours (paint-mixer 4)', () => {
  it('names the six colours as the shelf recipes do, each swatch filled with its measured mix', () => {
    expect([...MIXED_COLORS]).toEqual(RECIPES.map((r) => r.name));
    for (const r of RECIPES) {
      const counts = Object.fromEntries(POTS.map((p) => [p, 0])) as Record<(typeof POTS)[number], number>;
      r.pots.forEach((p, i) => (counts[p] = r.counts[i]));
      expect(swatch[r.name].fill, r.name).toBe(mix(counts));
      // The outline is darker than the fill and the tint lighter, as on every other swatch.
      const sum = (rgb: number) => channels(rgb).reduce((a, b) => a + b, 0);
      expect(sum(swatch[r.name].line)).toBeLessThan(sum(swatch[r.name].fill));
      expect(sum(swatch[r.name].light)).toBeGreaterThan(sum(swatch[r.name].fill));
    }
    // The eight first colours are unchanged and come first.
    expect(ALL_PET_COLORS.slice(0, 8)).toEqual([...PET_COLORS]);
  });

  it('unlocks exactly the colours her journal has filed, in shelf order, ignoring anything else', () => {
    expect(mixedColors({ found: [] })).toEqual([]);
    const found = [
      entryId('paint-mixer', 'lilac'),
      'paint-mixer:mauve',
      'sink-float:apple',
      entryId('paint-mixer', 'peach'),
    ];
    expect(mixedColors({ found })).toEqual(['peach', 'lilac']);
    // Derived, not stored: two profiles' journals give each its own colours, and filing again changes nothing.
    expect(mixedColors({ found: [entryId('paint-mixer', 'rose')] })).toEqual(['rose']);
    expect(mixedColors({ found: [...found, entryId('paint-mixer', 'peach')] })).toEqual(['peach', 'lilac']);
  });

  it('offers her colours plus the friend’s own, never another profile’s that the friend does not wear', () => {
    expect(colorChoices([...PET_COLORS])).toEqual([...PET_COLORS]);
    expect(colorChoices([...PET_COLORS, 'coral'], 'teal')).toEqual([...PET_COLORS, 'coral']);
    // A restored or copied friend in lavender keeps lavender on offer, though this profile has not mixed it.
    expect(colorChoices([...PET_COLORS, 'coral'], 'lavender')).toEqual([...PET_COLORS, 'coral', 'lavender']);
  });

  it('save repair accepts every mixed colour, whether or not this profile has mixed it, and repairs the rest', () => {
    const one = (color: unknown) =>
      cleanCreatures({
        owned: [{ id: 'pip1', species: 'sprout', name: 'Pip', look: { color }, metAt: 'start' }],
      }).owned[0].look.color;
    for (const c of MIXED_COLORS) expect(one(c)).toBe(c);
    expect(one('mauve')).toBe(SPECIES.sprout.color);
    expect(one(42)).toBe(SPECIES.sprout.color);
    const met = meetIn(
      { owned: [], companion: null, forms: [] },
      'sprout',
      'Pip',
      'peach',
      'start',
      () => 'pip1',
    );
    expect(met?.look.color).toBe('peach');
  });

  it('lifts only a mixed colour toward white, and every colour of a species looks different', () => {
    const apply = (m: number[] | null, rgb: number) => {
      const c = channels(rgb).map((v) => v / 255);
      if (!m) return rgb;
      const out = [0, 5, 10].map((row) =>
        Math.round(
          255 *
            Math.min(
              1,
              Math.max(0, m[row] * c[0] + m[row + 1] * c[1] + m[row + 2] * c[2] + m[row + 3] + m[row + 4]),
            ),
        ),
      );
      return (out[0] << 16) | (out[1] << 8) | out[2];
    };
    // A hue turn keeps white white (so the lift toward white and the turn commute).
    expect(apply(hueMatrix(73), 0xffffff)).toBe(0xffffff);
    for (const species of SPECIES_IDS) {
      for (const c of PET_COLORS) expect(paleness(species, c)).toBe(0);
      expect(recolorMatrix(species, SPECIES[species].color)).toBeNull();
      const body = swatch[SPECIES[species].color as ColorName].fill;
      const seen: { color: PetColor; rgb: number }[] = ALL_PET_COLORS.map((color) => ({
        color,
        rgb: apply(recolorMatrix(species, color), body),
      }));
      for (const c of MIXED_COLORS) {
        const p = paleness(species, c);
        expect(p, `${species} ${c}`).toBeGreaterThanOrEqual(0);
        expect(p, `${species} ${c}`).toBeLessThanOrEqual(0.5);
      }
      // Each mixed colour on the species' body differs from every other of its fourteen colours.
      for (const a of seen)
        for (const b of seen)
          if (a.color < b.color && (MIXED_COLORS as readonly string[]).includes(a.color))
            expect(oklabDistance(a.rgb, b.rgb), `${species}: ${a.color} vs ${b.color}`).toBeGreaterThan(3);
    }
  });
});
