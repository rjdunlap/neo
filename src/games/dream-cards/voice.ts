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
  // Level 2: a second clue for the same picture, then a second look.
  'dream-cards.ask-second': ['Now say one more clue about the same dream, {name}.'],
  'dream-cards.pet-clue2': ['And it is {clue2} too, {name}.'],
  'dream-cards.ask-again': ['{clue} and {clue2}. Keep your picture, or look again, {name}?'],
  'dream-cards.kept': ['You are keeping the {b}, {name}.'],
  'dream-cards.moved': ['A second clue can change what you see, {name}.'],
  'dream-cards.hint-clues': ['Look for one that can be {clue} and {clue2}, {name}.'],
  'dream-cards.hint-any': ['Any clue is fine, {name}. Say what it makes you think of.'],
  // The pet gave the clues.
  'dream-cards.reveal2-same': ['I saw the {a}, and you found it, {name}. {clue} and {clue2}!'],
  'dream-cards.reveal2-both': ['I saw the {a}. You saw the {b}. Both can be {clue} and {clue2}.'],
  'dream-cards.reveal2-new': ['I saw the {a}. You saw the {b}. That is a new way to see {clue} and {clue2}.'],
  // She gave the clues and the pet pointed.
  'dream-cards.reveal2-same-me': ['We both saw the {a}, {name}. {clue} and {clue2}!'],
  'dream-cards.reveal2-both-me': ['You saw the {a}. I saw the {b}. Both can be {clue} and {clue2}.'],
  'dream-cards.reveal2-new-me': [
    'You saw the {a}. I saw the {b}. That is a new way to see {clue} and {clue2}.',
  ],
  // Two people on the same device.
  'dream-cards.reveal2-same-pair': ['You both saw the {a}, {name}. {clue} and {clue2}!'],
  'dream-cards.reveal2-both-pair': [
    'One of you saw the {a}, one saw the {b}. Both can be {clue} and {clue2}.',
  ],
  'dream-cards.reveal2-new-pair': [
    'One of you saw the {a}, one saw the {b}. That is a new way to see {clue} and {clue2}.',
  ],
  // Level 3: she builds a dream picture, then gives its clue.
  'dream-cards.ask-build': ['{name}, pick a place, a thing and a light for your dream.'],
  'dream-cards.part': ['{a}'],
  'dream-cards.build-done': ['What a dream, {name}! Pick a clue for it.'],
  'dream-cards.hint-build': ['Pick one of each, {name}: a place, a thing and a light.'],
  'dream-cards.hint-clue': ['Your dream can be {clue}, {name}.'],
  'dream-cards.pet-builds': ['I made a dream, {name}.'],
  'dream-cards.reveal3-same': ['We both saw your dream, {name}!'],
  'dream-cards.reveal3-both': ['I saw the {b}. You made the {a}. Both can be {clue}.'],
  'dream-cards.reveal3-new': ['I saw the {b}. You made the {a}. That is a new way to see {clue}.'],
  'dream-cards.show-me': ['Here it is, {name}. It was the {a}.'],
  'dream-cards.hint-point': ['The {a} can be {clue}. So can another one.'],
  'dream-cards.hint-give': ['The {a} can be {clue}, {name}.'],
  'dream-cards.swap': ['Your turn to give a clue, {name}.'],
  'dream-cards.finish': ['What a lot of ways to see one clue, {name}!'],
};
