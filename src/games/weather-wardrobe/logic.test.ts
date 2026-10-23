import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { GROUND_TOUCH, ITEM_NAMES, MISFIT, SHIELD, ITEM_WORDS, ITEMS, itemsFor, itemToTap, outfitFor, outfits, SLOTS, STICKER_ITEMS, tripPlays, WARDROBE_PLANS, WEATHERS, wardrobePlan, type Item } from './logic';

describe('Weather Wardrobe', () => {
  it('gives every weather at least two things to wear, each spoken plainly', () => {
    for (const w of WEATHERS) expect(itemsFor(w).length).toBeGreaterThanOrEqual(2);
    for (const item of Object.keys(ITEMS)) expect(ITEM_WORDS[item as keyof typeof ITEMS]).toBeTruthy();
  });

  it('names every worn item at level 1, and the grass answers each weather its own way', () => {
    for (const item of Object.keys(ITEMS) as Item[]) {
      expect(ITEM_NAMES[item]).toBeTruthy();
      // The name is the start of the "is for … days" line, so the two never disagree.
      expect(ITEM_WORDS[item].startsWith(ITEM_NAMES[item])).toBe(true);
    }
    expect(new Set(WEATHERS.map((w) => GROUND_TOUCH[w])).size).toBe(WEATHERS.length);
  });

  it('offers the right things to wear among distinct choices from other weathers', () => {
    for (const plan of WARDROBE_PLANS.filter((p) => !['play', 'sky'].includes(p.mode))) {
      for (let seed = 1; seed <= 300; seed++) {
        const rounds = outfits(plan, new Rng(seed));
        expect(rounds).toHaveLength(plan.rounds);
        rounds.forEach((o, i) => {
          expect(o.options, plan.name).toHaveLength(plan.choices);
          expect(new Set(o.options).size).toBe(o.options.length);
          for (const item of o.needed) expect(o.options).toContain(item);
          // Everything offered is either needed or clearly for a weather that is not coming.
          const current = plan.mode === 'change' ? o.weathers[1] : null;
          for (const item of o.options) expect(o.needed.includes(item) || (current ? ITEMS[item] !== current : !o.weathers.includes(ITEMS[item]))).toBe(true);
          for (const item of o.needed) {
            if (plan.mode === 'trip') expect(o.weathers).toContain(ITEMS[item]);
            else expect(current ?? o.weathers[0]).toBe(ITEMS[item]);
          }
          if (plan.mode === 'pick') expect(o.needed).toHaveLength(1);
          if (plan.mode === 'trip') expect(new Set(o.weathers).size).toBe(2);
          if (plan.mode === 'change') {
            expect(o.weathers).toHaveLength(2);
            expect(o.weathers[0]).not.toBe(o.weathers[1]);
            for (const item of o.remove!) expect(ITEMS[item]).toBe(o.weathers[0]);
            expect(o.remove!.length).toBe(new Set(itemsFor(o.weathers[0]).map((i) => SLOTS[i])).size);
            expect(o.needed.length).toBe(new Set(itemsFor(o.weathers[1]).map((i) => SLOTS[i])).size);
            expect(o.remove!.length).toBeGreaterThan(0);
            expect(o.needed.length).toBeGreaterThan(0);
          }
          if (i > 0 && plan.mode !== 'trip') expect(o.weathers[0]).not.toBe(rounds[i - 1].weathers[0]);
        });
      }
    }
  });

  it('never puts two things in one slot, and a whole outfit fills every slot its weather uses', () => {
    const slotsOf = (items: Item[]) => items.map((i) => SLOTS[i]);
    for (let seed = 1; seed <= 200; seed++) {
      for (const w of WEATHERS) {
        const outfit = outfitFor(w, new Rng(seed));
        for (const item of outfit) expect(ITEMS[item]).toBe(w);
        expect(new Set(slotsOf(outfit)).size).toBe(outfit.length);
        expect(new Set(slotsOf(outfit))).toEqual(new Set(slotsOf(itemsFor(w))));
      }
      for (const plan of WARDROBE_PLANS.filter((p) => !['play', 'sky'].includes(p.mode))) {
        for (const o of outfits(plan, new Rng(seed))) {
          const sets = plan.mode === 'trip' ? o.weathers.map((w) => o.needed.filter((i) => ITEMS[i] === w)) : [o.needed, ...(o.remove ? [o.remove] : [])];
          for (const set of sets) expect(new Set(slotsOf(set)).size, plan.name).toBe(set.length);
        }
      }
    }
  });

  it('asks for three things every round of level 5, and changes outfits that match what she just put on', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const o of outfits(wardrobePlan(5), new Rng(seed))) expect(o.needed).toHaveLength(3);
      const change = outfits(wardrobePlan(7), new Rng(seed));
      for (let i = 1; i < change.length; i++) expect([...change[i].remove!].sort()).toEqual([...change[i - 1].needed].sort());
    }
  });

  it('keeps the sticker to the original eight items, so old stickers look the same', () => {
    expect(STICKER_ITEMS).toEqual(['sunhat', 'sunglasses', 'raincoat', 'umbrella', 'boots', 'beanie', 'scarf', 'mittens']);
    for (const w of WEATHERS) expect(STICKER_ITEMS.some((i) => ITEMS[i] === w)).toBe(true);
  });

  it("gives the ghost finger's bot only things that fit the weather, each once, until the outfit is complete", () => {
    for (const plan of WARDROBE_PLANS.filter((p) => !['play', 'sky'].includes(p.mode))) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const o of outfits(plan, new Rng(seed))) {
          const used = new Set<Item>();
          for (let item = itemToTap(o, used); item; item = itemToTap(o, used)) {
            expect(o.options).toContain(item);
            if (plan.mode === 'trip') expect(o.weathers).toContain(ITEMS[item]);
            else expect(plan.mode === 'change' ? o.weathers[1] : o.weathers[0]).toBe(ITEMS[item]);
            expect(used.has(item)).toBe(false);
            used.add(item);
          }
          expect([...used].sort()).toEqual([...o.needed].sort());
        }
      }
    }
  });

  it('gives every weather a misfit consequence and a fitting shield for level 8', () => {
    expect(new Set(WEATHERS.map((w) => MISFIT[w])).size).toBe(WEATHERS.length);
    for (const w of WEATHERS) expect(ITEMS[SHIELD[w]]).toBe(w);
  });

  it('level 8 gives three different weathers, one fitting item and one misfit from another weather', () => {
    const plan = wardrobePlan(8);
    expect(plan.mode).toBe('try');
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = outfits(plan, new Rng(seed));
      expect(rounds).toHaveLength(3);
      expect(new Set(rounds.map((o) => o.weathers[0])).size).toBe(3);
      for (const o of rounds) {
        expect(o.options).toHaveLength(2);
        expect(o.needed).toEqual([SHIELD[o.weathers[0]]]);
        const fits = o.options.filter((i) => ITEMS[i] === o.weathers[0]);
        expect(fits).toEqual(o.needed);
      }
    }
  });

  it('level 6 unpacks each weather\'s packed things in forecast order', () => {
    for (let seed = 1; seed <= 300; seed++) {
      for (const o of outfits(wardrobePlan(6), new Rng(seed))) {
        const plays = tripPlays(o);
        expect(plays.map((p) => p.weather)).toEqual(o.weathers);
        for (const p of plays) {
          expect(p.items).toHaveLength(2);
          for (const item of p.items) expect(ITEMS[item]).toBe(p.weather);
        }
        expect(plays.flatMap((p) => p.items).sort()).toEqual([...o.needed].sort());
      }
    }
  });

  it('level 9 shows an outfit that fits exactly one of three different skies, never repeating a weather', () => {
    const plan = wardrobePlan(9);
    expect(plan.mode).toBe('sky');
    for (let seed = 1; seed <= 300; seed++) {
      const rounds = outfits(plan, new Rng(seed));
      expect(rounds).toHaveLength(3);
      expect(new Set(rounds.map((o) => o.answer)).size).toBe(3);
      for (const o of rounds) {
        expect(new Set(o.skies).size).toBe(3);
        expect(o.skies).toContain(o.answer);
        expect(o.skies!.filter((w) => o.worn!.every((i) => ITEMS[i] === w))).toEqual([o.answer]);
        expect(new Set(o.worn!.map((i) => SLOTS[i])).size).toBe(o.worn!.length);
        expect(o.worn).toHaveLength(2);
      }
    }
  });
});
