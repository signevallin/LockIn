import type { Milestone } from '@/lib/types';

export function generateMilestones(start: Date, end: Date): Milestone[] {
  const total = end.getTime() - start.getTime();
  return [25, 50, 75].map(pct => ({
    label: `${pct}% nådd`,
    date: new Date(start.getTime() + (total * pct) / 100),
    percentage: pct,
    completed: false,
  }));
}
