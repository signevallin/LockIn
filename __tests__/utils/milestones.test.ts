import { generateMilestones } from '@/lib/utils/milestones';

describe('generateMilestones', () => {
  const start = new Date('2026-01-01');
  const end = new Date('2026-04-11'); // 100 days later

  it('returns 3 milestones', () => {
    expect(generateMilestones(start, end)).toHaveLength(3);
  });

  it('milestones are at 25%, 50%, 75%', () => {
    const ms = generateMilestones(start, end);
    expect(ms[0].percentage).toBe(25);
    expect(ms[1].percentage).toBe(50);
    expect(ms[2].percentage).toBe(75);
  });

  it('all milestones start as not completed', () => {
    const ms = generateMilestones(start, end);
    ms.forEach(m => expect(m.completed).toBe(false));
  });

  it('milestone dates are between start and end', () => {
    const ms = generateMilestones(start, end);
    ms.forEach(m => {
      expect(m.date.getTime()).toBeGreaterThan(start.getTime());
      expect(m.date.getTime()).toBeLessThan(end.getTime());
    });
  });
});
