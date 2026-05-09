/**
 * Infer normalized color names from product text.
 */

const COLOR_ALIASES: Record<string, string> = {
  // greys
  gray: 'grey', charcoal: 'grey', ash: 'grey', slate: 'grey', graphite: 'grey',
  // whites/creams
  ivory: 'cream', 'off-white': 'cream', 'off white': 'cream', snow: 'white', pearl: 'white',
  // beiges
  tan: 'beige', sand: 'beige', taupe: 'beige', khaki: 'beige', latte: 'beige', camel: 'beige',
  // browns
  chocolate: 'brown', espresso: 'brown', mocha: 'brown', coffee: 'brown', cognac: 'brown',
  // navies
  midnight: 'navy', indigo: 'navy',
  // blues
  teal: 'blue', turquoise: 'blue', aqua: 'blue', cobalt: 'blue', cerulean: 'blue',
  // greens
  sage: 'green', olive: 'green', forest: 'green', emerald: 'green', hunter: 'green',
  // oranges
  rust: 'orange', terracotta: 'orange', amber: 'orange', burnt: 'orange',
  // reds
  blush: 'red', rose: 'red', burgundy: 'red', wine: 'red', crimson: 'red',
  // yellows
  mustard: 'yellow', lemon: 'yellow', butter: 'yellow',
  // golds/silvers
  brass: 'gold', champagne: 'gold', chrome: 'silver', nickel: 'silver',
  // woods
  natural: 'natural_wood', pine: 'natural_wood', birch: 'natural_wood',
  walnut: 'walnut', oak: 'oak',
};

const BASE_COLORS = [
  'black', 'white', 'beige', 'cream', 'grey', 'brown', 'oak', 'walnut',
  'natural_wood', 'green', 'blue', 'navy', 'red', 'orange', 'yellow',
  'pink', 'gold', 'silver',
];

export function inferColors(title: string, description?: string, options?: string[]): string[] {
  const text = `${title} ${description ?? ''} ${(options ?? []).join(' ')}`.toLowerCase();
  const found = new Set<string>();

  for (const color of BASE_COLORS) {
    const searchTerm = color.replace('_', ' ');
    if (text.includes(searchTerm) || text.includes(color)) {
      found.add(color);
    }
  }

  for (const [alias, normalized] of Object.entries(COLOR_ALIASES)) {
    if (text.includes(alias)) {
      found.add(normalized);
    }
  }

  return Array.from(found);
}
