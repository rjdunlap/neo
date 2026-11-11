// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.pixel-pictures': ['Pixel pictures!'],
  'pixel.copy': ['Make your picture look like the little one. Tap the squares!'],
  'pixel.copy2': ['Pick a color, then tap squares to copy the little picture.'],
  'pixel.mirror': ['Finish the picture! Make the right side match the left side, like a mirror.'],
  'pixel.clues': [
    'The numbers say how many squares to fill in a row, or down a column. Tap a square to fill it. What picture is hiding?',
  ],
  'pixel.colorClues': [
    'Each number tells how many squares of that color go together. Choose its color, then fill the runs to reveal the picture.',
  ],
  'pixel.notthere': ['Not that square. Look at the little picture again.'],
  'pixel.notcolor': ['That square is {color}. Pick {color} first.'],
  'pixel.notmirror': ['Look across the middle line. Is that square filled on the other side?'],
  'pixel.mirror2': ['Two mirror lines! Copy the little corner across both lines, so all four corners match.'],
  'pixel.notmirror2': ['Look across both lines. Is that square filled in the drawn corner?'],
  'pixel.big': ['Make the little picture twice as big. Each little square makes a block of four.'],
  'pixel.notbig': ['Each little square makes a block of four. Look at the little picture again.'],
  'pixel.twice': ['Twice as wide and twice as tall!'],
  'pixel.notclue': ['That one stays empty. Count with the numbers again.'],
  'pixel.hint': ['Try the glowing square.'],
  'pixel.reveal': ['It is {name}!', 'Look, {name}!'],
  'pixel.done': ['What a gallery of pictures!'],
  'pixel.free': [
    'Make your own picture! Pick a color and tap squares. Tap a square again to clear it. When you like it, tap the green check.',
  ],
  'pixel.bits.row': [
    'Each card says one or zero. One fills a square, zero leaves it empty. Flip the cards to make this row, press the arrow to see it, then tap the check.',
  ],
  'pixel.bits.picture': [
    'Now a whole picture, one row at a time. Flip the cards for the row with the arrow beside it.',
  ],
  'pixel.bits.differ.fill': ['This square is filled, so its card should say one.'],
  'pixel.bits.differ.empty': ['This square is empty, so its card should say zero.'],
  'pixel.bits.hint': ['Try the glowing card.'],
  'pixel.bits.set': ['I flipped that card. Now tap the check.'],
  'pixel.bits.rowdone': ['The cards and the squares say the same row!', 'That row matches!'],
  'pixel.bits.emptyrow': ['Four zeros make an empty row.'],
  'pixel.bits.same': ['Sixteen ones and zeros, and the same picture.'],
  'pixel.bits.done': ['Four cards, one row. Any row can be written that way!'],
  'pixel.mine': ['What a picture! You made that.', 'Look what you made!'],
} satisfies Record<string, string[]>;
