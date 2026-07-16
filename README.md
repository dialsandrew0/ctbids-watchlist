# CTBids Watchlist Manager

A production-ready MVP for monitoring and managing your CTBids auction watchlist with real-time alerts, bid tracking, and smart notifications.

## Features

✨ **Core Features**
- 📱 Full-stack web application with responsive design
- 🔐 Secure authentication with Supabase
- 👁️ Monitor multiple CTBids auction items simultaneously
- 💰 Track bid history and set max bid ceilings
- 🚨 Smart alerts for outbid and ending-soon items
- 📊 Dashboard with KPI cards and watchlist table
- 🔄 Automated background sync (every 10 minutes)
- 📝 Per-item notes and status tracking
- 🎯 Dense, fast UI inspired by Linear/Vercel

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, React Hook Form
- **Backend**: Next.js Server Actions, Node.js
- **Database**: Supabase (PostgreSQL) with RLS policies
- **Scraping**: Playwright for authenticated CTBids scraping
- **Validation**: Zod
- **Tables**: TanStack Table (React Table)
- **Auth**: Supabase Auth (email/password)
- **Date utils**: date-fns
- **Notifications**: Sonner (toast library)
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ (verify with `node --version`)
- npm or pnpm
- Supabase account (free tier available at https://supabase.com)

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Create a new project
3. Wait for it to initialize (~2 min)
4. Copy your project URL and API keys:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → `SUPABASE_SERVICE_ROLE_KEY` (keep this secret!)

### 2. Clone & Setup Repo

```bash
# Clone
git clone <repo-url>
cd ctbids-watchlist

# Install dependencies
npm install
# or
pnpm install

# Create .env.local with your Supabase credentials
cp .env.example .env.local
```

**Edit `.env.local` with your Supabase keys:**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

**Important**: Migrations may not run via the API. If that happens:
1. Go to your Supabase dashboard
2. Click "SQL Editor" → "New Query"
3. Copy the contents of `migrations/001_init_schema.sql`
4. Paste and run
5. Repeat for `migrations/002_rls_policies.sql`

### 4. (Optional) Seed Demo Data

```bash
npm run db:seed
```

Creates 1 demo auction with 3 items you can test with.

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 6. Create Account & Login

1. Click "Sign up"
2. Enter your email and password (8+ characters)
3. Verify your email (check spam folder)
4. Log in

## Usage

### Dashboard
- View KPI cards: Total watching, Won, Lost, Outbid alerts
- Search and filter watchlist items by status
- Click any item to open detail drawer

### Item Detail Drawer
- View item image, title, current bid, bid history
- Set your max bid (get alerted if outbid)
- Add personal notes
- Mark as won/lost/archived
- Direct link to CTBids auction

### Manual Ingest
- Paste a CTBids item URL directly
- Item is scraped and added to watchlist
- Fallback if automated scraping is unavailable

### Sync Items
- Trigger manual refresh of your watchlist
- Automatic syncs run every 10 minutes
- Updates bid amounts, detects alerts

### Alerts
- View all alerts (outbid, ending-soon, won, lost)
- Filter by type or read/unread
- Mark as read

## Architecture

### Database Schema

**Tables**:
- `profiles` - User accounts (extends auth.users)
- `auctions` - Auction metadata (shared)
- `auction_items` - Individual items (shared)
- `watchlist_entries` - User's watched items (RLS: user-owned)
- `bid_snapshots` - Historical bid tracking (immutable)
- `alert_events` - Notifications (RLS: user-owned)
- `scraping_sessions` - Scraper run logs (RLS: user-owned)
- `user_notification_settings` - Alert preferences (RLS: user-owned)

**Indexes**: Strategically placed on `user_id`, `status`, `end_time`, `created_at` for query performance.

### Row-Level Security (RLS)

All user-owned tables are protected with RLS policies:
- Users can only read/write their own watchlist entries, alerts, and settings
- Shared tables (auctions, auction_items, bid_snapshots) are readable by all
- No cross-user data leakage
- Enforced at the database layer (cannot be bypassed from client)

### Scraper System

**File**: `lib/scraper/ctbids.ts`

**How it works**:
1. Initializes Playwright Chrome browser
2. Authenticates to CTBids (if credentials provided via env)
3. Navigates to your watched items page
4. Parses item cards: title, bid, end time, image, auction info
5. Upserts into database
6. Creates bid snapshots on bid changes
7. Returns structured data or null on error

**Selectors**: Uses CSS selectors that may break if CTBids changes their DOM. Selectors are in comments with fallbacks documented in `SCRAPER_NOTES.md`.

### Alert Logic

**Files**: `lib/utils/alerts.ts`

**Rules**:
1. **Outbid**: Triggered when `current_bid > user's max_bid`
2. **Ending Soon**: Triggered when item ends within configurable threshold (default 60 min)
3. **Deduplication**: Checks for existing unread alerts before creating new ones
4. **Status Changes**: Auto-detects when auctions end

**Jobs** run as Node.js scripts:
- `scripts/jobs/detect-outbid.js` - Check for outbid conditions
- `scripts/jobs/detect-ending-soon.js` - Check for ending-soon items
- `scripts/jobs/sync-watchlist.js` - Scrape and update items

In production, these would be:
- Scheduled via Supabase Edge Functions
- Triggered by pg_cron on a schedule (e.g., every 10 min)
- Or run via a separate job queue (Bull, RQ, etc.)

### Server Actions

**File**: `app/actions.ts`

Core mutations exposed to client:
- `addToWatchlist` - Add item by ID
- `updateWatchlistEntry` - Update max bid, notes, status
- `archiveWatchlistEntry` - Move to archive
- `markAsWon` / `markAsLost` - Update status
- `updateNotificationSettings` - Modify alert preferences
- `ingestManualUrl` - Scrape a single item URL
- `markAlertAsRead` - Dismiss alerts

All actions:
- Validate input with Zod
- Verify user ownership (auth.getUser())
- Catch errors and return structured responses
- Use RLS for final safety layer

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=                    # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=               # Public API key
SUPABASE_SERVICE_ROLE_KEY=                   # Secret key (server-side only)

# Optional (for authenticated scraping)
CTBIDS_USERNAME=your_email@example.com      # CTBids login
CTBIDS_PASSWORD=your_password               # CTBids password

# Optional (for email notifications)
RESEND_API_KEY=                              # Resend email service key
SMTP_HOST=smtp.gmail.com                     # SMTP server
SMTP_PORT=587                                # SMTP port
SMTP_USER=your-email@gmail.com               # SMTP user
SMTP_PASS=your-app-password                  # SMTP password
```

### Notification Settings

In the app, each user can configure:
- Email on outbid (boolean)
- Email on ending-soon (boolean)
- Email on won (boolean)
- Ending-soon threshold (minutes, default 60)
- Digest frequency (immediate, hourly, daily, off)

## Development

### Project Structure

```
ctbids-watchlist/
├── app/
│   ├── (auth)/           # Login/signup pages
│   ├── (app)/            # Protected app routes
│   │   ├── dashboard/    # Main watchlist view
│   │   ├── alerts/       # Alert history
│   │   ├── sync/         # Manual sync
│   │   └── ingest/       # Manual URL ingest
│   ├── actions.ts        # Server actions
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Tailwind styles
├── components/
│   ├── nav/              # Navigation (header, sidebar)
│   ├── dashboard/        # Dashboard components
│   ├── watchlist/        # Watchlist components
│   └── ui/               # Reusable UI (Input, Badge)
├── lib/
│   ├── supabase/         # Supabase clients
│   ├── scraper/          # Playwright scraper
│   ├── validators/       # Zod schemas
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities (alerts, etc.)
│   └── env.ts            # Environment validation
├── migrations/           # SQL migrations
├── scripts/
│   ├── migrate.js        # Run migrations
│   ├── seed.js           # Seed demo data
│   └── jobs/             # Background jobs
├── public/               # Static assets
├── .env.example          # Environment template
├── tsconfig.json         # TypeScript config
├── tailwind.config.ts    # Tailwind config
└── next.config.js        # Next.js config
```

### Type Safety

All database types are generated from `lib/types/database.ts` (Supabase autogenerated types). Update this file if you modify the schema manually.

### Testing Scraper

```bash
# Test the scraper (requires CTBids credentials)
npm run scraper:test

# This runs scripts/test-scraper.js which:
# 1. Authenticates to CTBids (if creds provided)
# 2. Scrapes your watchlist
# 3. Prints parsed items to console
# 4. Exits
```

## Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git push origin main

# 2. Go to vercel.com, connect your repo
# 3. Add environment variables (Supabase keys)
# 4. Deploy

# Migrations: Run manually in Supabase SQL editor before first deploy
```

### Self-hosted (Docker)

```bash
# Build
docker build -t ctbids-watchlist .

# Run
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=... \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=... \
  -e SUPABASE_SERVICE_ROLE_KEY=... \
  ctbids-watchlist
```

## Scraping Notes

**Important**: CTBids is a third-party site. Always review their:
- Terms of Service
- robots.txt
- API availability

**Known limitations**:
- CSS selectors may break if CTBids updates their DOM
- Unauthenticated scraping may have rate limits
- Some data fields (e.g., location) may not always be present

**Selector documentation**: See `SCRAPER_NOTES.md` for current CSS selectors and fallback strategies.

## Future Enhancements

- [ ] Email digest notifications
- [ ] SMS alerts (Twilio integration)
- [ ] Multi-auction comparison
- [ ] Bid history charts
- [ ] Automatic bidding simulation
- [ ] Bulk operations on watchlist
- [ ] Export to CSV
- [ ] Dark mode toggle (CSS vars ready)
- [ ] Mobile app (React Native)
- [ ] Browser extension for quick add

## Troubleshooting

### "Unauthorized" error
- Check that you're logged in (visit /login)
- Verify SUPABASE_SERVICE_ROLE_KEY is correct
- Check RLS policies are enabled on tables

### Scraper not finding items
- Verify CTBids username/password in .env
- Check CTBids CSS selectors (may have changed)
- Try manual ingest URL instead

### Database migration failed
- Run migrations manually via Supabase SQL editor
- Copy SQL from `migrations/*.sql` files
- Ensure service role key has admin permissions

### "Module not found" errors
- Run `npm install` again
- Clear `.next` folder: `rm -rf .next`
- Restart dev server

## Support & Contributing

- 🐛 Found a bug? Create an issue with reproduction steps
- 💡 Feature request? Describe your use case
- 🤝 Want to contribute? Fork and submit a PR

## License

MIT License - feel free to use for personal and commercial projects.

---

Built with ❤️ for auction enthusiasts
