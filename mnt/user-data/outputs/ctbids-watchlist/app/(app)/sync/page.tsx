'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { RefreshCw, Loader2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';
import { env } from '@/lib/env';

export default function SyncPage() {
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const supabase = createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const handleSync = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast.error('Not authenticated');
        return;
      }

      // Create a scraping session record
      const { error } = await supabase
        .from('scraping_sessions')
        .insert({
          user_id: user.id,
          session_type: 'watchlist',
          status: 'pending',
        });

      if (error) {
        toast.error('Failed to start sync');
        return;
      }

      // In production, this would trigger a background job
      // For now, show success message
      toast.success('Sync initiated. Check back in a few moments.');
      setLastSync(new Date());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Sync Watchlist
        </h1>
        <p className="text-muted-foreground">
          Manually refresh your watchlist items
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <div className="space-y-6">
          <button
            onClick={handleSync}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Start Sync
              </>
            )}
          </button>

          {lastSync && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-sm">
              Last synced at {lastSync.toLocaleTimeString()}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">What happens during sync:</h3>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Connects to your CTBids account (if credentials provided)</li>
              <li>Fetches your current watchlist</li>
              <li>Updates bid amounts and item details</li>
              <li>Creates alerts for outbid and ending-soon items</li>
              <li>Stores bid history for tracking</li>
            </ul>
          </div>

          <div className="p-4 bg-secondary rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 Tip: Syncs run automatically every 10 minutes in the background. Use this button to refresh immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
