export function calculateStreak(completionDates: string[]): number {
  if (completionDates.length === 0) return 0;

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const today = fmt(new Date());
  const yesterday = fmt(new Date(Date.now() - 86400000));

  const unique = [...new Set(completionDates)].sort().reverse();

  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1]);
    const curr = new Date(unique[i]);
    const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diff === 1) streak++;
    else break;
  }
  return streak;
}
