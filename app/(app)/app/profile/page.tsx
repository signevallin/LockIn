'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { requestNotificationPermission } from '@/lib/firebase/fcm';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const router = useRouter();

  async function handleEnableNotifications() {
    if (!user) return;
    const granted = await requestNotificationPermission(user.uid);
    setNotifStatus(granted ? 'granted' : 'denied');
  }

  async function handleLogout() {
    await logout();
    router.push('/login');
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-earth pt-2">Profil</h1>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-earth-light mb-1">Inloggad som</p>
        <p className="text-earth font-medium">{user?.email}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm font-semibold text-earth mb-2">Push-notiser</p>
        <p className="text-xs text-earth-light mb-3">
          Aktivera för påminnelser om incheckning och streak.
        </p>
        {notifStatus === 'granted' ? (
          <p className="text-sm text-earth">✓ Notiser aktiverade</p>
        ) : notifStatus === 'denied' ? (
          <p className="text-sm text-red-600">Notiser nekade. Aktivera i webbläsarens inställningar.</p>
        ) : (
          <Button variant="outline" onClick={handleEnableNotifications}>
            Aktivera notiser 🔔
          </Button>
        )}
      </div>

      <Button variant="outline" size="lg" onClick={handleLogout}>
        Logga ut
      </Button>
    </div>
  );
}
