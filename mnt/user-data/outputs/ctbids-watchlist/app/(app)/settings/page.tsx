'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { updateNotificationSettings } from '@/app/actions';
import { env } from '@/lib/env';
import { toast } from 'sonner';
import { Loader2, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { Database } from '@/lib/types/database';

type NotificationSettings = Database['public']['Tables']['user_notification_settings']['Row'];

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_notification_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setSettings(data);
      } else {
        // Create default settings
        const { data: newSettings } = await supabase
          .from('user_notification_settings')
          .insert({
            user_id: user.id,
          })
          .select()
          .single();

        setSettings(newSettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async (updates: Partial<NotificationSettings>) => {
    setSaving(true);
    try {
      const result = await updateNotificationSettings(updates);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSettings(result.data);
        toast.success('Settings saved');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success('Logged out');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your preferences</p>
      </div>

      {settings && (
        <div className="space-y-6">
          {/* Notification Alerts */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Alert Notifications
            </h2>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_on_outbid}
                  onChange={(e) =>
                    handleSave({ email_on_outbid: e.target.checked })
                  }
                  disabled={saving}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-foreground">Outbid alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when someone outbids your max price
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_on_ending_soon}
                  onChange={(e) =>
                    handleSave({ email_on_ending_soon: e.target.checked })
                  }
                  disabled={saving}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-foreground">Ending soon alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when auctions are about to end
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.email_on_won}
                  onChange={(e) =>
                    handleSave({ email_on_won: e.target.checked })
                  }
                  disabled={saving}
                  className="w-4 h-4 rounded"
                />
                <div>
                  <p className="font-medium text-foreground">Won alerts</p>
                  <p className="text-sm text-muted-foreground">
                    Get notified when you win an auction
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-6 pt-6 border-t border-border">
              <label className="block text-sm font-medium text-foreground mb-2">
                Ending soon threshold
              </label>
              <select
                value={settings.ending_soon_minutes}
                onChange={(e) =>
                  handleSave({ ending_soon_minutes: parseInt(e.target.value) })
                }
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="120">2 hours</option>
                <option value="240">4 hours</option>
              </select>
              <p className="text-xs text-muted-foreground mt-2">
                Receive alerts when auctions have this much time remaining
              </p>
            </div>
          </div>

          {/* Account */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Account
            </h2>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
