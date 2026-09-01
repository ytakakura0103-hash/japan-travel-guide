import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

const activities = JSON.parse(
  readFileSync(new URL('../site/data/activities.json', import.meta.url), 'utf-8')
);

const ALLOWED_INTERESTS = new Set([
  'sightseeing', 'history', 'food', 'shopping', 'nature', 'temples-shrines', 'nightlife',
  'pop-culture', 'traditional-culture', 'art-museums', 'local-markets', 'cafes-sweets',
  'onsen', 'festivals', 'architecture', 'photo-spots', 'family', 'outdoor', 'backstreets', 'seasonal-nature',
]);
const REQUIRED_FIELDS = ['id', 'title', 'city', 'interests', 'summary', 'description', 'access', 'address'];
const TEXT_FIELDS = ['title', 'summary', 'description', 'access', 'address'];

// A literal backslash character immediately followed by 'n' in decoded string
// content means the source data was double-escaped ("\\n" instead of "\n"),
// which renders as visible "\n" text instead of a real line break.
const STRAY_ESCAPE = String.fromCharCode(92) + 'n';

describe('activities.json data integrity', () => {
  it('has no duplicate ids', () => {
    const ids = activities.map((a) => a.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('has all required fields on every entry', () => {
    const missing = [];
    for (const a of activities) {
      for (const field of REQUIRED_FIELDS) {
        if (a[field] === undefined || a[field] === null || a[field] === '') {
          missing.push(`${a.id || '(no id)'}: missing ${field}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  it('uses only ids matching [a-z0-9-]', () => {
    const bad = activities.filter((a) => !/^[a-z0-9-]+$/.test(a.id));
    expect(bad.map((a) => a.id)).toEqual([]);
  });

  it('uses only interest tags from the fixed 20-tag taxonomy', () => {
    const bad = [];
    for (const a of activities) {
      for (const interest of a.interests || []) {
        if (!ALLOWED_INTERESTS.has(interest)) bad.push(`${a.id}: ${interest}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('never contains a literal backslash-n where a real line break was intended', () => {
    const bad = [];
    for (const a of activities) {
      for (const field of TEXT_FIELDS) {
        if (typeof a[field] === 'string' && a[field].includes(STRAY_ESCAPE)) {
          bad.push(`${a.id}: ${field}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('has no leading/trailing whitespace on text fields', () => {
    const bad = [];
    for (const a of activities) {
      for (const field of TEXT_FIELDS) {
        if (typeof a[field] === 'string' && a[field] !== a[field].trim()) {
          bad.push(`${a.id}: ${field}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('keeps descriptions in a reasonable length range (roughly 100-350 words)', () => {
    const bad = [];
    for (const a of activities) {
      const wordCount = a.description.trim().split(/\s+/).length;
      if (wordCount < 100 || wordCount > 350) {
        bad.push(`${a.id}: ${wordCount} words`);
      }
    }
    expect(bad).toEqual([]);
  });
});
