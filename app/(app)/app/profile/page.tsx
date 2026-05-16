'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { requestNotificationPermission } from '@/lib/firebase/fcm';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, logout, updateName } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const router = useRouter();

  useEffect(() => {
    if (user?.displayName) setName(user.displayName);
  }, [user?.displayName]);

  async function handleSaveName() {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await updateName(name.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

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

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark space-y-3">
        <p className="text-sm font-semibold text-earth">Ditt namn</p>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSaveName()}
          placeholder="Vad ska vi kalla dig?"
          className="w-full px-3 py-2 rounded-xl border border-sage bg-white text-earth text-sm focus:outline-none focus:border-earth"
        />
        <Button size="sm" onClick={handleSaveName} disabled={!name.trim() || saving}>
          {saving ? 'Sparar...' : saved ? '✓ Sparat!' : 'Spara namn'}
        </Button>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark">
        <p className="text-xs text-earth-light mb-1">Inloggad som</p>
        <p className="text-earth text-sm font-medium">{user?.email}</p>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-cream-dark">
        <p className="text-sm font-semibold text-earth mb-2">Push-notiser</p>
        <p className="text-xs text-earth-light mb-3">Aktivera för påminnelser om incheckning och streak.</p>
        {notifStatus === 'granted' ? (
          <p className="text-sm text-earth">✓ Notiser aktiverade</p>
        ) : notifStatus === 'denied' ? (
          <p className="text-sm text-red-600">Notiser nekade. Aktivera i webbläsarens inställningar.</p>
        ) : (
          <Button variant="outline" onClick={handleEnableNotifications}>Aktivera notiser 🔔</Button>
        )}
      </div>

      <Button variant="outline" size="lg" onClick={handleLogout}>Logga ut</Button>
    </div>
  );
}
