# Gather

A Partiful-style event hosting and RSVP platform. Create events, share a link, collect RSVPs, and send SMS reminders automatically.

---

## Tech Stack

- **Framework**: Next.js 16 with App Router + TypeScript
- **Database + Auth**: Supabase (PostgreSQL + Supabase Auth)
- **SMS**: Twilio
- **Styling**: Tailwind CSS
- **Hosting**: Vercel (with Vercel Cron Jobs)

---

## Environment Variables

Create a `.env.local` file in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=        # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Your Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=       # Your Supabase service role key (server-side only)
TWILIO_ACCOUNT_SID=              # Twilio account SID
TWILIO_AUTH_TOKEN=               # Twilio auth token
TWILIO_PHONE_NUMBER=             # Twilio phone number (e.g. +18001234567)
NEXT_PUBLIC_BASE_URL=            # Your app's public URL (e.g. https://yourdomain.com)
CRON_SECRET=                     # A secret string to protect the cron endpoint
```

---

## Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Events table
create table events (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id),
  slug text unique not null,
  title text not null,
  description text,
  location text,
  event_date timestamptz not null,
  cover_emoji text default '🎉',
  is_cancelled boolean default false,
  created_at timestamptz default now()
);

-- RSVPs table
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  phone text not null,
  status text check (status in ('going', 'maybe', 'not_going')),
  reminder_sent boolean default false,
  created_at timestamptz default now(),
  unique(event_id, phone)
);

-- Enable Row Level Security
alter table events enable row level security;
alter table rsvps enable row level security;

-- Hosts can manage their own events
create policy "Hosts manage own events" on events
  for all using (auth.uid() = host_id);

-- Anyone can read non-cancelled events by slug (for public page)
create policy "Public can read events" on events
  for select using (true);

-- Anyone can read and insert rsvps
create policy "Public can read rsvps" on rsvps
  for select using (true);

create policy "Public can insert rsvps" on rsvps
  for insert with check (true);

create policy "Public can update rsvps" on rsvps
  for update using (true);
```

> Note: The API routes use the Supabase **service role key** to bypass RLS for writes, so RLS policies are mainly for direct DB access protection.

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Vercel

1. Push the repo to GitHub.
2. Import the project in Vercel.
3. Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.
4. Deploy.

The `vercel.json` file configures a daily cron job at 14:00 UTC (9–10 AM US time) to send SMS reminders for events happening the next day.

### Cron Job

The cron endpoint is at `/api/cron/send-reminders`. It is protected by the `CRON_SECRET` environment variable. Vercel automatically sends the `Authorization: Bearer <CRON_SECRET>` header when triggering cron jobs (configured in `vercel.json`).

To test manually:
```bash
curl -H "Authorization: Bearer your-cron-secret" https://yourdomain.com/api/cron/send-reminders
```

---

## Features

- **Host dashboard**: Create and manage events, view RSVPs, filter by status
- **Public event page**: Share a clean event page — no account required for guests
- **RSVP form**: Guests provide name, phone, and status (Going / Maybe / Can't Go)
- **Upsert logic**: Guests can update their RSVP by re-submitting with the same phone number
- **SMS reminders**: Automated day-before reminder texts via Twilio
- **Event cancellation**: Hosts can cancel events; a cancellation notice shows on the public page
- **Responsive**: Mobile-first design, works great on any screen size
