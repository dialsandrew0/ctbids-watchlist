import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KPICards } from '@/components/dashboard/kpi-cards';
import { WatchlistTable } from '@/components/dashboard/watchlist-table';
import { AlertPanel } from '@/components/dashboard/alert-panel';

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Fetch KPI data
  const { data: watchlistEntries } = await supabase
    .from('watchlist_entries')
    .select('status')
    .eq('user_id', user.id);

  const { data: alertsData } = await supabase
    .from('alert_events')
    .select('*')
    .eq('user_id', user.id)
    .eq('read_at', null)
    .limit(10);

  const stats = {
    total_watching: watchlistEntries?.filter(e => e.status === 'watching').length || 0,
    won: watchlistEntries?.filter(e => e.status === 'won').length || 0,
    lost: watchlistEntries?.filter(e => e.status === 'lost').length || 0,
    outbid: alertsData?.filter(a => a.type === 'outbid').length || 0,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground">Watchlist</h1>
        <p className="text-muted-foreground">Monitor your CTBids auctions</p>
      </div>

      {/* KPI Cards */}
      <KPICards stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {/* Watchlist Table */}
          <WatchlistTable userId={user.id} />
        </div>
        <div>
          {/* Alert Panel */}
          <AlertPanel userId={user.id} alerts={alertsData || []} />
        </div>
      </div>
    </div>
  );
}
