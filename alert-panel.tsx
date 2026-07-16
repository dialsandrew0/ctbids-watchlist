'use client';

import { Bell, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { markAlertAsRead } from '@/app/actions';
import { toast } from 'sonner';
import type { Database } from '@/lib/types/database';

type AlertEvent = Database['public']['Tables']['alert_events']['Row'];

interface AlertPanelProps {
  userId: string;
  alerts: AlertEvent[];
}

export function AlertPanel({ userId, alerts }: AlertPanelProps) {
  const handleMarkAsRead = async (alertId: string) => {
    const result = await markAlertAsRead(alertId);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Alert marked as read');
    }
  };

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

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'outbid':
        return '⚠️';
      case 'ending_soon':
        return '⏰';
      case 'won':
        return '🏆';
      case 'lost':
        return '❌';
      default:
        return '🔔';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell size={20} className="text-accent" />
        <h3 className="text-lg font-semibold text-foreground">Recent Alerts</h3>
      </div>

      {alerts.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No alerts yet. Stay tuned!
        </p>
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getAlertIcon(alert.type)}</span>
                    <p className="font-semibold text-sm">{alert.title}</p>
                  </div>
                  <p className="text-xs mt-1 opacity-80">{alert.message}</p>
                  <p className="text-xs mt-2 opacity-60">
                    {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                  </p>
                </div>
                <button
                  onClick={() => handleMarkAsRead(alert.id)}
                  className="opacity-60 hover:opacity-100 transition-opacity"
                  aria-label="Dismiss alert"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
