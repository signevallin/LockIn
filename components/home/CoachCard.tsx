'use client';
import { useRouter } from 'next/navigation';

export function CoachCard() {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push('/app/coach')}
      className="w-full bg-earth text-cream rounded-2xl p-4 text-left"
    >
      <div className="flex items-center gap-3">
        <span className="text-2xl">🤖</span>
        <div>
          <p className="font-semibold text-sm">AI-coach</p>
          <p className="text-xs opacity-70">Prata med din personliga coach →</p>
        </div>
      </div>
    </button>
  );
}
