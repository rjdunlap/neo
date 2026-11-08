import { describe, expect, it } from 'vitest';
import { Rng } from '../../engine/random';
import {
  riverWords,
  riverSquare,
  mirrorOf,
  riverReason,
  mirrorReason,
  mirrorPath,
  acrossWords,
  upDownWords,
  squaresWord,
  HALF,
  flagWalk,
  sameCells,
  slideWords,
  bestDig,
  distance,
  dugAt,
  type FarDig,
  ruledOutBy,
  stillFits,
  stepsWord,
  type Square,
  type Card,
  cardDone,
  cardFor,
  cardReason,
  EMPTY_CARD,
  nextCount,
  nextWay,
  planFor,
  walkCard,
  CELL,
  cellCenter,
  clueDirection,
  clueEnd,
  COLUMN_COLORS,
  compare,
  digSpot,
  directions,
  DOODLES,
  dressingFor,
  firstDirection,
  firstLeg,
  headersFor,
  inLine,
  lineSquares,
  makeFinds,
  name,
  ONE_LINE,
  PLANS,
  ROW_PICTURES,
  squareAt,
  TINTS,
} from './logic';

describe('Treasure Map', () => {
  it('names squares by column letter and row number, counting rows from the bottom', () => {
    expect(name({ col: 0, row: 0 })).toBe('A1');
    expect(name({ col: 1, row: 2 })).toBe('B3');
    expect(compare({ col: 1, row: 2 }, { col: 1, row: 0 })).toBe('column');
    expect(compare({ col: 3, row: 0 }, { col: 1, row: 0 })).toBe('row');
    expect(compare({ col: 1, row: 0 }, { col: 1, row: 0 })).toBe('right');
  });

  it('makes different squares on the map, and step directions that start on the map and turn', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        const finds = makeFinds(plan, new Rng(seed));
        expect(finds).toHaveLength(plan.finds);
        expect(new Set(finds.map((f) => name(f.square))).size).toBe(plan.finds);
        for (const f of finds) {
          for (const s of [f.square, f.from].filter(Boolean)) {
            expect(s!.col).toBeGreaterThanOrEqual(0);
            expect(s!.col).toBeLessThan(plan.size);
            expect(s!.row).toBeGreaterThanOrEqual(0);
            expect(s!.row).toBeLessThan(plan.size);
          }
          if (plan.mode === 'steps') {
            expect(f.from!.col + f.right!).toBe(f.square.col);
            expect(f.from!.row + f.up!).toBe(f.square.row);
            expect(f.right).not.toBe(0);
            expect(f.up).not.toBe(0);
            expect(directions(f)).toMatch(/^\d (right|left), then \d (up|down)$/);
          }
          if (plan.mode === 'place') expect(f.thing).toBeDefined();
          if (plan.mode === 'clues') {
            expect(f.clues).toHaveLength(2);
            const [horizontal, vertical] = f.clues!;
            expect(horizontal.axis).toBe('horizontal');
            expect(vertical.axis).toBe('vertical');
            expect(clueEnd(horizontal)).toEqual(f.square);
            expect(clueEnd(vertical)).toEqual(f.square);
            expect(clueDirection(horizontal)).toMatch(/^\d (right|left)$/);
            expect(clueDirection(vertical)).toMatch(/^\d (up|down)$/);
            const occupied = [
              ...finds.map((other) => other.square),
              ...finds.flatMap((other) => other.clues?.map((clue) => clue.landmark) ?? []),
            ];
            expect(new Set(occupied.map(name)).size).toBe(occupied.length);
            for (const clue of f.clues!) {
              expect(clue.landmark.col).toBeGreaterThanOrEqual(0);
              expect(clue.landmark.col).toBeLessThan(plan.size);
              expect(clue.landmark.row).toBeGreaterThanOrEqual(0);
              expect(clue.landmark.row).toBeLessThan(plan.size);
            }
          }
        }
      }
    }
  });

  it('reads a point on the map back to its square, and a point off the map to nothing', () => {
    for (const size of [4, 5]) {
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          const mid = cellCenter({ col, row }, size);
          expect(squareAt(mid.x, mid.y, size)).toEqual({ col, row });
          // Anywhere inside the square is the same square, corners included.
          expect(squareAt(mid.x - CELL / 2 + 1, mid.y + CELL / 2 - 1, size)).toEqual({ col, row });
        }
      }
      expect(squareAt(-1, 10, size)).toBeNull();
      expect(squareAt(10, -1, size)).toBeNull();
      expect(squareAt(size * CELL, 10, size)).toBeNull();
      expect(squareAt(10, size * CELL, size)).toBeNull();
    }
    // Row 1 is the bottom of the map, as on a graph.
    expect(cellCenter({ col: 0, row: 0 }, 4).y).toBeGreaterThan(cellCenter({ col: 0, row: 3 }, 4).y);
  });

  it("digs for every find in the middle of its own square, so the demonstration's finger is always right", () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 300; seed++) {
        for (const f of makeFinds(plan, new Rng(seed))) {
          const spot = digSpot(f, plan.size);
          const hit = squareAt(spot.x, spot.y, plan.size);
          expect(hit).toEqual(f.square);
          expect(compare(hit!, f.square)).toBe('right');
        }
      }
    }
  });

  it('draws fresh picture headers: distinct, every picture and colour in turn, and the asked-for picture and colour on the map', () => {
    const plan = PLANS.find((p) => p.mode === 'pictures')!;
    const seenRows = new Set<string>();
    const seenCols = new Set<string>();
    const firstRows = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const rng = new Rng(seed);
      const finds = makeFinds(plan, rng);
      const { cols, rows } = headersFor(plan, rng);
      expect(cols).toHaveLength(plan.size);
      expect(rows).toHaveLength(plan.size);
      expect(new Set(cols).size).toBe(plan.size);
      expect(new Set(rows).size).toBe(plan.size);
      for (const c of cols) expect(COLUMN_COLORS).toContain(c);
      for (const r of rows) expect(ROW_PICTURES).toContain(r);
      // Every find names a picture and a colour that head its own row and column.
      for (const f of finds) {
        expect(rows[f.square.row]).toBeDefined();
        expect(cols[f.square.col]).toBeDefined();
      }
      cols.forEach((c) => seenCols.add(c));
      rows.forEach((r) => seenRows.add(r));
      firstRows.add(rows.join());
    }
    expect(seenRows.size).toBe(ROW_PICTURES.length);
    expect(seenCols.size).toBe(COLUMN_COLORS.length);
    expect(firstRows.size).toBeGreaterThan(50);
  });

  it('keeps the finds the same whatever the headers and dressing draw, and letters maps in plain order', () => {
    for (const plan of PLANS) {
      for (let seed = 1; seed <= 50; seed++) {
        const plain = makeFinds(plan, new Rng(seed));
        const rng = new Rng(seed);
        const dressed = makeFinds(plan, rng);
        headersFor(plan, rng);
        dressingFor(rng);
        expect(dressed).toEqual(plain);
      }
      if (plan.mode !== 'pictures' && plan.mode !== 'line' && plan.mode !== 'river' && plan.mode !== 'mirror')
        expect(headersFor(plan, new Rng(1)).rows).toEqual(ROW_PICTURES.slice(0, plan.size));
    }
  });

  it('dresses each map with one of three tints and a known doodle, every one in turn', () => {
    const tints = new Set<number>();
    const doodles = new Set<string>();
    for (let seed = 1; seed <= 100; seed++) {
      const d = dressingFor(new Rng(seed));
      expect(d.tint).toBeGreaterThanOrEqual(0);
      expect(d.tint).toBeLessThan(TINTS);
      tints.add(d.tint);
      doodles.add(d.doodle);
    }
    expect(tints.size).toBe(TINTS);
    expect(doodles.size).toBe(DOODLES.length);
  });

  it('lights the steps hint along the first leg only: on the map, from beside the pet to the turning square, never the answer', () => {
    const plan = PLANS.find((p) => p.mode === 'steps')!;
    for (let seed = 1; seed <= 300; seed++) {
      for (const f of makeFinds(plan, new Rng(seed))) {
        const leg = firstLeg(f);
        expect(leg).toHaveLength(Math.abs(f.right!));
        leg.forEach((sq, i) => {
          expect(sq.col).toBeGreaterThanOrEqual(0);
          expect(sq.col).toBeLessThan(plan.size);
          expect(sq.row).toBe(f.from!.row);
          // One square at a time, each a step further from the pet.
          expect(Math.abs(sq.col - f.from!.col)).toBe(i + 1);
        });
        // It ends at the turn: the target's column on the pet's row, which is not the target (every walk turns).
        expect(leg[leg.length - 1]).toEqual({ col: f.square.col, row: f.from!.row });
        expect(leg.some((sq) => name(sq) === name(f.square))).toBe(false);
        expect(directions(f).startsWith(firstDirection(f))).toBe(true);
      }
    }
  });
});

