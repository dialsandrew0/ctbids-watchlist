'use client';

import { useEffect, useState } from 'react';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Search, Loader2 } from 'lucide-react';
import { ItemDrawer } from '@/components/watchlist/item-drawer';
import type { Database } from '@/lib/types/database';

type WatchlistEntry = Database['public']['Tables']['watchlist_entries']['Row'] & {
  auction_items?: Database['public']['Tables']['auction_items']['Row'];
};

interface WatchlistTableProps {
  userId: string;
}

export function WatchlistTable({ userId }: WatchlistTableProps) {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<WatchlistEntry[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('watching');
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WatchlistEntry | null>(null);

  const supabase = createSupabaseClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  useEffect(() => {
    loadWatchlist();
  }, []);

  useEffect(() => {
    let filtered = entries;

    if (statusFilter && statusFilter !== 'all') {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (search) {
      filtered = filtered.filter(e =>
        e.auction_items?.title.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredEntries(filtered);
  }, [entries, search, statusFilter]);

  async function loadWatchlist() {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('watchlist_entries')
        .select(`
          *,
          auction_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setEntries(data || []);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching':
        return 'bg-blue-500/10 text-blue-400';
      case 'won':
        return 'bg-green-500/10 text-green-400';
      case 'lost':
        return 'bg-red-500/10 text-red-400';
      case 'archived':
        return 'bg-gray-500/10 text-gray-400';
      default:
        return 'bg-gray-500/10 text-gray-400';
    }
  };

  const getTimeLeftColor = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const hoursLeft = (end.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursLeft < 0) return 'text-red-400';
    if (hoursLeft < 1) return 'text-orange-400';
    if (hoursLeft < 24) return 'text-yellow-400';
    return 'text-green-400';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-card border border-border rounded-lg">
        {/* Search and filters */}
        <div className="p-6 border-b border-border space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2">
            {['all', 'watching', 'won', 'lost', 'archived'].map(status => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-muted-foreground hover:bg-border'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Item</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Current Bid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Max Bid</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Ending</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No items found
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className="border-b border-border hover:bg-secondary/30 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-3">
                        {entry.auction_items?.image_url && (
                          <img
                            src={entry.auction_items.image_url}
                            alt={entry.auction_items.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="font-medium text-foreground line-clamp-1">
                            {entry.auction_items?.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.auction_items?.auction_id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      ${entry.auction_items?.current_bid?.toFixed(2) || '0.00'}
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {entry.max_bid ? `$${entry.max_bid.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getTimeLeftColor(entry.auction_items?.end_time || '')}>
                        {formatDistanceToNow(new Date(entry.auction_items?.end_time || ''), { addSuffix: true })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Badge className={getStatusColor(entry.status)}>
                        {entry.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Item detail drawer */}
      {selectedEntry && (
        <ItemDrawer
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onUpdate={() => loadWatchlist()}
        />
      )}
    </>
  );
}
