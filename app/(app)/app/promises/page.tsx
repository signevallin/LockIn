'use client';
import { useState } from 'react';
import { usePromises } from '@/lib/hooks/usePromises';
import { PromiseCard } from '@/components/promises/PromiseCard';
import { PromiseForm } from '@/components/promises/PromiseForm';
import { Button } from '@/components/ui/Button';

export default function PromisesPage() {
  const { promises, loading, addPromise, updateStatus } = usePromises();
  const [formOpen, setFormOpen] = useState(false);
  const active = promises.filter(p => p.status === 'active');
  const past = promises.filter(p => p.status !== 'active');

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between pt-2">
        <h1 className="text-xl font-bold text-earth">Mina löften</h1>
        <Button size="sm" onClick={() => setFormOpen(true)}>+ Nytt löfte</Button>
      </div>

      {loading && <p className="text-earth-light text-sm">Laddar...</p>}
      {!loading && promises.length === 0 && (
        <div className="text-center py-12">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-earth-light text-sm mb-4">Inga löften ännu.<br/>Lägg till ett och håll dig accountable.</p>
          <Button onClick={() => setFormOpen(true)}>Skapa löfte</Button>
        </div>
      )}

      {active.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-earth-light">Aktiva</p>
          {active.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
        </div>
      )}

      {past.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-earth-light">Avslutade</p>
          {past.map(p => <PromiseCard key={p.id} promise={p} onUpdateStatus={updateStatus} />)}
        </div>
      )}

      <PromiseForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={addPromise} />
    </div>
  );
}
