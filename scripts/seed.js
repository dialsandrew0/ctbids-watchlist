#!/usr/bin/env node

const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function seedDatabase() {
  console.log("🌱 Seeding database with demo data...\n");

  try {
    console.log("📦 Creating demo auction...");
    const { data: auction, error: auctionError } = await supabase
      .from("auctions")
      .insert({
        title: "Estate Auction - Fine Furniture",
        description: "Collection of mid-century modern furniture",
        url: "https://www.ctbids.com/estate-auctions/search?searchTerm=demo",
        status: "active",
        location: "Atlanta, GA",
      })
      .select()
      .single();

    if (auctionError) throw auctionError;

    console.log("📋 Creating demo auction items...");
    const items = [
      {
        auction_id: auction.id,
        title: "Vintage Walnut Dining Table",
        description: "Mid-century walnut dining table with 6 chairs, excellent condition",
        url: "https://www.ctbids.com/estate-auctions/lot/123",
        image_url: "https://images.unsplash.com/photo-1581032159075-d74e16b1c6bb?w=400&h=300&fit=crop",
        current_bid: 450.00,
        starting_bid: 300.00,
        bid_count: 12,
        end_time: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active",
        location: "Atlanta, GA",
      },
      {
        auction_id: auction.id,
        title: "Eames Style Lounge Chair",
        description: "Iconic design, genuine leather, minor wear",
        url: "https://www.ctbids.com/estate-auctions/lot/124",
        image_url: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=400&h=300&fit=crop",
        current_bid: 680.00,
        starting_bid: 500.00,
        bid_count: 18,
        end_time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        status: "active",
        location: "Atlanta, GA",
      },
    ];

    const { data: auctionItems, error: itemsError } = await supabase
      .from("auction_items")
      .insert(items)
      .select();

    if (itemsError) throw itemsError;

    console.log("✅ Demo data created successfully!");
  } catch (error) {
    console.error("❌ Seed error:", error.message);
    process.exit(1);
  }
}

seedDatabase();
