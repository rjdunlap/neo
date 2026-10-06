export type Part = 'tummy' | 'head' | 'cheeks' | 'ears' | 'nose';

export interface Plan {
  /** free: scrub it all off. parts: "wash my ears!", one body part at a time. */
  mode: 'free' | 'parts';
  parts: Part[];
  shuffle?: boolean;
  /** Ask for two parts in one breath ("wash my ears and my nose!"). */
  pairs?: boolean;
  /** With pairs: "first my nose, then my ears", in that order. */
  ordered?: boolean;
}

export const PLANS: Plan[] = [
  { mode: 'free', parts: ['tummy', 'head', 'cheeks'] },
  { mode: 'free', parts: ['tummy', 'head', 'cheeks', 'ears'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'] },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'cheeks', 'nose'], shuffle: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true },
  { mode: 'parts', parts: ['tummy', 'ears', 'head', 'nose'], shuffle: true, pairs: true, ordered: true },
];

export function planFor(level: number): Plan {
  return PLANS[Math.min(PLANS.length, Math.max(1, level)) - 1];
}

/** The parts asked for right now, starting at `index`: one, or a pair. */
export function askedParts(plan: Plan, index: number): Part[] {
  return plan.parts.slice(index, index + (plan.pairs ? 2 : 1));
}

/** The asked-for parts that may be scrubbed now: in order, only the first one still muddy. */
export function allowedParts(plan: Plan, index: number, clean: (p: Part) => boolean): Part[] {
  const left = askedParts(plan, index).filter((p) => !clean(p));
  return plan.ordered ? left.slice(0, 1) : left;
}
