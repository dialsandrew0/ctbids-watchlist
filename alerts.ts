import { createServiceRoleClient } from '@/lib/supabase/server';
import { differenceInMinutes, isPast } from 'date-fns';

export async function detectOutbidAlerts(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    // Get all active watchlist entries with max_bid set
    const { data: entries, error: entriesError } = await supabase
      .from('watchlist_entries')
      .select('id, auction_item_id, max_bid')
      .eq('user_id', userId)
      .eq('status', 'watching')
      .not('max_bid', 'is', null);

    if (entriesError) throw entriesError;
    if (!entries || entries.length === 0) return;

    for (const entry of entries) {
      // Get current item bid
      const { data: item, error: itemError } = await supabase
        .from('auction_items')
        .select('current_bid, id')
        .eq('id', entry.auction_item_id)
        .single();

      if (itemError) {
        console.error('Error fetching item:', itemError);
        continue;
      }

      if (!item || item.current_bid === null) continue;

      // Check if outbid
      if (item.current_bid > entry.max_bid) {
        // Check if alert already exists (deduplication)
        const { data: existingAlert } = await supabase
          .from('alert_events')
          .select('id')
          .eq('watchlist_entry_id', entry.id)
          .eq('type', 'outbid')
          .eq('read_at', null)
          .single();

        if (!existingAlert) {
          // Create alert
          await supabase.from('alert_events').insert({
            user_id: userId,
            watchlist_entry_id: entry.id,
            type: 'outbid',
            title: 'You\'ve been outbid',
            message: `Current bid ($${item.current_bid}) exceeds your max bid ($${entry.max_bid})`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error detecting outbid alerts:', error);
  }
}

export async function detectEndingSoonAlerts(userId: string, minutesThreshold: number = 60): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    // Get user's notification settings
    const { data: settings } = await supabase
      .from('user_notification_settings')
      .select('ending_soon_minutes')
      .eq('user_id', userId)
      .single();

    const threshold = settings?.ending_soon_minutes || minutesThreshold;

    // Get all active watchlist entries
    const { data: entries, error: entriesError } = await supabase
      .from('watchlist_entries')
      .select('id, auction_item_id')
      .eq('user_id', userId)
      .eq('status', 'watching');

    if (entriesError) throw entriesError;
    if (!entries) return;

    const now = new Date();

    for (const entry of entries) {
      // Get item end time
      const { data: item } = await supabase
        .from('auction_items')
        .select('end_time, status')
        .eq('id', entry.auction_item_id)
        .single();

      if (!item || item.status === 'ended' || item.status === 'archived') continue;

      const endTime = new Date(item.end_time);
      const minutesUntilEnd = differenceInMinutes(endTime, now);

      // Create alert if within threshold
      if (minutesUntilEnd > 0 && minutesUntilEnd <= threshold) {
        // Check if alert already exists for this threshold
        const alertKey = `${entry.id}-ending-soon-${threshold}`;
        const { data: existingAlert } = await supabase
          .from('alert_events')
          .select('id')
          .eq('watchlist_entry_id', entry.id)
          .eq('type', 'ending_soon')
          .eq('read_at', null)
          .single();

        if (!existingAlert) {
          await supabase.from('alert_events').insert({
            user_id: userId,
            watchlist_entry_id: entry.id,
            type: 'ending_soon',
            title: 'Auction ending soon',
            message: `This item ends in approximately ${Math.round(minutesUntilEnd)} minutes`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error detecting ending soon alerts:', error);
  }
}

export async function createBidSnapshot(auctionItemId: string, bidAmount: number, bidCount?: number): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    await supabase.from('bid_snapshots').insert({
      auction_item_id: auctionItemId,
      bid_amount: bidAmount,
      bid_count: bidCount,
      captured_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating bid snapshot:', error);
  }
}

export async function getBidHistory(auctionItemId: string, limit: number = 50) {
  const supabase = createServiceRoleClient();

  try {
    const { data, error } = await supabase
      .from('bid_snapshots')
      .select('*')
      .eq('auction_item_id', auctionItemId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching bid history:', error);
    return [];
  }
}

export async function detectItemStatusChange(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  try {
    const { data: entries } = await supabase
      .from('watchlist_entries')
      .select('id, auction_item_id')
      .eq('user_id', userId)
      .eq('status', 'watching');

    if (!entries) return;

    for (const entry of entries) {
      const { data: item } = await supabase
        .from('auction_items')
        .select('status')
        .eq('id', entry.auction_item_id)
        .single();

      if (!item) continue;

      // Update watchlist entry status based on item status
      if (item.status === 'ended' || item.status === 'unsold') {
        // Check if we already created a won/lost alert
        const { data: existingAlert } = await supabase
          .from('alert_events')
          .select('id')
          .eq('watchlist_entry_id', entry.id)
          .in('type', ['won', 'lost'])
          .single();

        if (!existingAlert) {
          // Assume lost if status changed to ended (would need manual verification for won)
          await supabase.from('alert_events').insert({
            user_id: userId,
            watchlist_entry_id: entry.id,
            type: item.status === 'unsold' ? 'lost' : 'lost',
            title: 'Auction ended',
            message: `This item's auction has ended (status: ${item.status})`,
          });
        }
      }
    }
  } catch (error) {
    console.error('Error detecting status changes:', error);
  }
}
