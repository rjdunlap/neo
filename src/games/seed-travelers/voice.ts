// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  // Seed Travelers: a fluffy seed rides the breeze, a hooky seed rides in fur.
  'game.seed-travelers': ['Seed Travelers'],
  'seeds.ask.breeze': ['Tap the bellows to blow the fluffy seed to the tray!'],
  'seeds.ask.fur': ['Tap the hooky seed, then tap the furry friend to carry it!'],
  'seeds.ask.both': ['Can you get both seeds to the tray? Choose a seed and a helper.'],
  'seeds.name.plume': ['The fluffy seed.'],
  'seeds.name.burr': ['The hooky seed.'],
  'seeds.which.seed': ['Which seed?'],
  'seeds.which.helper': ['Which helper?'],
  'seeds.arrived.breeze': ['The wind carried the fluffy seed!'],
  'seeds.arrived.fur': ['The hooky seed caught on the fur, and fell off at the tray!'],
  'seeds.stayed.breeze': ['It stayed. It has no fluff to catch the wind.'],
  'seeds.stayed.fur': ['It slid off. It has no hooks to hold on.'],
  'seeds.load.first': ['Put the hooky seed on first.'],
  'seeds.finish': ["Tap the basket when you're done."],
  'seeds.again': ['Again! Tap the bellows.'],
  'seeds.hint': ['Try this.'],
  'seeds.done': ['Both seeds made it!'],
} satisfies Record<string, string[]>;
