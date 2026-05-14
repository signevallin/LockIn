import { calculateXp } from '@/lib/utils/xp';

describe('calculateXp', () => {
  it('returns 0 for no completions', () => {
    expect(calculateXp(0)).toBe(0);
  });
  it('returns 10 per completion', () => {
    expect(calculateXp(5)).toBe(50);
  });
  it('returns correct value for 1 completion', () => {
    expect(calculateXp(1)).toBe(10);
  });
});
