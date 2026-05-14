import { ProgressRing } from '@/components/ui/ProgressRing';

interface Props {
  completedCount: number;
  totalCount: number;
  streak: number;
  totalXp: number;
}

export function ProgressSummary({ completedCount, totalCount, streak, totalXp }: Props) {
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <p className="text-xs uppercase tracking-widest text-earth-light mb-3">Dagens progress</p>
      <div className="flex items-center gap-4">
        <ProgressRing percent={percent} size={72} />
        <div className="space-y-1">
          <p className="text-sm text-earth">{completedCount}/{totalCount} <span className="text-earth-light">Mål klara</span></p>
          <p className="text-sm text-earth">{streak} <span className="text-earth-light">Dagar i rad 🔥</span></p>
          <p className="text-sm text-earth">{totalXp} <span className="text-earth-light">XP</span></p>
        </div>
      </div>
    </div>
  );
}
