import { calculateStreak } from '@/lib/utils/streak';

const fmt = (d: Date) => d.toISOString().split('T')[0];
const today = fmt(new Date());
const yesterday = fmt(new Date(Date.now() - 86400000));
const twoDaysAgo = fmt(new Date(Date.now() - 172800000));
const threeDaysAgo = fmt(new Date(Date.now() - 259200000));

describe('calculateStreak', () => {
  it('returns 0 for empty array', () => {
    expect(calculateStreak([])).toBe(0);
  });
  it('returns 1 for only today', () => {
    expect(calculateStreak([today])).toBe(1);
  });
  it('returns 2 for today and yesterday', () => {
    expect(calculateStreak([today, yesterday])).toBe(2);
  });
  it('returns 3 for three consecutive days', () => {
    expect(calculateStreak([today, yesterday, twoDaysAgo])).toBe(3);
  });
  it('breaks at gap', () => {
    expect(calculateStreak([today, twoDaysAgo])).toBe(1);
  });
  it('counts streak starting from yesterday if today is missing', () => {
    expect(calculateStreak([yesterday, twoDaysAgo, threeDaysAgo])).toBe(3);
  });
  it('returns 0 if newest date is older than yesterday', () => {
    expect(calculateStreak([twoDaysAgo, threeDaysAgo])).toBe(0);
  });
});
