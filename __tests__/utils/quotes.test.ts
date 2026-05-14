import { getDailyQuote } from '@/lib/utils/quotes';

describe('getDailyQuote', () => {
  it('returns a non-empty string', () => {
    expect(typeof getDailyQuote()).toBe('string');
    expect(getDailyQuote().length).toBeGreaterThan(0);
  });

  it('returns the same quote when called twice in the same execution', () => {
    expect(getDailyQuote()).toBe(getDailyQuote());
  });
});
