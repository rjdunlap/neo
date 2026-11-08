// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.robot-path': ['Robot Path!'],
  'robot.counts': ['Tap an arrow again to go further: tap it four times for four steps! Then press play.'],
  'robot.loop': [
    'The purple loop button repeats your whole program. Make one part of the path, then loop it!',
  ],
  'robot.fix': [
    'The program is already here. Press play to watch, then tap a slot to change and tap an arrow. Press play again to reach the star!',
  ],
  'robot.fix.watch': ['It stopped short. Can you fix the program so it reaches the star?'],
  'robot.fix.hint': ['Tap the glowing slot, then add one more step.'],
  'robot.fix.clear': ['That step went too far. Tap the glowing button to start the program again.'],
  'robot.mend': [
    'This program has a loop. Press play to watch, then fix one slot or change how many times it loops. Press play again to reach the star!',
  ],
  'robot.mend.hint': ['Tap the glowing loop button so the program goes round more times.'],
  'robot.via': [
    'Pick up the apple on the way! Make a path that goes through the apple and ends on the star.',
  ],
  'robot.forgot': ['You forgot the apple! Go through it on the way to the star.'],
  'robot.empty': ['Tap some arrows first.'],
  'robot.short': ['It stopped here. It needs more steps.'],
  'robot.bump': ['A bump! Let us change our path and try again.'],
  'robot.hint': ['Follow the glowing arrow.'],
  'robot.clear': ['Let us try a new path.'],
  'robot.predict': ['Read the arrows. Tap the square where the robot will stop, then press play and watch.'],
  'robot.predict.choose': ['Choose a square where the robot might stop, then press play to find out.'],
  'robot.predict.right': ['You knew where it would stop!'],
  'robot.predict.reveal': ['The robot stopped right here. Where did the arrows take it?'],
} satisfies Record<string, string[]>;