describe('Treasure Map level 6, write the card', () => {
  const plan = planFor(6);
  const ways = [-1, 1] as const;
  const allCards: Card[] = [];
  for (let a = 1; a <= 3; a++)
    for (const aw of ways)
      for (let u = 1; u <= 3; u++)
        for (const uw of ways) allCards.push({ across: a, acrossWay: aw, upDown: u, upDownWay: uw });

  it('is plan 6 on a 5 by 5 map', () => {
    expect(PLANS[5].mode).toBe('write');
    expect(plan).toBe(PLANS[5]);
    expect(plan.size).toBe(5);
  });

  it('has exactly one complete card that reaches the chest, and it is cardFor', () => {
    expect(allCards).toHaveLength(36);
    for (let seed = 1; seed <= 150; seed++) {
      for (const f of makeFinds(plan, new Rng(seed))) {
        const winners = allCards.filter((c) => {
          const w = walkCard(f.from!, c, plan.size);
          return !w.edge && w.end.col === f.square.col && w.end.row === f.square.row;
        });
        expect(winners).toEqual([cardFor(f)]);
        expect(cardDone(cardFor(f))).toBe(true);
        for (const c of allCards) {
          const isTheOne = JSON.stringify(c) === JSON.stringify(cardFor(f));
          expect(cardReason(c, f) === null).toBe(isTheOne);
        }
      }
    }
  });

  it('names the line that was off and says why', () => {
    for (let seed = 1; seed <= 100; seed++) {
      for (const f of makeFinds(plan, new Rng(seed))) {
        const good = cardFor(f);
        expect(cardReason(good, f)).toBeNull();
        const leg = f.up! > 0 ? 'up' : 'down';
        for (const c of allCards) {
          const r = cardReason(c, f);
          if (!r) continue;
          const acrossOff = c.across * c.acrossWay !== f.right!;
          const upOff = c.upDown * c.upDownWay !== f.up!;
          expect(r.slots.leg).toBe(leg);
          expect(r.line).toBe(
            acrossOff && upOff ? 'map.cardboth' : acrossOff ? 'map.cardacross' : 'map.cardupdown',
          );
          const lineWhy = (got: number, want: number) =>
            Math.sign(got) !== Math.sign(want)
              ? 'goes the wrong way'
              : Math.abs(got) > Math.abs(want)
                ? 'is ' + ['', 'one', 'two'][Math.abs(got) - Math.abs(want)] + ' too many'
                : 'is ' + ['', 'one', 'two'][Math.abs(want) - Math.abs(got)] + ' too few';
          const wantWhy =
            r.line === 'map.cardacross'
              ? lineWhy(c.across * c.acrossWay, f.right!)
              : lineWhy(c.upDown * c.upDownWay, f.up!);
          expect(r.slots.why).toBe(wantWhy);
          if (r.line === 'map.cardacross') expect(r.slots.across).toBe(r.slots.why);
        }
      }
    }
    const f = { square: { col: 3, row: 3 }, from: { col: 1, row: 1 }, right: 2, up: 2 };
    expect(cardReason({ across: 3, acrossWay: 1, upDown: 2, upDownWay: 1 }, f)!.slots.why).toBe(
      'is one too many',
    );
    expect(cardReason({ across: 1, acrossWay: 1, upDown: 2, upDownWay: 1 }, f)!.slots.why).toBe(
      'is one too few',
    );
    expect(cardReason({ across: 2, acrossWay: 1, upDown: 2, upDownWay: -1 }, f)!.slots.why).toBe(
      'goes the wrong way',
    );
    expect(cardReason({ across: 2, acrossWay: -1, upDown: 1, upDownWay: 1 }, f)!.line).toBe('map.cardboth');
  });

  it('walks stop at the map edge and never leave the map', () => {
    for (let col = 0; col < 5; col++)
      for (let row = 0; row < 5; row++)
        for (const c of allCards) {
          const w = walkCard({ col, row }, c, 5);
          for (const s of [...w.legs[0], ...w.legs[1], w.end]) {
            expect(s.col).toBeGreaterThanOrEqual(0);
            expect(s.col).toBeLessThan(5);
            expect(s.row).toBeGreaterThanOrEqual(0);
            expect(s.row).toBeLessThan(5);
          }
          const wantEdge =
            col + c.across * c.acrossWay < 0 || col + c.across * c.acrossWay > 4
              ? true
              : row + c.upDown * c.upDownWay < 0 || row + c.upDown * c.upDownWay > 4;
          expect(w.edge).toBe(wantEdge);
        }
    const w = walkCard({ col: 3, row: 0 }, { across: 3, acrossWay: 1, upDown: 1, upDownWay: 1 }, 5);
    expect(w.edge).toBe(true);
    expect(w.legs[0]).toEqual([{ col: 4, row: 0 }]);
    expect(w.end).toEqual({ col: 4, row: 1 });
  });

  it('walks nothing for an unset across line, and the up line waits for it', () => {
    const from = { col: 2, row: 2 };
    const w = walkCard(from, { across: 0, acrossWay: 0, upDown: 2, upDownWay: 1 }, 5);
    expect(w.legs).toEqual([[], []]);
    expect(w.end).toEqual(from);
    expect(w.edge).toBe(false);
    expect(walkCard(from, EMPTY_CARD, 5).end).toEqual(from);
    expect(walkCard(from, { across: 2, acrossWay: 0, upDown: 1, upDownWay: 1 }, 5).legs).toEqual([[], []]);
    const half = walkCard(from, { across: 2, acrossWay: 1, upDown: 0, upDownWay: 0 }, 5);
    expect(half.legs[0]).toHaveLength(2);
    expect(half.legs[1]).toEqual([]);
    expect(cardDone({ across: 2, acrossWay: 1, upDown: 0, upDownWay: 0 })).toBe(false);
  });

  it('cycles the tiles', () => {
    expect([0, 1, 2, 3].map(nextCount)).toEqual([1, 2, 3, 1]);
    expect(nextWay(0)).toBe(1);
    expect(nextWay(1)).toBe(-1);
    expect(nextWay(-1)).toBe(1);
  });

  describe('level 7, How far?', () => {
    const plan = planFor(7);
    const all: Square[] = [];
    for (let col = 0; col < plan.size; col++)
      for (let row = 0; row < plan.size; row++) all.push({ col, row });
    const eq = (a: Square, b: Square) => a.col === b.col && a.row === b.row;

    it('is a 4 by 4 hunt with chests on the map', () => {
      expect(plan.mode).toBe('far');
      expect(plan.size).toBe(4);
      for (let seed = 1; seed <= 100; seed++)
        for (const f of makeFinds(plan, new Rng(seed))) expect(f.square.col).toBeLessThan(4);
    });

    it('counts the distance across plus up, as the pet walks', () => {
      expect(distance({ col: 0, row: 0 }, { col: 3, row: 3 })).toBe(6);
      expect(distance({ col: 2, row: 1 }, { col: 0, row: 3 })).toBe(4);
      expect(distance({ col: 1, row: 1 }, { col: 1, row: 1 })).toBe(0);
      expect(stepsWord(1)).toBe('1 step');
      expect(stepsWord(3)).toBe('3 steps');
    });

    it('always keeps the chest among the squares that still fit, and shrinks the set after every fitting dig', () => {
      for (const chest of all) {
        let digs: FarDig[] = [];
        // Any fitting order: dig the still-fitting squares from the far end of the list.
        while (true) {
          const fits = stillFits(digs, 4);
          expect(fits.some((s) => eq(s, chest))).toBe(true);
          const g = fits[fits.length - 1];
          if (eq(g, chest)) break;
          digs = [...digs, { square: g, said: distance(g, chest) }];
          const after = stillFits(digs, 4);
          expect(after.length).toBeLessThan(fits.length);
          expect(after.some((s) => eq(s, g))).toBe(false);
        }
      }
    });

    it('finds every hiding square within five digs, whichever fitting square each dig picks', () => {
      const worst = (digs: FarDig[], chest: Square): number => {
        let most = 0;
        for (const g of stillFits(digs, 4))
          most = Math.max(
            most,
            eq(g, chest) ? 1 : 1 + worst([...digs, { square: g, said: distance(g, chest) }], chest),
          );
        return most;
      };
      for (const chest of all) expect(worst([], chest)).toBeLessThanOrEqual(5);
    });

    it("finds every hiding square within three digs with the bot's play, and the bot only digs squares that fit", () => {
      for (const chest of all) {
        const digs: FarDig[] = [];
        let n = 0;
        while (true) {
          const g = bestDig(digs, 4);
          n++;
          expect(ruledOutBy(g, digs)).toBeNull();
          if (eq(g, chest)) break;
          digs.push({ square: g, said: distance(g, chest) });
        }
        expect(n).toBeLessThanOrEqual(3);
      }
    });

    it('names the earliest dig a ruled-out square disagrees with, and remembers squares already dug', () => {
      const digs: FarDig[] = [
        { square: { col: 0, row: 0 }, said: 3 },
        { square: { col: 3, row: 0 }, said: 2 },
      ];
      expect(stillFits(digs, 4)).toEqual(
        [
          { col: 2, row: 1 },
          { col: 1, row: 2 },
        ].filter((s) => distance(s, { col: 3, row: 0 }) === 2),
      );
      expect(ruledOutBy({ col: 3, row: 3 }, digs)).toBe(digs[0]);
      expect(ruledOutBy({ col: 0, row: 3 }, digs)).toBe(digs[1]);
      expect(ruledOutBy({ col: 2, row: 1 }, digs)).toBeNull();
      expect(dugAt({ col: 3, row: 0 }, digs)).toBe(digs[1]);
      expect(dugAt({ col: 2, row: 1 }, digs)).toBeNull();
    });
  });
});

