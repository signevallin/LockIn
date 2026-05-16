import { Button } from '@/components/ui/Button';
import type { UserPromise } from '@/lib/types';

interface Props {
  promise: UserPromise;
  onUpdateStatus: (id: string, status: UserPromise['status']) => void;
}

export function PromiseCard({ promise, onUpdateStatus }: Props) {
  const daysLeft = Math.ceil((promise.deadline.getTime() - Date.now()) / 86400000);
  const completedMilestones = promise.milestones.filter(m => m.completed).length;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-cream-dark p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-semibold text-earth text-sm mb-1">{promise.category} {promise.title}</p>
          <p className="text-xs text-earth-light">
            {daysLeft > 0 ? `${daysLeft} dagar kvar` : 'Passerad deadline'} · {promise.stakeAmount} kr → {promise.charityOrg}
          </p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${promise.status === 'active' ? 'bg-sky text-earth' : promise.status === 'completed' ? 'bg-sage text-earth' : 'bg-red-100 text-red-700'}`}>
          {promise.status === 'active' ? 'Aktivt' : promise.status === 'completed' ? 'Hållet ✓' : 'Brutet'}
        </span>
      </div>

      <div className="mb-3">
        <p className="text-xs text-earth-light mb-2">Milstolpar ({completedMilestones}/{promise.milestones.length})</p>
        <div className="flex gap-2">
          {promise.milestones.map((m, i) => (
            <div key={i} className={`flex-1 h-1.5 rounded-full ${m.completed ? 'bg-earth' : 'bg-cream-dark'}`} />
          ))}
        </div>
      </div>

      {promise.status === 'active' && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onUpdateStatus(promise.id, 'completed')}>
            Hållet ✓
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onUpdateStatus(promise.id, 'broken')}>
            Brutet
          </Button>
        </div>
      )}
    </div>
  );
}
