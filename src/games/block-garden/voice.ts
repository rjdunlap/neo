// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.block-garden': ['Block garden!'],
  'block-garden.instruct': [
    'Drag a seed tray onto the garden. Fill a whole row or a whole column, and the buds in it bloom. Wake every bud!',
  ],
  'block-garden.instruct-clear': [
    'Drag a seed tray onto the garden. A full row or column blooms and gets picked. Empty the whole garden!',
  ],
  'block-garden.two-lines': ['One piece can finish two lines.'],
  'block-garden.refuse': ['It needs an empty space just its shape.'],
  'block-garden.snail': ["That would pick the snail's house."],
  'block-garden.bloom': ['They bloomed!', 'Flowers!', 'Look, the buds woke up!'],
  'block-garden.next-tray': ['Here come three more.'],
  'block-garden.comes-next': ['That one comes next.'],
  'block-garden.stuck': ["No room for this one! Let's take one back. Tap the round arrow."],
  'block-garden.hint': ['Try the glowing piece where its shadow is.'],
  'block-garden.done': ['Every bud is blooming! What a garden.', 'A whole basket of flowers!'],
} satisfies Record<string, string[]>;
