import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { coinArt, marketStall } from './index';
import { anotherWay, coinToName, PIP_NUMERAL, pips, teachLine, hintCharge, missKind, stickerGood, fewest, makeOrders, PAID, paymentFor, payTouch, PLANS, sameWay, sum, target, usesFewestCoins } from './logic';

describe('Market Stall', () => {
  it('asks for amounts from 1 to 10 that the level\'s coins can make, never the same twice running', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toHaveLength(plan.orders);
        orders.forEach((o, i) => {
          const t = target(plan, o);
          expect(t).toBeGreaterThanOrEqual(1);
          expect(t).toBeLessThanOrEqual(10);
          expect(sum(fewest(t, plan.coins))).toBe(t);
          for (const p of o.prices) expect(p).toBeGreaterThanOrEqual(plan.price[0]), expect(p).toBeLessThanOrEqual(plan.price[1]);
          if (i > 0) expect(t).not.toBe(target(plan, orders[i - 1]));
          if (plan.mode === 'pair') expect(o.prices).toHaveLength(2);
          if (plan.mode === 'change') expect(t).toBe(PAID - o.prices[0]);
        });
      }
    }
  });

  it('suggests the fewest coins, and a genuinely different second way to pay', () => {
    expect(fewest(8, [1, 2, 5])).toEqual([5, 2, 1]);
    expect(fewest(4, [1])).toEqual([1, 1, 1, 1]);
    expect(sameWay([5, 2, 1], [1, 5, 2])).toBe(true);
    for (let amount = 2; amount <= 10; amount++) {
      for (const first of [fewest(amount, [1, 2, 5]), Array(amount).fill(1)]) {
        const second = anotherWay(amount, [1, 2, 5], first);
        expect(sum(second)).toBe(amount);
        expect(sameWay(second, first)).toBe(false);
      }
    }
  });

  it('makes every fewest-coins price with a minimum-size payment, while a longer exact payment is not enough', () => {
    const plan = PLANS.find((entry) => entry.mode === 'fewest')!;
    for (let amount = plan.price[0]; amount <= plan.price[1]; amount++) {
      const payment = fewest(amount, plan.coins);
      expect(usesFewestCoins(amount, plan.coins, payment)).toBe(true);
      expect(usesFewestCoins(amount, plan.coins, Array(amount).fill(1))).toBe(false);
    }
  });

  it("pays every order exactly with coins the counter has room for, the second way different from the first, so the demonstration never bounces", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 100; seed++) {
        for (const order of makeOrders(plan, new Rng(seed))) {
          const want = target(plan, order);
          let firstWay: number[] | null = null;
          for (let way = 0; way < (plan.mode === 'ways' ? 2 : 1); way++) {
            const pay = paymentFor(plan, order, firstWay);
            expect(sum(pay), `${plan.name} seed ${seed}`).toBe(want);
            expect(pay.length).toBeLessThanOrEqual(12);
            for (const c of pay) expect(plan.coins).toContain(c);
            if (firstWay) expect(sameWay(pay, firstWay)).toBe(false);
            // Touch by touch: a coin each time until the amount is down, then the bell.
            const mat: number[] = [];
            for (let touch = payTouch(pay, mat); touch !== 'bell'; touch = payTouch(pay, mat)) mat.push(touch.coin);
            expect(mat).toEqual(pay);
            firstWay = pay;
          }
        }
      }
    }
  });
  it('explains amount errors with specific, applicable feedback', () => {
    expect(missKind(PLANS[5], { prices: [4] }, [2, 2])).toBe('price');
    expect(missKind(PLANS[3], { prices: [3, 4] }, [2, 1])).toBe('one-price');
    expect(missKind(PLANS[2], { prices: [4] }, [2, 1, 1, 1])).toBe('counted-coins');
    expect(missKind(PLANS[2], { prices: [4] }, [2, 1])).toBe('one-more');
    expect(missKind(PLANS[2], { prices: [4] }, [5])).toBe('one-less');
    expect(missKind(PLANS[2], { prices: [3] }, [5])).toBe('big-coin');
    expect(missKind(PLANS[2], { prices: [9] }, [2])).toBe('short');
    expect(missKind(PLANS[2], { prices: [3] }, [2, 2, 2, 2])).toBe('over');
    for (const plan of PLANS) for (const order of makeOrders(plan, new Rng(37))) {
      const want = target(plan, order);
      expect(missKind(plan, order, fewest(want, plan.coins))).toBeNull();
      for (let amount = 1; amount <= 12; amount++) {
        const coins = Array(amount).fill(1);
        const kind = missKind(plan, order, coins);
        expect(kind === null).toBe(amount === want);
        if (kind === 'price') expect(plan.mode).toBe('change');
        if (kind === 'one-price') expect(plan.mode).toBe('pair');
        if (kind === 'one-more') expect(amount).toBe(want - 1);
        if (kind === 'one-less') expect(amount).toBe(want + 1);
      }
    }
  });

  it('charges help once across both payments of an order', () => {
    expect(hintCharge(1, false, false)).toBe(0);
    expect(hintCharge(2, false, false)).toBe(1);
    expect(hintCharge(3, true, true)).toBe(0);
    expect(hintCharge(2, false, true)).toBe(0);
  });

  it('describes only real levels and includes every plan in school', () => {
    expect(marketStall.levels('school')).toEqual({ min: 3, max: PLANS.length });
    expect(marketStall.describeLevel(0)).toBeUndefined();
    expect(marketStall.describeLevel(PLANS.length + 1)).toBeUndefined();
  });

  it('pins the original six-fruit sticker draw and shared shell drawings', () => {
    expect(Array.from({ length: 100 }, (_, seed) => stickerGood(new Rng(seed)))).toMatchSnapshot('fruit draws');
    // Pin actual fruit geometry/color as well as the RNG draw and coin recipes.
    const serialize = (node: import('pixi.js').Container): unknown => {
      const g = node as import('pixi.js').Graphics;
      const text = node as import('pixi.js').Text;
      return {
        x: node.x, y: node.y, scale: [node.scale.x, node.scale.y],
        drawing: g.context?.instructions.map(i => {
          if (i.action === 'texture') throw new Error('Sticker art must remain code-drawn');
          const { texture: _texture, ...style } = i.data.style;
          return { action: i.action, path: i.data.path.instructions, style };
        }),
        text: text.text, children: node.children.map(serialize),
      };
    };
    expect(Array.from({ length: 100 }, (_, seed) => {
      const art = marketStall.sticker(seed);
      const fingerprint = [...JSON.stringify(serialize(art))].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
      art.destroy({ children: true });
      return fingerprint;
    })).toMatchSnapshot('sticker art');
    for (const value of [1, 2, 5]) {
      const art = coinArt(value);
      const g = art.children[0] as import('pixi.js').Graphics;
      const drawing = g.context.instructions.map(i => {
        if (i.action === 'texture') throw new Error('Shells must remain code-drawn');
        const { texture: _texture, ...style } = i.data.style;
        return { action: i.action, path: i.data.path.instructions, style };
      });
      const fingerprint = [...JSON.stringify(drawing)].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0, 2166136261);
      expect(fingerprint).toMatchSnapshot(`coin ${value} drawing`);
      const text = art.children[1] as import('pixi.js').Text;
      expect([text.text, text.style.fontSize, text.style.fill]).toMatchSnapshot(`coin ${value} numeral`);
      art.destroy({ children: true });
    }
  });


  it('names only a coin that is new at levels 2 and 3, and only once per game start', () => {
    const none = new Set<number>();
    expect(coinToName(1, 1, none)).toBeNull();
    expect(coinToName(2, 1, none)).toBeNull();
    expect(coinToName(2, 2, none)).toBe('two');
    expect(coinToName(2, 5, none)).toBeNull();
    expect(coinToName(3, 5, none)).toBe('five');
    expect(coinToName(3, 2, none)).toBeNull();
    expect(coinToName(2, 2, new Set([2]))).toBeNull();
    for (let level = 4; level <= PLANS.length; level++) for (const c of [1, 2, 5]) expect(coinToName(level, c, none)).toBeNull();
  });
  it('draws one pip per shell of value, five to a row, inside the coin and clear of its rim dots', () => {
    for (const value of [1, 2, 3, 5, 10]) for (const r of [30, 35, 40, 44]) {
      const dots = pips(value, r);
      expect(dots).toHaveLength(value);
      const rows = new Map<number, number>();
      for (const d of dots) {
        rows.set(d.y, (rows.get(d.y) ?? 0) + 1);
        // Inside the coin's 4-unit outline.
        expect(Math.hypot(d.x, d.y) + d.r).toBeLessThan(r - 2);
        // Below the numeral (font size 0.95r, its glyphs about 0.35r either side of center, then scaled and lifted) and clear of the rim dots at 0.78r.
        expect(d.y - d.r).toBeGreaterThan(r * (PIP_NUMERAL.y + 0.35 * PIP_NUMERAL.scale));
        if (value <= 5) for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          expect(Math.hypot(d.x - Math.cos(a) * r * 0.78, d.y - Math.sin(a) * r * 0.78)).toBeGreaterThan(d.r + r * 0.08);
        }
      }
      expect([...rows.values()].every((n) => n <= 5)).toBe(true);
      if (value === 10) expect([...rows.values()]).toEqual([5, 5]);
    }
  });

  it('teaches a strategy before the faint coins only at mix, ways and fewest, and the strategy pays legally', () => {
    PLANS.forEach((plan) => {
      if (!['mix', 'ways', 'fewest'].includes(plan.mode)) return void expect(teachLine(plan, null)).toBeNull();
      expect(teachLine(plan, null)).toBe('biggest');
      for (let want = plan.price[0]; want <= plan.price[1]; want++) {
        // Biggest coin that fits first is the payment the hint then shows.
        const biggest = fewest(want, plan.coins);
        expect(sum(biggest)).toBe(want);
        expect(usesFewestCoins(want, plan.coins, biggest)).toBe(true);
        if (plan.mode !== 'ways') continue;
        // On the second way, the hint swaps coins rather than repeating the first way.
        for (const first of [biggest, fewest(want, [1, 2]), Array(want).fill(1)]) {
          expect(teachLine(plan, first)).toBe('swap');
          const second = anotherWay(want, plan.coins, first);
          expect(sum(second)).toBe(want);
          expect(sameWay(second, first)).toBe(false);
        }
      }
    });
  });
});
