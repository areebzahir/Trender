/**
 * Infer normalized material names from product text.
 */

const MATERIAL_ALIASES: Record<string, string> = {
  'solid wood': 'wood', 'engineered wood': 'wood', 'mdf': 'wood', 'plywood': 'wood',
  'particle board': 'wood', 'hardwood': 'wood',
  'stainless steel': 'metal', 'iron': 'metal', 'steel': 'metal',
  'aluminum': 'metal', 'aluminium': 'metal', 'brass': 'metal', 'chrome': 'metal',
  'tempered glass': 'glass', 'frosted glass': 'glass',
  'polyester': 'fabric', 'linen': 'fabric', 'cotton': 'fabric', 'wool': 'fabric',
  'boucle': 'fabric', 'bouclé': 'fabric', 'chenille': 'fabric',
  'microfiber': 'fabric', 'microsuede': 'fabric', 'tweed': 'fabric',
  'genuine leather': 'leather', 'full-grain leather': 'leather', 'top-grain leather': 'leather',
  'faux leather': 'faux_leather', 'vegan leather': 'faux_leather',
  'pu leather': 'faux_leather', 'bonded leather': 'faux_leather',
  'marble': 'marble', 'granite': 'stone', 'concrete': 'stone',
  'ceramic': 'ceramic', 'porcelain': 'ceramic',
  'rattan': 'rattan', 'wicker': 'rattan', 'cane': 'rattan', 'bamboo': 'rattan',
  'acrylic': 'plastic', 'polypropylene': 'plastic', 'abs plastic': 'plastic',
};

const BASE_MATERIALS = [
  'wood', 'oak', 'walnut', 'pine', 'metal', 'glass', 'marble', 'stone',
  'fabric', 'linen', 'velvet', 'leather', 'faux_leather', 'rattan',
  'wicker', 'plastic', 'ceramic',
];

export function inferMaterials(title: string, description?: string, options?: string[]): string[] {
  const text = `${title} ${description ?? ''} ${(options ?? []).join(' ')}`.toLowerCase();
  const found = new Set<string>();

  for (const mat of BASE_MATERIALS) {
    const searchTerm = mat.replace('_', ' ');
    if (text.includes(searchTerm) || text.includes(mat)) {
      found.add(mat);
    }
  }

  for (const [alias, normalized] of Object.entries(MATERIAL_ALIASES)) {
    if (text.includes(alias)) {
      found.add(normalized);
    }
  }

  return Array.from(found);
}
