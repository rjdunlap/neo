// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'village-vote.title': ['Village Vote!'],
  'village-vote.two': ['Tap the paws to count. Which picture has more votes?'],
  'village-vote.preference': ['What would your pet like? Choose a picture.'],
  'village-vote.pet-count': ['Your pet voted too. Count the paws. Which picture has more votes?'],
  'village-vote.three': ['Count the paws at each picture. Which picture has the most votes?'],
  'village-vote.count': ['{n} votes for the {thing}.'],
  'village-vote.one': ['One vote for the {thing}.'],
  'village-vote.empty': ['No votes here.'],
  'village-vote.zero': ['No votes counted here.'],
  'village-vote.again': ["Let's count again."],
  'village-vote.free': ['Choose either picture for your pet.'],
  'village-vote.compare-two': ['{n} is more than {a}. Choose the {thing}.'],
  'village-vote.compare-three': ['{n} is more than {a}, and more than {b}. Choose the {thing}.'],
  'village-vote.result': ["The {thing} has the most votes. Let's all try it!"],
} satisfies Record<string, string[]>;
