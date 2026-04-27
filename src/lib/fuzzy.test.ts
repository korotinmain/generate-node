import { describe, expect, it } from 'vitest';
import { rank, score } from './fuzzy';

describe('score', () => {
  it('rewards prefix highest, then word-start, then substring, then fuzzy', () => {
    const prefix = score('feat', 'feature');
    const wordStart = score('log', 'view-logs');
    const substring = score('ate', 'feature');
    const fuzzy = score('vlg', 'view-logs');
    const none = score('xyz', 'feature');

    expect(prefix).toBeGreaterThan(wordStart);
    expect(wordStart).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(fuzzy);
    expect(fuzzy).toBeGreaterThan(0);
    expect(none).toBe(0);
  });

  it('treats empty query as matching everything', () => {
    expect(score('', 'anything')).toBeGreaterThan(0);
    expect(score('   ', 'anything')).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(score('FEAT', 'feature')).toBeGreaterThan(0);
    expect(score('feat', 'FEATURE')).toBeGreaterThan(0);
  });

  it('recognizes word-start after dashes, slashes, dots, colons, underscores, and spaces', () => {
    expect(score('log', 'view-logs')).toBeGreaterThan(0);
    expect(score('log', 'view/logs')).toBeGreaterThan(0);
    expect(score('log', 'view.logs')).toBeGreaterThan(0);
    expect(score('log', 'view:logs')).toBeGreaterThan(0);
    expect(score('log', 'view_logs')).toBeGreaterThan(0);
    expect(score('log', 'view logs')).toBeGreaterThan(0);
  });

  it('breaks ties by favoring shorter targets', () => {
    expect(score('feat', 'feat')).toBeGreaterThan(score('feat', 'feature-x'));
  });
});

describe('rank', () => {
  it('filters out non-matches and sorts by score desc', () => {
    const items = [
      { id: 1, label: 'Feature' },
      { id: 2, label: 'View Logs' },
      { id: 3, label: 'Registry Hub' },
    ];
    const result = rank(items, 'log', (i) => i.label);
    expect(result.map((r) => r.item.id)).toEqual([2]);
  });

  it('preserves all items when query is empty', () => {
    const items = ['a', 'b', 'c'];
    const result = rank(items, '', (i) => i);
    expect(result).toHaveLength(3);
  });
});
