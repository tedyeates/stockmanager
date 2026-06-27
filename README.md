# PC Elemac Stock Management System

Inventory management application for tracking stock items, inbound receipts, and outbound withdrawals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2+ / Django REST Framework |
| Frontend | React 18 / TypeScript / Vite |
| Database | PostgreSQL (Supabase) |
| Styling | Tailwind CSS 3 + Material UI 5 |
| Auth | DRF Token Authentication |
| Hosting | Fly.io (backend) / Vercel (frontend) |

## Project Structure

```
stockmanager/
├── stockmanagement_bg/      # Django backend
│   ├── stockmanagement_bg/  # Django project (settings, urls, wsgi)
│   ├── stockmanagement/     # Main app (models, views, serializers)
│   ├── login/               # Auth app
│   ├── fly.toml             # Fly.io deployment config
│   └── requirements.txt
├── stockmanagement-fe/      # React frontend
│   ├── src/
│   └── package.json
```

## Local Development

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (or a Supabase project)

### Backend

```bash
cd stockmanagement_bg

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file (see Environment Variables below)

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

API available at `http://127.0.0.1:8000`

### Frontend

```bash
cd stockmanagement-fe

pnpm install
pnpm start
```

App available at `http://localhost:5173`

### Environment Variables

Create `stockmanagement_bg/.env`:

```env
SECRET_KEY=<django-secret-key>
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=postgres://user:password@host:5432/dbname
CORS_ALLOW_ALL_ORIGINS=True
```

Generate a secret key:

```python
import secrets
print(secrets.token_urlsafe())
```

Frontend env files (already in repo):
- `.env.development` — points to `http://127.0.0.1:8000`
- `.env.production` — points to production backend URL

## Management Commands

Run from `stockmanagement_bg/`:

```bash
# Import stock data from Excel
python manage.py loadstock

# Create superuser from env vars (SUPER_USER_USERNAME, SUPER_USER_PASSWORD)
python manage.py createsu

# Backup DB then truncate all Django-managed tables
python manage.py reset_django_tables

# Backup only (no wipe)
python manage.py reset_django_tables --backup-only

# Wipe only (no backup)
python manage.py reset_django_tables --skip-backup
```

Backups saved to `stockmanagement_bg/backups/` as timestamped `.sql` files. Requires `pg_dump` on PATH.

## API Endpoints

Base path: `/api/`

| Resource | Endpoint |
|----------|----------|
| Groups | `/api/group/` |
| Items | `/api/item/` |
| Instock | `/api/instock/` |
| Outstock | `/api/outstock/` |

All endpoints require token auth. Pagination: 19 items per page.

## Testing

### Frontend

```bash
cd stockmanagement-fe
pnpm test              # Vitest unit tests
```

### Backend

```bash
cd stockmanagement_bg
python manage.py test
```

Uses Hypothesis for property-based testing.

## Deployment

### Database (Supabase)

1. Create a project at [supabase.com](https://supabase.com)
2. Copy the connection string from **Settings → Database → Connection string (URI)**
3. Use this as `DATABASE_URL` in both local `.env` and Fly.io secrets

### Backend (Fly.io)

Prerequisites: [Install flyctl](https://fly.io/docs/flyctl/install/)

```bash
cd stockmanagement_bg

# First deploy
fly launch          # creates app from existing fly.toml
fly secrets set SECRET_KEY=<key> DATABASE_URL=<supabase-url> ALLOWED_HOSTS=<your-app>.fly.dev SUPER_USER_USERNAME=<user> SUPER_USER_PASSWORD=<pass>
fly deploy

# Subsequent deploys
fly deploy
```

Migrations run automatically on each deploy via `release_command`. The app auto-stops when idle (free tier friendly).

Required secrets:
- `SECRET_KEY` — Django secret key
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `ALLOWED_HOSTS` — `<your-app>.fly.dev` (comma-separated if multiple)
- `SUPER_USER_USERNAME` / `SUPER_USER_PASSWORD` — for `createsu` command

### Frontend (Vercel)

1. Import the repo at [vercel.com](https://vercel.com)
2. Set **Root Directory** to `stockmanagement-fe`
3. Add environment variable: `VITE_BASE_URL` = `https://<your-app>.fly.dev`
4. Deploy — Vercel auto-detects Vite and uses `vercel.json` config

Or via CLI:

```bash
cd stockmanagement-fe
npx vercel
```

Update `.env.production` locally to match:

```env
VITE_BASE_URL=https://<your-app>.fly.dev
```
