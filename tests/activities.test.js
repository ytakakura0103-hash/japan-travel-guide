import { describe, it, expect } from 'vitest';
import { filterActivities } from '../site/src/activities.js';

const sample = [
  { id: 'a', title: 'Senso-ji Temple', city: 'Tokyo', interests: ['temples-shrines', 'history'] },
  { id: 'b', title: 'Fushimi Inari', city: 'Kyoto', interests: ['temples-shrines', 'nature'] },
  { id: 'c', title: 'Dotonbori Food Crawl', city: 'Osaka', interests: ['food'] },
];

describe('filterActivities', () => {
  it('returns all activities when no filters are given', () => {
    expect(filterActivities(sample)).toHaveLength(3);
  });

  it('filters by city', () => {
    const result = filterActivities(sample, { city: 'Tokyo' });
    expect(result.map((a) => a.id)).toEqual(['a']);
  });

  it('filters by overlapping interests', () => {
    const result = filterActivities(sample, { interests: ['temples-shrines'] });
    expect(result.map((a) => a.id)).toEqual(['a', 'b']);
  });

  it('combines city and interests filters', () => {
    const result = filterActivities(sample, { city: 'Kyoto', interests: ['nature'] });
    expect(result.map((a) => a.id)).toEqual(['b']);
  });

  it('returns an empty array when nothing matches', () => {
    expect(filterActivities(sample, { city: 'Tokyo', interests: ['food'] })).toEqual([]);
  });
});
