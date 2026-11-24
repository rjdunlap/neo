import type { Card, Contact, HintStep, LookId, Reason, RecordState, Ribbon } from './logic.ts';

/**
 * Every line whole, with no slot, so each gets a rendered clip. The `*Line` helpers below map the round's events to
 * these ids; `voice.test.ts` checks that every id they can return exists.
 */
const LINES = {
  'game.outcrop-detective': 'Outcrop Detective',
  'outcrop.start.1':
    'This cliff tells a story. Lower is older, and dark rock cuts what was already there. Swap the cards until the story makes this cliff.',
  'outcrop.start.2': 'Some of this cliff is under sand. Make a story that fits what we can see.',
  'outcrop.rules':
    'Layers were laid flat, lower first. Nothing has been flipped. Dark rock cuts the layers that were already there.',
  'outcrop.card.A': 'Lay layer A.',
  'outcrop.card.B': 'Lay layer B.',
  'outcrop.card.C': 'Lay layer C.',
  'outcrop.card.X': 'The dark rock pushes in.',
  'outcrop.lift': 'Now tap another card to swap them.',
  // Play: one line per card as the story builds.
  'outcrop.lay.A.first': 'A is laid down.',
  'outcrop.lay.B.first': 'B is laid down.',
  'outcrop.lay.C.first': 'C is laid down.',
  'outcrop.lay.A.top': 'A is laid on top.',
  'outcrop.lay.B.top': 'B is laid on top.',
  'outcrop.lay.C.top': 'C is laid on top.',
  'outcrop.lay.A.over': 'A is laid over the dark rock.',
  'outcrop.lay.B.over': 'B is laid over the dark rock.',
  'outcrop.lay.C.over': 'C is laid over the dark rock.',
  'outcrop.dark.0': 'The dark rock pushes up from the floor. There is nothing yet for it to cut.',
  'outcrop.dark.1': 'The dark rock pushes up through the bottom layer.',
  'outcrop.dark.2': 'The dark rock pushes up through both layers.',
  'outcrop.dark.3': 'The dark rock pushes up through all three layers.',
  // Why a story does not fit: the first broken rule.
  'outcrop.why.stack.AB': 'In this story B is laid before A, so B would be lower. Here A is lower.',
  'outcrop.why.stack.BC': 'In this story C is laid before B, so C would be lower. Here B is lower.',
  'outcrop.why.cut.A': 'In this story the dark rock comes before A, so it couldn’t cut A. Here it cuts A.',
  'outcrop.why.cut.B': 'In this story the dark rock comes before B, so it couldn’t cut B. Here it cuts B.',
  'outcrop.why.cut.first':
    'In this story the dark rock comes first, so there is nothing for it to cut. Here it cuts A.',
  'outcrop.why.cover.B': 'In this story the dark rock comes after B, so it would cut B. Here B lies over it.',
  'outcrop.why.cover.C':
    'In this story the dark rock comes after C, so it would cut C too. Here C lies over it.',
  'outcrop.why.cover.last':
    'In this story the dark rock comes last, so it would cut C too. Here C lies over it.',
  // Fits and the question.
  'outcrop.fit': 'This story makes this cliff!',
  'outcrop.fit.sand': 'This story fits everything we can see.',
  'outcrop.sure': 'Do the rocks tell this order for sure?',
  'outcrop.answer.yes': 'Yes, only this story',
  'outcrop.answer.unsure': 'Not enough to tell',
  'outcrop.sure.right.1': 'Yes. Every other order breaks something the cliff shows.',
  'outcrop.sure.right.2': 'Right. Could one more look tell them apart?',
  'outcrop.sure.wrong.1':
    'Watch this other order. Every other order breaks something the cliff shows. Only this one fits.',
  'outcrop.sure.wrong.2': 'This story fits too! The sand hides the one place that would tell.',
  // Looks.
  'outcrop.preview.look-sand': 'Brush the sand away where the dark rock meets B.',
  'outcrop.preview.look-low': 'Look closely where the dark rock meets A.',
  'outcrop.preview.look-top': 'Look at the top of C.',
  'outcrop.result.look-low':
    'The dark rock cuts A. We knew that already. That doesn’t tell the two stories apart.',
  'outcrop.result.look-top': 'Pebbles and sky on top of C. That doesn’t tell the two stories apart.',
  'outcrop.result.sand.cut': 'Under the sand, the dark rock runs up through B!',
  'outcrop.result.sand.covers': 'Under the sand, B lies across the flat top of the dark rock!',
  'outcrop.again.fits': 'Your story still fits. Check it.',
  'outcrop.again.cut': 'Now we can see the dark rock cuts B.',
  'outcrop.again.covers': 'Now we can see B lies over the dark rock.',
  'outcrop.close.1': 'Case closed. The cliff tells this story for sure.',
  'outcrop.close.cut': 'The dark rock cuts B, so it came after B. It was this story.',
  'outcrop.close.covers': 'B came after the dark rock. It was this story.',
  // Hints.
  'outcrop.hint.A': 'A is at the bottom and the dark rock cuts it, so A came first.',
  'outcrop.hint.B.after-A': 'B lies on A, so B came next.',
  'outcrop.hint.B.over': 'B lies over the dark rock, so B came after it.',
  'outcrop.hint.B.maybe': 'In a story that fits, B can come after the dark rock.',
  'outcrop.hint.C': 'C is on top and lies over the dark rock, so C came last.',
  'outcrop.hint.X.cut': 'The dark rock cuts B, so it came after B.',
  'outcrop.hint.X.before-B': 'B lies over the dark rock, so the dark rock came before B.',
  'outcrop.hint.X.maybe-1': 'In a story that fits, the dark rock can come right after A.',
  'outcrop.hint.X.maybe-2': 'In a story that fits, the dark rock can come after A and B.',
  'outcrop.hint.fits': 'This story fits. Check it.',
  'outcrop.hint.sure.1': 'Can we see every place the dark rock meets a layer?',
  'outcrop.hint.sure.2': 'Is there a contact we can’t see?',
  'outcrop.hint.look': 'What is under the sand?',
  'outcrop.pick-look': 'Tap a look card first, then Look.',
} as const;

