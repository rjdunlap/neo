// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// `{fixture}` is "window" or "door" and `{name}` is her name, so each line carries a variable and stays on device speech.
export const VOICE = {
  'common-ground.title': ['A place for you!'],
  'common-ground.start': ['{name}, a friend is coming! Listen to what they would like.'],
  'common-ground.request': ['I would like my cushion by the {fixture}, and my book basket right beside it.'],
  'common-ground.miss.cushion': ['Hmm, my cushion is not by the {fixture} yet.'],
  'common-ground.miss.basket': ['My basket is not beside my cushion yet, {name}.'],
  'common-ground.hint': ['Try the glowing piece, {name}. It goes in the glowing place.'],
  'common-ground.ok': ['Just right. Thank you, {name}!'],
  'common-ground.plant': ['A plant! That is a nice extra.'],
  'common-ground.noplant': ['Cozy, just like I asked, {name}.'],
  'common-ground.change': ['Oh, {name}, could my basket be on a different side of the cushion?'],
  'common-ground.miss.same': ['My basket is still on the same side, {name}.'],
  'common-ground.better': ['That is a better side. Thank you, {name}!'],
  'common-ground.finish': ['You listened and made a place for your friend, {name}.'],
  // Level 3, two residents. Every line carries {name} so it stays on device speech.
  'common-ground.start3': ['{name}, two friends share this room. Listen to what each one needs.'],
  'common-ground.drawer': [
    'I need a place by the window to draw, {name}. It would be nice to have the shelf.',
  ],
  'common-ground.drummer': ['I need a place for my drums, {name}. It would be nice to be by the doorway.'],
  'common-ground.miss.window': ['My easel is not by the window yet, {name}.'],
  'common-ground.miss.beside': [
    'My drums are right next to the drawing, {name}. They need a different place.',
  ],
  'common-ground.clash': [
    'The shelf and the doorway wishes can not both happen in this room. Which plan would you like to try, {name}?',
  ],
  'common-ground.ok.shelf': ['Both needs are kept, {name}, and the drawing is by the shelf.'],
  'common-ground.ok.doorway': ['Both needs are kept, {name}, and the drums are by the doorway.'],
  'common-ground.ok.neither': ['Both needs are kept, {name}. The wishes are for another plan.'],
  'common-ground.again': ['Let us try another plan, {name}.'],
  'common-ground.finish3': ['You found a plan that keeps what each friend needs, {name}.'],
};
