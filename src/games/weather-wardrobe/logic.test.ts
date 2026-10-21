import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { GROUND_TOUCH, ITEM_NAMES, ITEM_WORDS, ITEMS, itemsFor, itemToTap, outfits, WARDROBE_PLANS, WEATHERS, type Item } from './logic';

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
    for (const plan of WARDROBE_PLANS.filter((p) => p.mode !== 'play')) {
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
            expect(o.remove?.sort()).toEqual(itemsFor(o.weathers[0]).sort());
            expect(o.needed.sort()).toEqual(itemsFor(o.weathers[1]).sort());
            expect(o.remove!.length).toBeGreaterThan(0);
            expect(o.needed.length).toBeGreaterThan(0);
          }
          if (i > 0 && plan.mode !== 'trip') expect(o.weathers[0]).not.toBe(rounds[i - 1].weathers[0]);
        });
      }
    }
  });

  it("gives the ghost finger's bot only things that fit the weather, each once, until the outfit is complete", () => {
    for (const plan of WARDROBE_PLANS.filter((p) => p.mode !== 'play')) {
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
});
