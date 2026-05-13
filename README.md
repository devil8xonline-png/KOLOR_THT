# Tile Catalog Web

Next.js catalogue app backed by Supabase.

## Local setup

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
NEXT_PUBLIC_ZALO_PHONE=0900000000
```

Install and run:

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Create an admin user in **Authentication > Users**.
4. Copy that user's UUID and run:

```sql
insert into public.admins (user_id, email)
values ('USER_UUID_HERE', 'admin@example.com')
on conflict (user_id) do update set email = excluded.email;
```

5. Confirm Storage has public bucket `product-images`.

## Expected tables

- `products`: product catalogue data.
- `admins`: users allowed to access `/admin`.
- `leads`: customer contact requests.
- `product_views`: product view tracking.

## Deploy

Deploy the Next.js app to Vercel/Netlify or another Node-compatible host, then add the same environment variables there.
