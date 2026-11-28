import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import { prop } from '../../art/props';
import { computeView } from '../../engine/view';
import { coinArt, marketStall, STALLS } from './index';
import {
  STALL_IDS,
  stallFor,
  stallLayout,
  goodPlacement,
  anotherWay,
  coinToName,
  PIP_NUMERAL,
  pips,
  teachLine,
  hintCharge,
  missKind,
  stickerGood,
  fewest,
  makeOrders,
  PAID,
  paidFor,
  stripLayout,
  paidCoins,
  countUpHint,
  hintCountsUp,
  paymentFor,
  payTouch,
  PLANS,
  LEVELS,
  sameWay,
  sum,
  target,
  usesFewestCoins,
  countsUp,
  showsTotal,
  totalShown,
  TOTAL_SLATE,
  countUpWords,
  countUpText,
  countUpSaid,
  tenStrip,
  makePurse,
  purseCards,
  purseMiss,
  countOn,
  PURSE_MAX,
  TARGET_MAX,
  COIN_R,
  MAT_STEP,
  matCoinScale,
  matSlot,
  TAG,
  tagMarks,
  purseFor,
  affordHint,
  affordSlot,
  canBuy,
  chooseTap,
  GOOD_HIT,
  shelfX,
  spendBell,
  spendHint,
  spendsAll,
  type AffordOrder,
} from './logic';

/** Every level where she pays; the purse level asks for a total instead, and the afford level asks what a purse can buy. */
const PAYING = PLANS.filter((p) => p.mode !== 'purse' && p.mode !== 'afford' && p.mode !== 'trade');

