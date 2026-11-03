/**
 * The words Word Search hides, in themes. Plain, common, family-friendly words in capitals, three to eight letters, so a grid of
 * eight or more squares can hold any of them. A theme is the clue: the list beside the grid says which words are in it, and the
 * theme is the title of the page.
 */
export interface Theme {
  id: string;
  /** Said and shown as the puzzle's name. */
  name: string;
  words: readonly string[];
  /**
   * A root-family theme: every word grows from one Latin root, and on the first word found the pet says what the root means
   * (`wordsearch.root-<root>`). Its list is shorter than twelve, so it is drawn only for the plans it can fill (`themesFor`).
   */
  root?: 'port' | 'spect';
}

export const THEMES: readonly Theme[] = [
  { id: 'pond', name: 'By the pond', words: ['FROG', 'DUCK', 'REED', 'LILY', 'NEWT', 'SWAN', 'FISH', 'HERON', 'OTTER', 'RIPPLE', 'PEBBLE', 'TADPOLE', 'MUD', 'BANK'] },
  { id: 'garden', name: 'In the garden', words: ['ROSE', 'TULIP', 'DAISY', 'SEED', 'SOIL', 'BLOOM', 'WORM', 'LEAF', 'STEM', 'PETAL', 'BEE', 'HOSE', 'SPADE', 'WEED', 'MINT', 'BASIL'] },
  { id: 'kitchen', name: 'In the kitchen', words: ['SPOON', 'FORK', 'KNIFE', 'PLATE', 'BOWL', 'WHISK', 'OVEN', 'STOVE', 'LADLE', 'TRAY', 'KETTLE', 'TOAST', 'SOUP', 'JAM'] },
  { id: 'weather', name: 'The weather', words: ['SNOW', 'WIND', 'CLOUD', 'STORM', 'SUN', 'FOG', 'HAIL', 'FROST', 'BREEZE', 'PUDDLE', 'RAINBOW', 'THUNDER'] },
  { id: 'farm', name: 'On the farm', words: ['BARN', 'COW', 'PIG', 'HEN', 'SHEEP', 'GOAT', 'HORSE', 'TRACTOR', 'FIELD', 'HAY', 'MILK', 'EGG', 'FENCE', 'GATE'] },
  { id: 'bakery', name: 'At the bakery', words: ['BREAD', 'CAKE', 'PIE', 'BUN', 'SCONE', 'TART', 'DOUGH', 'YEAST', 'FLOUR', 'ICING', 'ROLL', 'MUFFIN'] },
  { id: 'sea', name: 'By the sea', words: ['WAVE', 'SAND', 'CORAL', 'CRAB', 'TIDE', 'BOAT', 'SAIL', 'REEF', 'SEAL', 'WHALE', 'ANCHOR', 'PEARL'] },
  { id: 'trees', name: 'In the woods', words: ['OAK', 'PINE', 'ELM', 'MAPLE', 'BIRCH', 'ASH', 'WILLOW', 'CEDAR', 'FIR', 'BARK', 'ROOT', 'ACORN'] },
  { id: 'cozy', name: 'A cozy evening', words: ['TEA', 'CANDLE', 'BOOK', 'SOFA', 'WARM', 'COCOA', 'BLANKET', 'PILLOW', 'QUILT', 'FIRE', 'RUG', 'SLIPPERS'] },
  { id: 'orchard', name: 'In the orchard', words: ['APPLE', 'PEAR', 'PLUM', 'CHERRY', 'PEACH', 'QUINCE', 'LADDER', 'BASKET', 'BRANCH', 'BLOSSOM', 'CIDER', 'HARVEST', 'CRATE'] },
  { id: 'birds', name: 'Birds on the wing', words: ['ROBIN', 'WREN', 'OWL', 'CROW', 'EAGLE', 'HAWK', 'GOOSE', 'DOVE', 'PIGEON', 'PARROT', 'PUFFIN', 'STORK', 'FINCH', 'SPARROW', 'MAGPIE'] },
  { id: 'market', name: 'At the market', words: ['STALL', 'CART', 'COIN', 'PRICE', 'SCALES', 'MELON', 'ONION', 'CARROT', 'CHEESE', 'HONEY', 'FLOWERS', 'CABBAGE', 'BEANS'] },
  { id: 'night', name: 'The night sky', words: ['MOON', 'STAR', 'COMET', 'PLANET', 'ORBIT', 'CRATER', 'GALAXY', 'METEOR', 'ROCKET', 'DUSK', 'TWINKLE', 'MARS', 'SATURN'] },
  { id: 'tools', name: 'In the toolbox', words: ['HAMMER', 'NAIL', 'SAW', 'SCREW', 'DRILL', 'WRENCH', 'PLIERS', 'TAPE', 'BOLT', 'NUT', 'CHISEL', 'FILE', 'CLAMP'] },
  { id: 'music', name: 'Making music', words: ['DRUM', 'FLUTE', 'PIANO', 'HARP', 'SONG', 'NOTE', 'BELL', 'TUNE', 'GUITAR', 'VIOLIN', 'TRUMPET', 'CHOIR', 'BANJO'] },
  // Root families (the vocabulary study's VW6). Only words that really grow from the root: the harbour port of AIRPORT and
  // PASSPORT is a different word, so it is left out.
  { id: 'port', name: 'Words that carry', root: 'port', words: ['REPORT', 'SUPPORT', 'IMPORT', 'EXPORT', 'PORTER', 'DEPORT', 'PORTABLE'] },
  { id: 'spect', name: 'Words that look', root: 'spect', words: ['INSPECT', 'RESPECT', 'SUSPECT', 'SPECTATE', 'PROSPECT', 'SPECTRUM', 'ASPECT'] },
];

export const themeById = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
