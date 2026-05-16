interface Props {
  completedCount: number;
  totalCount: number;
  streak: number;
  totalXp: number;
}

export function ProgressSummary({ completedCount, totalCount, streak, totalXp }: Props) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark">
      <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Dagens progress</p>
      <div className="flex gap-3">
        {/* Completed Goals Chip */}
        <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-cream">
          <span className="text-2xl mb-2">✅</span>
          <p className="text-xl font-bold text-earth">{completedCount}/{totalCount}</p>
          <p className="text-xs text-earth-light">Klara</p>
        </div>

        {/* Streak Chip */}
        <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-cream">
          <span className="text-2xl mb-2">🔥</span>
          <p className="text-xl font-bold text-earth">{streak}</p>
          <p className="text-xs text-earth-light">Streak</p>
        </div>

        {/* XP Chip */}
        <div className="flex-1 flex flex-col items-center py-3 rounded-xl bg-cream">
          <span className="text-2xl mb-2">⚡</span>
          <p className="text-xl font-bold text-earth">{totalXp}</p>
          <p className="text-xs text-earth-light">Poäng</p>
        </div>
      </div>
    </div>
  );
}
