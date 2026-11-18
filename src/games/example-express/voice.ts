// What this game says, keyed by line id; src/content/voice-script.ts gathers every game's lines into SCRIPT.
export const VOICE = {
  'ee.title': ['Example Express.'],
  'ee.instruction1': [
    'Circles to the tree. Squares to the house. Give these two examples their docks, then check.',
  ],
  'ee.instruction2': [
    'Circles to the tree. Squares to the house. Watch this yellow circle. Then choose an example to change the sorter’s rule.',
  ],
  'ee.instruction3': [
    'Choose examples for circles to the tree and squares to the house. Test your lesson, then check.',
  ],
  'ee.rule0': ['The sorter used color. Blue to the tree. Yellow to the house.'],
  'ee.rule1': ['The sorter used color. Yellow to the tree. Blue to the house.'],
  'ee.rule2': ['The sorter used shape. Circles to the tree. Squares to the house.'],
  'ee.rule3': ['The sorter used shape. Squares to the tree. Circles to the house.'],
  'ee.rule4': ['The sorter used stamps. Leaves to the tree. Stars to the house.'],
  'ee.rule5': ['The sorter used stamps. Stars to the tree. Leaves to the house.'],
  'ee.needs': ['The sorter needs examples before it can send a parcel.'],
  'ee.tree': ['Tree dock.'],
  'ee.house': ['House dock.'],
  'ee.test': [
    'Test is free. Choose a practice parcel with the arrows, then Send. Testing does not change the lesson.',
  ],
  'ee.test3': [
    'Test is free. Choose a practice parcel with the arrows, then Send. A practice parcel can also be one of your examples. Testing does not change the lesson.',
  ],
  'ee.parcel': ['A {color} {shape} with a {stamp} stamp.'],
  'ee.route': ['{color} {shape}, {stamp} stamp. Sorter: {actual}. Request: {required}.'],
  'ee.failed': [
    'This delivery is different from the request. {color} {shape}, {stamp} stamp. Sorter: {actual}. Request: {required}. Change an example and check again.',
  ],
  'ee.missing': [
    'The {color} {shape} with a {stamp} stamp needs a dock. Choose the tree or the house for this example.',
  ],
  'ee.surprise': [
    'The yellow circle went to the house. The request says tree. The sorter used color. Choose an example to help it use shape.',
  ],
  'ee.placeExample': ['Now tap an open slot, or replace an example in an open slot.'],
  'ee.locked': ['This example stays in the lesson.'],
  'ee.chooseDock': ['Choose the tree dock or the house dock for this example.'],
  'ee.selected': ['This example is selected. Change opens Undo, Reset and Remove.'],
  'ee.selected3': [
    'This example is selected. Tap a dock to change its label, Examples to swap the parcel, or Change to remove it.',
  ],
  'ee.openSlot': ['This slot is open. Tap Examples to choose a parcel for it.'],
  'ee.full': ['The lesson holds four examples. Tap one first to swap it, or use Change to remove it.'],
  'ee.shelf': ['Choose one of these labelled examples. Then tap a slot in the lesson.'],
  'ee.shelf3': ['Choose a parcel for the lesson. Then give it the tree dock or the house dock.'],
  'ee.tools': [
    'Undo takes back your last change. Reset starts the lesson again. Select an example first to remove it.',
  ],
  'ee.undo': ['Your last change is undone. The sorter fits the examples again.'],
  'ee.reset': ['The starting examples are back. Your checks and help still count.'],
  'ee.remove': ['That example is back on the shelf. The sorter fits the examples again.'],
  'ee.back': ['Back to the lesson.'],
  'ee.checkNow': ['The lesson is ready. Check the deliveries.'],
  'ee.helpLabel': ['Watch. Choose the {color} {shape} with a {stamp} stamp. Give it the {dock} dock.'],
  'ee.helpInsert': [
    'Watch. Choose the {color} {shape} with a {stamp} stamp for the {dock} dock. Put that example in the lesson.',
  ],
  'ee.helpRemove': ['Watch. The {color} {shape} with a {stamp} stamp goes back on the shelf.'],
  'ee.success': [
    'These checked parcels reached their requested docks. Tap Back, then All delivered when you are ready.',
  ],
  'ee.successNoisy': [
    'These checked parcels reached their requested docks. The sorter used shape. An example marked with arrows has a different dock, and the sorter still chose shape. Tap Back, then All delivered when you are ready.',
  ],
} satisfies Record<string, string[]>;
