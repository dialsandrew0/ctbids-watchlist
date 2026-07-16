-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE auction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraping_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only read/update their own profile
CREATE POLICY profiles_select ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY profiles_update ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_insert ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Auctions: Everyone can read (shared data), only system can insert/update
CREATE POLICY auctions_select ON auctions
  FOR SELECT
  USING (true);

-- Auction Items: Everyone can read (shared data)
CREATE POLICY auction_items_select ON auction_items
  FOR SELECT
  USING (true);

-- Watchlist Entries: Users can only access their own entries
CREATE POLICY watchlist_entries_select ON watchlist_entries
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY watchlist_entries_insert ON watchlist_entries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY watchlist_entries_update ON watchlist_entries
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY watchlist_entries_delete ON watchlist_entries
  FOR DELETE
  USING (auth.uid() = user_id);

-- Bid Snapshots: Only readable by app (immutable, no RLS needed as they're derived from auction_items)
CREATE POLICY bid_snapshots_select ON bid_snapshots
  FOR SELECT
  USING (true);

-- Alert Events: Users can only see their own alerts
CREATE POLICY alert_events_select ON alert_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY alert_events_insert ON alert_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY alert_events_update ON alert_events
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Scraping Sessions: Users can only see their own scraping sessions
CREATE POLICY scraping_sessions_select ON scraping_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY scraping_sessions_insert ON scraping_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY scraping_sessions_update ON scraping_sessions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User Notification Settings: Users can only manage their own settings
CREATE POLICY user_notification_settings_select ON user_notification_settings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY user_notification_settings_insert ON user_notification_settings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_notification_settings_update ON user_notification_settings
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_notification_settings_delete ON user_notification_settings
  FOR DELETE
  USING (auth.uid() = user_id);
