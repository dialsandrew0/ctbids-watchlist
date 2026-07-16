'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { updateWatchlistEntry, markAsWon, markAsLost, archiveWatchlistEntry } from '@/app/actions';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/lib/types/database';

type WatchlistEntry = Database['public']['Tables']['watchlist_entries']['Row'] & {
  auction_items?: Database['public']['Tables']['auction_items']['Row'];
};

interface ItemDrawerProps {
  entry: WatchlistEntry;
  onClose: () => void;
  onUpdate: () => void;
}

export function ItemDrawer({ entry, onClose, onUpdate }: ItemDrawerProps) {
  const [maxBid, setMaxBid] = useState(entry.max_bid?.toString() || '');
  const [notes, setNotes] = useState(entry.notes || '');
  const [saving, setSaving] = useState(false);

  const item = entry.auction_items;

  if (!item) return null;

  const handleSaveMaxBid = async () => {
    if (!maxBid) return;

    setSaving(true);
    const result = await updateWatchlistEntry(entry.id, {
      max_bid: parseFloat(maxBid),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Max bid updated');
      onUpdate();
    }
    setSaving(false);
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    const result = await updateWatchlistEntry(entry.id, {
      notes,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Notes saved');
      onUpdate();
    }
    setSaving(false);
  };

  const handleMarkWon = async () => {
    const result = await markAsWon(entry.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Marked as won');
      onUpdate();
      onClose();
    }
  };

  const handleMarkLost = async () => {
    const result = await markAsLost(entry.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Marked as lost');
      onUpdate();
      onClose();
    }
  };

  const handleArchive = async () => {
    const result = await archiveWatchlistEntry(entry.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('Item archived');
      onUpdate();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-card w-full sm:w-96 max-h-[90vh] overflow-y-auto rounded-t-lg sm:rounded-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <h2 className="text-xl font-semibold text-foreground">Item Details</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image and title */}
          {item.image_url && (
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-48 object-cover rounded-lg"
            />
          )}

          <div>
            <h3 className="text-xl font-semibold text-foreground">{item.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
          </div>

          {/* Status badge */}
          <Badge className="w-fit bg-blue-500/10 text-blue-400">
            {entry.status}
          </Badge>

          {/* Bid information */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current bid:</span>
              <span className="font-semibold text-foreground">
                ${item.current_bid?.toFixed(2) || '0.00'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Bid count:</span>
              <span className="font-semibold text-foreground">{item.bid_count || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ends:</span>
              <span className="font-semibold text-foreground">
                {formatDistanceToNow(new Date(item.end_time), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Max bid */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Your max bid
            </label>
            <div className="flex gap-2">
              <Input
                type="number"
                step="0.01"
                value={maxBid}
                onChange={(e) => setMaxBid(e.target.value)}
                placeholder="Set your max bid"
                className="flex-1"
              />
              <button
                onClick={handleSaveMaxBid}
                disabled={saving || !maxBid}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all"
              >
                Save
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add personal notes..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="mt-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              Save notes
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-border">
            {entry.status === 'watching' && (
              <>
                <button
                  onClick={handleMarkWon}
                  className="flex-1 px-4 py-2 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 transition-all text-sm font-medium"
                >
                  Won
                </button>
                <button
                  onClick={handleMarkLost}
                  className="flex-1 px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-all text-sm font-medium"
                >
                  Lost
                </button>
              </>
            )}
            <button
              onClick={handleArchive}
              className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium"
            >
              Archive
            </button>
          </div>

          {/* Item URL */}
          <div className="pt-4 border-t border-border">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline text-sm"
            >
              View on CTBids →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
