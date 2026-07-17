#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function detectOutbidAlerts() {
  console.log("🔍 Detecting outbid alerts...");

  try {
    const { data: entries, error: entriesError } = await supabase
      .from("watchlist_entries")
      .select("id, user_id, auction_item_id, max_bid, auction_items(id, current_bid)")
      .eq("status", "watching")
      .not("max_bid", "is", null);

    if (entriesError) throw entriesError;

    let alertsCreated = 0;

    for (const entry of entries || []) {
      if (!entry.auction_items || entry.auction_items.current_bid === null) continue;

      const isOutbid = entry.auction_items.current_bid > entry.max_bid;

      if (isOutbid) {
        const { data: existingAlert } = await supabase
          .from("alert_events")
          .select("id")
          .eq("watchlist_entry_id", entry.id)
          .eq("type", "outbid")
          .eq("read_at", null)
          .single()
          .catch(() => ({ data: null }));

        if (!existingAlert) {
          const { error: alertError } = await supabase
            .from("alert_events")
            .insert({
              user_id: entry.user_id,
              watchlist_entry_id: entry.id,
              type: "outbid",
              title: "You've been outbid",
              message: `Current bid ($${entry.auction_items.current_bid.toFixed(2)}) exceeds your max bid ($${entry.max_bid.toFixed(2)})`,
            });

          if (!alertError) {
            alertsCreated++;
          }
        }
      }
    }

    console.log(`✅ Outbid check complete. Created ${alertsCreated} new alerts.`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

detectOutbidAlerts();
