# CTBids Watchlist Manager - Complete Setup Guide

## ✅ What Was Built

A production-ready MVP watchlist manager for CTBids with:

### Core Features
- ✨ Full-stack Next.js 15 web application
- 🔐 Supabase authentication with RLS security
- 📊 Dashboard with KPI cards and dense watchlist table
- 🚨 Smart alerts (outbid, ending-soon, won/lost)
- 💰 Bid history tracking and max bid management
- 🎯 Real-time item monitoring with auto-refresh
- 📝 Per-item notes and status tracking
- 🌙 Dark mode with premium Vercel-inspired UI

### Technical Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, React Hook Form
- **Backend**: Next.js Server Actions, Node.js
- **Database**: Supabase (PostgreSQL) with Row-Level Security
- **Scraping**: Playwright for authenticated CTBids crawling
- **Components**: TanStack Table, Sonner toast, Lucide icons

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose any region (e.g., `us-east-1`)
4. Wait for initialization (~2 min)

### Step 2: Get Your API Keys

In Supabase dashboard:
- Go to **Settings** → **API**
- Copy these three values:
  - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ keep secret!)

### Step 3: Setup Project Locally

```bash
# Extract the project
cd ctbids-watchlist

# Install dependencies
npm install
# or: pnpm install

# Create environment file
cp .env.example .env.local
```

### Step 4: Add Supabase Keys to `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 5: Run Database Migrations

**Option A: Via Script (may not work depending on Supabase plan)**
```bash
npm run db:migrate
```

**Option B: Manual (Recommended)**

1. Go to your Supabase dashboard
2. Click **SQL Editor** → **New Query**
3. Copy the entire contents of `migrations/001_init_schema.sql`
4. Paste and click **Run**
5. Repeat step 2-4 for `migrations/002_rls_policies.sql`

### Step 6: Start the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Step 7: Create Your Account

1. Click "Sign up"
2. Enter email and password (8+ chars)
3. Confirm email (check spam)
4. Log in

### Step 8: (Optional) Load Demo Data

```bash
npm run db:seed
```

Creates 3 sample auction items to test with.

---

## 📁 Project Structure

```
ctbids-watchlist/
├── app/
│   ├── (auth)/                    # Login/Signup pages
│   ├── (app)/                     # Protected routes
│   │   ├── dashboard/             # Main watchlist
│   │   ├── alerts/                # Alert history
│   │   ├── sync/                  # Manual sync
│   │   ├── ingest/                # Add item by URL
│   │   └── settings/              # Preferences
│   ├── actions.ts                 # Server actions (mutations)
│   ├── layout.tsx                 # Root layout
│   └── globals.css                # Tailwind styles
├── components/
│   ├── nav/                       # Sidebar, header
│   ├── dashboard/                 # KPI cards, table
│   ├── watchlist/                 # Item drawer
│   └── ui/                        # Input, Badge
├── lib/
│   ├── supabase/                  # Supabase clients
│   ├── scraper/ctbids.ts          # Playwright scraper
│   ├── validators/schemas.ts      # Zod validation
│   ├── utils/alerts.ts            # Alert logic
│   ├── types/database.ts          # Database types
│   └── env.ts                     # Environment validation
├── migrations/                    # SQL schemas
│   ├── 001_init_schema.sql        # Tables & indexes
│   └── 002_rls_policies.sql       # Security policies
├── scripts/
│   ├── migrate.js                 # Run migrations
│   ├── seed.js                    # Demo data
│   └── jobs/
│       ├── detect-outbid.js       # Alert detection
│       ├── detect-ending-soon.js  # Time alerts
│       └── sync-watchlist.js      # Scrape items
├── package.json                   # Dependencies
├── tsconfig.json                  # TypeScript config
├── tailwind.config.ts             # Tailwind theme
├── .env.example                   # Env template
└── README.md                      # Full documentation
```

---

## 🔑 Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### Optional (for scraping)
```
CTBIDS_USERNAME=your_email@ctbids.com
CTBIDS_PASSWORD=your_ctbids_password
```

