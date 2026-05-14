const XP_PER_COMPLETION = 10;

export function calculateXp(completionCount: number): number {
  return completionCount * XP_PER_COMPLETION;
}