describe('Treasure Map level 8, Slide it', () => {
  const plan = planFor(8);
  const all = (seeds = 400) =>
    Array.from({ length: seeds }, (_, i) => makeFinds(plan, new Rng(i + 1))).flat();
  const onMap = (cells: Square[]) =>
    cells.every((s) => s.col >= 0 && s.row >= 0 && s.col < plan.size && s.row < plan.size);
  const moved = (cells: Square[], r: number, u: number) =>
    cells.map((s) => ({ col: s.col + r, row: s.row + u }));

  it('is plan 8, a 5 by 5 map of three rafts', () => {
    expect(PLANS[7]).toBe(plan);
    expect(plan.mode).toBe('slide');
    expect(plan.size).toBe(5);
    expect(plan.finds).toBe(3);
  });

  it('slides an L of three squares 1 to 3 across and 1 to 3 up or down, on the map before and after, never onto itself', () => {
    for (const f of all()) {
      expect(f.raft).toHaveLength(3);
      expect(f.raft!.some((s) => s.col === f.from!.col && s.row === f.from!.row)).toBe(true);
      // An L: two squares beside its corner, one across and one up or down.
      const cols = new Set(f.raft!.map((s) => s.col));
      const rows = new Set(f.raft!.map((s) => s.row));
      expect(cols.size).toBe(2);
      expect(rows.size).toBe(2);
      for (const v of [f.right!, f.up!]) {
        expect(Math.abs(v)).toBeGreaterThanOrEqual(1);
        expect(Math.abs(v)).toBeLessThanOrEqual(3);
      }
      expect(f.square).toEqual({ col: f.from!.col + f.right!, row: f.from!.row + f.up! });
      const slid = moved(f.raft!, f.right!, f.up!);
      expect(onMap(f.raft!)).toBe(true);
      expect(onMap(slid)).toBe(true);
      expect(slid.some((s) => f.raft!.some((t) => sameCells([s], [t])))).toBe(false);
      expect(slideWords(f.right!, f.up!)).toMatch(/^\d (right|left) and \d (up|down)$/);
    }
  });

  it('offers three distinct outlines on the map: the raft plus the slide, the raft turned over, and one slid the wrong amount', () => {
    for (const f of all()) {
      const outlines = f.outlines!;
      expect(outlines.map((o) => o.kind).sort()).toEqual(['far', 'flipped', 'right']);
      for (const o of outlines) {
        expect(o.cells).toHaveLength(3);
        expect(onMap(o.cells)).toBe(true);
      }
      for (let i = 0; i < 3; i++)
        for (let j = i + 1; j < 3; j++) expect(sameCells(outlines[i].cells, outlines[j].cells)).toBe(false);
      const slid = moved(f.raft!, f.right!, f.up!);
      // Exactly one card is the raft plus the slide.
      expect(outlines.filter((o) => sameCells(o.cells, slid)).map((o) => o.kind)).toEqual(['right']);
      // The turned-over raft keeps the flag where she tapped it, so the flag alone cannot pick the card.
      const flipped = outlines.find((o) => o.kind === 'flipped')!;
      expect(flipped.cells.some((s) => s.col === f.square.col && s.row === f.square.row)).toBe(true);
      // The wrong amount is the same raft moved one square too far or too short on one way only, the same way round.
      const far = outlines.find((o) => o.kind === 'far')!;
      expect(sameCells(far.cells, moved(f.raft!, far.right, far.up))).toBe(true);
      expect(Math.abs(far.right - f.right!) + Math.abs(far.up - f.up!)).toBe(1);
      expect(Math.sign(far.right)).toBe(Math.sign(f.right!));
      expect(Math.sign(far.up)).toBe(Math.sign(f.up!));
    }
  });

  it('puts the right card in every place across seeds', () => {
    const places = new Set(all(100).map((f) => f.outlines!.findIndex((o) => o.kind === 'right')));
    expect(places).toEqual(new Set([0, 1, 2]));
  });

  it("lights the flag's walk from beside its square to where it lands", () => {
    for (const f of all(100)) {
      const walk = flagWalk(f, plan.size);
      expect(walk).toHaveLength(Math.abs(f.right!) + Math.abs(f.up!));
      expect(walk[walk.length - 1]).toEqual(f.square);
    }
  });
});

