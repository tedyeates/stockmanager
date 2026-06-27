# Tech Stack

## Backend (`stockmanagement_bg/`)

- **Language**: Python 3.9+
- **Framework**: Django 4.2+ with Django REST Framework
- **Database**: PostgreSQL (via psycopg2)
- **Auth**: DRF Token Authentication
- **CORS**: django-cors-headers
- **Environment**: django-environ (`.env` file in `stockmanagement_bg/`)
- **WSGI Server**: Gunicorn

## Frontend (`stockmanagement-fe/`)

- **Language**: TypeScript
- **Framework**: React 18 (Create React App / react-scripts 5)
- **UI Library**: Material UI 5 (@mui/material)
- **Styling**: Tailwind CSS 3 + PostCSS + custom CSS files
- **HTTP Client**: Native fetch (custom `Requests` utility class)
- **Routing**: react-router-dom 6
- **Icons**: Heroicons, react-icons, MUI Icons

## Common Commands

### Backend

Virtual environment at repo root: `.venv/`

```bash
# Activate (from repo root)
.venv\Scripts\activate              # Windows

# All python/pip commands use .venv
pip install -r stockmanagement_bg/requirements.txt
cd stockmanagement_bg
python manage.py migrate
python manage.py runserver          # Dev server at :8000
python manage.py collectstatic      # Collect static files for production
```

### Frontend

```bash
cd stockmanagement-fe
pnpm install
pnpm start                           # Dev server at :3000
pnpm build                           # Production build
pnpm e2e                             # Open Cypress interactive
pnpm e2e:run                         # Run Cypress headless
pnpm deploy:s3                      # Sync build to S3
```

## API Configuration

- REST pagination: PageNumberPagination, PAGE_SIZE = 19
- Frontend dev API base: configured via `.env.development`
- Frontend prod API base: configured via `.env.production`
