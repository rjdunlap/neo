// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.campsite': ['Campsite!'],
  'campsite.start': [
    'Pitch one tent beside each tree. Match the tent counts. Leave space so no tents touch, even at the corners.',
  ],
  'campsite.tree': ['A tent goes right beside this tree.'],
  'campsite.full': ['All three tents are up. Pack up a tent to move it.'],
  'campsite.left-1': ['One more tent to pitch.'],
  'campsite.left-2': ['Two more tents to pitch.'],
  'campsite.left-3': ['Three tents to pitch, one beside each tree.'],
  'campsite.touch': ['Two tents are touching. Leave space around every tent, even at the corners.'],
  'campsite.row': ['A row has the wrong number of tents. Look at its sign.'],
  'campsite.col': ['A column has the wrong number of tents. Look at its sign.'],
  'campsite.lonely': ['This tree has no tent beside it. Every tree needs its own tent.'],
  'campsite.share': ['These trees are sharing a tent. Every tree needs its own tent right beside it.'],
  'campsite.hint-first': [
    'Row two needs zero tents, so this tree cannot use the square below it. Its tent goes here.',
  ],
  'campsite.hint-second': [
    'This tree’s tent cannot go in row two, and up top it would touch the first tent. So it goes below, here.',
  ],
  'campsite.hint-third': ['Row three has its tent now, so the last tree’s tent goes up top, here.'],
  'campsite.pack-zero-row': ['This tent is in a row that needs zero tents. Tap it to pack it up.'],
  'campsite.pack-zero-col': ['This tent is in a column that needs zero tents. Tap it to pack it up.'],
  'campsite.pack-no-tree': ['This tent is not beside any tree. Tap it to pack it up.'],
  'campsite.pack-in-the-way': ['This tent is in the way of another tree’s tent. Tap it to pack it up.'],
  'campsite.done': ['Every tree has its own tent. The campers are coming out!'],
} satisfies Record<string, string[]>;
