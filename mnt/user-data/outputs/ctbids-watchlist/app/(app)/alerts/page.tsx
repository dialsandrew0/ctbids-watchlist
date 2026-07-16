'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { env } from '@/lib/env';
import { formatDistanceToNow } from 'date-fns';
import { markAlertAsRead } from '@/app/actions';
import { toast } from 'sonner';
import { Bell, Loader2 } from 'lucide-react';
import type { Database } from '@/lib/types/database';

type AlertEvent = Database['public']['Tables']['alert_events']['Row'];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadAlerts();
  }, []);

  async function loadAlerts() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('alert_events')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setAlerts(data || []);
    } finally {
      setLoading(false);
    }
  }

  const handleMarkAsRead = async (alertId: string) => {
    const result = await markAlertAsRead(alertId);
    if (result.error) {
      toast.error(result.error);
    } else {
      loadAlerts();
    }
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : filter === 'unread'
    ? alerts.filter(a => !a.read_at)
    : alerts.filter(a => a.type === filter);

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'outbid':
        return 'bg-red-500/10 border-red-500/20 text-red-400';
      case 'ending_soon':
        return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
      case 'won':
        return 'bg-green-500/10 border-green-500/20 text-green-400';
      case 'lost':
        return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
      default:
        return 'bg-blue-500/10 border-blue-500/20 text-blue-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Alerts
        </h1>
        <p className="text-muted-foreground">
          Notifications for your watchlist
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {['all', 'unread', 'outbid', 'ending_soon', 'won', 'lost'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary text-muted-foreground hover:bg-border'
            }`}
          >
            {f === 'ending_soon' ? 'Ending Soon' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Bell className="mx-auto mb-4 text-muted-foreground opacity-50" size={40} />
          <p className="text-muted-foreground">
            {filter === 'all' ? 'No alerts yet' : `No ${filter} alerts`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-6 rounded-lg border ${getAlertColor(alert.type)} ${
                alert.read_at ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{alert.title}</h3>
                  <p className="text-sm opacity-80 mb-2">{alert.message}</p>
                  <p className="text-xs opacity-60">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!alert.read_at && (
                  <button
                    onClick={() => handleMarkAsRead(alert.id)}
                    className="px-4 py-1 bg-current bg-opacity-20 hover:bg-opacity-30 rounded transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
