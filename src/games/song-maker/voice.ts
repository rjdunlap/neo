// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.song-maker': ['Song Maker!'],

  'song.free': ['Tap the jellies to make a song! Listen to it go round and round.'],
  'song.wake': ['Touch anywhere! The jelly sings, and more jellies wake up.'],
  'song.copy': ['Tap the shadow jellies to make the song!'],
  'song.card': ['Make your song look just like the little card!'],
  'song.pattern.stairs-up': ['This one goes up like stairs. Keep the song going the same way!'],
  'song.pattern.stairs-down': ['This one goes down like stairs. Keep the song going the same way!'],
  'song.pattern.zigzag': ['This one goes like a zigzag. Keep the song going the same way!'],
  'song.pattern.hop': ['This one hops, up and down. Keep the song going the same way!'],
  'song.pattern.twins': [
    'This one goes like twins: two the same, then two the same. Keep the song going the same way!',
  ],
  'song.pattern.arch': ['This one goes up and over, like an arch. Keep the song going the same way!'],
  'song.pattern.valley': ['This one goes down and up, like a valley. Keep the song going the same way!'],
  'song.pattern.climb-rest': ['This one climbs up, then rests. Keep the song going the same way!'],
  'song.pattern.big-leap': ['This one makes a big leap, low then high! Keep the song going the same way!'],
  'song.pattern.step-back': [
    'This one steps up, steps back, then steps up higher. Keep the song going the same way!',
  ],
  'song.listen': ['Listen to the tune. Then find each note, one beat at a time.'],
  'song.again': ['Listen again. Is it higher or lower?'],
  'song.wrong': ['Hmm, not that one. Try another jelly!'],
  'song.hint': ['Try the glowing jelly!'],
  'song.done': ['What a beautiful song!', 'You made music!'],
} satisfies Record<string, string[]>;
