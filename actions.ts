'use server';

import { createClient } from '@/lib/supabase/server';
import { scrapeItemDetail } from '@/lib/scraper/ctbids';
import {
  UpdateWatchlistEntrySchema,
  UpdateNotificationSettingsSchema,
  ManualIngestSchema,
} from '@/lib/validators/schemas';
import { env } from '@/lib/env';

export async function addToWatchlist(auctionItemId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const result = await supabase
      .from('watchlist_entries')
      .insert({
        user_id: user.id,
        auction_item_id: auctionItemId,
      })
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return { error: 'Failed to add to watchlist' };
  }
}

export async function updateWatchlistEntry(entryId: string, updates: unknown) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    // Validate input
    const validatedData = UpdateWatchlistEntrySchema.parse(updates);

    // Verify ownership
    const { data: entry } = await supabase
      .from('watchlist_entries')
      .select('id')
      .eq('id', entryId)
      .eq('user_id', user.id)
      .single();

    if (!entry) {
      return { error: 'Entry not found' };
    }

    const result = await supabase
      .from('watchlist_entries')
      .update(validatedData)
      .eq('id', entryId)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error updating watchlist entry:', error);
    return { error: 'Failed to update entry' };
  }
}

export async function archiveWatchlistEntry(entryId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const result = await supabase
      .from('watchlist_entries')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
      })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error archiving entry:', error);
    return { error: 'Failed to archive entry' };
  }
}

export async function markAsWon(entryId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const result = await supabase
      .from('watchlist_entries')
      .update({ status: 'won' })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error marking as won:', error);
    return { error: 'Failed to mark as won' };
  }
}

export async function markAsLost(entryId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const result = await supabase
      .from('watchlist_entries')
      .update({ status: 'lost' })
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error marking as lost:', error);
    return { error: 'Failed to mark as lost' };
  }
}

export async function updateNotificationSettings(updates: unknown) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const validatedData = UpdateNotificationSettingsSchema.parse(updates);

    const result = await supabase
      .from('user_notification_settings')
      .update(validatedData)
      .eq('user_id', user.id)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { error: 'Failed to update settings' };
  }
}

export async function ingestManualUrl(url: unknown) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    // Validate URL
    const validatedData = ManualIngestSchema.parse({ url });

    // Scrape the item
    const scraped = await scrapeItemDetail(validatedData.url, {
      username: env.CTBIDS_USERNAME,
      password: env.CTBIDS_PASSWORD,
    });

    if (!scraped) {
      return { error: 'Failed to scrape item from URL' };
    }

    // Upsert auction
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .upsert(
        {
          title: scraped.auction_title,
          url: scraped.auction_url,
          external_auction_id: null,
          raw_data: { source: 'manual_ingest' },
        },
        { onConflict: 'url' }
      )
      .select()
      .single();

    if (auctionError) {
      return { error: 'Failed to create/update auction' };
    }

    // Upsert auction item
    const { data: item, error: itemError } = await supabase
      .from('auction_items')
      .upsert(
        {
          auction_id: auction.id,
          title: scraped.title,
          description: scraped.description,
          url: scraped.url,
          image_url: scraped.image_url,
          current_bid: scraped.current_bid,
          starting_bid: scraped.starting_bid,
          bid_count: scraped.bid_count,
          end_time: scraped.end_time,
          external_item_id: scraped.external_item_id,
          location: scraped.location,
          raw_data: scraped,
        },
        { onConflict: 'url' }
      )
      .select()
      .single();

    if (itemError) {
      return { error: 'Failed to create/update item' };
    }

    // Add to watchlist
    const { data: entry, error: entryError } = await supabase
      .from('watchlist_entries')
      .upsert(
        {
          user_id: user.id,
          auction_item_id: item.id,
        },
        { onConflict: 'user_id,auction_item_id' }
      )
      .select()
      .single();

    if (entryError) {
      return { error: 'Failed to add to watchlist' };
    }

    return { data: entry };
  } catch (error) {
    console.error('Error ingesting manual URL:', error);
    return { error: 'Failed to ingest URL' };
  }
}

export async function markAlertAsRead(alertId: string) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: 'Unauthorized' };
    }

    const result = await supabase
      .from('alert_events')
      .update({ read_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (result.error) {
      return { error: result.error.message };
    }

    return { data: result.data };
  } catch (error) {
    console.error('Error marking alert as read:', error);
    return { error: 'Failed to mark alert as read' };
  }
}
