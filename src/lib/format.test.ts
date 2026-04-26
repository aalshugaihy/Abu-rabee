import { describe, expect, it } from 'vitest';
import { committeeName, priorityToTone, statusToTone } from './format';
import { Committee } from '../data/types';

describe('committeeName', () => {
  const c: Committee = {
    id: 'CMT-X',
    name: 'لجنة اختبار',
    nameEn: 'Test Committee',
    scope: 'internal',
    status: 'active',
    active: true,
  };

  it('returns Arabic name for Arabic locale', () => {
    expect(committeeName(c, 'ar')).toBe('لجنة اختبار');
  });

  it('returns English name when available for English locale', () => {
    expect(committeeName(c, 'en')).toBe('Test Committee');
  });

  it('falls back to Arabic name when English is missing', () => {
    expect(committeeName({ ...c, nameEn: undefined }, 'en')).toBe('لجنة اختبار');
  });
});

describe('statusToTone', () => {
  it('maps positive statuses to green', () => {
    expect(statusToTone('active')).toBe('green');
    expect(statusToTone('completed')).toBe('green');
    expect(statusToTone('onTime')).toBe('green');
  });
  it('maps overdue/late to rose', () => {
    expect(statusToTone('overdue')).toBe('rose');
    expect(statusToTone('late')).toBe('rose');
  });
  it('maps inProgress to cyan', () => {
    expect(statusToTone('inProgress')).toBe('cyan');
  });
});

describe('priorityToTone', () => {
  it('high -> rose, medium -> amber, low -> slate', () => {
    expect(priorityToTone('high')).toBe('rose');
    expect(priorityToTone('medium')).toBe('amber');
    expect(priorityToTone('low')).toBe('slate');
  });
});
