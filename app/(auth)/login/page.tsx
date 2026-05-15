'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col justify-center p-6">
      <div className="w-full max-w-sm mx-auto">
        <img
          src="/lockin-logo-transparent.svg"
          alt="LockIn"
          className="w-52 h-auto rounded-2xl mb-8"
        />

        <h2 className="text-lg font-semibold text-earth mb-6">
          {mode === 'login' ? 'Logga in' : 'Skapa konto'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="E-post"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-sage bg-white text-earth placeholder-earth-light focus:outline-none focus:border-earth"
          />
          <input
            type="password"
            placeholder="Lösenord (minst 6 tecken)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-sage bg-white text-earth placeholder-earth-light focus:outline-none focus:border-earth"
          />
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-earth text-cream py-4 rounded-xl font-semibold text-base hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {submitting ? 'Väntar...' : mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
        </form>

        <p className="text-center text-sm text-earth-light mt-6">
          {mode === 'login' ? 'Inget konto?' : 'Redan registrerad?'}{' '}
          <button
            type="button"
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
            className="text-earth font-semibold underline"
          >
            {mode === 'login' ? 'Registrera dig' : 'Logga in'}
          </button>
        </p>
      </div>
    </div>
  );
}
