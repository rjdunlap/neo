/** Every filling of Festival Signals' four slots and the lantern's wire, for the rule test and the checked-in list. */
import { TUPLES } from './logic';
import { encode, evaluateFlat, SLOTS, sourcesFor, type Flat, type Part } from './flat';

/** Every complete part slot `i` can hold, and empty: OR, then AND, then NOT, inputs in source order. */
export function partsFor(i: number): (Part | null)[] {
  const srcs = sourcesFor(i);
  const out: (Part | null)[] = [];
  for (const op of ['OR', 'AND'] as const) for (const a of srcs) for (const b of srcs) out.push({ op, a, b });
  for (const a of srcs) out.push({ op: 'NOT', a, b: null });
  out.push(null);
  return out;
}

/** Counts every filling and returns, in enumeration order, the ones whose lantern matches the sign on all four rows. */
export function enumerate(): { total: number; accepted: string[]; machines: Flat[] } {
  const choices = Array.from({ length: SLOTS }, (_, i) => partsFor(i));
  const fixtures = TUPLES.map(([p, q]) => ({ p, q }));
  let total = 0;
  const machines: Flat[] = [];
  for (const s0 of choices[0])
    for (const s1 of choices[1])
      for (const s2 of choices[2])
        for (const s3 of choices[3])
          for (let out = 0; out < SLOTS; out++) {
            total++;
            const m: Flat = { slots: [s0, s1, s2, s3], out };
            if (fixtures.every((f) => evaluateFlat(m, f) === (f.p !== f.q))) machines.push(m);
          }
  return { total, accepted: machines.map(encode), machines };
}
