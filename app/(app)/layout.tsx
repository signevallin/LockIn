'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { BottomNav } from '@/components/layout/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-earth border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-cream pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
