// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.island-bridges': ['Island bridges!'],
  'bridges.go': ['Give each island as many planks as its number, with no crossing, and join them all.'],
  'bridges.go-touch': [
    'Give each island as many planks as its number, with no crossing, and join them all. Tap the water between two islands to lay a plank.',
  ],
  'bridges.go-three': [
    'This time a bridge can carry up to three planks. Give each island as many planks as its number, with no crossing, and join them all.',
  ],
  'bridges.go-three-touch': [
    'This time a bridge can carry up to three planks: tap the water again for a third. Give each island as many planks as its number, with no crossing, and join them all.',
  ],
  'bridges.cross': ['A bridge would cross another there, or an island has no room. Try another.'],
  'bridges.hint-fix': ['A bridge here is not part of the answer. Take a plank off the ringed bridge.'],
  'bridges.hint-fix-touch': [
    'A bridge here is not part of the answer. Take off is on, so tap the ringed bridge.',
  ],
  'bridges.hint-full': [
    'Just enough room: the ringed island needs every plank it still has room for, so the lit bridge has to carry one.',
  ],
  'bridges.hint-last-way': [
    'One way left: the ringed island has room on only the lit bridge, so the rest of its number goes there.',
  ],
  'bridges.hint-every-way': [
    'One short of full: the ringed island needs all but one of the planks it has room for, so the lit bridge needs at least one.',
  ],
  'bridges.hint-next': ['A plank belongs on the lit bridge between the two ringed islands.'],
  'bridges.hint-joined': [
    'Keep them joined: filling the dashed bridge would cut the islands in dashed rings off from the rest, so the lit bridge needs a plank.',
  ],
  'bridges.hint-joined-same': [
    'Keep them joined: two planks on the lit bridge would cut the islands in dashed rings off from the rest, so it carries one plank, not two.',
  ],
  'bridges.joined': ['Every island is joined!', 'A bridge to every island!'],
  'bridges.done': ['A whole archipelago, joined.'],
  'bridges.done-school': ["Every island has its planks, and they're all joined!"],
  'bridges.trouble': ["The red island can't reach its number now. Take a plank off a bridge next to it."],
} satisfies Record<string, string[]>;
