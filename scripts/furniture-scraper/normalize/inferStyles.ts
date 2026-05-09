/**
 * Infer style tags and aesthetic tags from product text.
 */

const STYLE_KEYWORDS: Array<[string, string[]]> = [
  ['modern',        ['modern', 'contemporary', 'sleek', 'clean lines']],
  ['minimalist',    ['minimalist', 'minimal', 'simple', 'understated']],
  ['scandinavian',  ['scandinavian', 'scandi', 'nordic', 'hygge', 'danish']],
  ['industrial',    ['industrial', 'loft', 'urban', 'raw', 'pipe', 'metal frame']],
  ['mid_century',   ['mid-century', 'mid century', 'mcm', 'retro', 'eames', '1950s', '1960s']],
  ['rustic',        ['rustic', 'reclaimed', 'barn', 'distressed', 'weathered']],
  ['farmhouse',     ['farmhouse', 'country', 'cottage', 'shiplap']],
  ['boho',          ['boho', 'bohemian', 'eclectic', 'global', 'macrame', 'rattan']],
  ['luxury',        ['luxury', 'premium', 'high-end', 'designer', 'velvet', 'marble']],
  ['traditional',   ['traditional', 'classic', 'formal', 'ornate', 'carved']],
  ['coastal',       ['coastal', 'beach', 'nautical', 'seaside', 'driftwood']],
  ['japandi',       ['japandi', 'wabi-sabi', 'zen', 'japanese', 'organic modern']],
  ['glam',          ['glam', 'glamour', 'hollywood', 'gold', 'mirrored', 'crystal']],
];

const AESTHETIC_KEYWORDS: Array<[string, string[]]> = [
  ['warm neutral',       ['warm', 'beige', 'cream', 'sand', 'terracotta', 'earthy']],
  ['clean minimal',      ['white', 'minimal', 'clean', 'simple', 'light']],
  ['modern contrast',    ['black and white', 'contrast', 'bold', 'graphic']],
  ['organic natural',    ['natural', 'organic', 'wood', 'linen', 'cotton', 'rattan']],
  ['cozy soft',          ['cozy', 'soft', 'plush', 'fluffy', 'sherpa', 'boucle']],
  ['dark luxury',        ['dark', 'charcoal', 'black', 'navy', 'deep', 'rich']],
  ['light airy',         ['light', 'airy', 'bright', 'white', 'glass', 'open']],
  ['wood tones',         ['wood', 'oak', 'walnut', 'pine', 'teak', 'bamboo']],
  ['apartment friendly', ['compact', 'small space', 'apartment', 'studio', 'space-saving']],
  ['statement piece',    ['statement', 'bold', 'unique', 'eye-catching', 'focal']],
  ['budget friendly',    ['affordable', 'value', 'budget', 'economical']],
];

export function inferStyles(title: string, description?: string, tags?: string[]): string[] {
  const text = `${title} ${description ?? ''} ${(tags ?? []).join(' ')}`.toLowerCase();
  const found: string[] = [];
  for (const [style, keywords] of STYLE_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw))) found.push(style);
  }
  return found;
}

export function inferAestheticTags(title: string, description?: string, tags?: string[]): string[] {
  const text = `${title} ${description ?? ''} ${(tags ?? []).join(' ')}`.toLowerCase();
  const found: string[] = [];
  for (const [aesthetic, keywords] of AESTHETIC_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw))) found.push(aesthetic);
  }
  return found;
}
