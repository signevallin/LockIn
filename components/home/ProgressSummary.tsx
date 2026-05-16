interface Props {
  completedCount: number;
  totalCount: number;
  streak: number;
  totalXp: number;
}

export function ProgressSummary({ completedCount, totalCount, streak, totalXp }: Props) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm bg-sky text-earth px-3 py-1.5 rounded-full font-medium">
        {completedCount}/{totalCount} klara
      </span>
      <span className="text-sm bg-sky text-earth px-3 py-1.5 rounded-full font-medium">
        {streak} dagar 🔥
      </span>
      <span className="text-sm bg-sky text-earth px-3 py-1.5 rounded-full font-medium">
        {totalXp} XP ⚡
      </span>
    </div>
  );
}
