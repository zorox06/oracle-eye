# Supabase Configuration Guide

## 🔧 Fix "dapp is not responding" Error

Follow these steps to configure Supabase correctly.

---

## Step 1: Get Supabase Credentials

### If you already have a Supabase project:
1. Go to https://supabase.com/dashboard
2. Sign in and select your project
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### If you DON'T have a Supabase project yet:
1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - Name: `oracle-eye` (or any name)
   - Database Password: (create a strong password)
   - Region: Choose closest to you
4. Wait ~2 minutes for project creation
5. Then go to **Settings** → **API** and copy credentials

---

## Step 2: Update `.env.local` File

Open your `.env.local` file (it's currently open in your editor) and update it with:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_KEY_HERE

# Algorand
VITE_ALGORAND_APP_ID=754320381
```

**Replace:**
- `YOUR_PROJECT_ID` with your actual project ID
- `YOUR_KEY_HERE` with your actual anon key

---

## Step 3: Configure Authentication URLs

**This is the most important step to fix the error!**

1. In Supabase Dashboard, go to **Authentication** → **URL Configuration**
2. Set these values:

**Site URL:**
```
http://localhost:8080
```

**Redirect URLs:** (Add both)
```
http://localhost:8080/**
http://localhost:8080/auth/callback
```

3. Click **Save**

---

## Step 4: Set Up Database Tables

Run the migration we created:

1. In Supabase Dashboard → **SQL Editor**
2. Click **"New query"**
3. Paste the contents of: `supabase/migrations/20260123_create_blockchain_tables.sql`
4. Click **Run**

**Or manually create the markets table:**

```sql
CREATE TABLE IF NOT EXISTS markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  asset_symbol TEXT NOT NULL,
  strike_price NUMERIC NOT NULL,
  expiry_at TIMESTAMPTZ NOT NULL,
  status TEXT CHECK (status IN ('open', 'closed', 'resolved')) DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  resolved_price NUMERIC
);

-- Enable RLS
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Anyone can view markets"
  ON markets FOR SELECT
  TO anon, authenticated
  USING (true);
```

---

## Step 5: Enable Email Authentication

1. In Supabase Dashboard → **Authentication** → **Providers**
2. Make sure **Email** is enabled
3. Disable email confirmation for testing:
   - Go to **Authentication** → **Settings**
   - Disable **"Enable email confirmations"**
   - Click **Save**

---

## Step 6: Restart Development Server

After making all changes:

```bash
# Stop current server (Ctrl+C in terminal)
npm run dev
```

---

## Step 7: Test Login

1. Go to http://localhost:8080/auth
2. Enter email: `newarcstyle@gmail.com`
3. Enter any password
4. Click **Sign Up** (first time) or **Sign In**
5. You should be logged in without errors!

---

## Troubleshooting

### Still getting "dapp not responding"?

**Check browser console:**
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for errors mentioning Supabase
4. Share the error message

**Common Issues:**

1. **Invalid API Key**
   - Make sure you copied the full anon key (it's very long, starts with `eyJ`)
   - No spaces before or after the key

2. **Wrong URL**
   - URL should be `https://yourproject.supabase.co` (no `/auth` or other paths)
   - Must be HTTPS, not HTTP

3. **CORS Error**
   - Make sure localhost:8080 is in Redirect URLs
   - Try adding `http://localhost:8080` without the `/**`

4. **Environment variables not loading**
   - Restart dev server after changing `.env.local`
   - Make sure file is named `.env.local` exactly (not `.env` or `.local.env`)

---

## Quick Test

After configuration, test with this code in browser console:

```javascript
// Check if Supabase is configured
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Has API Key:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

Should show:
```
Supabase URL: https://yourproject.supabase.co
Has API Key: true
```

---

## Next Steps After Login Works

1. Go to `/admin` - you'll have admin access (newarcstyle@gmail.com)
2. Create a test market
3. Connect Pera Wallet and test betting

**Need more help?** Let me know what error you're seeing!
