// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.down-we-go': ['Down we go!'],
  'down.instruct.1': ['Pull the lantern down. Then tap the deepest ledge where the seaweed can grow.'],
  'down.instruct.2': [
    'This seaweed needs {need} petals of light. Measure with the lantern, then plant it as deep as it can live.',
  ],
  'down.ride': ['Pull the lantern all the way down first.'],
  'down.knot.lots': ['Lots of light up here.'],
  'down.knot.less': ['Less light now.'],
  'down.knot.none': ['No daylight here. Our lantern keeps it cosy.'],
  'down.rooted': ["It's growing! There is enough light here."],
  'down.deeper': ['It can grow here. Can it live deeper still?'],
  'down.wrong': ['Only {n} here. It needs {need}.'],
  'down.unmeasured': ['Not enough light there. Now we know.'],
  'down.hint': ['Count the petals here.'],
  'down.why': ['Seaweed needs sunlight to make its food, so it lives where the light reaches.'],
  'down.glow': ['Some animals in the dark sea make their own light.'],
};
