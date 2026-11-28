// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.song-maker': ['Song Maker!'],

  'song.free': ['Tap the jellies to make a song! Listen to it go round and round.'],
  'song.wake': ['Touch anywhere! The jelly sings, and more jellies wake up.'],
  'song.compose': ['Make your very own song! Tap the jellies, and listen to it go round.'],
  'song.compose.ready': ['Do you like your song? Press the check to hear it once more!'],
  'song.answer': ['Listen to my song, {name}! Now answer it: tap one jelly in each of the last four beats.'],
  'song.answer.ready': ['Is that a good answer, {name}? Press the check to hear our song once more!'],
  'song.home': [
    'Listen to my song, {name}! Now answer it, and end your answer on the home jelly at the very bottom.',
  ],
  'song.home.hear': [
    'Hear how this one sounds finished, {name}? It ends on the home jelly. Change your last jelly to try it!',
  ],
  'song.change.higher': ['Here is my song, {name}. Change one thing: make the end go higher!'],
  'song.change.match': [
    'Here is my song, {name}. Change one thing: make beat four sound just like beat one!',
  ],
  'song.change.down': ['Here is my song, {name}. Change one thing: make it go down at the very end!'],
  'song.change.quiet': ['Here is my song, {name}. Change one thing: give it a quiet beat, with no jelly!'],
  'song.change.higher.again': ['Listen to the end. Is it higher than my song? Move the last jelly up!'],
  'song.change.match.again': ['Beat four does not sound like beat one yet. Put them on the same row!'],
  'song.change.down.again': [
    'It does not go down at the end yet. Make the last jelly lower than the one before!',
  ],
  'song.change.quiet.again': ['Every beat still has a jelly. Tap one to make that beat quiet!'],
  'song.change.ready': ['Is that the change, {name}? Press the check to hear our song once more!'],
  'song.finish': ['Listen to my start, {name}! Now finish it: tap one jelly in each of the last two beats.'],
  'song.finish.ready': ['Is that a good ending, {name}? Press the check to hear our song once more!'],
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
  'song.listenTwo': ['Listen to the tune. Then pick which of the two shadows matches each note!'],
  'song.again': ['Listen again. Is it higher or lower?'],
  'song.wrong': ['Hmm, not that one. Try another jelly!'],
  'song.hint': ['Try the glowing jelly!'],
  'song.done': ['What a beautiful song!', 'You made music!'],
} satisfies Record<string, string[]>;