describe('Treasure Map level 9, One line', () => {
  const plan = planFor(ONE_LINE);
  const rounds = (seeds = 300) => Array.from({ length: seeds }, (_, i) => makeFinds(plan, new Rng(i + 1)));

  it('is appended as plan 9, a 3 by 3 map of four finds, right after plan 8', () => {
    expect(ONE_LINE).toBe(9);
    expect(PLANS).toHaveLength(11);
    expect(PLANS[8]).toBe(plan);
    expect(plan.mode).toBe('line');
    expect(plan.size).toBe(3);
    expect(plan.finds).toBe(4);
  });

  it('accepts every square in the named line and no other', () => {
    for (const finds of rounds(50)) {
      for (const f of finds) {
        const right = lineSquares(f.line!, plan.size);
        expect(right).toHaveLength(plan.size);
        for (let col = 0; col < plan.size; col++)
          for (let row = 0; row < plan.size; row++) {
            const s = { col, row };
            const want = f.line!.axis === 'col' ? col === f.line!.at : row === f.line!.at;
            expect(inLine(s, f.line!)).toBe(want);
            expect(right.some((r) => r.col === col && r.row === row)).toBe(want);
          }
      }
    }
  });

  it('takes turns between rows and columns, never asks a line twice, and both start in turn', () => {
    const firsts = new Set<string>();
    for (const finds of rounds()) {
      finds.forEach((f, i) => {
        if (i) expect(f.line!.axis).not.toBe(finds[i - 1].line!.axis);
        expect(inLine(f.square, f.line!)).toBe(true);
      });
      expect(new Set(finds.map((f) => `${f.line!.axis}${f.line!.at}`)).size).toBe(plan.finds);
      firsts.add(finds[0].line!.axis);
    }
    expect(firsts).toEqual(new Set(['col', 'row']));
  });

  it('opens preschool and pre-K, keeps school as it was, and lands a carried 9 at the start of school', async () => {
    const { treasureMap: mod } = await import('./index');
    const { levelsInOrder, nextLevelOffer, stepLevel, landing } = await import('../../progress/difficulty');
    expect(mod.bands).toEqual(['preschool', 'prek', 'school']);
    expect(mod.entryLevels).toEqual([ONE_LINE]);
    expect(levelsInOrder(mod.levels('preschool'))).toEqual([9, 1]);
    expect(levelsInOrder(mod.levels('prek'))).toEqual([9, 1, 2]);
    expect(levelsInOrder(mod.levels('school'))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 10, 11]);
    expect(nextLevelOffer(9, mod.levels('prek'))).toBe(1);
    expect(stepLevel(1, -1, mod.levels('prek'))).toBe(9);
    expect(landing(9, mod.levels('school'), mod.entryLevels)).toBe(1);
    expect(landing(2, mod.levels('prek'), mod.entryLevels)).toBe(2);
    PLANS.forEach((p, i) => expect(planFor(i + 1)).toBe(p));
  });

  it('heads its rows with pictures and its columns with colours, fresh each round', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const rng = new Rng(seed);
      makeFinds(plan, rng);
      const { cols, rows } = headersFor(plan, rng);
      expect(new Set(cols).size).toBe(3);
      expect(new Set(rows).size).toBe(3);
      seen.add(cols.join() + rows.join());
    }
    expect(seen.size).toBeGreaterThan(20);
  });
});

