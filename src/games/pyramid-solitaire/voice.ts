// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pyramid-solitaire': ['Pyramid solitaire!'],
  'pyramid.go': [
    'Lift two open cards that add to thirteen. A king is thirteen all by itself. Remove the cards below to uncover the ones above.',
  ],
  'pyramid.lift': [
    'Lift two open cards that add to thirteen, or a king alone. New: an open card can also lift with the one card under it, when nothing else lies on that card and the two make thirteen.',
  ],
  'pyramid.shelf': [
    'Lift two open cards that add to thirteen, or a king alone. The five cards on the shelf are always open. Use them to help the pyramid, and save the ones it will need. Clear the shelf too.',
  ],
  'pyramid.liftFirst': ['First choose the one card lying on this one.'],
  'pyramid.number': ['{n}. Find an open card to make thirteen together.'],
  'pyramid.covered': ['First lift both cards directly below this one.'],
  'pyramid.miss': ['Those cards do not make thirteen. This first card needs {n}.'],
  'pyramid.hint': ['Lift the cards with gold outlines. They start a way to clear the pyramid.'],
  'pyramid.blocked': ['This route cannot clear every card. Try Undo, or ask for a hint to revise it.'],
  'pyramid.recover': ['We took back some removals to find a clearing route. Try the gold cards.'],
  'pyramid.restart': ['The same cards are back. Try a different order.'],
  'pyramid.done': ['The pyramid is clear!'],
} satisfies Record<string, string[]>;
