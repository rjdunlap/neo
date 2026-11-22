// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.garden-rows': ['Garden rows!'],
  'rows.one': [
    'One flower is missing from this row. Tap the flower packet that is missing, then tap the empty spot!',
  ],
  'rows.clash-row': ['There is already a {flower} in this row. Try another flower!'],
  'rows.clash-col': ['There is already a {flower} in this column. Try another flower!'],
  'rows.boxes': [
    'One of each flower in every row, every column and every hedge box! Pick a flower packet, then tap an empty spot.',
  ],
  'rows.clash-box': ['There is already a {flower} in this hedge box. Try another flower!'],
  'rows.hint-plant': ['Look at the glowing spot and the glowing packet. Plant that flower there!'],
  'rows.bloom': ['The flower bed is full! Beautiful!', 'Every flower is in the right place!'],
  'rows.bee': ['Plant one of each height in every row and column. Tap the gates to peek!'],
  'rows.bee-goal': ['From here I want to see {goal} {flowers}.'],
  'rows.bee-revise': ['I can see {seen}. This gate asks for {goal}.'],
  'rows.bee-three': [
    'To see all three, the heights go up in order. Plant the {flower} flower in the glowing spot.',
  ],
  'rows.bee-one': ['To see just one, put the tall flower closest to this gate.'],
  'rows.bee-missing': ['The {line} still needs a {flower} flower.'],
  'rows.bee-line': ['Use the numbers at both ends. Put the {flower} flower in the glowing spot.'],
  'rows.bee-cross': ['Look along both glowing lines. Put the {flower} flower in the glowing spot.'],
  'rows.bee-lift': ['Tap the glowing flower to lift it. Look again from the glowing gate.'],
  'rows.bee-sample': [
    'Tap each gate. The bee can see a flower if it rises above every flower in front of it.',
  ],
  'rows.bee-sample-left': ['From here the bee sees two tops. The middle flower hides behind the first.'],
  'rows.bee-sample-right': ['The tallest comes first here. The bee sees just one top!'],
  'rows.bee-solved': ['Every gate has the view the bee wanted!'],
  'rows.done': ['What a lovely garden!'],
  'rows.mend': [
    'Two flowers got mixed up! Find them and swap them back. Tap a flower to lift it out, then plant it where it belongs.',
  ],
  'rows.mend-hint': ['This glowing flower got mixed up. Tap it to lift it out, then find where it belongs.'],
} satisfies Record<string, string[]>;