describe('Treasure Map levels 10–11, across the river', () => {
  const squares: Square[] = Array.from({ length: 36 }, (_, i) => ({ col: i % 6, row: Math.floor(i / 6) }));
  const rounds = (id: number, n = 200) =>
    Array.from({ length: n }, (_, i) => makeFinds(planFor(id), new Rng(i + 1)));
  const key = (s: Square) => `${s.col},${s.row}`;

  it('words the 36 squares distinctly and reads them back', () => {
    const seen = new Set(squares.map((s) => JSON.stringify(riverWords(s))));
    expect(seen.size).toBe(36);
    for (const s of squares) {
      expect(riverSquare(riverWords(s))).toEqual(s);
      const w = riverWords(s);
      expect(w.across.n).toBeGreaterThanOrEqual(1);
      expect(w.across.n).toBeLessThanOrEqual(HALF);
    }
    expect(acrossWords({ col: 3, row: 0 })).toBe('1 square right');
    expect(upDownWords({ col: 0, row: 0 })).toBe('3 squares below');
    expect(squaresWord(2)).toBe('2 squares');
  });

  it('level 10 digs one find per quadrant, counts 1 to 3, distinct squares', () => {
    for (const finds of rounds(10)) {
      expect(finds).toHaveLength(4);
      expect(new Set(finds.map((f) => key(f.square))).size).toBe(4);
      expect(
        new Set(finds.map((f) => `${riverWords(f.square).across.side}${riverWords(f.square).upDown.side}`))
          .size,
      ).toBe(4);
      for (const f of finds) {
        const w = riverWords(f.square);
        for (const n of [w.across.n, w.upDown.n]) {
          expect(n).toBeGreaterThanOrEqual(1);
          expect(n).toBeLessThanOrEqual(3);
        }
      }
    }
  });

  it('mirrorOf stays on the map, is an involution, never the own square, and keeps the count from the line', () => {
    for (const s of squares)
      for (const line of ['river', 'road'] as const) {
        const t = mirrorOf(s, line);
        expect(t.col).toBeGreaterThanOrEqual(0);
        expect(t.col).toBeLessThan(6);
        expect(t.row).toBeGreaterThanOrEqual(0);
        expect(t.row).toBeLessThan(6);
        expect(mirrorOf(t, line)).toEqual(s);
        expect(t).not.toEqual(s);
        const [a, b] = [riverWords(s), riverWords(t)];
        if (line === 'river') {
          expect(b.upDown.n).toBe(a.upDown.n);
          expect(b.upDown.side).not.toBe(a.upDown.side);
          expect(t.col).toBe(s.col);
        } else {
          expect(b.across.n).toBe(a.across.n);
          expect(b.across.side).not.toBe(a.across.side);
          expect(t.row).toBe(s.row);
        }
      }
  });

  it('level 11 has two finds per line, four different things, and the twin is the answer', () => {
    for (const finds of rounds(11)) {
      expect(finds).toHaveLength(4);
      expect(finds.filter((f) => f.across === 'river')).toHaveLength(2);
      expect(finds.filter((f) => f.across === 'road')).toHaveLength(2);
      expect(new Set(finds.map((f) => f.thing)).size).toBe(4);
      expect(new Set(finds.map((f) => key(f.square))).size).toBe(4);
      for (const f of finds) expect(f.square).toEqual(mirrorOf(f.stands!, f.across!));
    }
  });

  it('riverReason names the first wrong part in order, and nothing when right', () => {
    const want = { col: 4, row: 1 }; // 2 right of the road, 2 below the river
    expect(riverReason(want, want)).toBeNull();
    expect(riverReason({ col: 1, row: 1 }, want)).toEqual({
      line: 'map.riverside',
      slots: { got: 'left of the road', want: 'right of the road' },
    });
    // wrong side of both: the road comes first
    expect(riverReason({ col: 1, row: 4 }, want)?.slots.got).toBe('left of the road');
    expect(riverReason({ col: 5, row: 1 }, want)).toEqual({
      line: 'map.rivercount',
      slots: { line: 'road', want: '2 squares right of the road' },
    });
    // wrong count on both: the road comes first
    expect(riverReason({ col: 3, row: 2 }, want)?.slots.line).toBe('road');
    expect(riverReason({ col: 4, row: 4 }, want)).toEqual({
      line: 'map.riverside',
      slots: { got: 'above the river', want: 'below the river' },
    });
    expect(riverReason({ col: 4, row: 0 }, want)).toEqual({
      line: 'map.rivercount',
      slots: { line: 'river', want: '2 squares below the river' },
    });
  });

  it('mirrorReason names side, then slide, then distance, and nothing on the twin', () => {
    const stands = { col: 4, row: 1 }; // 2 right of the road, 2 below the river
    const twin = mirrorOf(stands, 'river'); // col 4, row 4
    expect(mirrorReason(twin, stands, 'river')).toBeNull();
    expect(mirrorReason(stands, stands, 'river')).toEqual({
      line: 'map.mirrorside',
      slots: { line: 'river' },
    });
    expect(mirrorReason({ col: 0, row: 0 }, stands, 'river')?.line).toBe('map.mirrorside');
    expect(mirrorReason({ col: 5, row: 4 }, stands, 'river')).toEqual({
      line: 'map.mirrorslid',
      slots: { line: 'river', keep: '2 squares right of the road' },
    });
    expect(mirrorReason({ col: 4, row: 3 }, stands, 'river')).toEqual({
      line: 'map.mirrorcount',
      slots: { line: 'river', n: '2 squares' },
    });
    const road = mirrorOf(stands, 'road'); // col 1, row 1
    expect(mirrorReason(road, stands, 'road')).toBeNull();
    expect(mirrorReason({ col: 5, row: 1 }, stands, 'road')?.line).toBe('map.mirrorside');
    expect(mirrorReason({ col: 1, row: 2 }, stands, 'road')).toEqual({
      line: 'map.mirrorslid',
      slots: { line: 'road', keep: '2 squares below the river' },
    });
    expect(mirrorReason({ col: 2, row: 1 }, stands, 'road')).toEqual({
      line: 'map.mirrorcount',
      slots: { line: 'road', n: '2 squares' },
    });
  });

  it('mirrorPath has 2n squares, starts on the thing, ends on the twin, half on each side', () => {
    for (const s of squares)
      for (const line of ['river', 'road'] as const) {
        const path = mirrorPath(s, line);
        const w = riverWords(s);
        const n = line === 'river' ? w.upDown.n : w.across.n;
        expect(path).toHaveLength(2 * n);
        expect(path[0]).toEqual(s);
        expect(path[path.length - 1]).toEqual(mirrorOf(s, line));
        const side = (q: Square) =>
          line === 'river' ? riverWords(q).upDown.side : riverWords(q).across.side;
        expect(path.slice(0, n).every((q) => side(q) === side(s))).toBe(true);
        expect(path.slice(n).every((q) => side(q) !== side(s))).toBe(true);
      }
  });
});
