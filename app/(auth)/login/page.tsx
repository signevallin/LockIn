'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, register } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') await login(email, password);
      else await register(email, password);
      router.push('/app');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Något gick fel');
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-earth mb-1">LockIn</h1>
        <p className="text-earth-light text-sm mb-8">Lock in your future.</p>

        <div className="flex rounded-xl overflow-hidden mb-6 border border-sage">
          <button
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-earth text-cream' : 'bg-cream text-earth-light'}`}
            onClick={() => setMode('login')}
          >
            Logga in
          </button>
          <button
            className={`flex-1 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-earth text-cream' : 'bg-cream text-earth-light'}`}
            onClick={() => setMode('register')}
          >
            Registrera
          </button>
        </div>

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
            placeholder="Lösenord"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border border-sage bg-white text-earth placeholder-earth-light focus:outline-none focus:border-earth"
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full bg-earth text-cream py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            {mode === 'login' ? 'Logga in' : 'Skapa konto'}
          </button>
        </form>
      </div>
    </div>
  );
}
