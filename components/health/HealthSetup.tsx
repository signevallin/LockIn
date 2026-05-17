'use client';
import { useState } from 'react';
import { useHealthGoals } from '@/lib/hooks/useHealthGoals';
import { SHORTCUT_URL } from '@/lib/health/shortcut';

export function HealthSetup() {
  const { goals, generateToken } = useHealthGoals();
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState('');
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [testing, setTesting] = useState(false);

  const token = goals?.healthSyncToken;

  async function handleActivate() {
    setGenerating(true);
    setGenerateError('');
    try {
      await generateToken();
    } catch {
      setGenerateError('Kunde inte generera token. Försök igen.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleTest() {
    if (!token) return;
    setTesting(true);
    setTestStatus('idle');
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await fetch('/api/health/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          steps: 0,
          totalCalories: 0,
          workoutMinutes: 0,
          date: today,
        }),
      });
      setTestStatus(res.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="bg-sky rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="font-bold text-earth text-base mb-1">Koppla Apple Health</h2>
        <p className="text-xs text-earth-light">
          Synka steg, kalorier och träningsminuter automatiskt via ett Apple Shortcut
          som körs kl 08:00, 12:00 och 20:00.
        </p>
      </div>

      {!token ? (
        <>
          <button
            onClick={handleActivate}
            disabled={generating}
            className="w-full bg-earth text-cream py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {generating ? 'Genererar token...' : 'Aktivera'}
          </button>
          {generateError && (
            <p className="text-sm text-red-500 text-center">{generateError}</p>
          )}
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-earth-light mb-1">Din synk-token</p>
            <div className="bg-white rounded-xl border border-sage px-3 py-2 font-mono text-xs text-earth break-all select-all">
              {token}
            </div>
          </div>

          <ol className="space-y-3">
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="text-sm text-earth font-medium">Hämta Shortcutet</p>
                <a
                  href={SHORTCUT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-earth-light underline"
                >
                  Öppna i Shortcuts-appen →
                </a>
              </div>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <p className="text-sm text-earth">
                Klistra in din token när du installerar Shortcutet
              </p>
            </li>
            <li className="flex gap-3 items-start">
              <span className="bg-earth text-cream rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                3
              </span>
              <p className="text-sm text-earth">
                Öppna <strong>Shortcuts → Automatisering</strong> och skapa tre
                tidbaserade automationer: <strong>08:00, 12:00 och 20:00</strong> som
                kör Shortcutet
              </p>
            </li>
          </ol>

          <button
            onClick={handleTest}
            disabled={testing}
            className="w-full border border-sage text-earth py-2.5 rounded-xl text-sm disabled:opacity-50"
          >
            {testing ? 'Testar...' : 'Testa synk'}
          </button>
          {testStatus === 'ok' && (
            <p className="text-sm text-green-600 text-center">✅ Koppling fungerar!</p>
          )}
          {testStatus === 'error' && (
            <p className="text-sm text-red-500 text-center">
              ❌ Något gick fel — kontrollera din token
            </p>
          )}
        </div>
      )}
    </div>
  );
}
