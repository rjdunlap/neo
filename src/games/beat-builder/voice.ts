// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.beat-builder': ['Beat builder!'],
  'beat.free': ['Tap squares to make a beat! {drum} on top, {clap} below. Listen to it go round.'],
  'beat.done-when': ['When you like your beat, tap the green check!'],
  'beat.see': ['Copy the beat! Fill in the faint squares.'],
  'beat.hear': [
    'Listen to the beat, then build it! Tap the note to hear it again, and the green check when you are ready.',
  ],
  'beat.repeat': ['Make the beat repeat! The second half should match the first half.'],
  'beat.notsee': ['That square is not in this beat. Look for the faint ones.'],
  'beat.notrepeat': ['Look at the first half. Does that square have a sound there?'],
  'beat.nothear': ['Not quite the same. Listen again!'],
  'beat.hint': [
    'Glowing plus marks need a sound. Glowing minus marks have an extra sound. Tap those squares to repair the beat.',
  ],
  'beat.phrase': ['This beat is called {phrase}.'],
  'beat.mend': ['One sound in your copy is different from the model. Fix it, then tap the green check!'],
  'beat.revise': [
    'The drum stays put. Listen, then move the claps to match! Tap the clap button to hear just the claps.',
  ],
  'beat.locked': ['The drum keeps its place. Change the claps!'],
  'beat.ab': [
    'Make the circle part. Copy it to the square part, change it a little, then play them one after the other!',
  ],
  'beat.ab-empty-a': ['Put a sound in the circle part first.'],
  'beat.ab-empty-b': ['Put a sound in the square part too.'],
  'beat.ab-same': ['The two parts sound the same. Change the square part a little!'],
  'beat.ab-preview': ['Tap the play button to hear both parts, one after the other.'],
  'beat.ret': [
    'Make the song come back! Put the circle part again at the end, after the square part. Tap a card to turn it over.',
  ],
  'beat.ret-order': ['Not yet. A song that comes back plays circle, then square, then circle again.'],
  'beat.ret-hint': ['Look at the glowing card. Turn it over so the song ends where it began.'],
  'beat.free-toddler': ['Tap a square to make a sound! Listen for it as it goes round.'],
  'beat.toddler-empty': ['All quiet! Tap a square to bring a sound back.'],
  'beat.mendno': ['Not quite. Look at the {instrument} row, {place} square.'],
  'beat.yay': ['That is the beat!', 'Groovy!', 'You got the rhythm!'],
  'beat.done': ['What a band! Thank you for the music!'],
} satisfies Record<string, string[]>;
