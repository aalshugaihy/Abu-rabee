import { describe, expect, it } from 'vitest';
import { matchLabel } from './match';

describe('matchLabel', () => {
  const codes = ['planned', 'inProgress', 'completed'] as const;
  const labelEn = (c: (typeof codes)[number]) =>
    c === 'planned' ? 'Planned' : c === 'inProgress' ? 'In progress' : 'Completed';
  const labelAr = (c: (typeof codes)[number]) =>
    c === 'planned' ? 'مخططة' : c === 'inProgress' ? 'قيد التنفيذ' : 'مكتملة';

  it('matches by exact code', () => {
    expect(matchLabel('planned', codes, labelEn)).toBe('planned');
  });

  it('matches by English label (case-insensitive)', () => {
    expect(matchLabel('IN PROGRESS', codes, labelEn)).toBe('inProgress');
  });

  it('matches by Arabic label', () => {
    expect(matchLabel('قيد التنفيذ', codes, labelAr)).toBe('inProgress');
  });

  it('returns undefined for non-matches', () => {
    expect(matchLabel('something else', codes, labelEn)).toBeUndefined();
  });

  it('returns undefined for empty / undefined input', () => {
    expect(matchLabel('', codes, labelEn)).toBeUndefined();
    expect(matchLabel(undefined, codes, labelEn)).toBeUndefined();
  });
});
