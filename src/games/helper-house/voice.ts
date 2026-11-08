// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.helper-house': ['Helper House!'],
  'hh.instruct.1': [
    'Drag the eye to the door, so the door can see a friend coming. Then tap Watch and see the house run its day.',
  ],
  'hh.instruct.2': [
    'Make the lamp come on when it gets dark. Pick the sensor the lamp needs, then tap Watch.',
  ],
  'hh.instruct.3': [
    'The lamp comes on when it gets dark. Add the missing row so it turns off again by morning, then tap Watch.',
  ],
  'hh.instruct.4': [
    'The nook is chilly. Pick which warmth turns the heater on and which turns it off, so the nook stays comfy. Then tap Watch.',
  ],
  'hh.instruct.5': [
    'Keep the lamp on all night, without flickering. Drag the sun sensor to a better place, then tap Watch.',
  ],
  'hh.instruct.6': [
    'Set the line so the nook stays comfy. Below the line the heater turns on, above it the heater turns off. Then tap Watch.',
  ],
  'hh.instruct.7': [
    'Keep the nook comfy, with fewer clicks. Pull the two lines apart so the heater can rest between them, then tap Watch.',
  ],
  'hh.guess.ask': [
    'The line is way up high. Will the nook warm up faster? Tap the hare for faster, or the two flames for the same.',
  ],
  'hh.guess.faster': ['Faster? Let us watch and see.'],
  'hh.guess.same': ['The same? Let us watch and see.'],
  'hh.guess.truth': ['The heater warms one step at a time, wherever the line is.'],
  'hh.click': ['Click! The heater switched, so a pebble dropped in the jar.'],
  'hh.watch': ['Here comes the day. Watch the sensor, the card and the helper.'],
  'hh.placed': ['Sensor in! Tap Watch to see what it does.'],
  'hh.row-set': ['Row set. Tap Watch to see what the lamp does now.'],
  'hh.row-set.4': ['Row set. Tap Watch to see what the heater does now.'],
  'hh.friend-waiting': [
    'The friends waited outside all day. The eye never saw anyone, so the door never opened.',
  ],
  'hh.sensor-blind': ['The lamp stayed off in the dark. Nothing told it that it was dark.'],
  'hh.lamp-flickers': ["The lamp's own light reached its sensor, so it turned itself off."],
  'hh.heater-busy': ['The heater clicked on and off all day. Nothing lets it rest.'],
  'hh.lamp-on-at-morning': ['The lamp is still on in the morning. Nothing tells it to turn off.'],
  'hh.lamp-off-at-night': ['The lamp stayed off in the dark. A later card turned it off again.'],
  'hh.never-warms': ['The nook stayed chilly. Nothing kept the heater on while it was cool.'],
  'hh.too-warm': ['The nook got too hot. The heater stayed on, because nothing turned it off in time.'],
  'hh.glow': ['Look at the glowing part. Try changing that one.'],
  'hh.offer': ['Shall I set it up? Tap the green tick and we will watch it together.'],
  'hh.help.sensor.1': ['I put the eye above the door. Now it sees a friend who comes near. Tap Watch!'],
  'hh.help.sensor.2': ['I put in the sun sensor. It tells the lamp when the sky is dark. Tap Watch!'],
  'hh.help.sensor.5': [
    "I put the sun sensor up on the roof. The lamp's own light can't reach it there. Tap Watch!",
  ],
  'hh.help.row': ['I added the row: when it is bright, the lamp turns off. Tap Watch!'],
  'hh.help.row.4.on': ['I added the row: when it is cool, the heater turns on. Tap Watch!'],
  'hh.help.row.4.off': ['I added the row: when it is warm, the heater turns off. Tap Watch!'],
  'hh.help.6': ['I moved the line to the comfy part of the gauge. Tap Watch!'],
  'hh.help.7.off': ['I moved the off line up, so the heater rests while the nook is comfy. Tap Watch!'],
  'hh.help.7.on': [
    'I moved the on line, so the heater comes back on before the nook gets chilly. Tap Watch!',
  ],
  'hh.help.done': ['Everything is in place. Tap Watch and see the day.'],
  'hh.help.setup': ['I set it up. Let us watch the day together.'],
  'hh.done': ['The helper did its job all day by itself. Nice work!'],
} satisfies Record<string, string[]>;
