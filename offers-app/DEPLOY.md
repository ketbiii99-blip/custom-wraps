# Putting OFFERS online

The app is one small server (shopper app + admin panel + API) packaged as a Docker image.
It needs **one server and one storage disk** for the database. No other services.

## Option A — Render (recommended, about 15 minutes)

What it costs: Render's **Starter** web service plus a 1 GB disk. Check current prices at
render.com/pricing (at the time of writing roughly USD 7–8 per month). The free plan cannot keep a disk,
so the database would be wiped on every restart.

1. Create an account at **render.com** and connect your GitHub account.
2. Merge this branch into your main branch on GitHub (or pick this branch in step 3).
3. In Render: **New +** → **Blueprint** → choose the `custom-wraps` repository.
   Render reads `render.yaml` and sets everything up: the Docker image, the health check,
   the Frankfurt region (closest to the UAE) and a 1 GB disk at `/data`.
4. Render asks for two values:
   - `ADMIN_EMAIL`: the email you will use to sign in to the admin panel.
   - `ADMIN_PASSWORD`: a strong password (12+ characters). Keep it in a password manager.
5. Click **Apply**. The first deploy takes a few minutes. When it shows **Live** you get a link like
   `https://offers-app.onrender.com`.
6. Check it:
   - `https://…onrender.com/` → the shopper app
   - `https://…onrender.com/admin` → sign in with the email and password from step 4
7. Before you announce the app: in the admin panel, use **حذف العروض التجريبية** to remove the sample prices,
   then enter real offers.

Every push to the branch Render watches redeploys the app automatically. The database on the disk is kept.

### Your own domain (e.g. offers.ae)
Render → your service → **Settings** → **Custom Domains** → add the domain, then create the DNS record
Render shows you at your domain registrar. HTTPS certificates are issued automatically.

## Option B — any Docker host (Railway, Fly.io, DigitalOcean, a VPS)

Requirements: run the image, give it a persistent volume mounted at `/data`, expose port `8080`,
and set `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

```bash
cd offers-app
docker build -t offers-app .
docker run -d --name offers --restart unless-stopped -p 8080:8080 \
  -v offers-data:/data \
  -e ADMIN_EMAIL=you@example.com -e ADMIN_PASSWORD='a-strong-password' \
  offers-app
```

Put it behind HTTPS (the platform's proxy, or Caddy/Nginx on a VPS). Health check path: `/api/health`.

## Settings

| Variable | Default | Meaning |
|---|---|---|
| `ADMIN_EMAIL` | `admin@offers.local` | Admin account created on first start |
| `ADMIN_PASSWORD` | random, printed once in the logs | Its password. Only used when the database is first created |
| `SEED_DEMO` | `1` | `0` = start with no sample offers |
| `DB_PATH` | `/data/offers.db` in Docker | Where the database lives |
| `PORT` | `8080` | Port the server listens on |
| `TRUST_PROXY` | `1` in Docker | Use the visitor IP from the host's proxy for sign-in limits |

Changing `ADMIN_PASSWORD` later does not change an existing admin's password.

## Backups

- The server writes a copy of the database to `/data/backups/` every day and keeps the last 7.
  This protects against mistakes, but the copies live on the same disk.
- On Render, also keep the platform's disk snapshots (Render → service → **Disks**) and now and then
  download a copy through Render's **Shell**: `ls /data/backups`.

## Security already in place

- Passwords stored as scrypt hashes; sign-in tokens stored only as hashes.
- At most 10 sign-in or sign-up attempts per visitor every 15 minutes.
- Stores can only post offers for their own store, and those wait for admin approval.
- Security headers on every page (content security policy, no framing, HSTS in production).
- Only the app's own files are served; the database and server code cannot be downloaded.

## Still to do before a big launch

- Password reset by email (needs an email service such as Postmark or Amazon SES).
- Google / Apple sign-in for stores.
- Product photo uploads (needs file storage such as Cloudflare R2 or S3).
- Native iPhone/Android apps. Until then, shoppers can open the site on their phone and use
  **Add to Home Screen**; it opens full screen like an app.
