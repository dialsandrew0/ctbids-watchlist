export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          updated_at?: string;
        };
      };
      auctions: {
        Row: {
          id: string;
          external_auction_id: string | null;
          title: string;
          description: string | null;
          url: string;
          start_date: string | null;
          end_date: string | null;
          status: string;
          location: string | null;
          raw_data: Json;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          external_auction_id?: string | null;
          title: string;
          description?: string | null;
          url: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          location?: string | null;
          raw_data?: Json;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          external_auction_id?: string | null;
          title?: string;
          description?: string | null;
          url?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: string;
          location?: string | null;
          raw_data?: Json;
          last_scraped_at?: string | null;
          updated_at?: string;
        };
      };
      auction_items: {
        Row: {
          id: string;
          auction_id: string;
          external_item_id: string | null;
          title: string;
          description: string | null;
          url: string;
          image_url: string | null;
          current_bid: number | null;
          starting_bid: number | null;
          bid_count: number | null;
          end_time: string;
          status: string;
          location: string | null;
          raw_data: Json;
          last_scraped_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auction_id: string;
          external_item_id?: string | null;
          title: string;
          description?: string | null;
          url: string;
          image_url?: string | null;
          current_bid?: number | null;
          starting_bid?: number | null;
          bid_count?: number | null;
          end_time: string;
          status?: string;
          location?: string | null;
          raw_data?: Json;
          last_scraped_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          auction_id?: string;
          external_item_id?: string | null;
          title?: string;
          description?: string | null;
          url?: string;
          image_url?: string | null;
          current_bid?: number | null;
          starting_bid?: number | null;
          bid_count?: number | null;
          end_time?: string;
          status?: string;
          location?: string | null;
          raw_data?: Json;
          last_scraped_at?: string | null;
          updated_at?: string;
        };
      };
      watchlist_entries: {
        Row: {
          id: string;
          user_id: string;
          auction_item_id: string;
          max_bid: number | null;
          notes: string | null;
          status: 'watching' | 'won' | 'lost' | 'archived';
          archived_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          auction_item_id: string;
          max_bid?: number | null;
          notes?: string | null;
          status?: 'watching' | 'won' | 'lost' | 'archived';
          archived_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          max_bid?: number | null;
          notes?: string | null;
          status?: 'watching' | 'won' | 'lost' | 'archived';
          archived_at?: string | null;
          updated_at?: string;
        };
      };
      bid_snapshots: {
        Row: {
          id: string;
          auction_item_id: string;
          bid_amount: number;
          bid_count: number | null;
          captured_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          auction_item_id: string;
          bid_amount: number;
          bid_count?: number | null;
          captured_at?: string;
          created_at?: string;
        };
        Update: never;
      };
      alert_events: {
        Row: {
          id: string;
          user_id: string;
          watchlist_entry_id: string;
          type: 'outbid' | 'ending_soon' | 'won' | 'lost';
          title: string;
          message: string;
          read_at: string | null;
          notified_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          watchlist_entry_id: string;
          type: 'outbid' | 'ending_soon' | 'won' | 'lost';
          title: string;
          message: string;
          read_at?: string | null;
          notified_at?: string | null;
          created_at?: string;
        };
        Update: {
          read_at?: string | null;
          notified_at?: string | null;
        };
      };
      scraping_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_type: 'watchlist' | 'item_detail' | 'manual';
          status: 'pending' | 'success' | 'failed';
          items_scraped: number;
          items_updated: number;
          error_message: string | null;
          metadata: Json;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_type: 'watchlist' | 'item_detail' | 'manual';
          status?: 'pending' | 'success' | 'failed';
          items_scraped?: number;
          items_updated?: number;
          error_message?: string | null;
          metadata?: Json;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: 'pending' | 'success' | 'failed';
          items_scraped?: number;
          items_updated?: number;
          error_message?: string | null;
          completed_at?: string | null;
        };
      };
      user_notification_settings: {
        Row: {
          id: string;
          user_id: string;
          email_on_outbid: boolean;
          email_on_ending_soon: boolean;
          email_on_won: boolean;
          ending_soon_minutes: number;
          digest_frequency: 'immediate' | 'hourly' | 'daily' | 'off';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_on_outbid?: boolean;
          email_on_ending_soon?: boolean;
          email_on_won?: boolean;
          ending_soon_minutes?: number;
          digest_frequency?: 'immediate' | 'hourly' | 'daily' | 'off';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email_on_outbid?: boolean;
          email_on_ending_soon?: boolean;
          email_on_won?: boolean;
          ending_soon_minutes?: number;
          digest_frequency?: 'immediate' | 'hourly' | 'daily' | 'off';
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
