import { z } from 'zod';

// Scraped auction data schema
export const ScrapedAuctionSchema = z.object({
  external_auction_id: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  url: z.string().url(),
  start_date: z.string().datetime().optional().nullable(),
  end_date: z.string().datetime().optional().nullable(),
  location: z.string().optional().nullable(),
});

export type ScrapedAuction = z.infer<typeof ScrapedAuctionSchema>;

// Scraped auction item schema
export const ScrapedAuctionItemSchema = z.object({
  external_item_id: z.string().optional().nullable(),
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  url: z.string().url(),
  image_url: z.string().url().optional().nullable(),
  current_bid: z.number().positive().optional().nullable(),
  starting_bid: z.number().positive().optional().nullable(),
  bid_count: z.number().int().nonnegative().optional().nullable(),
  end_time: z.string().datetime(),
  location: z.string().optional().nullable(),
  auction_title: z.string().min(1),
  auction_url: z.string().url(),
});

export type ScrapedAuctionItem = z.infer<typeof ScrapedAuctionItemSchema>;

// Watchlist entry update schema
export const UpdateWatchlistEntrySchema = z.object({
  max_bid: z.number().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['watching', 'won', 'lost', 'archived']).optional(),
});

export type UpdateWatchlistEntry = z.infer<typeof UpdateWatchlistEntrySchema>;

// Create watchlist entry schema
export const CreateWatchlistEntrySchema = z.object({
  auction_item_id: z.string().uuid(),
  max_bid: z.number().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export type CreateWatchlistEntry = z.infer<typeof CreateWatchlistEntrySchema>;

// Notification settings schema
export const UpdateNotificationSettingsSchema = z.object({
  email_on_outbid: z.boolean().optional(),
  email_on_ending_soon: z.boolean().optional(),
  email_on_won: z.boolean().optional(),
  ending_soon_minutes: z.number().int().positive().max(1440).optional(),
  digest_frequency: z.enum(['immediate', 'hourly', 'daily', 'off']).optional(),
});

export type UpdateNotificationSettings = z.infer<typeof UpdateNotificationSettingsSchema>;

// Manual URL ingest schema
export const ManualIngestSchema = z.object({
  url: z.string().url().includes('ctbids.com', { message: 'Must be a CTBids URL' }),
});

export type ManualIngest = z.infer<typeof ManualIngestSchema>;