### Optional (for email alerts)
```
RESEND_API_KEY=re_xxxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 🗄️ Database Schema

### Tables
- **profiles** - User accounts (extends Supabase auth)
- **auctions** - Auction metadata (shared, readable)
- **auction_items** - Individual items (shared, readable)
- **watchlist_entries** - User's items (RLS: user-owned) ⚙️
- **bid_snapshots** - Historical bids (immutable)
- **alert_events** - Notifications (RLS: user-owned) ⚙️
- **scraping_sessions** - Job logs (RLS: user-owned)
- **user_notification_settings** - Preferences (RLS: user-owned) ⚙️

### Row-Level Security (RLS)
All user-owned tables are protected:
- Users can only access their own data
- Enforced at database layer
- No cross-user data leakage
- ⚙️ = Protected by RLS

---

## 🎯 Key Features Explained

### Dashboard
- **KPI Cards**: Total watching, won, lost, outbid count
- **Watchlist Table**: Search, filter, sort, click to detail
- **Alert Panel**: Recent alerts with quick dismiss

### Item Detail Drawer
- Image, title, bid history
- Set max bid → get alerted if outbid
- Add personal notes
- Mark won/lost/archive
- Direct link to CTBids

### Manual Ingest
- Paste any CTBids item URL
- Scrapes and adds to watchlist
- Fallback if automated sync unavailable

### Alerts
- **Outbid**: Current bid > your max bid
- **Ending Soon**: Item ends within threshold (default 60 min)
- **Won/Lost**: Auction concluded
- All with full alert history and read status

### Sync & Jobs
- Automatic background refresh (every 10 min in production)
- Manual sync available anytime
- Updates bid amounts, detects changes
- Creates alerts automatically

---

## 🔐 Security Features

✅ **Row-Level Security (RLS)**
- Each user isolated to their own data
- Enforced at Postgres layer

✅ **Authentication**
- Supabase Auth (email/password)
- Session cookies
- Protected routes

✅ **Server Actions**
- All mutations use `'use server'`
- User identity verified via `auth.getUser()`
- Zod validation on all inputs
- Type-safe responses

✅ **Environment Variables**
- Service role key server-side only
- Never exposed to client
- Validated at startup

---

## 🛠️ Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type check
npm run type-check

# Database setup
npm run db:migrate          # Run SQL migrations
npm run db:seed            # Add demo data

# Run background jobs
npm run jobs:sync-watchlist
npm run jobs:detect-outbid
npm run jobs:detect-ending-soon

# Test scraper
npm run scraper:test       # Requires CTBIDS_USERNAME/PASSWORD
```

---

## 🚀 Deployment

### Vercel (Recommended)

```bash
# 1. Push to GitHub
git add .
git commit -m "Initial commit"
git push origin main

# 2. Import to Vercel at vercel.com
# 3. Add env variables (Supabase keys)
# 4. Deploy button

# 5. Before deploy: Run migrations manually in Supabase SQL editor
```

### Self-hosted

```bash
# Build
npm run build

# Run
npm start

# With environment variables
NODE_ENV=production npm start
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Unauthorized" error | Check you're logged in, verify SUPABASE_SERVICE_ROLE_KEY |
| Scraper finds no items | Verify CTBids credentials, check SCRAPER_NOTES.md for selector changes |
| Migration failed | Manually copy SQL to Supabase SQL editor |
| Module not found | Run `npm install`, delete `.next`, restart dev server |
| RLS policy error | Ensure migrations 001 & 002 both ran successfully |
| White screen | Check browser console for errors, verify .env.local is correct |

---

## 📋 Checklist for First Deploy

- [ ] Supabase project created
- [ ] 3 environment variables added to `.env.local`
- [ ] Migrations 001 & 002 executed in Supabase SQL editor
- [ ] `npm install` completed
- [ ] `npm run dev` starts without errors
- [ ] Login page accessible at http://localhost:3000/login
- [ ] Can create account and log in
- [ ] Dashboard loads (may be empty until you add items)
- [ ] (Optional) Run `npm run db:seed` to add demo data
- [ ] Ready to push to GitHub and deploy

---

## 🎨 UI Customization

### Colors (Dark Mode)
Edit `app/globals.css` CSS variables:

```css
:root {
  --background: 0 0% 3%;        /* Almost black */
  --foreground: 0 0% 98%;       /* Almost white */
  --accent: 220 90% 56%;        /* Bright blue */
  /* ... more vars ... */
}
```

### Tailwind Theming
Edit `tailwind.config.ts` for any design changes.

---

## 📚 Key Files to Know

| File | Purpose |
|------|---------|
| `app/actions.ts` | All server mutations (add watchlist, update bid, etc.) |
| `lib/scraper/ctbids.ts` | Playwright CTBids scraper |
| `lib/utils/alerts.ts` | Alert detection logic (outbid, ending-soon) |
| `migrations/*.sql` | Database schema and RLS policies |
| `components/dashboard/watchlist-table.tsx` | Main watchlist view |
| `app/(app)/dashboard/page.tsx` | Dashboard container |

---

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Playwright Docs](https://playwright.dev)
- [Zod Validation](https://zod.dev)

---

## ❓ FAQ

**Q: Can I use this on the CTBids site?**
A: Yes, but respect their ToS. Scraping frequency and authentication are governed by their policies.

**Q: What if CTBids changes their DOM?**
A: The scraper will fail gracefully. Check `SCRAPER_NOTES.md` for updated selectors, or use manual URL ingest as fallback.

**Q: How do I run this in production?**
A: Deploy to Vercel (5 clicks), Railway, or Render. Ensure migrations run first, add env vars.

**Q: Can multiple users use this?**
A: Yes! RLS ensures each user only sees their own data. Perfect for SaaS expansion.

**Q: Where are my alerts stored?**
A: In the `alert_events` Postgres table. All your data stays in your Supabase project.

---

## 📞 Support

- Check README.md for full documentation
- Review SCRAPER_NOTES.md for scraper details
- Check browser console for JavaScript errors
- Review Supabase dashboard for database errors

---

## 🎉 You're Ready!

Follow the Quick Start above, and you'll have a fully functional watchlist manager running locally in **~15 minutes**.

**Next steps:**
1. Set up Supabase
2. Copy keys to `.env.local`
3. Run migrations
4. `npm run dev`
5. Sign up and start monitoring!

Good luck! 🚀
