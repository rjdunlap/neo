// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.habitat-helpers': ['Habitat helpers!'],
  'habitat.start': ['Help {visitor}! Put food, water and shelter in the garden. Then tap the green gate.'],
  'habitat.build': ['Build a garden for {visitor}. Find food, water and shelter, then tap the green gate.'],
  'habitat.compact': ['Only two spaces! Find pieces that give {visitor} food, water and shelter.'],
  'habitat.together': [
    'Can one little garden welcome Bunny and Duck together? Give them both food, water and shelter.',
  ],
  'habitat.predict': [
    'Look at the garden. Who do you think will visit? Pick Bunny or Duck, then tap the green gate.',
  ],
  'habitat.think': ['You predict {visitor}. Tap the green gate to test it!'],
  'habitat.choose': ['Pick Bunny or Duck first. Who do you think will come?'],
  'habitat.testing': ["Let's open the garden and see!"],
  'habitat.missing': ['No visitor yet. {visitor} still needs {need}. Change the garden and test again!'],
  'habitat.glow': ['A piece that can give {need} is glowing.'],
  'habitat.full': ['The garden is full. Tap a piece in the garden to take it out.'],
  'habitat.place': ['{piece}. It can give {help}.'],
  'habitat.remove': ['{piece} is back in the tray.'],
  'habitat.arrived': ['{visitor} found everything it needs. Welcome!'],
  'habitat.both': ['Bunny and Duck both found what they need. They can share this garden!'],
  'habitat.predicted': ['You predicted it!'],
  'habitat.found': ['We found {visitor}. Now we know what this garden provides!'],
  'habitat.done': ['Food, water and shelter. What a welcoming garden!'],
  'habitat.change-intro': ["Here is {visitor}'s garden. It has food, water and shelter. Watch what happens!"],
  'habitat.change.pool-dried': ['The summer sun dried up the pool. Bunny hops off to find a drink.'],
  'habitat.change.reeds-flattened': [
    'A big storm blew the tall reeds flat. Duck waddles off to find a place to hide.',
  ],
  'habitat.change.clover-finished': [
    'The clover is finished for the year. Bunny hops off to find something to eat.',
  ],
  'habitat.change.seeds-gone': [
    'Winter came, and the seed grass has no seeds left. Duck waddles off to find food.',
  ],
  'habitat.which-need': [
    'Something changed! What does {visitor} need now? Look at the before picture, then tap food, water or shelter.',
  ],
  'habitat.need-wrong': ['Look at the before picture. What is different?'],
  'habitat.need-glow': ['The need that changed is glowing.'],
  'habitat.repair': [
    'Yes! {visitor} needs {need}. Put a piece that gives {need} in the empty space, then tap the green gate.',
  ],
  'habitat.restored': ['{visitor} is back! The garden has food, water and shelter again.'],
  'habitat.shore': [
    'The sea will go out soon. Tap a friend, then tap a place for it. When everyone has a place, tap the wave to let the sea go out.',
  ],
  'habitat.shore-three': [
    'Three places on the shore! Find every friend a place that has what it needs when the sea goes out. The rock pool has room for one.',
  ],
  'habitat.shore-pick': ['The {friend}. Where should it go?'],
  'habitat.shore-place.high-rock': ['The high rock. When the sea goes out, it dries in the sun.'],
  'habitat.shore-place.rock-pool': ['The rock pool. It stays wet when the sea goes out.'],
  'habitat.shore-place.seaweed-rocks': ['The seaweed rocks. There are places to hide under the seaweed.'],
  'habitat.shore-full': ['There is no more room there. Move a friend out first.'],
  'habitat.shore-sand': ['Find a place for every friend first.'],
  'habitat.shore-tide': ['Here goes the sea!'],
  'habitat.shore-anemone-high': [
    'The anemone pulled in tight. It needs to stay wet, and up here the rock dries out.',
  ],
  'habitat.shore-anemone-dry': [
    'The anemone pulled in tight. It needs to stay wet, and these rocks dry out when the sea goes out.',
  ],
  'habitat.shore-crab': ['The crab has nowhere to hide from the gulls! It scuttles behind a rock to wait.'],
  'habitat.shore-back': ['The sea comes back in. Try a different place!'],
  'habitat.shore-glow': ['A friend and a good place for it are glowing.'],
  'habitat.shore-ok': ['The sea went out, and every friend has what it needs!'],
  'habitat.shore-done': ['Wet pools, dry rocks and hiding places. Everyone has a home on the shore!'],
} satisfies Record<string, string[]>;
