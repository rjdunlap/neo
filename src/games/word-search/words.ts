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
}

export const THEMES: readonly Theme[] = [
  { id: 'pond', name: 'By the pond', words: ['FROG', 'DUCK', 'REED', 'LILY', 'NEWT', 'SWAN', 'FISH', 'HERON', 'OTTER', 'RIPPLE', 'PEBBLE', 'TADPOLE', 'MUD', 'BANK'] },
  { id: 'garden', name: 'In the garden', words: ['ROSE', 'TULIP', 'DAISY', 'SEED', 'SOIL', 'BLOOM', 'WORM', 'LEAF', 'STEM', 'PETAL', 'BEE', 'HOSE', 'SPADE', 'WEED', 'MINT', 'BASIL'] },
  { id: 'kitchen', name: 'In the kitchen', words: ['SPOON', 'FORK', 'KNIFE', 'PLATE', 'BOWL', 'WHISK', 'OVEN', 'STOVE', 'LADLE', 'TRAY', 'KETTLE', 'TOAST', 'SOUP', 'JAM'] },
  { id: 'weather', name: 'The weather', words: ['RAIN', 'SNOW', 'WIND', 'CLOUD', 'STORM', 'SUN', 'FOG', 'HAIL', 'FROST', 'BREEZE', 'PUDDLE', 'RAINBOW', 'THUNDER'] },
  { id: 'farm', name: 'On the farm', words: ['BARN', 'COW', 'PIG', 'HEN', 'SHEEP', 'GOAT', 'HORSE', 'TRACTOR', 'FIELD', 'HAY', 'MILK', 'EGG', 'FENCE', 'GATE'] },
  { id: 'bakery', name: 'At the bakery', words: ['BREAD', 'CAKE', 'PIE', 'BUN', 'SCONE', 'TART', 'DOUGH', 'YEAST', 'FLOUR', 'ICING', 'ROLL', 'MUFFIN'] },
  { id: 'sea', name: 'By the sea', words: ['WAVE', 'SAND', 'CORAL', 'CRAB', 'TIDE', 'BOAT', 'SAIL', 'REEF', 'SEAL', 'WHALE', 'ANCHOR', 'PEARL'] },
  { id: 'trees', name: 'In the woods', words: ['OAK', 'PINE', 'ELM', 'MAPLE', 'BIRCH', 'ASH', 'WILLOW', 'CEDAR', 'FIR', 'BARK', 'ROOT', 'ACORN'] },
  { id: 'cozy', name: 'A cozy evening', words: ['TEA', 'CANDLE', 'BOOK', 'SOFA', 'WARM', 'COCOA', 'BLANKET', 'PILLOW', 'QUILT', 'FIRE', 'RUG', 'SLIPPERS'] },
];

export const themeById = (id: string): Theme => THEMES.find((t) => t.id === id) ?? THEMES[0];
