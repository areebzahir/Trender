/**
 * Infer room types from product title, description, and category.
 */

import type { ProductCategory } from '../../../src/lib/ingestion/types';

const ROOM_MAP: Partial<Record<ProductCategory, string[]>> = {
  sofa:            ['living_room'],
  sectional:       ['living_room'],
  loveseat:        ['living_room'],
  armchair:        ['living_room', 'bedroom'],
  accent_chair:    ['living_room', 'bedroom', 'office'],
  coffee_table:    ['living_room'],
  side_table:      ['living_room', 'bedroom'],
  dining_table:    ['dining_room'],
  dining_chair:    ['dining_room'],
  bed_frame:       ['bedroom'],
  mattress:        ['bedroom'],
  nightstand:      ['bedroom'],
  dresser:         ['bedroom'],
  wardrobe:        ['bedroom'],
  tv_stand:        ['living_room', 'bedroom'],
  media_console:   ['living_room'],
  desk:            ['home_office'],
  office_chair:    ['home_office'],
  bookshelf:       ['living_room', 'home_office', 'bedroom'],
  storage_cabinet: ['living_room', 'dining_room', 'home_office'],
  rug:             ['living_room', 'bedroom', 'dining_room'],
  lighting:        ['living_room', 'bedroom', 'dining_room', 'home_office'],
  mirror:          ['bedroom', 'entryway', 'living_room'],
  decor:           ['living_room', 'bedroom', 'dining_room'],
};

const KEYWORD_ROOM_MAP: Array<[string, string[]]> = [
  ['outdoor', ['outdoor', 'patio']],
  ['kitchen', ['kitchen']],
  ['nursery', ['nursery', 'baby', 'kids', 'children']],
  ['entryway', ['entryway', 'hallway', 'foyer', 'mudroom']],
  ['bathroom', ['bathroom', 'vanity']],
];

export function inferRoomTypes(category: ProductCategory, title: string, description?: string): string[] {
  const rooms = new Set<string>(ROOM_MAP[category] ?? []);
  const text = `${title} ${description ?? ''}`.toLowerCase();

  for (const [room, keywords] of KEYWORD_ROOM_MAP) {
    if (keywords.some(kw => text.includes(kw))) rooms.add(room);
  }

  return Array.from(rooms);
}
