import { z } from 'zod';

export const UpdateWatchlistEntrySchema = z.object({
  max_bid: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['watching', 'won', 'lost', 'archived']).optional(),
});

export const CreateWatchlistEntrySchema = z.object({
  auction_item_id: z.string().uuid(),
  max_bid: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const UpdateNotificationSettingsSchema = z.object({
  email_on_outbid: z.boolean().optional(),
  email_on_ending_soon: z.boolean().optional(),
  email_on_won: z.boolean().optional(),
  ending_soon_minutes: z.number().int().positive().optional(),
  digest_frequency: z.enum(['immediate', 'hourly', 'daily', 'off']).optional(),
});

export const ManualIngestSchema = z.object({
  url: z.string().url(),
});

export type ScrapedAuctionItem = {
  title: string;
  url: string;
  current_bid?: number | null;
  image_url?: string | null;
  end_time?: string | null;
  auction_title?: string | null;
  auction_url?: string | null;
};

export const ScrapedAuctionItemSchema = z.object({
  title: z.string(),
  url: z.string().url(),
  current_bid: z.number().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  end_time: z.string().datetime().nullable().optional(),
  auction_title: z.string().nullable().optional(),
  auction_url: z.string().url().nullable().optional(),
});

export type UpdateWatchlistEntry = z.infer<typeof UpdateWatchlistEntrySchema>;
export type CreateWatchlistEntry = z.infer<typeof CreateWatchlistEntrySchema>;
export type UpdateNotificationSettings = z.infer<
  typeof UpdateNotificationSettingsSchema
>;
export type ManualIngest = z.infer<typeof ManualIngestSchema>;
