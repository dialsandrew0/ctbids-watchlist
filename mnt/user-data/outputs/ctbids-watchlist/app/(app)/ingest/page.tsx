'use client';

import { useState } from 'react';
import { ingestManualUrl } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function IngestPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    try {
      const result = await ingestManualUrl(url);

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success('Item added to watchlist!');
        setUrl('');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Manual Item Ingest
        </h1>
        <p className="text-muted-foreground">
          Add a single CTBids item URL to your watchlist
        </p>
      </div>

      <div className="bg-card border border-border rounded-lg p-8">
        <form onSubmit={handleIngest} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-foreground mb-2">
              CTBids Item URL
            </label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.ctbids.com/estate-auctions/lot/..."
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              Paste the full URL of the CTBids item you want to add
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-accent text-accent-foreground font-medium hover:bg-opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Adding item...
              </>
            ) : (
              <>
                <Upload size={18} />
                Add to Watchlist
              </>
            )}
          </button>
        </form>

        <div className="mt-8 p-4 bg-secondary rounded-lg">
          <h3 className="font-semibold text-foreground mb-2">How it works</h3>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Navigate to a CTBids auction item page</li>
            <li>Copy the URL from your browser's address bar</li>
            <li>Paste it here and click "Add to Watchlist"</li>
            <li>The item will be scraped and added to your watchlist</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
