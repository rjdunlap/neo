// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// `{fixture}` is "window" or "door" and `{name}` is her name, so each line carries a variable and stays on device speech.
export const VOICE = {
  'game.common-ground': ['A place for you!'],
  'common-ground.start': ['{name}, a friend is coming! Listen to what they would like.'],
  'common-ground.request': ['I would like my cushion by the {fixture}, and my book basket right beside it.'],
  'common-ground.miss.cushion': ['Hmm, my cushion is not by the {fixture} yet.'],
  'common-ground.miss.basket': ['My basket is not beside my cushion yet, {name}.'],
  'common-ground.hint': ['Try the glowing piece, {name}. It goes in the glowing place.'],
  'common-ground.ok': ['Just right. Thank you, {name}!'],
  'common-ground.plant': ['A plant! That is a nice extra.'],
  'common-ground.noplant': ['Cozy, just like I asked, {name}.'],
  'common-ground.finish': ['You listened and made a place for your friend, {name}.'],
};
