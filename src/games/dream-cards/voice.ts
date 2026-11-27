// What Dream Cards says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
// `{name}` is her name, `{a}` and `{b}` are dream picture names and `{clue}` is a clue word, so every line carries a
// slot and stays on device speech. No line says right, wrong, correct or mistake, and none says what anyone feels.
export const VOICE = {
  'game.dream-cards': ['Dream clues, {name}!'],
  'dream-cards.start': ['{name}, do you want to play with the pet, or with a friend next to you?'],
  'dream-cards.ask-give': ['{name}, pick a dream, then pick a clue about it.'],
  'dream-cards.ask-point': ['Which picture does {clue} make you think of, {name}?'],
  'dream-cards.cover': ['Shh, {name}. The dream is hiding.'],
  'dream-cards.pass': ['Pass it to your friend, {name}.'],
  'dream-cards.pet-clue': ['I am thinking of something {clue}, {name}.'],
  'dream-cards.pet-points': ['{clue} makes me think of the {b}, {name}.'],
  'dream-cards.word': ['{a}'],
  // The pet gave the clue.
  'dream-cards.reveal-same': ['We both saw the {a}, {name}!'],
  'dream-cards.reveal-both': ['I saw the {a}. You saw the {b}. Both can be {clue}.'],
  'dream-cards.reveal-new': ['I saw the {a}. You saw the {b}. That is a new way to see {clue}.'],
  // She gave the clue and the pet pointed.
  'dream-cards.reveal-same-me': ['We both saw the {a}, {name}!'],
  'dream-cards.reveal-both-me': ['You saw the {a}. I saw the {b}. Both can be {clue}.'],
  'dream-cards.reveal-new-me': ['You saw the {a}. I saw the {b}. That is a new way to see {clue}.'],
  // Two people on the same device.
  'dream-cards.reveal-same-pair': ['You both saw the {a}, {name}!'],
  'dream-cards.reveal-both-pair': ['One of you saw the {a}, one saw the {b}. Both can be {clue}.'],
  'dream-cards.reveal-new-pair': [
    'One of you saw the {a}, one saw the {b}. That is a new way to see {clue}.',
  ],
  'dream-cards.show-me': ['Here it is, {name}. It was the {a}.'],
  'dream-cards.hint-point': ['The {a} can be {clue}. So can another one.'],
  'dream-cards.hint-give': ['The {a} can be {clue}, {name}.'],
  'dream-cards.swap': ['Your turn to give a clue, {name}.'],
  'dream-cards.finish': ['What a lot of ways to see one clue, {name}!'],
};
