import { describe, it, expect } from 'vitest';
import { selectVisibleCreators } from '@/utils/visibleCreators';

const creators = ['Ana', 'Ben', 'Cy', 'Di', 'Ed'].map((name) => ({ name }));
const summary = (entries) => entries.map(({ creator, highlighted, afterGap }) =>
  `${creator.name}${highlighted ? '*' : ''}${afterGap ? '^' : ''}`);

describe('selectVisibleCreators', () => {
  it('shows the first maxVisible creators', () => {
    expect(summary(selectVisibleCreators(creators, 2))).toEqual(['Ana', 'Ben']);
  });

  it('adds matched creators past the limit, noting the gap before them', () => {
    expect(summary(selectVisibleCreators(creators, 2, ['Di']))).toEqual(['Ana', 'Ben', 'Di*^']);
  });

  it('marks a matched creator within the limit without adding anyone', () => {
    expect(summary(selectVisibleCreators(creators, 2, ['Ben']))).toEqual(['Ana', 'Ben*']);
  });

  it('notes a gap only where creators were skipped', () => {
    expect(summary(selectVisibleCreators(creators, 2, ['Cy', 'Ed']))).toEqual(['Ana', 'Ben', 'Cy*', 'Ed*^']);
  });

  it('shows everyone when maxVisible is not a non-negative integer', () => {
    expect(selectVisibleCreators(creators, null)).toHaveLength(5);
    expect(selectVisibleCreators(creators, -1)).toHaveLength(5);
  });

  it('returns nothing for a non-array', () => {
    expect(selectVisibleCreators(null, 3, ['Ana'])).toEqual([]);
  });

  it('tolerates missing highlight names', () => {
    expect(summary(selectVisibleCreators(creators, 1, null))).toEqual(['Ana']);
  });
});