describe('Market Stall', () => {
  it('seeds every stall reproducibly, with distinct awnings, keepers and enough named goods for paired orders', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const stall = stallFor(new Rng(seed));
      expect(stall).toBe(stallFor(new Rng(seed)));
      seen.add(stall);
    }
    expect([...seen].sort()).toEqual([...STALL_IDS].sort());
    expect(new Set(STALL_IDS.map((id) => STALLS[id].awning)).size).toBe(3);
    expect(new Set(STALL_IDS.map((id) => STALLS[id].keeper)).size).toBe(3);
    for (const id of STALL_IDS) {
      const goods = STALLS[id].goods;
      expect(new Set(goods.map((g) => g.name)).size).toBe(goods.length);
      expect(goods.length).toBeGreaterThanOrEqual(2);
      if (id !== 'fruit') expect(goods.every((g) => g.kind === id)).toBe(true);
    }
  });

  it('keeps every stock drawing and price tag on screen, clear of the pet, payment mat and each other at four views', () => {
    for (const [w, h] of [
      [1024, 768],
      [1366, 768],
      [768, 1024],
      [844, 390],
    ]) {
      const view = computeView(w, h);
      const { cy, stockX } = stallLayout(view);
      for (const id of STALL_IDS)
        for (const good of STALLS[id].goods)
          for (const count of [1, 2]) {
            for (let i = 0; i < count; i++) {
              const place = goodPlacement(good.kind, count, i);
              const art = prop(good.kind, good.color);
              art.scale.set(place.scale);
              art.position.set(stockX + place.x, cy + place.y);
              const b = art.getBounds();
              const tag = {
                left: stockX + place.x - 56,
                right: stockX + place.x + 56,
                top: cy - 194,
                bottom: cy - 106,
              };
              expect(b.x).toBeGreaterThan(150); // pet's left-hand space
              expect(b.x + b.width).toBeLessThan(view.w);
              expect(b.y).toBeGreaterThan(tag.bottom);
              expect(b.y + b.height).toBeLessThan(cy + 70); // top of payment mat
              expect(tag.left).toBeGreaterThan(150);
              expect(tag.right).toBeLessThan(view.w);
              expect(tag.top).toBeGreaterThan(158.5); // awning's scalloped edge
              expect(b.width).toBeLessThan(150); // paired goods are 150 apart
              art.destroy({ children: true });
            }
          }
    }
  });

  it("asks for amounts the level's coins can make (to 10, or 11 to 20 with the ten-shell coin), never the same twice running", () => {
    for (const plan of PAYING) {
      for (let seed = 1; seed <= 300; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toHaveLength(plan.orders);
        orders.forEach((o, i) => {
          const t = target(plan, o);
          expect(t).toBeGreaterThanOrEqual(1);
          expect(t).toBeLessThanOrEqual(plan.coins.includes(10) ? TARGET_MAX : 10);
          expect(sum(fewest(t, plan.coins))).toBe(t);
          for (const p of o.prices)
            (expect(p).toBeGreaterThanOrEqual(plan.price[0]), expect(p).toBeLessThanOrEqual(plan.price[1]));
          if (i > 0) expect(t).not.toBe(target(plan, orders[i - 1]));
          if (plan.mode === 'pair') expect(o.prices).toHaveLength(2);
          if (plan.mode === 'change') expect(t).toBe(paidFor(plan) - o.prices[0]);
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

  it('pays every order exactly with coins the counter has room for, the second way different from the first, so the demonstration never bounces', () => {
    for (const plan of PAYING) {
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
            for (let touch = payTouch(pay, mat); touch !== 'bell'; touch = payTouch(pay, mat))
              mat.push(touch.coin);
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
    for (const plan of PAYING)
      for (const order of makeOrders(plan, new Rng(37))) {
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
    expect(marketStall.levels('school')).toEqual(LEVELS.school);
    expect(marketStall.describeLevel(0)).toBeUndefined();
    expect(marketStall.describeLevel(PLANS.length + 1)).toBeUndefined();
  });

  it('pins the original six-fruit sticker draw and shared shell drawings', () => {
    expect(Array.from({ length: 100 }, (_, seed) => stickerGood(new Rng(seed)))).toMatchSnapshot(
      'fruit draws',
    );
    // Pin actual fruit geometry/color as well as the RNG draw and coin recipes.
    const serialize = (node: import('pixi.js').Container): unknown => {
      const g = node as import('pixi.js').Graphics;
      const text = node as import('pixi.js').Text;
      return {
        x: node.x,
        y: node.y,
        scale: [node.scale.x, node.scale.y],
        drawing: g.context?.instructions.map((i) => {
          if (i.action === 'texture') throw new Error('Sticker art must remain code-drawn');
          const { texture: _texture, ...style } = i.data.style;
          return { action: i.action, path: i.data.path.instructions, style };
        }),
        text: text.text,
        children: node.children.map(serialize),
      };
    };
    expect(
      Array.from({ length: 100 }, (_, seed) => {
        const art = marketStall.sticker(seed);
        const fingerprint = [...JSON.stringify(serialize(art))].reduce(
          (h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0,
          2166136261,
        );
        art.destroy({ children: true });
        return fingerprint;
      }),
    ).toMatchSnapshot('sticker art');
    for (const value of [1, 2, 5]) {
      const art = coinArt(value);
      const g = art.children[0] as import('pixi.js').Graphics;
      const drawing = g.context.instructions.map((i) => {
        if (i.action === 'texture') throw new Error('Shells must remain code-drawn');
        const { texture: _texture, ...style } = i.data.style;
        return { action: i.action, path: i.data.path.instructions, style };
      });
      const fingerprint = [...JSON.stringify(drawing)].reduce(
        (h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0,
        2166136261,
      );
      expect(fingerprint).toMatchSnapshot(`coin ${value} drawing`);
      const text = art.children[1] as import('pixi.js').Text;
      expect([text.text, text.style.fontSize, text.style.fill]).toMatchSnapshot(`coin ${value} numeral`);
      art.destroy({ children: true });
    }
  });

  it('names only a coin that is new at its level (2, 3 and 9), and only once per game start', () => {
    const none = new Set<number>();
    expect(coinToName(1, 1, none)).toBeNull();
    expect(coinToName(2, 1, none)).toBeNull();
    expect(coinToName(2, 2, none)).toBe('two');
    expect(coinToName(2, 5, none)).toBeNull();
    expect(coinToName(3, 5, none)).toBe('five');
    expect(coinToName(3, 2, none)).toBeNull();
    expect(coinToName(2, 2, new Set([2]))).toBeNull();
    for (let level = 4; level <= PLANS.length; level++)
      for (const c of [1, 2, 5]) expect(coinToName(level, c, none)).toBeNull();
    expect(coinToName(9, 10, none)).toBe('ten');
    expect(coinToName(9, 10, new Set([10]))).toBeNull();
    expect(coinToName(10, 10, none)).toBeNull();
    expect(coinToName(PLANS.length + 1, 10, none)).toBeNull();
  });
  it('draws one pip per shell of value, five to a row, inside the coin and clear of its rim dots', () => {
    for (const value of [1, 2, 3, 5, 10])
      for (const r of [30, 35, 40, 44]) {
        const dots = pips(value, r);
        expect(dots).toHaveLength(value);
        const rows = new Map<number, number>();
        for (const d of dots) {
          rows.set(d.y, (rows.get(d.y) ?? 0) + 1);
          // Inside the coin's 4-unit outline.
          expect(Math.hypot(d.x, d.y) + d.r).toBeLessThan(r - 2);
          // Below the numeral (font size 0.95r, its glyphs about 0.35r either side of center, then scaled and lifted) and clear of the rim dots at 0.78r.
          expect(d.y - d.r).toBeGreaterThan(r * (PIP_NUMERAL.y + 0.35 * PIP_NUMERAL.scale));
          if (value <= 5)
            for (let i = 0; i < 8; i++) {
              const a = (i * Math.PI) / 4;
              expect(Math.hypot(d.x - Math.cos(a) * r * 0.78, d.y - Math.sin(a) * r * 0.78)).toBeGreaterThan(
                d.r + r * 0.08,
              );
            }
        }
        expect([...rows.values()].every((n) => n <= 5)).toBe(true);
        if (value === 10) expect([...rows.values()]).toEqual([5, 5]);
      }
  });

  it('teaches a strategy before the faint coins only at mix, ways and fewest, and the strategy pays legally', () => {
    PLANS.forEach((plan) => {
      if (!['mix', 'ways', 'fewest'].includes(plan.mode))
        return void expect(teachLine(plan, null)).toBeNull();
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

  describe('a total she can see (TotoLogic P8)', () => {
    it('stays hidden on pair, change, purse and Which coin? levels', () => {
      expect(PLANS.filter((p) => !showsTotal(p)).map((p) => PLANS.indexOf(p) + 1)).toEqual([
        4, 6, 8, 10, 11, 14,
      ]);
      expect(PLANS.filter(showsTotal).map((p) => PLANS.indexOf(p) + 1)).toEqual([1, 2, 3, 5, 7, 9, 12, 13]);
    });

    it('is the sum of the coins on the counter, and nothing while the counter is empty', () => {
      for (const plan of PLANS.filter(showsTotal)) {
        expect(totalShown(plan, [])).toBeNull();
        expect(totalShown(plan, [5, 2, 1])).toBe(8);
        expect(totalShown(plan, [1])).toBe(1);
      }
    });

    it('never shows in pair or change mode, whatever is on the counter', () => {
      for (const plan of PLANS.filter((p) => !showsTotal(p)))
        for (const coins of [[], [1], [5, 2, 1], Array(12).fill(5)])
          expect(totalShown(plan, coins)).toBeNull();
    });

    it('never gives the answer away: the slate shows the same number for a right and a wrong payment of one size', () => {
      const plan = PLANS[2];
      expect(totalShown(plan, [5, 2])).toBe(totalShown(plan, [2, 2, 2, 1]));
    });

    it('sits above the mat, clear of the coins and of the faint hint coins', () => {
      // Coins on the mat: rows of six from x -200 by 80, top row at y -32, the biggest stall coin 40 in radius.
      expect(TOTAL_SLATE.y + TOTAL_SLATE.h / 2).toBeLessThanOrEqual(-32 - 40);
      // Hint coins: at most five, from x -200 by 60 at 0.7 scale (radius 28).
      expect(TOTAL_SLATE.x - TOTAL_SLATE.w / 2).toBeGreaterThan(-200 + 4 * 60 + 28);
      // Inside the mat's width, so it stays on the stall front beside the bell.
      expect(TOTAL_SLATE.x + TOTAL_SLATE.w / 2).toBeLessThanOrEqual(250);
    });
  });

  describe('count up the change (fresh 4)', () => {
    /** Every way to pay an amount with the plan's coins, in every order the coins could land. */
    const payments = (amount: number, coins: number[]): number[][] =>
      amount === 0
        ? [[]]
        : coins.filter((c) => c <= amount).flatMap((c) => payments(amount - c, coins).map((p) => [c, ...p]));

    it('only the change levels count up', () => {
      expect(PLANS.filter(countsUp).map((p) => PLANS.indexOf(p) + 1)).toEqual([6, 11]);
    });

    it('a correct change counts up one at a time from the price and ends on what they paid', () => {
      const plan = PLANS.find(countsUp)!;
      for (let price = plan.price[0]; price <= plan.price[1]; price++)
        for (const coins of payments(PAID - price, plan.coins)) {
          let before = 0;
          const said: number[] = [];
          for (const v of coins) {
            said.push(...countUpWords(price, before, v));
            before += v;
          }
          expect(said[0]).toBe(price);
          said.forEach((n, i) => i && expect(n).toBe(said[i - 1] + 1));
          expect(said.at(-1)).toBe(PAID);
        }
    });

    it('each coin says as many numbers as it is worth, and the price only before the first', () => {
      for (const v of [1, 2, 5]) {
        expect(countUpWords(7, 0, v)).toHaveLength(v + 1);
        expect(countUpWords(7, 1, v)).toHaveLength(v);
        expect(countUpWords(7, 1, v)[0]).toBe(9);
      }
      expect(countUpText(countUpWords(7, 0, 2), 7)).toBe('7… 8, 9');
      expect(countUpText(countUpWords(7, 2, 1), 7)).toBe('10');
      // The coin's own value is still said first.
      expect(countUpSaid(7, 0, 2)).toBe('2. 7… 8, 9');
      expect(countUpSaid(7, 2, 1)).toBe('1. 10');
    });

    it('the ten strip shows the price, then the change, and never more than ten cells', () => {
      for (let price = 1; price < PAID; price++)
        for (let given = 0; given <= 15; given++) {
          const { cells, over } = tenStrip(price, given);
          expect(cells).toHaveLength(PAID);
          expect(cells.filter((c) => c === 'price')).toHaveLength(price);
          expect(cells.filter((c) => c === 'change')).toHaveLength(Math.min(given, PAID - price));
          expect(over).toBe(Math.max(0, price + given - PAID));
          // Price cells come first, then change, then empty ones.
          expect(cells.join()).toBe(
            [...cells].sort((a, b) => 'pce'.indexOf(a[0]) - 'pce'.indexOf(b[0])).join(),
          );
        }
      expect(tenStrip(7, 3).cells.every((c) => c !== 'empty')).toBe(true);
    });
  });

  describe('level 8, How much is in the purse?', () => {
    const plan = PLANS[7];

    it('is a school level, appended after the fewest-coins level', () => {
      expect(plan.mode).toBe('purse');
      expect(marketStall.levels('school').max).toBeGreaterThanOrEqual(8);
      expect(marketStall.describeLevel(8)).toBe(plan.name);
    });

    it('lays three to six coins on the counter, largest first, worth 3 to 12 with a coin worth more than 1', () => {
      const totals = new Set<number>();
      for (let seed = 1; seed <= 400; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toHaveLength(plan.orders);
        orders.forEach((o, i) => {
          const purse = o.purse!;
          expect(o.prices).toEqual([]);
          expect(purse.length).toBeGreaterThanOrEqual(3);
          expect(purse.length).toBeLessThanOrEqual(PURSE_MAX);
          expect(purse).toEqual([...purse].sort((a, b) => b - a));
          for (const c of purse) expect(plan.coins).toContain(c);
          expect(purse.some((c) => c > 1)).toBe(true);
          const t = target(plan, o);
          expect(t).toBe(sum(purse));
          expect(t).toBeGreaterThanOrEqual(3);
          expect(t).toBeLessThanOrEqual(12);
          // Counting the coins as ones never gives the answer.
          expect(purse.length).not.toBe(t);
          if (i > 0) expect(t).not.toBe(target(plan, orders[i - 1]));
          totals.add(t);
        });
      }
      // Totals past ten come up, which the paying levels never ask for.
      expect(totals.has(11) && totals.has(12)).toBe(true);
      expect(makeOrders(plan, new Rng(9))).toEqual(makeOrders(plan, new Rng(9)));
    });

    it('offers three different cards: the total, the number of coins and a neighbour of the total', () => {
      for (let seed = 1; seed <= 300; seed++) {
        const rng = new Rng(seed);
        const purse = makePurse(plan, rng);
        const cards = purseCards(purse, rng);
        const total = sum(purse);
        expect(cards).toHaveLength(3);
        expect(new Set(cards).size).toBe(3);
        expect(cards).toContain(total);
        expect(cards).toContain(purse.length);
        const near = cards.find((n) => n !== total && n !== purse.length)!;
        expect(Math.abs(near - total)).toBe(1);
        expect(near).toBeGreaterThanOrEqual(1);
        // Every wrong card has a named kind, so no card gets the generic line.
        for (const n of cards)
          expect(purseMiss(purse, n)).toBe(n === total ? null : n === purse.length ? 'coins' : 'near');
      }
    });

    it('takes the neighbour above when the coin count is the one below (2, 1, 1, 1 is 5 in four coins)', () => {
      for (let seed = 1; seed <= 50; seed++)
        expect(purseCards([2, 1, 1, 1], new Rng(seed)).sort()).toEqual([4, 5, 6]);
    });

    it('names each wrong card by its kind', () => {
      expect(purseMiss([5, 2, 2, 1], 10)).toBeNull();
      expect(purseMiss([5, 2, 2, 1], 4)).toBe('coins');
      expect(purseMiss([5, 2, 2, 1], 9)).toBe('near');
      expect(purseMiss([5, 2, 2, 1], 11)).toBe('near');
      expect(purseMiss([5, 2, 2, 1], 7)).toBe('other');
    });

    it('counts the purse on, largest first, ending on the total (the hint leads to the right card)', () => {
      expect(countOn([5, 2, 2, 1])).toEqual([5, 7, 9, 10]);
      expect(countOn([1, 5, 2])).toEqual([5, 7, 8]);
      for (let seed = 1; seed <= 200; seed++) {
        const purse = makePurse(plan, new Rng(seed));
        const said = countOn(purse);
        expect(said).toHaveLength(purse.length);
        expect(said.at(-1)).toBe(sum(purse));
        said.forEach((n, i) => i && expect(n).toBeGreaterThan(said[i - 1]));
      }
    });

    it('never shows or says the running total, and keeps the paying hints away', () => {
      expect(showsTotal(plan)).toBe(false);
      expect(totalShown(plan, [5, 2, 2, 1])).toBeNull();
      expect(teachLine(plan, null)).toBeNull();
      expect(countsUp(plan)).toBe(false);
    });
  });

  describe('level 9, The ten-shell shell', () => {
    const plan = PLANS[8];

    it('is a mix level with a ten-shell coin in the purse and prices 11 to 20', () => {
      expect(plan.mode).toBe('mix');
      expect(plan.coins).toEqual([1, 2, 5, 10]);
      expect(marketStall.describeLevel(9)).toBe(plan.name);
      expect(showsTotal(plan)).toBe(true);
      expect(teachLine(plan, null)).toBe('biggest');
    });

    it('asks for every price from 11 to 20 over many rounds, never twice running', () => {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 400; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toHaveLength(plan.orders);
        orders.forEach((o, i) => {
          expect(o.prices).toHaveLength(1);
          const t = target(plan, o);
          expect(t).toBeGreaterThanOrEqual(11);
          expect(t).toBeLessThanOrEqual(TARGET_MAX);
          if (i > 0) expect(t).not.toBe(target(plan, orders[i - 1]));
          seen.add(t);
        });
      }
      expect([...seen].sort((a, b) => a - b)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    });

    it('pays every price with a ten in the fewest coins, within the twelve the counter holds, and the bot pays it', () => {
      for (let want = 10; want <= TARGET_MAX; want++) {
        const best = fewest(want, plan.coins);
        expect(sum(best)).toBe(want);
        expect(best[0]).toBe(10);
        expect(best.length).toBeLessThanOrEqual(12);
        // Greedy is the true minimum for 1, 2, 5 and 10: no exact payment uses fewer coins.
        const min = Array<number>(want + 1).fill(Infinity);
        min[0] = 0;
        for (let a = 1; a <= want; a++)
          for (const c of plan.coins) if (c <= a) min[a] = Math.min(min[a], min[a - c] + 1);
        expect(best.length).toBe(min[want]);
        const pay = paymentFor(plan, { prices: [want] }, null);
        expect(pay).toEqual(best);
        expect(payTouch(pay, pay)).toBe('bell');
      }
    });

    it('accepts any exact payment, and names the usual wrong ones', () => {
      const order = { prices: [14] };
      expect(missKind(plan, order, [10, 2, 2])).toBeNull();
      expect(missKind(plan, order, [5, 5, 2, 2])).toBeNull();
      expect(missKind(plan, order, Array(14).fill(1))).toBeNull();
      // Fourteen coins counted as fourteen, whatever they are worth.
      expect(missKind(plan, order, [10, ...Array(13).fill(1)])).toBe('counted-coins');
      expect(missKind(plan, order, [10, 2, 1])).toBe('one-more');
      expect(missKind(plan, order, [10, 5])).toBe('one-less');
      expect(missKind(plan, order, [10, 10])).toBe('over');
      expect(missKind(plan, order, [10])).toBe('short');
    });

    it('draws the mat coins so the ten-shell coin fits a mat column, and leaves other levels full size', () => {
      expect(matCoinScale(plan) * 2 * COIN_R[10]).toBeLessThanOrEqual(MAT_STEP);
      // Neighbouring coins on a row, and the rows, never meet.
      const r = matCoinScale(plan) * COIN_R[10];
      expect(matSlot(1).x - matSlot(0).x).toBeGreaterThanOrEqual(2 * r);
      expect(matSlot(6).y - matSlot(0).y + 1e-9).toBeGreaterThan(r * 1.4);
      // Bigger coins stay bigger on the mat.
      expect(COIN_R[10] * matCoinScale(plan)).toBeGreaterThan(COIN_R[5] * matCoinScale(plan));
      for (const p of PLANS.filter((q) => !q.coins.includes(10))) expect(matCoinScale(p)).toBe(1);
      // Twelve coins stay on the mat's box.
      for (let i = 0; i < 12; i++) {
        const at = matSlot(i);
        expect(Math.abs(at.x) + r).toBeLessThanOrEqual(250);
      }
    });

    it('draws each tag as dots to 10, then a ten bar and the ones, inside the tag at every price', () => {
      const inner = { x: TAG.w / 2 - 3, y: TAG.h / 2 - 3 };
      for (let price = 1; price <= TARGET_MAX; price++) {
        const m = tagMarks(price);
        expect(m.bar === null).toBe(price <= 10);
        expect(m.dots).toHaveLength(price <= 10 ? price : price - 10);
        for (const d of m.dots) {
          expect(Math.abs(d.x) + d.r).toBeLessThanOrEqual(inner.x);
          expect(d.y + d.r).toBeLessThanOrEqual(inner.y);
          if (m.bar) expect(d.y - d.r).toBeGreaterThan(m.bar.y + m.bar.h);
        }
        // Five dots to a row.
        const rows = new Map<number, number>();
        for (const d of m.dots) rows.set(d.y, (rows.get(d.y) ?? 0) + 1);
        expect([...rows.values()].every((n) => n <= 5)).toBe(true);
        if (m.bar) {
          expect(m.bar.x).toBeGreaterThanOrEqual(-inner.x);
          expect(m.bar.x + 10 * m.bar.cell).toBeLessThanOrEqual(inner.x);
          // Below the string hole and the numeral (its glyphs about 0.35 of the size either side of its centre).
          expect(m.bar.y).toBeGreaterThan(m.numeral.y + 0.35 * m.numeral.size);
          expect(m.numeral.y - 0.35 * m.numeral.size).toBeGreaterThan(TAG.hole.y + TAG.hole.r);
        }
      }
      // Up to ten the tag is unchanged.
      expect(tagMarks(7)).toEqual({
        numeral: { y: -8, size: 40 },
        bar: null,
        dots: Array.from({ length: 7 }, (_, i) => ({
          x: -40 + (i % 5) * 20,
          y: 22 + Math.floor(i / 5) * 14,
          r: 5,
        })),
      });
    });

    it('keeps the three-coin purse where it was and fits four coins along the foot', () => {
      const v = computeView(1024, 768);
      expect(purseFor(v, 3).map((p) => p.x)).toEqual([372, 542, 712]);
      const four = purseFor(v, 4);
      four.forEach((p, i) => i && expect(p.x - four[i - 1].x).toBeGreaterThanOrEqual(115));
    });
  });

  describe('level 10, Two baskets to twenty', () => {
    const plan = PLANS[9];

    it('adds three paired orders with a ten-shell coin to the school ladder', () => {
      expect(plan.mode).toBe('pair');
      expect(plan.coins).toEqual([1, 2, 5, 10]);
      expect(plan.orders).toBe(3);
      expect(marketStall.describeLevel(10)).toBe(plan.name);
    });

    it('seeds two distinct prices per order and reaches every sum from 11 to 19 without adjacent repeats', () => {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 300; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toEqual(makeOrders(plan, new Rng(seed)));
        let previous = 0;
        for (const order of orders) {
          expect(order.prices).toHaveLength(2);
          const [first, second] = order.prices;
          for (const price of order.prices) {
            expect(price).toBeGreaterThanOrEqual(4);
            expect(price).toBeLessThanOrEqual(10);
          }
          expect(first).not.toBe(second);
          const total = target(plan, order);
          expect(total).toBe(first + second);
          expect(total).toBeGreaterThanOrEqual(11);
          expect(total).toBeLessThanOrEqual(19);
          expect(total).not.toBe(previous);
          seen.add(total);
          previous = total;
        }
      }
      expect([...seen].sort((a, b) => a - b)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });

    it('suggests a short exact payment and accepts a payment without the ten', () => {
      for (let total = 11; total <= 19; total++) {
        const first = Math.min(total - 4, 10);
        const order = { prices: [first, total - first] };
        const pay = paymentFor(plan, order, null);
        expect(pay[0]).toBe(10);
        expect(pay.length).toBeLessThanOrEqual(12);
        expect(missKind(plan, order, pay)).toBeNull();
        expect(missKind(plan, order, [5, 5, ...pay.slice(1)])).toBeNull();
        for (const single of order.prices) {
          expect(missKind(plan, order, fewest(single, plan.coins))).toBe('one-price');
        }
      }
    });

    it('keeps the one-off, counted-coins and amount feedback for other payments', () => {
      const order = { prices: [4, 7] };
      expect(missKind(plan, order, [10])).toBe('one-more');
      expect(missKind(plan, order, [10, 2])).toBe('one-less');
      expect(missKind(plan, order, [2, ...Array(10).fill(1)])).toBe('counted-coins');
      expect(missKind(plan, order, [5])).toBe('short');
      expect(missKind(plan, order, [10, 5])).toBe('over');
    });
  });

  describe('level 11, Change from twenty', () => {
    const plan = PLANS[10];
    /** Every way to make an amount with the plan's coins, in every landing order. */
    const payments = (amount: number, coins: number[]): number[][] =>
      amount === 0
        ? [[]]
        : coins.filter((c) => c <= amount).flatMap((c) => payments(amount - c, coins).map((p) => [c, ...p]));

    it('tops the school ladder: three customers paying 20 for 11 to 19, change with ones, twos and fives', () => {
      expect(plan.mode).toBe('change');
      expect(plan.coins).toEqual([1, 2, 5]);
      expect(plan.price).toEqual([11, 19]);
      expect(paidFor(plan)).toBe(20);
      expect(paidFor(PLANS[5])).toBe(PAID);
      expect(plan.orders).toBe(3);
      expect(marketStall.levels('school')).toEqual(LEVELS.school);
      expect(marketStall.describeLevel(11)).toBe(plan.name);
      expect(hintCountsUp(plan)).toBe(true);
      expect(PLANS.filter(hintCountsUp)).toEqual([plan]);
    });

    it('asks for change 1 to 9, every amount payable in at most four coins, never the same change twice running', () => {
      const seen = new Set<number>();
      for (let seed = 1; seed <= 300; seed++) {
        const orders = makeOrders(plan, new Rng(seed));
        expect(orders).toEqual(makeOrders(plan, new Rng(seed)));
        orders.forEach((o, i) => {
          const price = o.prices[0];
          expect(price).toBeGreaterThanOrEqual(11);
          expect(price).toBeLessThanOrEqual(19);
          const change = target(plan, o);
          expect(change).toBe(20 - price);
          expect(change).toBeGreaterThanOrEqual(1);
          expect(change).toBeLessThanOrEqual(9);
          expect(fewest(change, plan.coins).length).toBeLessThanOrEqual(4);
          if (i) expect(change).not.toBe(target(plan, orders[i - 1]));
          seen.add(change);
        });
      }
      expect([...seen].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it('accepts any coins that make the change, not only the fewest, and counts every one up to 20', () => {
      for (let price = 11; price <= 19; price++) {
        const order = { prices: [price] };
        for (const coins of payments(20 - price, plan.coins)) {
          expect(missKind(plan, order, coins)).toBeNull();
          let before = 0;
          const said: number[] = [];
          for (const v of coins) (said.push(...countUpWords(price, before, v)), (before += v));
          expect(said[0]).toBe(price);
          said.forEach((n, i) => i && expect(n).toBe(said[i - 1] + 1));
          expect(said.at(-1)).toBe(20);
        }
      }
    });

    it('names giving back the price, and one off', () => {
      const order = { prices: [13] };
      expect(missKind(plan, order, [10, 2, 1])).toBe('price');
      expect(missKind(plan, order, [5, 1])).toBe('one-more');
      expect(missKind(plan, order, [5, 2, 1])).toBe('one-less');
      expect(missKind(plan, order, [2])).toBe('short');
      expect(missKind(plan, order, [5, 5])).toBe('over');
    });

    it('the bot gives the right change', () => {
      for (let price = 11; price <= 19; price++) {
        const pay = paymentFor(plan, { prices: [price] }, null);
        expect(sum(pay)).toBe(20 - price);
      }
    });

    it('the hint counts up smallest coin first, passing 15 on the way to 20 when the change is 5 or more', () => {
      expect(countUpHint(13, 20, plan.coins)).toEqual({ coins: [2, 5], stops: [15, 20] });
      expect(countUpHint(11, 20, plan.coins)).toEqual({ coins: [2, 2, 5], stops: [13, 15, 20] });
      for (let price = 11; price <= 19; price++) {
        const { coins, stops } = countUpHint(price, 20, plan.coins);
        expect(sum(coins)).toBe(20 - price);
        expect(coins).toEqual(fewest(20 - price, plan.coins).sort((a, b) => a - b));
        expect(stops.at(-1)).toBe(20);
        if (price < 15) expect(stops).toContain(15);
        // At most five faint coins fit left of the slate.
        expect(coins.length).toBeLessThanOrEqual(5);
      }
    });

    it('the two strips of ten fill to 20, and the price fills the whole first strip', () => {
      for (let price = 11; price <= 19; price++)
        for (let given = 0; given <= 12; given++) {
          const { cells, over } = tenStrip(price, given, 20);
          expect(cells).toHaveLength(20);
          expect(cells.slice(0, 10).every((c) => c === 'price')).toBe(true);
          expect(cells.filter((c) => c === 'change')).toHaveLength(Math.min(given, 20 - price));
          expect(over).toBe(Math.max(0, price + given - 20));
        }
    });

    it('draws the strips as one row of ten at level 6 and two rows at 11, between the tag and the goods, clear of the paid coins', () => {
      expect(new Set(stripLayout(10).cells.map((c) => c.y)).size).toBe(1);
      const two = stripLayout(20);
      expect(new Set(two.cells.map((c) => c.y)).size).toBe(2);
      for (const paid of [10, 20]) {
        const at = stripLayout(paid);
        // Cells of a row do not overlap, and each row's eleventh cell starts under its first.
        at.cells.forEach((c, i) => i % 10 && expect(c.x).toBeGreaterThanOrEqual(at.cells[i - 1].x + c.w));
        for (const c of at.cells) {
          expect(c.x).toBeGreaterThanOrEqual(at.frame.x);
          expect(c.x + c.w).toBeLessThanOrEqual(at.frame.x + at.frame.w);
          expect(at.y + c.y).toBeGreaterThanOrEqual(at.y + at.frame.y);
          expect(c.y + c.h).toBeLessThanOrEqual(at.frame.y + at.frame.h);
        }
        // Below the tag (at -150, 88 tall), the cells clear of the customer's coins (radius 44 at x 150).
        expect(at.y + at.frame.y).toBeGreaterThanOrEqual(-150 + TAG.h / 2);
        for (const coin of paidCoins(paid))
          for (const c of at.cells) expect(c.x + c.w).toBeLessThanOrEqual(coin.x - COIN_R[10]);
      }
      expect(paidCoins(10)).toHaveLength(1);
      expect(paidCoins(20).map((c) => c.value)).toEqual([10, 10]);
    });
  });

  describe('level 12, Can I buy it?', () => {
    const plan = PLANS[11];
    const rounds = Array.from({ length: 400 }, (_, i) => makeOrders(plan, new Rng(i + 1)) as AffordOrder[]);

    it('is the twelfth school level: two choose orders, then two spend orders', () => {
      expect(plan.mode).toBe('afford');
      expect(LEVELS.school?.order?.at(-1)).toBe(12);
      expect(marketStall.describeLevel(12)).toMatch(/^Can I buy it\?/);
      for (const orders of rounds)
        expect(orders.map((o) => o.afford.kind)).toEqual(['choose', 'choose', 'spend', 'spend']);
    });

    it('draws purses of 6 to 14, never the same twice running, each three coins or fewer', () => {
      for (const orders of rounds)
        orders.forEach((o, i) => {
          expect(o.afford.purse).toBeGreaterThanOrEqual(6);
          expect(o.afford.purse).toBeLessThanOrEqual(14);
          expect(target(plan, o)).toBe(o.afford.purse);
          if (i) expect(o.afford.purse).not.toBe(orders[i - 1].afford.purse);
        });
      for (let n = 6; n <= 14; n++) expect(fewest(n, plan.coins).length).toBeLessThanOrEqual(3);
    });

    it('gives every choose shelf three distinct prices near the purse, one it covers and one it does not, and one "just enough" a round', () => {
      for (const orders of rounds) {
        const choose = orders.filter((o) => o.afford.kind === 'choose');
        for (const o of choose) {
          const n = o.afford.purse;
          expect(new Set(o.prices).size).toBe(3);
          for (const p of o.prices)
            (expect(p).toBeGreaterThanOrEqual(Math.max(1, n - 5)), expect(p).toBeLessThanOrEqual(n + 5));
          expect(o.prices.some((p) => canBuy(o, p))).toBe(true);
          expect(o.prices.some((p) => !canBuy(o, p))).toBe(true);
          expect(canBuy(o, o.prices[affordHint(o)])).toBe(true);
          expect(o.prices[affordHint(o)]).toBe(Math.min(...o.prices));
        }
        const just = choose.filter((o) => o.prices.includes(o.afford.purse));
        expect(just).toHaveLength(1);
        expect(canBuy(just[0], just[0].afford.purse)).toBe(true);
        expect(chooseTap(just[0], just[0].afford.purse, 0)).toBe('just');
      }
    });

    it('counts at most one miss in a choose order: the first too-dear tap, then the nudge', () => {
      for (const orders of rounds.slice(0, 50))
        for (const o of orders.filter((x) => x.afford.kind === 'choose')) {
          const dear = o.prices.find((p) => !canBuy(o, p))!;
          const taps = [dear, dear, dear].map((p, i) => chooseTap(o, p, i));
          expect(taps).toEqual(['miss', 'nudge', 'nudge']);
          for (const p of o.prices.filter((q) => q < o.afford.purse)) expect(chooseTap(o, p, 1)).toBe('yes');
        }
    });

    it('gives every spend shelf exactly one pair that spends the purse, and no price equal to it', () => {
      for (const orders of rounds)
        for (const o of orders.filter((x) => x.afford.kind === 'spend')) {
          const n = o.afford.purse;
          expect(new Set(o.prices).size).toBe(3);
          for (const p of o.prices)
            (expect(p).toBeGreaterThanOrEqual(2), expect(p).toBeLessThanOrEqual(n - 2));
          const pairs = [
            [0, 1],
            [0, 2],
            [1, 2],
          ].filter((pair) => spendsAll(o, pair));
          expect(pairs).toHaveLength(1);
          const [i, j] = spendHint(o);
          expect(pairs[0]).toEqual([i, j]);
          expect(spendsAll(o, [j, i])).toBe(true);
          expect(spendBell(o, [i, j])).toBe('yes');
          expect(spendBell(o, [i])).toBe('two');
          expect(spendBell(o, [])).toBe('two');
          const other = [0, 1, 2].find((k) => k !== i && k !== j)!;
          expect(spendBell(o, [i, other])).toBe('miss');
          expect(spendBell(o, [other, j])).toBe('miss');
        }
    });

    it('lays the shelf and the purse as whole, separate targets: goods 120 wide and 30 apart, under the awning, clear of the keeper and mat', () => {
      for (const [w, h] of [
        [1024, 768],
        [1366, 768],
        [768, 1024],
        [844, 390],
      ]) {
        const v = computeView(w, h);
        const { cx, stockX } = stallLayout(v);
        const boxes = [0, 1, 2].map((i) => ({
          x0: stockX + shelfX(i) - GOOD_HIT.w / 2,
          x1: stockX + shelfX(i) + GOOD_HIT.w / 2,
        }));
        expect(boxes[1].x0 - boxes[0].x1).toBe(30);
        expect(boxes[0].x0).toBeGreaterThanOrEqual(cx - 340); // inside the awning
        expect(boxes[2].x1).toBeLessThanOrEqual(cx + 120); // clear of the keeper at cx + 200
        expect(GOOD_HIT.h).toBeGreaterThanOrEqual(150);
        // The good's box stays above the mat's box (its top 60 below the counter).
        expect(GOOD_HIT.y + GOOD_HIT.h / 2).toBeLessThanOrEqual(140 - 80);
        // It covers the tag (centred 150 above the counter) and the good.
        expect(GOOD_HIT.y - GOOD_HIT.h / 2).toBeLessThanOrEqual(-150 - TAG.h / 2);
      }
      // Purse coins 160 apart: each coin's 115 box whole on the 500-wide mat and clear of the slate.
      for (let n = 1; n <= 3; n++)
        for (let i = 0; i < n; i++) {
          const at = affordSlot(i, n);
          expect(Math.abs(at.x) + 115 / 2).toBeLessThanOrEqual(250);
          if (i) expect(at.x - affordSlot(i - 1, n).x).toBe(160);
          expect(at.y - COIN_R[10] * 1.25).toBeGreaterThan(TOTAL_SLATE.y + TOTAL_SLATE.h / 2);
        }
    });
  });
});