export type OutcropLine = keyof typeof LINES;

export const VOICE = Object.fromEntries(Object.entries(LINES).map(([id, text]) => [id, [text]])) as Record<
  OutcropLine,
  string[]
>;

/** The words for a line, for the on-screen status. */
export const words = (id: OutcropLine): string => LINES[id];

export const cardLine = (c: Card): OutcropLine => `outcrop.card.${c}`;

/** The Play narration: one line per card of the ribbon. */
export function playLines(r: Ribbon): OutcropLine[] {
  const xi = r.indexOf('X');
  return r.map((c, i): OutcropLine => {
    if (c === 'X') return `outcrop.dark.${xi as 0 | 1 | 2 | 3}`;
    const before = r.slice(0, i);
    if (!before.some((b) => b !== 'X'))
      return before.length ? `outcrop.lay.${c}.over` : `outcrop.lay.${c}.first`;
    return i === xi + 1 ? `outcrop.lay.${c}.over` : `outcrop.lay.${c}.top`;
  });
}

export function whyLine(reason: Reason): OutcropLine {
  if (reason.rule === 'stack') return reason.lower === 'A' ? 'outcrop.why.stack.AB' : 'outcrop.why.stack.BC';
  if (reason.rule === 'cut') {
    if (reason.first) return 'outcrop.why.cut.first';
    return reason.layer === 'A' ? 'outcrop.why.cut.A' : 'outcrop.why.cut.B';
  }
  if (reason.layer === 'C' && reason.last) return 'outcrop.why.cover.last';
  return reason.layer === 'B' ? 'outcrop.why.cover.B' : 'outcrop.why.cover.C';
}

/** The reason a hint gives for the card it moved, in words that never claim the only story before the look. */
export function hintLine(step: HintStep, record: RecordState, truth: Contact): OutcropLine {
  const { card, slot } = step;
  const known: Contact | null = record === 'sand' ? null : record === 'seen' ? 'cut' : truth;
  if (card === 'A') return 'outcrop.hint.A';
  if (card === 'C') return 'outcrop.hint.C';
  if (card === 'B') {
    if (slot === 1) return 'outcrop.hint.B.after-A';
    return known === 'covers' ? 'outcrop.hint.B.over' : 'outcrop.hint.B.maybe';
  }
  if (known === 'cut') return 'outcrop.hint.X.cut';
  if (known === 'covers') return 'outcrop.hint.X.before-B';
  return slot === 1 ? 'outcrop.hint.X.maybe-1' : 'outcrop.hint.X.maybe-2';
}

export const previewLine = (id: LookId): OutcropLine => `outcrop.preview.${id}`;
