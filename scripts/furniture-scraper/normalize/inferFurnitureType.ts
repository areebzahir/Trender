/**
 * Infer furniture type from product title and description.
 * Returns a subcategory string used in the products.subcategory column.
 */

const FURNITURE_TYPES: Array<[string, string[]]> = [
  ['sectional',       ['sectional', 'l-shape sofa', 'l shape sofa', 'modular sofa', 'corner sofa']],
  ['sofa',            ['sofa', 'couch', 'chesterfield', '3-seat', '2-seat sofa', 'loveseat']],
  ['loveseat',        ['loveseat', 'love seat', '2-seater', 'two seater']],
  ['accent chair',    ['accent chair', 'occasional chair', 'side chair', 'barrel chair']],
  ['dining chair',    ['dining chair', 'kitchen chair', 'counter chair']],
  ['office chair',    ['office chair', 'task chair', 'ergonomic chair', 'desk chair']],
  ['lounge chair',    ['lounge chair', 'chaise', 'recliner', 'club chair']],
  ['armchair',        ['armchair', 'arm chair', 'wing chair', 'wingback']],
  ['coffee table',    ['coffee table', 'cocktail table']],
  ['side table',      ['side table', 'end table', 'accent table']],
  ['console table',   ['console table', 'sofa table', 'hall table', 'entryway table']],
  ['dining table',    ['dining table', 'kitchen table', 'dinner table', 'extendable table']],
  ['desk',            ['desk', 'writing table', 'computer desk', 'work desk', 'standing desk']],
  ['bed frame',       ['bed frame', 'bedframe', 'platform bed', 'panel bed', 'sleigh bed']],
  ['mattress',        ['mattress', 'memory foam', 'box spring', 'hybrid mattress']],
  ['nightstand',      ['nightstand', 'night stand', 'bedside table', 'bedside cabinet']],
  ['dresser',         ['dresser', 'chest of drawers', 'bureau', 'chest drawer']],
  ['wardrobe',        ['wardrobe', 'armoire', 'closet', 'clothes storage']],
  ['bookshelf',       ['bookshelf', 'bookcase', 'shelving unit', 'shelf', 'shelves']],
  ['TV stand',        ['tv stand', 'tv unit', 'television stand', 'media stand', 'tv console']],
  ['media console',   ['media console', 'entertainment unit', 'entertainment center', 'media cabinet']],
  ['rug',             ['rug', 'carpet', 'area rug', 'runner rug']],
  ['floor lamp',      ['floor lamp', 'arc lamp', 'torchiere']],
  ['pendant light',   ['pendant light', 'pendant lamp', 'hanging light', 'chandelier']],
  ['table lamp',      ['table lamp', 'desk lamp', 'bedside lamp']],
  ['mirror',          ['mirror', 'wall mirror', 'floor mirror', 'vanity mirror']],
  ['wall art',        ['wall art', 'canvas', 'painting', 'print', 'artwork']],
  ['curtains',        ['curtain', 'drape', 'blind', 'shade']],
  ['storage cabinet', ['cabinet', 'sideboard', 'buffet', 'credenza', 'storage unit']],
  ['bar stool',       ['bar stool', 'counter stool', 'barstool']],
  ['bench',           ['bench', 'ottoman bench', 'storage bench', 'entryway bench']],
  ['ottoman',         ['ottoman', 'footstool', 'pouf', 'pouffe']],
  ['outdoor chair',   ['outdoor chair', 'patio chair', 'garden chair', 'adirondack']],
  ['outdoor table',   ['outdoor table', 'patio table', 'garden table']],
  ['patio set',       ['patio set', 'outdoor set', 'garden set', 'bistro set']],
];

export function inferFurnitureType(title: string, description?: string): string {
  const text = `${title} ${description ?? ''}`.toLowerCase();
  for (const [type, keywords] of FURNITURE_TYPES) {
    if (keywords.some(kw => text.includes(kw))) return type;
  }
  return 'furniture';
}
