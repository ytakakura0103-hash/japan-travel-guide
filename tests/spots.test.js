import { describe, it, expect } from 'vitest';
import { filterSpots } from '../site/src/spots.js';

const sample = [
  { id: 'x', name: 'Yanaka Ginza', area: 'Tokyo', tags: ['local-life', 'shopping'] },
  { id: 'y', name: 'Fushimi Inari Back Trail', area: 'Kyoto', tags: ['nature', 'shrine'] },
  { id: 'z', name: 'Shimokitazawa Backstreets', area: 'Tokyo', tags: ['local-life', 'nightlife'] },
];

describe('filterSpots', () => {
  it('returns all spots when no filters are given', () => {
    expect(filterSpots(sample)).toHaveLength(3);
  });

  it('filters by area', () => {
    const result = filterSpots(sample, { area: 'Tokyo' });
    expect(result.map((s) => s.id)).toEqual(['x', 'z']);
  });

  it('filters by tag', () => {
    const result = filterSpots(sample, { tag: 'local-life' });
    expect(result.map((s) => s.id)).toEqual(['x', 'z']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterSpots(sample, { area: 'Hokkaido' })).toEqual([]);
  });
});
