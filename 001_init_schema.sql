-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auctions table
CREATE TABLE IF NOT EXISTS auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_auction_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived')),
  location TEXT,
  raw_data JSONB,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create auction_items table
CREATE TABLE IF NOT EXISTS auction_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  external_item_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL UNIQUE,
  image_url TEXT,
  current_bid DECIMAL(10, 2),
  starting_bid DECIMAL(10, 2),
  bid_count INTEGER,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'ended', 'archived', 'unsold')),
  location TEXT,
  raw_data JSONB,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create watchlist_entries table
CREATE TABLE IF NOT EXISTS watchlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  max_bid DECIMAL(10, 2),
  notes TEXT,
  status TEXT DEFAULT 'watching' CHECK (status IN ('watching', 'won', 'lost', 'archived')),
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, auction_item_id)
);

-- Create bid_snapshots table
CREATE TABLE IF NOT EXISTS bid_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_item_id UUID NOT NULL REFERENCES auction_items(id) ON DELETE CASCADE,
  bid_amount DECIMAL(10, 2) NOT NULL,
  bid_count INTEGER,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create alert_events table
CREATE TABLE IF NOT EXISTS alert_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  watchlist_entry_id UUID NOT NULL REFERENCES watchlist_entries(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('outbid', 'ending_soon', 'won', 'lost')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create scraping_sessions table
CREATE TABLE IF NOT EXISTS scraping_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('watchlist', 'item_detail', 'manual')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  items_scraped INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_notification_settings table
CREATE TABLE IF NOT EXISTS user_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_on_outbid BOOLEAN DEFAULT true,
  email_on_ending_soon BOOLEAN DEFAULT true,
  email_on_won BOOLEAN DEFAULT true,
  ending_soon_minutes INTEGER DEFAULT 60,
  digest_frequency TEXT DEFAULT 'immediate' CHECK (digest_frequency IN ('immediate', 'hourly', 'daily', 'off')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_end_date ON auctions(end_date);
CREATE INDEX idx_auction_items_auction_id ON auction_items(auction_id);
CREATE INDEX idx_auction_items_status ON auction_items(status);
CREATE INDEX idx_auction_items_end_time ON auction_items(end_time);
CREATE INDEX idx_auction_items_external_id ON auction_items(external_item_id);
CREATE INDEX idx_watchlist_entries_user_id ON watchlist_entries(user_id);
CREATE INDEX idx_watchlist_entries_item_id ON watchlist_entries(auction_item_id);
CREATE INDEX idx_watchlist_entries_status ON watchlist_entries(status);
CREATE INDEX idx_bid_snapshots_item_id ON bid_snapshots(auction_item_id);
CREATE INDEX idx_bid_snapshots_created_at ON bid_snapshots(created_at);
CREATE INDEX idx_alert_events_user_id ON alert_events(user_id);
CREATE INDEX idx_alert_events_watchlist_id ON alert_events(watchlist_entry_id);
CREATE INDEX idx_alert_events_type ON alert_events(type);
CREATE INDEX idx_alert_events_read_at ON alert_events(read_at);
CREATE INDEX idx_scraping_sessions_user_id ON scraping_sessions(user_id);
CREATE INDEX idx_scraping_sessions_status ON scraping_sessions(status);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE PLPGSQL;

-- Apply updated_at triggers
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER auctions_updated_at BEFORE UPDATE ON auctions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER auction_items_updated_at BEFORE UPDATE ON auction_items
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER watchlist_entries_updated_at BEFORE UPDATE ON watchlist_entries
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER user_notification_settings_updated_at BEFORE UPDATE ON user_notification_settings
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
