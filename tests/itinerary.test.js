import { describe, it, expect } from 'vitest';
import { filterItineraries } from '../site/src/itinerary.js';

const sample = [
  { id: 'a', title: 'Tokyo Culture & Food', days: 3, area: 'Tokyo', interests: ['culture', 'food'] },
  { id: 'b', title: 'Kyoto Nature Escape', days: 5, area: 'Kyoto', interests: ['nature'] },
  { id: 'c', title: 'Osaka Food Crawl', days: 3, area: 'Osaka', interests: ['food'] },
];

describe('filterItineraries', () => {
  it('returns all itineraries when no filters are given', () => {
    expect(filterItineraries(sample)).toHaveLength(3);
  });

  it('filters by exact day count', () => {
    const result = filterItineraries(sample, { days: 3 });
    expect(result.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('filters by area', () => {
    const result = filterItineraries(sample, { area: 'Kyoto' });
    expect(result.map((i) => i.id)).toEqual(['b']);
  });

  it('filters by overlapping interests', () => {
    const result = filterItineraries(sample, { interests: ['food'] });
    expect(result.map((i) => i.id)).toEqual(['a', 'c']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterItineraries(sample, { area: 'Hokkaido' })).toEqual([]);
  });
});
