// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'game.weather-wardrobe': ['Weather Wardrobe!'],

  'weather.friends': [
    'Two friends, two places! One is in {a} weather, and one is in {b} weather. Drag each thing to the friend who needs it.',
  ],
  'weather.friend.wrong': [
    '{item} for {weather} days. This friend has {other} weather. Try the other friend.',
  ],
  'weather.friend.hint': ['Drag the glowing thing to the glowing friend in {weather} weather.'],
  'weather.friends.ready': ['Both friends are dressed for their weather!'],
  'weather.play': ['Tap the sky to change the weather!'],
  'weather.sunny': ['Sunny! Hats and sunglasses on.'],
  'weather.rainy': ['Rainy! Pitter patter. Umbrella up!'],
  'weather.snowy': ['Snowy! Brr! Bundle up.'],
  'weather.windy': ['Windy! Whoosh! Hold on to your hat.'],
  'weather.try': ['It is {weather} today! Try something on {pet}!'],
  'weather.pick': ['It is {weather} today! What should {pet} wear?'],
  'weather.all': ['It is {weather} today! Find everything {pet} needs.'],
  'weather.temp': [
    'It is {weather} today, and look at the thermometer: it is {temp}! Find one thing for the sky and one thing for the {temp} day.',
  ],
  'weather.temp.wrong': ['{item} for {temp} days. Look at the thermometer. Try another!'],
  'weather.trip': ['We are going on a trip! First it will be {a}, then {b}. Pack what we need for both!'],
  'weather.light.rain.three': [
    'Rain first, then snow. Pack two things for each sky. The case has just three spaces!',
  ],
  'weather.light.snow.three': [
    'Snow first, then rain. Pack two things for each sky. The case has just three spaces!',
  ],
  'weather.light.rain.two': ['Rain first, then snow. Pack one thing for each sky. The case has two spaces!'],
  'weather.light.snow.two': ['Snow first, then rain. Pack one thing for each sky. The case has two spaces!'],
  'weather.light.space': ['Save a spot for the other sky. Try a different thing.'],
  'weather.light.boots': ['The same boots work in rain and snow!'],
  'weather.wrong': ['{item} for {weather} days. Try another!'],
  'weather.yes': ['Good idea!', 'Just right!', 'Yes!'],
  'weather.ready': ['{pet} is ready to go out!', 'All set! Let us go!'],
  'weather.which': ['Look at what {pet} is wearing! What is the weather today?'],
  'weather.sky.wrong': ['That is {weather}, but look at what {pet} is wearing. Try another sky!'],
  'weather.hint': ['Try the glowing one!'],
  'weather.name': ['{item}!'],
  'weather.change.remove': [
    'The weather is changing to {weather}. Tap the clothes that do not fit to take them off.',
  ],
  'weather.keep.remove': [
    'The weather is changing to {weather}. Some clothes still fit! Take off only what does not fit.',
  ],
  'weather.keep.wrong': ['{item} for {weather} days too. Keep that on!'],
  'weather.keep.hint': ['{pet} is wearing something that does not fit. Try the one that wiggles!'],
  'weather.change.add': ['Now it is {weather}. What should {pet} wear?'],
} satisfies Record<string, string[]>;
